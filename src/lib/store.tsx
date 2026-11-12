import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppData, FuelLog, OilLog, ServiceLog, Settings, Vehicle } from './types';
import { DEFAULT_SETTINGS } from './units';

const STORAGE_KEY = 'fuellog:data:v1';

const EMPTY: AppData = { version: 1, vehicles: [], fuel: [], services: [], oils: [], settings: DEFAULT_SETTINGS };

type Collection = 'fuel' | 'services' | 'oils';
type LogOf<C extends Collection> = C extends 'fuel' ? FuelLog : C extends 'services' ? ServiceLog : OilLog;

interface Store {
  data: AppData;
  ready: boolean;
  settings: Settings;
  activeVehicle: Vehicle | null;
  setActiveVehicle: (id: string) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  saveVehicle: (v: Vehicle) => void;
  deleteVehicle: (id: string) => void;
  saveLog: <C extends Collection>(c: C, log: LogOf<C>) => void;
  deleteLog: (c: Collection, id: string) => void;
  replaceAll: (d: AppData) => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

export function validateData(raw: unknown): AppData {
  const d = raw as Partial<AppData>;
  if (!d || typeof d !== 'object' || !Array.isArray(d.vehicles)) throw new Error('Not a FuelLog backup file');
  return {
    version: 1,
    vehicles: d.vehicles,
    fuel: Array.isArray(d.fuel) ? d.fuel : [],
    services: Array.isArray(d.services) ? d.services : [],
    oils: Array.isArray(d.oils) ? d.oils : [],
    settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) },
  };
}

const upsert = <T extends { id: string }>(list: T[], item: T) =>
  list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setData(validateData(JSON.parse(raw)));
      })
      .catch((e) => console.warn('Failed to load data', e))
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((e) => console.warn('Failed to save data', e));
  }, [data]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
  }, []);

  const setActiveVehicle = useCallback((id: string) => updateSettings({ activeVehicleId: id }), [updateSettings]);

  const saveVehicle = useCallback((v: Vehicle) => {
    setData((d) => ({
      ...d,
      vehicles: upsert(d.vehicles, v),
      settings: d.settings.activeVehicleId ? d.settings : { ...d.settings, activeVehicleId: v.id },
    }));
  }, []);

  const deleteVehicle = useCallback((id: string) => {
    setData((d) => {
      const vehicles = d.vehicles.filter((v) => v.id !== id);
      return {
        ...d,
        vehicles,
        fuel: d.fuel.filter((x) => x.vehicleId !== id),
        services: d.services.filter((x) => x.vehicleId !== id),
        oils: d.oils.filter((x) => x.vehicleId !== id),
        settings: {
          ...d.settings,
          activeVehicleId: d.settings.activeVehicleId === id ? (vehicles[0]?.id ?? null) : d.settings.activeVehicleId,
        },
      };
    });
  }, []);

  const saveLog = useCallback(<C extends Collection>(c: C, log: LogOf<C>) => {
    setData((d) => ({ ...d, [c]: upsert(d[c] as LogOf<C>[], log) }));
  }, []);

  const deleteLog = useCallback((c: Collection, id: string) => {
    setData((d) => ({ ...d, [c]: (d[c] as { id: string }[]).filter((x) => x.id !== id) }));
  }, []);

  const replaceAll = useCallback((d: AppData) => setData(d), []);
  const resetAll = useCallback(() => setData(EMPTY), []);

  const activeVehicle = useMemo(
    () => data.vehicles.find((v) => v.id === data.settings.activeVehicleId) ?? data.vehicles[0] ?? null,
    [data.vehicles, data.settings.activeVehicleId],
  );

  const value = useMemo<Store>(
    () => ({
      data,
      ready,
      settings: data.settings,
      activeVehicle,
      setActiveVehicle,
      updateSettings,
      saveVehicle,
      deleteVehicle,
      saveLog,
      deleteLog,
      replaceAll,
      resetAll,
    }),
    [data, ready, activeVehicle, setActiveVehicle, updateSettings, saveVehicle, deleteVehicle, saveLog, deleteLog, replaceAll, resetAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside DataProvider');
  return s;
}
