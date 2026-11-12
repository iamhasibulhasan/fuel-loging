import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { buildEntries, LogItem, type Entry } from '../../components/LogItem';
import { Button, Card, Chips, Empty, Screen } from '../../components/ui';
import { VehicleSwitcher } from '../../components/VehicleSwitcher';
import { fmtMoney, monthKey, monthLabel } from '../../lib/format';
import { vehicleLogs } from '../../lib/stats';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';

type Filter = 'all' | Entry['kind'];

const amount = (e: Entry) => (e.kind === 'fuel' ? e.log.total : e.kind === 'service' ? e.log.total : e.log.price);

export default function History() {
  const { data, settings, activeVehicle: v } = useStore();
  const [filter, setFilter] = useState<Filter>('all');

  const groups = useMemo(() => {
    if (!v) return [];
    const l = vehicleLogs(data, v.id);
    const entries = buildEntries(l.fuel, l.services, l.oils).filter((e) => filter === 'all' || e.kind === filter);
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const k = monthKey(e.log.date);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return [...map.entries()];
  }, [data, v, filter]);

  if (!v) {
    return (
      <Screen>
        <Empty icon="car-off" title="No vehicle" text="Add a vehicle to start logging." action={<Button title="Add vehicle" onPress={() => router.push('/vehicle')} />} />
      </Screen>
    );
  }

  return (
    <Screen>
      <VehicleSwitcher />
      <View style={{ marginBottom: 12 }}>
        <Chips<Filter>
          wrap={false}
          options={[
            { key: 'all', label: 'All', icon: 'format-list-bulleted' },
            { key: 'fuel', label: 'Fuel', icon: 'gas-station' },
            { key: 'service', label: 'Service', icon: 'wrench' },
            { key: 'oil', label: 'Engine oil', icon: 'oil' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>

      {groups.length === 0 ? (
        <Card>
          <Empty icon="history" title="Nothing here yet" text="Entries you add will be listed here, grouped by month. Tap an entry to edit or delete it." />
        </Card>
      ) : (
        groups.map(([k, entries]) => (
          <View key={k}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 8 }}>
              <Text style={{ fontWeight: '800', color: colors.sub }}>{monthLabel(k)}</Text>
              <Text style={{ fontWeight: '700', color: colors.sub }}>{fmtMoney(settings, entries.reduce((s, e) => s + amount(e), 0))}</Text>
            </View>
            <Card style={{ paddingVertical: 4 }}>
              {entries.map((e) => (
                <LogItem key={e.log.id} entry={e} settings={settings} vehicle={v} />
              ))}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}
