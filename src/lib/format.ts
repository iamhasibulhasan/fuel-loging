import type { Settings } from './types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtNum(n: number | null | undefined, decimals = 0): string {
  if (n == null || !isFinite(n)) return '—';
  const fixed = Math.abs(n).toFixed(decimals);
  const [int, frac] = fixed.split('.');
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n < 0 ? '-' : '') + withSep + (frac ? '.' + frac : '');
}

/** Trim trailing zeros: 12.50 -> 12.5, 12.00 -> 12 */
export function fmtSmart(n: number | null | undefined, maxDecimals = 2): string {
  if (n == null || !isFinite(n)) return '—';
  const s = fmtNum(n, maxDecimals);
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

export function fmtMoney(s: Settings, n: number | null | undefined, decimals?: number): string {
  if (n == null || !isFinite(n)) return '—';
  const d = decimals ?? (Math.abs(n) >= 1000 ? 0 : 2);
  const sym = s.currencySymbol;
  const sep = sym.length > 1 ? ' ' : '';
  return `${n < 0 ? '-' : ''}${sym}${sep}${fmtNum(Math.abs(n), d)}`;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const todayISO = () => toISODate(new Date());

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return '—';
  const d = parseISODate(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthLabel(key: string, short = false): string {
  const [y, m] = key.split('-').map(Number);
  return short ? `${MONTHS[m - 1]} ${String(y).slice(2)}` : `${MONTHS[m - 1]} ${y}`;
}

export const monthKey = (iso: string) => iso.slice(0, 7);

/** the last n month keys (YYYY-MM), oldest first, ending with the current month */
export function lastMonths(n: number): string[] {
  const out: string[] = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    out.unshift(toISODate(d).slice(0, 7));
    d.setMonth(d.getMonth() - 1);
  }
  return out;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISODate(b).getTime() - parseISODate(a).getTime()) / 86400000);
}

/** Parse user input like "1,234.5" safely. Returns NaN for empty. */
export function parseNum(s: string): number {
  if (s == null) return NaN;
  const clean = String(s).replace(/,/g, '').trim();
  if (clean === '') return NaN;
  return Number(clean);
}

export const numToInput = (n: number | null | undefined) => (n == null || !isFinite(n) ? '' : String(n));

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
