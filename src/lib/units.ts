import type {
  DistanceUnit,
  EconomyFormat,
  FuelType,
  PowerUnit,
  Settings,
  VehicleCategory,
  VolumeUnit,
} from './types';

export interface CountryPreset {
  code: string;
  name: string;
  flag: string;
  currencyCode: string;
  currencySymbol: string;
  distanceUnit: DistanceUnit;
  volumeUnit: VolumeUnit;
  economyFormat: EconomyFormat;
}

// Bangladesh first: it is the default.
export const COUNTRIES: CountryPreset[] = [
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', currencyCode: 'BDT', currencySymbol: '৳', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'IN', name: 'India', flag: '🇮🇳', currencyCode: 'INR', currencySymbol: '₹', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', currencyCode: 'PKR', currencySymbol: 'Rs', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', currencyCode: 'NPR', currencySymbol: 'Rs', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'AE', name: 'UAE (Dubai)', flag: '🇦🇪', currencyCode: 'AED', currencySymbol: 'AED', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', currencyCode: 'SAR', currencySymbol: 'SAR', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦', currencyCode: 'QAR', currencySymbol: 'QAR', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼', currencyCode: 'KWD', currencySymbol: 'KWD', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲', currencyCode: 'OMR', currencySymbol: 'OMR', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currencyCode: 'MYR', currencySymbol: 'RM', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currencyCode: 'SGD', currencySymbol: 'S$', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currencyCode: 'JPY', currencySymbol: '¥', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'CN', name: 'China', flag: '🇨🇳', currencyCode: 'CNY', currencySymbol: '¥', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'volPer100' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currencyCode: 'KRW', currencySymbol: '₩', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', currencyCode: 'EUR', currencySymbol: '€', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'volPer100' },
  { code: 'FR', name: 'France', flag: '🇫🇷', currencyCode: 'EUR', currencySymbol: '€', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'volPer100' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', currencyCode: 'EUR', currencySymbol: '€', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'volPer100' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', currencyCode: 'GBP', currencySymbol: '£', distanceUnit: 'mi', volumeUnit: 'L', economyFormat: 'distPerVol' },
  { code: 'US', name: 'United States', flag: '🇺🇸', currencyCode: 'USD', currencySymbol: '$', distanceUnit: 'mi', volumeUnit: 'galUS', economyFormat: 'distPerVol' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', currencyCode: 'CAD', currencySymbol: 'C$', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'volPer100' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', currencyCode: 'AUD', currencySymbol: 'A$', distanceUnit: 'km', volumeUnit: 'L', economyFormat: 'volPer100' },
];

export const DEFAULT_SETTINGS: Settings = {
  country: 'BD',
  currencyCode: 'BDT',
  currencySymbol: '৳',
  distanceUnit: 'km',
  volumeUnit: 'L',
  economyFormat: 'distPerVol',
  theme: 'system',
  activeVehicleId: null,
};

export const VOLUME_LABEL: Record<VolumeUnit, string> = { L: 'L', galUS: 'gal', galUK: 'gal (UK)' };
export const VOLUME_NAME: Record<VolumeUnit, string> = { L: 'Litre', galUS: 'US gallon', galUK: 'UK gallon' };
const LITRES_PER: Record<VolumeUnit, number> = { L: 1, galUS: 3.785411784, galUK: 4.54609 };

export const toLitres = (v: number, u: VolumeUnit) => v * LITRES_PER[u];
export const fromLitres = (l: number, u: VolumeUnit) => l / LITRES_PER[u];

const KM_PER: Record<DistanceUnit, number> = { km: 1, mi: 1.609344 };
export const convertDistance = (d: number, from: DistanceUnit, to: DistanceUnit) =>
  from === to ? d : (d * KM_PER[from]) / KM_PER[to];

export const POWER_UNITS: PowerUnit[] = ['hp', 'kW', 'PS'];

export const CATEGORIES: { key: VehicleCategory; label: string; icon: string }[] = [
  { key: 'motorcycle', label: 'Motorcycle', icon: 'motorbike' },
  { key: 'scooter', label: 'Scooter', icon: 'moped' },
  { key: 'car', label: 'Car', icon: 'car-side' },
  { key: 'suv', label: 'SUV / Jeep', icon: 'car-estate' },
  { key: 'microbus', label: 'Microbus', icon: 'van-passenger' },
  { key: 'pickup', label: 'Pickup', icon: 'car-pickup' },
  { key: 'truck', label: 'Truck', icon: 'truck' },
  { key: 'bus', label: 'Bus', icon: 'bus' },
  { key: 'cng', label: 'CNG / Auto', icon: 'rickshaw' },
  { key: 'tractor', label: 'Tractor', icon: 'tractor' },
  { key: 'other', label: 'Other', icon: 'car-wrench' },
];

export const categoryInfo = (k: VehicleCategory) => CATEGORIES.find((c) => c.key === k) ?? CATEGORIES[CATEGORIES.length - 1];

export const FUEL_TYPES: { key: FuelType; label: string }[] = [
  { key: 'octane', label: 'Octane' },
  { key: 'petrol', label: 'Petrol' },
  { key: 'diesel', label: 'Diesel' },
  { key: 'cng', label: 'CNG' },
  { key: 'lpg', label: 'LPG' },
  { key: 'hybrid', label: 'Hybrid' },
  { key: 'electric', label: 'Electric' },
];

export const fuelLabel = (k: FuelType) => FUEL_TYPES.find((f) => f.key === k)?.label ?? k;

export const SERVICE_ITEMS = [
  'General service',
  'Oil filter',
  'Air filter',
  'Fuel filter',
  'Spark plug',
  'Brake pads / shoes',
  'Brake fluid',
  'Clutch',
  'Chain & sprocket',
  'Chain lube / adjust',
  'Tyre change',
  'Tyre puncture',
  'Wheel alignment',
  'Wheel balancing',
  'Battery',
  'Coolant',
  'Gear oil',
  'AC service',
  'Suspension',
  'Electrical',
  'Body / paint',
  'Wash / clean',
  'Insurance',
  'Tax token / fitness',
  'Registration',
];

export const OIL_INTERVALS = [1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000];

export function economyUnitLabel(s: Settings, dist: DistanceUnit): string {
  const v = VOLUME_LABEL[s.volumeUnit];
  return s.economyFormat === 'volPer100' ? `${v}/100${dist}` : `${dist}/${v === 'gal (UK)' ? 'gal' : v}`;
}

/** distance (vehicle unit) and litres -> economy number in the user's format */
export function economyValue(s: Settings, distance: number, litres: number): number | null {
  if (distance <= 0 || litres <= 0) return null;
  const vol = fromLitres(litres, s.volumeUnit);
  return s.economyFormat === 'volPer100' ? (vol / distance) * 100 : distance / vol;
}
