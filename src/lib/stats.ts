import { daysBetween, monthKey, todayISO } from './format';
import type { AppData, FuelLog, OilLog, ServiceLog, Vehicle } from './types';
import { toLitres } from './units';

export interface Segment {
  date: string;
  odometer: number;
  distance: number;
  litres: number;
  cost: number;
  /** distance per litre (vehicle unit / L) */
  rate: number;
}

export interface MonthStat {
  key: string; // YYYY-MM
  litres: number;
  fuelCost: number;
  fills: number;
  distance: number;
  serviceCost: number;
  oilCost: number;
}

export interface OilStatus {
  last: OilLog;
  nextAt: number;
  remaining: number;
  used: number;
  progress: number; // 0..1+
}

export interface ServiceDue {
  log: ServiceLog;
  nextOdometer: number | null;
  remaining: number | null;
  nextDate: string | null;
  daysLeft: number | null;
}

export interface VehicleStats {
  currentOdometer: number | null;
  totalDistance: number;
  fills: number;
  totalLitres: number;
  totalFuelCost: number;
  serviceCost: number;
  oilCost: number;
  totalCost: number;
  /** overall average distance per litre */
  avgRate: number | null;
  lastRate: number | null;
  bestRate: number | null;
  worstRate: number | null;
  /** fuel cost per vehicle distance unit */
  fuelCostPerDistance: number | null;
  /** fuel + service + oil per distance unit */
  runningCostPerDistance: number | null;
  avgPricePerLitre: number | null;
  avgDailyDistance: number | null;
  segments: Segment[];
  months: MonthStat[];
  oil: OilStatus | null;
  service: ServiceDue | null;
  lastFuel: FuelLog | null;
  estimatedRange: number | null;
}

const byOdo = <T extends { odometer: number; date: string }>(a: T, b: T) =>
  a.odometer - b.odometer || a.date.localeCompare(b.date);

export function vehicleLogs(data: AppData, vehicleId: string) {
  return {
    fuel: data.fuel.filter((f) => f.vehicleId === vehicleId),
    services: data.services.filter((s) => s.vehicleId === vehicleId),
    oils: data.oils.filter((o) => o.vehicleId === vehicleId),
  };
}

