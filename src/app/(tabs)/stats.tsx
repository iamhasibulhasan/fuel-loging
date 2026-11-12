import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { BarChart } from '../../components/BarChart';
import { Button, Card, Chips, Empty, KV, Screen, SectionTitle, Stat, StatGrid } from '../../components/ui';
import { VehicleSwitcher } from '../../components/VehicleSwitcher';
import { fmtEconomy, fmtVolume, pricePerUnit, useActiveStats } from '../../lib/display';
import { fmtDate, fmtMoney, fmtNum, lastMonths, monthLabel } from '../../lib/format';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';
import { economyValue, fromLitres, VOLUME_LABEL } from '../../lib/units';

type ChartKind = 'cost' | 'volume' | 'distance' | 'mileage';

export default function Reports() {
  const { settings, activeVehicle: v } = useStore();
  const st = useActiveStats();
  const [chart, setChart] = useState<ChartKind>('cost');
  const [range, setRange] = useState<6 | 12>(6);

  if (!v || !st) {
    return (
      <Screen>
        <Empty icon="chart-bar" title="No data yet" text="Add a vehicle and some fuel entries to see reports." action={<Button title="Add vehicle" onPress={() => router.push('/vehicle')} />} />
      </Screen>
    );
  }

  const unit = v.odometerUnit;
  const vol = VOLUME_LABEL[settings.volumeUnit];
  const keys = lastMonths(range);
  const bars = keys.map((k) => {
    const m = st.months.find((x) => x.key === k);
    let value = 0;
    if (m) {
      if (chart === 'cost') value = m.fuelCost;
      else if (chart === 'volume') value = fromLitres(m.litres, settings.volumeUnit);
      else if (chart === 'distance') value = m.distance;
    }
    if (chart === 'mileage') {
      const segs = st.segments.filter((s) => s.date.startsWith(k));
      const d = segs.reduce((a, s) => a + s.distance, 0);
      const l = segs.reduce((a, s) => a + s.litres, 0);
      value = economyValue(settings, d, l) ?? 0;
    }
    return {
      label: monthLabel(k, true).split(' ')[0],
      value,
      display: chart === 'mileage' || chart === 'volume' ? fmtNum(value, 1) : fmtNum(value),
    };
  });
  const chartColor = { cost: colors.fuel, volume: colors.primary, distance: colors.service, mileage: colors.success }[chart];

  const price = pricePerUnit(settings, st.avgPricePerLitre);
  const recentSegs = [...st.segments].reverse().slice(0, 10);

  return (
    <Screen>
      <VehicleSwitcher />

      <SectionTitle>Fuel efficiency</SectionTitle>
      <StatGrid>
        <Stat icon="speedometer" label="Average mileage" value={fmtEconomy(settings, v, st.avgRate)} color={colors.success} />
        <Stat icon="speedometer-slow" label="Last mileage" value={fmtEconomy(settings, v, st.lastRate)} />
        <Stat icon="arrow-up-bold" label="Best" value={fmtEconomy(settings, v, st.bestRate)} color={colors.success} />
        <Stat icon="arrow-down-bold" label="Worst" value={fmtEconomy(settings, v, st.worstRate)} color={colors.danger} />
        <Stat icon="cash-multiple" label={`Fuel cost per ${unit}`} value={fmtMoney(settings, st.fuelCostPerDistance, 2)} color={colors.fuel} />
        <Stat icon="cash-plus" label={`Running cost per ${unit}`} value={fmtMoney(settings, st.runningCostPerDistance, 2)} sub="fuel + service + oil" color={colors.oil} />
        <Stat icon="tag" label={`Avg price / ${vol}`} value={fmtMoney(settings, price, 2)} />
        <Stat
          icon="map-marker-path"
          label="Est. full-tank range"
          value={st.estimatedRange != null ? `${fmtNum(st.estimatedRange)} ${unit}` : '—'}
          sub={v.tankCapacity ? `${v.tankCapacity} L tank` : 'Set tank size in vehicle'}
        />
      </StatGrid>

      <SectionTitle>Monthly trend</SectionTitle>
      <Card>
        <View style={{ marginBottom: 10 }}>
          <Chips<ChartKind>
            wrap={false}
            options={[
              { key: 'cost', label: 'Fuel cost' },
              { key: 'volume', label: `Fuel (${vol})` },
              { key: 'distance', label: `Distance (${unit})` },
              { key: 'mileage', label: 'Mileage' },
            ]}
            value={chart}
            onChange={setChart}
          />
        </View>
        <BarChart data={bars} color={chartColor} />
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
          <Chips<6 | 12>
            options={[
              { key: 6, label: '6 months' },
              { key: 12, label: '12 months' },
            ]}
            value={range}
            onChange={setRange}
          />
        </View>
      </Card>

      <SectionTitle>Month by month</SectionTitle>
      {st.months.length === 0 ? (
        <Card>
          <Text style={{ color: colors.sub }}>No entries yet.</Text>
        </Card>
      ) : (
        st.months.map((m) => {
          const perDist = m.distance > 0 ? m.fuelCost / m.distance : null;
          return (
            <Card key={m.key}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>{monthLabel(m.key)}</Text>
                <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>
                  {fmtMoney(settings, m.fuelCost + m.serviceCost + m.oilCost)}
                </Text>
              </View>
              <KV k="Fuel used" v={`${fmtVolume(settings, m.litres, 2)} · ${m.fills} fill-ups`} />
              <KV k="Fuel cost" v={fmtMoney(settings, m.fuelCost)} />
              <KV k="Distance driven" v={`${fmtNum(m.distance)} ${unit}`} />
              <KV k={`Fuel cost per ${unit}`} v={fmtMoney(settings, perDist, 2)} />
              {m.distance > 0 && m.litres > 0 ? <KV k="Approx. mileage" v={fmtEconomy(settings, v, m.distance / m.litres)} /> : null}
              {m.serviceCost > 0 ? <KV k="Service" v={fmtMoney(settings, m.serviceCost)} /> : null}
              {m.oilCost > 0 ? <KV k="Engine oil" v={fmtMoney(settings, m.oilCost)} /> : null}
            </Card>
          );
        })
      )}

      <SectionTitle>Full-tank mileage history</SectionTitle>
      <Card>
        {recentSegs.length === 0 ? (
          <Text style={{ color: colors.sub, lineHeight: 20 }}>
            Mileage appears after two &ldquo;Full tank&rdquo; fill-ups. Fill the tank completely, log it as Full tank, and do the same next time.
          </Text>
        ) : (
          recentSegs.map((s, i) => (
            <KV
              key={i}
              k={`${fmtDate(s.date)} · ${fmtNum(s.distance)} ${unit} on ${fmtVolume(settings, s.litres, 2)}`}
              v={fmtEconomy(settings, v, s.rate)}
            />
          ))
        )}
      </Card>

      <SectionTitle>Lifetime totals</SectionTitle>
      <Card>
        <KV k="Distance tracked" v={`${fmtNum(st.totalDistance)} ${unit}`} />
        <KV k="Fuel purchased" v={fmtVolume(settings, st.totalLitres, 1)} />
        <KV k="Fuel cost" v={fmtMoney(settings, st.totalFuelCost)} />
        <KV k="Service cost" v={fmtMoney(settings, st.serviceCost)} />
        <KV k="Engine oil cost" v={fmtMoney(settings, st.oilCost)} />
        <KV k="Total cost" v={fmtMoney(settings, st.totalCost)} bold />
      </Card>
    </Screen>
  );
}
