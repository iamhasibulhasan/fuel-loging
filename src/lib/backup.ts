import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { todayISO } from './format';
import { photoBase64, restorePhoto } from './photo';
import { validateData } from './store';
import type { AppData } from './types';
import { VOLUME_LABEL } from './units';

async function shareText(name: string, content: string, mimeType: string) {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  await file.write(content);
  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}

export async function exportBackup(data: AppData) {
  // the profile picture is a separate file, so embed it in the backup as base64
  const profilePhotoBase64 = await photoBase64(data.profile.photo);
  await shareText(`fuelburn-backup-${todayISO()}.json`, JSON.stringify({ ...data, profilePhotoBase64 }, null, 2), 'application/json');
}

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function exportCsv(data: AppData) {
  const name = (id: string) => data.vehicles.find((v) => v.id === id)?.name ?? '';
  const rows: unknown[][] = [
    ['Type', 'Vehicle', 'Date', 'Odometer', 'Details', 'Volume', 'Volume unit', 'Unit price', 'Amount', 'Notes'],
  ];
  for (const f of data.fuel)
    rows.push(['Fuel', name(f.vehicleId), f.date, f.odometer, f.fullTank ? 'Full tank' : 'Partial', f.volume, VOLUME_LABEL[f.volumeUnit], f.unitPrice, f.total, f.notes]);
  for (const s of data.services)
    rows.push(['Service', name(s.vehicleId), s.date, s.odometer, s.items.join('; ') + (s.garage ? ` @ ${s.garage}` : ''), '', '', '', s.total, s.notes]);
  for (const o of data.oils)
    rows.push(['Engine oil', name(o.vehicleId), o.date, o.odometer, `${o.oilName} ${o.grade} (use ${o.intervalKm})`.trim(), o.quantity ?? '', 'L', '', o.price, o.notes]);
  rows.sort((a, b) => (a === rows[0] ? -1 : b === rows[0] ? 1 : String(a[2]).localeCompare(String(b[2]))));
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  await shareText(`fuelburn-${todayISO()}.csv`, csv, 'text/csv');
}

/** Returns null if the user cancelled. */
export async function pickBackup(): Promise<AppData | null> {
  const res = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/plain', '*/*'] });
  if (res.canceled) return null;
  const raw = JSON.parse(await res.result.text());
  const data = validateData(raw);
  if (typeof raw.profilePhotoBase64 === 'string' && raw.profilePhotoBase64) {
    data.profile.photo = await restorePhoto(raw.profilePhotoBase64);
  } else if (data.profile.photo && !new File(Paths.document, data.profile.photo).exists) {
    data.profile.photo = null;
  }
  return data;
}
