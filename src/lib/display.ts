import { useMemo } from 'react';
import { fmtNum } from './format';
import { computeStats } from './stats';
import { useStore } from './store';
import type { Settings, Vehicle } from './types';
import { economyUnitLabel, economyValue, fromLitres, VOLUME_LABEL } from './units';

/** rate = vehicle distance unit per litre -> "45.2 km/L" or "6.1 L/100km" */
export function fmtEconomy(s: Settings, v: Vehicle, rate: number | null | undefined): string {
  if (rate == null) return '—';
  const val = economyValue(s, rate, 1);
  return `${fmtNum(val, s.economyFormat === 'volPer100' ? 2 : 1)} ${economyUnitLabel(s, v.odometerUnit)}`;
}

export function fmtVolume(s: Settings, litres: number, decimals = 1): string {
  return `${fmtNum(fromLitres(litres, s.volumeUnit), decimals)} ${VOLUME_LABEL[s.volumeUnit]}`;
}

/** convert a per-litre price into the user's volume unit */
export const pricePerUnit = (s: Settings, perLitre: number | null) => (perLitre == null ? null : perLitre / fromLitres(1, s.volumeUnit));

export function useActiveStats() {
  const { data, activeVehicle } = useStore();
  return useMemo(() => (activeVehicle ? computeStats(data, activeVehicle) : null), [data, activeVehicle]);
}
