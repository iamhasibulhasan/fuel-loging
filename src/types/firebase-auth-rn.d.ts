// `firebase/auth` resolves to the React Native build at runtime (Metro uses the
// "react-native" export condition of @firebase/auth), which exports
// getReactNativePersistence. The default TypeScript types are the browser ones,
// so declare it here.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