export function computeStats(data: AppData, vehicle: Vehicle): VehicleStats {
  const { fuel, services, oils } = vehicleLogs(data, vehicle.id);
  const sortedFuel = [...fuel].sort(byOdo);

  // ---- full-tank to full-tank segments ----
  const segments: Segment[] = [];
  let lastFull: FuelLog | null = null;
  let accLitres = 0;
  let accCost = 0;
  for (const f of sortedFuel) {
    const l = toLitres(f.volume, f.volumeUnit);
    if (lastFull) {
      accLitres += l;
      accCost += f.total;
    }
    if (f.fullTank) {
      if (lastFull) {
        const distance = f.odometer - lastFull.odometer;
        if (distance > 0 && accLitres > 0) {
          segments.push({ date: f.date, odometer: f.odometer, distance, litres: accLitres, cost: accCost, rate: distance / accLitres });
        }
      }
      lastFull = f;
      accLitres = 0;
      accCost = 0;
    }
  }

  const totalLitres = fuel.reduce((s, f) => s + toLitres(f.volume, f.volumeUnit), 0);
  const totalFuelCost = fuel.reduce((s, f) => s + f.total, 0);
  const serviceCost = services.reduce((s, x) => s + x.total, 0);
  const oilCost = oils.reduce((s, x) => s + x.price, 0);

  let avgRate: number | null = null;
  let fuelCostPerDistance: number | null = null;
  if (segments.length) {
    const d = segments.reduce((s, x) => s + x.distance, 0);
    const l = segments.reduce((s, x) => s + x.litres, 0);
    const c = segments.reduce((s, x) => s + x.cost, 0);
    avgRate = d / l;
    fuelCostPerDistance = c / d;
  } else if (sortedFuel.length >= 2) {
    // Fallback (no two full-tank fills yet): fuel bought before the last fill
    // was burned between the first and last odometer readings.
    const first = sortedFuel[0];
    const last = sortedFuel[sortedFuel.length - 1];
    const d = last.odometer - first.odometer;
    const prior = sortedFuel.slice(0, -1);
    const l = prior.reduce((s, f) => s + toLitres(f.volume, f.volumeUnit), 0);
    const c = prior.reduce((s, f) => s + f.total, 0);
    if (d > 0 && l > 0) {
      avgRate = d / l;
      fuelCostPerDistance = c / d;
    }
  }

  const rates = segments.map((s) => s.rate);

  // ---- odometer readings across all log types ----
  const readings: { date: string; odometer: number }[] = [
    ...fuel.map((f) => ({ date: f.date, odometer: f.odometer })),
    ...services.map((f) => ({ date: f.date, odometer: f.odometer })),
    ...oils.map((f) => ({ date: f.date, odometer: f.odometer })),
  ]
    .filter((r) => r.odometer > 0)
    .sort((a, b) => a.date.localeCompare(b.date) || a.odometer - b.odometer);

  const maxOdo = readings.reduce((m, r) => Math.max(m, r.odometer), vehicle.initialOdometer ?? 0);
  const currentOdometer = readings.length || vehicle.initialOdometer != null ? maxOdo : null;
  const minOdo = Math.min(
    ...(vehicle.initialOdometer != null ? [vehicle.initialOdometer] : []),
    ...readings.map((r) => r.odometer),
  );
  const totalDistance = isFinite(minOdo) && currentOdometer != null ? Math.max(0, currentOdometer - minOdo) : 0;

  const totalCost = totalFuelCost + serviceCost + oilCost;
  const runningCostPerDistance = totalDistance > 0 ? totalCost / totalDistance : null;

  let avgDailyDistance: number | null = null;
  if (readings.length >= 2) {
    const days = daysBetween(readings[0].date, readings[readings.length - 1].date);
    const span = readings[readings.length - 1].odometer - readings[0].odometer;
    if (days > 0 && span > 0) avgDailyDistance = span / days;
  }

  // ---- monthly ----
  const monthMap = new Map<string, MonthStat>();
  const m = (k: string) => {
    let v = monthMap.get(k);
    if (!v) {
      v = { key: k, litres: 0, fuelCost: 0, fills: 0, distance: 0, serviceCost: 0, oilCost: 0 };
      monthMap.set(k, v);
    }
    return v;
  };
  for (const f of fuel) {
    const ms = m(monthKey(f.date));
    ms.litres += toLitres(f.volume, f.volumeUnit);
    ms.fuelCost += f.total;
    ms.fills += 1;
  }
  for (const s of services) m(monthKey(s.date)).serviceCost += s.total;
  for (const o of oils) m(monthKey(o.date)).oilCost += o.price;

  // distance driven per month = highest reading in month - last reading before it
  let prevMax: number | null = vehicle.initialOdometer;
  const monthsSorted = [...new Set(readings.map((r) => monthKey(r.date)))].sort();
  for (const k of monthsSorted) {
    const inMonth = readings.filter((r) => monthKey(r.date) === k);
    const hi = Math.max(...inMonth.map((r) => r.odometer));
    const lo = Math.min(...inMonth.map((r) => r.odometer));
    const base = prevMax != null && prevMax <= hi ? prevMax : lo;
    m(k).distance = Math.max(0, hi - base);
    prevMax = Math.max(prevMax ?? hi, hi);
  }
  const months = [...monthMap.values()].sort((a, b) => b.key.localeCompare(a.key));

  // ---- engine oil ----
  let oil: OilStatus | null = null;
  const lastOil = [...oils].sort(byOdo).pop();
  if (lastOil) {
    const cur = currentOdometer ?? lastOil.odometer;
    const nextAt = lastOil.odometer + lastOil.intervalKm;
    const used = Math.max(0, cur - lastOil.odometer);
    oil = {
      last: lastOil,
      nextAt,
      used,
      remaining: nextAt - cur,
      progress: lastOil.intervalKm > 0 ? used / lastOil.intervalKm : 0,
    };
  }

  // ---- next service ----
  let service: ServiceDue | null = null;
  const lastWithDue = [...services]
    .filter((s) => s.nextOdometer != null || s.nextDate)
    .sort((a, b) => b.date.localeCompare(a.date) || b.odometer - a.odometer)[0];
  if (lastWithDue) {
    service = {
      log: lastWithDue,
      nextOdometer: lastWithDue.nextOdometer,
      remaining: lastWithDue.nextOdometer != null && currentOdometer != null ? lastWithDue.nextOdometer - currentOdometer : null,
      nextDate: lastWithDue.nextDate,
      daysLeft: lastWithDue.nextDate ? daysBetween(todayISO(), lastWithDue.nextDate) : null,
    };
  }

  const lastFuel = [...fuel].sort((a, b) => b.date.localeCompare(a.date) || b.odometer - a.odometer)[0] ?? null;
  const estimatedRange = avgRate != null && vehicle.tankCapacity ? avgRate * vehicle.tankCapacity : null;

  return {
    currentOdometer,
    totalDistance,
    fills: fuel.length,
    totalLitres,
    totalFuelCost,
    serviceCost,
    oilCost,
    totalCost,
    avgRate,
    lastRate: rates.length ? rates[rates.length - 1] : null,
    bestRate: rates.length ? Math.max(...rates) : null,
    worstRate: rates.length ? Math.min(...rates) : null,
    fuelCostPerDistance,
    runningCostPerDistance,
    avgPricePerLitre: totalLitres > 0 ? totalFuelCost / totalLitres : null,
    avgDailyDistance,
    segments,
    months,
    oil,
    service,
    lastFuel,
    estimatedRange,
  };
}

/** highest odometer reading on or before `date` (used to sanity-check new entries) */
export function readingBefore(data: AppData, vehicleId: string, date: string, excludeId?: string): number | null {
  const all = [...data.fuel, ...data.services, ...data.oils].filter(
    (l) => l.vehicleId === vehicleId && l.id !== excludeId && l.date <= date,
  );
  if (!all.length) return data.vehicles.find((x) => x.id === vehicleId)?.initialOdometer ?? null;
  return Math.max(...all.map((l) => l.odometer));
}

/** highest odometer recorded for a vehicle, optionally excluding one log id (when editing) */
export function lastOdometer(data: AppData, vehicleId: string, excludeId?: string): number | null {
  const v = data.vehicles.find((x) => x.id === vehicleId);
  const all = [...data.fuel, ...data.services, ...data.oils].filter((l) => l.vehicleId === vehicleId && l.id !== excludeId);
  const max = all.reduce((mx, l) => Math.max(mx, l.odometer), v?.initialOdometer ?? -1);
  return max >= 0 ? max : null;
}
