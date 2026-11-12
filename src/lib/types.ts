export type DistanceUnit = 'km' | 'mi';
export type VolumeUnit = 'L' | 'galUS' | 'galUK';
export type EconomyFormat = 'distPerVol' | 'volPer100';
export type PowerUnit = 'hp' | 'kW' | 'PS';

export type VehicleCategory =
  | 'motorcycle'
  | 'scooter'
  | 'car'
  | 'suv'
  | 'microbus'
  | 'pickup'
  | 'truck'
  | 'bus'
  | 'cng'
  | 'tractor'
  | 'other';

export type FuelType = 'octane' | 'petrol' | 'diesel' | 'cng' | 'lpg' | 'hybrid' | 'electric';

export interface Vehicle {
  id: string;
  name: string;
  category: VehicleCategory;
  make: string;
  model: string;
  year: string;
  regNumber: string;
  fuelType: FuelType;
  engineCC: number | null;
  power: number | null;
  powerUnit: PowerUnit;
  odometerUnit: DistanceUnit;
  initialOdometer: number | null;
  tankCapacity: number | null;
  notes: string;
  createdAt: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  odometer: number;
  volume: number;
  volumeUnit: VolumeUnit;
  unitPrice: number;
  total: number;
  fullTank: boolean;
  fuelType: FuelType;
  station: string;
  notes: string;
}

export interface ServiceLog {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  items: string[];
  garage: string;
  partsCost: number;
  laborCost: number;
  total: number;
  nextOdometer: number | null;
  nextDate: string | null;
  notes: string;
}

export interface OilLog {
  id: string;
  vehicleId: string;
  date: string;
  odometer: number;
  oilName: string;
  grade: string;
  quantity: number | null; // in litres
  intervalKm: number; // in the vehicle's odometer unit
  price: number;
  filterChanged: boolean;
  notes: string;
}

export interface Settings {
  country: string;
  currencyCode: string;
  currencySymbol: string;
  distanceUnit: DistanceUnit;
  volumeUnit: VolumeUnit;
  economyFormat: EconomyFormat;
  activeVehicleId: string | null;
}

export interface AppData {
  version: 1;
  vehicles: Vehicle[];
  fuel: FuelLog[];
  services: ServiceLog[];
  oils: OilLog[];
  settings: Settings;
}
