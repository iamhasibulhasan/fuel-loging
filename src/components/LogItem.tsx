import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { fmtDate, fmtMoney, fmtNum, fmtSmart } from '../lib/format';
import { colors } from '../lib/theme';
import type { FuelLog, OilLog, ServiceLog, Settings, Vehicle } from '../lib/types';
import { VOLUME_LABEL } from '../lib/units';
import { Icon } from './ui';

export type Entry =
  | { kind: 'fuel'; log: FuelLog }
  | { kind: 'service'; log: ServiceLog }
  | { kind: 'oil'; log: OilLog };

export function buildEntries(fuel: FuelLog[], services: ServiceLog[], oils: OilLog[]): Entry[] {
  const all: Entry[] = [
    ...fuel.map((log) => ({ kind: 'fuel' as const, log })),
    ...services.map((log) => ({ kind: 'service' as const, log })),
    ...oils.map((log) => ({ kind: 'oil' as const, log })),
  ];
  return all.sort((a, b) => b.log.date.localeCompare(a.log.date) || b.log.odometer - a.log.odometer);
}

const META = {
  fuel: { icon: 'gas-station', color: colors.fuel, bg: colors.fuelSoft, path: '/fuel' },
  service: { icon: 'wrench', color: colors.service, bg: colors.serviceSoft, path: '/service' },
  oil: { icon: 'oil', color: colors.oil, bg: colors.oilSoft, path: '/oil' },
} as const;

export function LogItem({ entry, settings, vehicle }: { entry: Entry; settings: Settings; vehicle: Vehicle }) {
  const m = META[entry.kind];
  let title = '';
  let sub = '';
  let amount = 0;
  if (entry.kind === 'fuel') {
    const f = entry.log;
    title = `${fmtSmart(f.volume)} ${VOLUME_LABEL[f.volumeUnit]} · ${f.fullTank ? 'Full tank' : 'Partial'}`;
    sub = `@ ${fmtMoney(settings, f.unitPrice)}/${VOLUME_LABEL[f.volumeUnit]}${f.station ? ' · ' + f.station : ''}`;
    amount = f.total;
  } else if (entry.kind === 'service') {
    const sv = entry.log;
    title = sv.items.length ? sv.items.slice(0, 2).join(', ') + (sv.items.length > 2 ? ` +${sv.items.length - 2}` : '') : 'Service';
    sub = sv.garage || 'Service';
    amount = sv.total;
  } else {
    const o = entry.log;
    title = o.oilName + (o.grade ? ` (${o.grade})` : '');
    sub = `Next at ${fmtNum(o.odometer + o.intervalKm)} ${vehicle.odometerUnit}${o.filterChanged ? ' · filter changed' : ''}`;
    amount = o.price;
  }
  return (
    <Pressable
      onPress={() => router.push({ pathname: m.path, params: { id: entry.log.id } })}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 12,
        opacity: pressed ? 0.6 : 1,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.border,
      })}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: m.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={m.icon} size={20} color={m.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>
          {title}
        </Text>
        <Text style={{ color: colors.sub, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontWeight: '800', color: colors.text }}>{fmtMoney(settings, amount)}</Text>
        <Text style={{ color: colors.faint, fontSize: 11, marginTop: 2 }}>
          {fmtDate(entry.log.date)} · {fmtNum(entry.log.odometer)} {vehicle.odometerUnit}
        </Text>
      </View>
    </Pressable>
  );
}
