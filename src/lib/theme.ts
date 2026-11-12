export type ThemeName = 'light' | 'dark';
export type ThemePref = 'system' | ThemeName;

const light = {
  bg: '#F3F5F9',
  card: '#FFFFFF',
  input: '#FFFFFF',
  text: '#111827',
  sub: '#6B7280',
  faint: '#9CA3AF',
  border: '#E5E7EB',
  track: '#E5E7EB',
  primary: '#0F766E',
  primarySoft: '#CCFBF1',
  fuel: '#2563EB',
  fuelSoft: '#DBEAFE',
  service: '#7C3AED',
  serviceSoft: '#EDE9FE',
  oil: '#D97706',
  oilSoft: '#FEF3C7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  hero: '#0F172A',
  overlay: 'rgba(15,23,42,0.45)',
};

const dark: typeof light = {
  bg: '#0B1120',
  card: '#131C2E',
  input: '#0F1727',
  text: '#E5E7EB',
  sub: '#9CA3AF',
  faint: '#6B7280',
  border: '#24304A',
  track: '#24304A',
  primary: '#14B8A6',
  primarySoft: '#123B37',
  fuel: '#60A5FA',
  fuelSoft: '#16264A',
  service: '#A78BFA',
  serviceSoft: '#2A1E4D',
  oil: '#FBBF24',
  oilSoft: '#3A2C0C',
  danger: '#F87171',
  dangerSoft: '#3D1818',
  success: '#4ADE80',
  successSoft: '#123222',
  hero: '#020617',
  overlay: 'rgba(0,0,0,0.6)',
};

/**
 * Active palette. It's mutated in place by `applyTheme`, and the app tree is
 * remounted on theme change, so every `colors.x` read picks up the new values.
 */
export const colors = { ...light };

let current: ThemeName = 'light';
export const themeName = () => current;
export const isDark = () => current === 'dark';

export function applyTheme(name: ThemeName) {
  if (name === current) return;
  current = name;
  Object.assign(colors, name === 'dark' ? dark : light);
}

export const radius = 14;
export const COMPANY = {
  name: 'Renosia Tech',
  url: 'https://renosiatech.com/',
};
export const copyright = () => `© ${new Date().getFullYear()} ${COMPANY.name}. All rights reserved.`;
