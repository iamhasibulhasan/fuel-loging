import { Link, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BarChart } from '../../components/BarChart';
import { buildEntries, LogItem } from '../../components/LogItem';
import { Button, Card, Empty, Icon, Progress, Screen, SectionTitle, Stat, StatGrid } from '../../components/ui';
import { VehicleSwitcher } from '../../components/VehicleSwitcher';
import { fmtEconomy, fmtVolume, pricePerUnit, useActiveStats } from '../../lib/display';
import { fmtDate, fmtMoney, fmtNum, lastMonths, monthLabel, toISODate } from '../../lib/format';
import { vehicleLogs } from '../../lib/stats';
import { useStore } from '../../lib/store';
import { colors, copyright } from '../../lib/theme';
import { categoryInfo, fuelLabel, VOLUME_LABEL } from '../../lib/units';

export default function Dashboard() {
  const { data, settings, activeVehicle: v } = useStore();
  const st = useActiveStats();

  const recent = useMemo(() => {
    if (!v) return [];
    const l = vehicleLogs(data, v.id);
    return buildEntries(l.fuel, l.services, l.oils).slice(0, 5);
  }, [data, v]);

  if (!v || !st) {
    return (
      <Screen>
        <Card style={{ marginTop: 24 }}>
          <Empty
            icon="car-side"
            title="Welcome to FuelLog"
            text="Track fuel, mileage, servicing and engine oil changes for all your vehicles. Start by adding a vehicle."
            action={<Button title="Add your first vehicle" icon="plus" onPress={() => router.push('/vehicle')} />}
          />
        </Card>
        <Text style={{ textAlign: 'center', color: colors.faint, fontSize: 12 }}>{copyright()}</Text>
      </Screen>
    );
  }

  const unit = v.odometerUnit;
  const thisMonth = toISODate(new Date()).slice(0, 7);
  const tm = st.months.find((m) => m.key === thisMonth);
  const months6 = lastMonths(6).map((k) => {
    const m = st.months.find((x) => x.key === k);
    return { label: monthLabel(k, true).split(' ')[0], value: m?.fuelCost ?? 0, display: m ? fmtNum(m.fuelCost) : '' };
  });
  const price = pricePerUnit(settings, st.avgPricePerLitre);
  const oilColor = !st.oil ? colors.oil : st.oil.remaining <= 0 ? colors.danger : st.oil.progress > 0.85 ? colors.oil : colors.success;

  return (
    <Screen>
      <VehicleSwitcher />

      {/* Hero */}
      <View style={{ backgroundColor: colors.hero, borderRadius: 20, padding: 18, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={categoryInfo(v.category).icon} size={26} color="#5EEAD4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
              {v.name}
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 12 }} numberOfLines={1}>
              {[categoryInfo(v.category).label, [v.make, v.model].filter(Boolean).join(' '), v.engineCC ? `${v.engineCC} cc` : '', fuelLabel(v.fuelType)]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
          <Pressable onPress={() => router.push({ pathname: '/vehicle', params: { id: v.id } })} hitSlop={10}>
            <Icon name="pencil" size={18} color="#94A3B8" />
          </Pressable>
        </View>
        <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 18 }}>ODOMETER</Text>
        <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800', letterSpacing: 1 }}>
          {st.currentOdometer != null ? fmtNum(st.currentOdometer) : '—'} <Text style={{ fontSize: 16, color: '#94A3B8' }}>{unit}</Text>
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 14, gap: 12 }}>
          <HeroStat label="Avg mileage" value={fmtEconomy(settings, v, st.avgRate)} />
          <HeroStat label={`Fuel cost / ${unit}`} value={fmtMoney(settings, st.fuelCostPerDistance, 2)} />
          <HeroStat label="Total spent" value={fmtMoney(settings, st.totalCost, 0)} />
        </View>
      </View>

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
        <QuickAction icon="gas-station" label="Add Fuel" color={colors.fuel} bg={colors.fuelSoft} href="/fuel" />
        <QuickAction icon="wrench" label="Service" color={colors.service} bg={colors.serviceSoft} href="/service" />
        <QuickAction icon="oil" label="Oil Change" color={colors.oil} bg={colors.oilSoft} href="/oil" />
      </View>

      {/* Engine oil */}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Icon name="oil" color={colors.oil} />
          <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text, flex: 1 }}>Engine Oil</Text>
          {st.oil ? (
            <Text style={{ color: oilColor, fontWeight: '700' }}>
              {st.oil.remaining <= 0 ? 'Change due!' : `${fmtNum(st.oil.remaining)} ${unit} left`}
            </Text>
          ) : null}
        </View>
        {st.oil ? (
          <>
            <Progress value={st.oil.progress} color={oilColor} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text style={{ color: colors.sub, fontSize: 12 }}>
                {st.oil.last.oilName} · changed {fmtDate(st.oil.last.date)} at {fmtNum(st.oil.last.odometer)}
              </Text>
            </View>
            <Text style={{ color: colors.sub, fontSize: 12, marginTop: 2 }}>
              Used {fmtNum(st.oil.used)} of {fmtNum(st.oil.last.intervalKm)} {unit} · next change at{' '}
              <Text style={{ fontWeight: '700', color: colors.text }}>
                {fmtNum(st.oil.nextAt)} {unit}
              </Text>
            </Text>
          </>
        ) : (
          <Text style={{ color: colors.sub }}>No oil change logged yet. Log one to get change reminders.</Text>
        )}
      </Card>

      {/* Service due */}
      {st.service ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="calendar-clock" color={colors.service} />
            <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text, flex: 1 }}>Next Service</Text>
            {(st.service.remaining != null && st.service.remaining <= 0) || (st.service.daysLeft != null && st.service.daysLeft <= 0) ? (
              <Text style={{ color: colors.danger, fontWeight: '700' }}>Due now</Text>
            ) : null}
          </View>
          <Text style={{ color: colors.sub, marginTop: 8 }}>
            {[
              st.service.nextOdometer != null
                ? `At ${fmtNum(st.service.nextOdometer)} ${unit}${st.service.remaining != null ? ` (${fmtNum(st.service.remaining)} ${unit} left)` : ''}`
                : '',
              st.service.nextDate ? `On ${fmtDate(st.service.nextDate)}${st.service.daysLeft != null ? ` (${st.service.daysLeft} days)` : ''}` : '',
            ]
              .filter(Boolean)
              .join('\n')}
          </Text>
        </Card>
      ) : null}

      <SectionTitle>Summary</SectionTitle>
      <StatGrid>
        <Stat icon="calendar-month" label="This month fuel" value={fmtMoney(settings, tm?.fuelCost ?? 0, 0)} sub={fmtVolume(settings, tm?.litres ?? 0)} color={colors.fuel} />
        <Stat icon="map-marker-distance" label="This month driven" value={`${fmtNum(tm?.distance ?? 0)} ${unit}`} sub={`${tm?.fills ?? 0} fill-ups`} />
        <Stat icon="speedometer" label="Last mileage" value={fmtEconomy(settings, v, st.lastRate)} sub={`Best ${fmtEconomy(settings, v, st.bestRate)}`} color={colors.success} />
        <Stat
          icon="cash"
          label={`Avg price / ${VOLUME_LABEL[settings.volumeUnit]}`}
          value={fmtMoney(settings, price, 2)}
          sub={`Running cost ${fmtMoney(settings, st.runningCostPerDistance, 2)}/${unit}`}
          color={colors.oil}
        />
        <Stat icon="water" label="Total fuel" value={fmtVolume(settings, st.totalLitres, 0)} sub={`${st.fills} fill-ups`} color={colors.fuel} />
        <Stat
          icon="road-variant"
          label="Distance tracked"
          value={`${fmtNum(st.totalDistance)} ${unit}`}
          sub={st.avgDailyDistance ? `~${fmtNum(st.avgDailyDistance, 1)} ${unit}/day` : undefined}
        />
      </StatGrid>

      <SectionTitle>Spending</SectionTitle>
      <Card>
        <SpendRow label="Fuel" value={st.totalFuelCost} total={st.totalCost} color={colors.fuel} />
        <SpendRow label="Service" value={st.serviceCost} total={st.totalCost} color={colors.service} />
        <SpendRow label="Engine oil" value={st.oilCost} total={st.totalCost} color={colors.oil} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontWeight: '700', color: colors.text }}>Total</Text>
          <Text style={{ fontWeight: '800', color: colors.text }}>{fmtMoney(settings, st.totalCost)}</Text>
        </View>
      </Card>

      <SectionTitle>Fuel cost · last 6 months</SectionTitle>
      <Card>
        <BarChart data={months6} color={colors.fuel} />
      </Card>

      <SectionTitle
        right={
          <Link href="/history" style={{ color: colors.primary, fontWeight: '700' }}>
            See all
          </Link>
        }
      >
        Recent activity
      </SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {recent.length ? (
          recent.map((e) => <LogItem key={e.log.id} entry={e} settings={settings} vehicle={v} />)
        ) : (
          <Text style={{ color: colors.sub, paddingVertical: 12 }}>No entries yet. Add your first fuel fill-up above.</Text>
        )}
      </Card>

      <Text style={{ textAlign: 'center', color: colors.faint, fontSize: 12, marginTop: 8 }}>{copyright()}</Text>
    </Screen>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#1E293B', borderRadius: 12, padding: 10 }}>
      <Text style={{ color: '#94A3B8', fontSize: 11 }} numberOfLines={1}>
        {label}
      </Text>
      <Text style={{ color: '#fff', fontWeight: '800', marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function QuickAction({ icon, label, color, bg, href }: { icon: string; label: string; color: string; bg: string; href: '/fuel' | '/service' | '/oil' }) {
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: bg,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        gap: 6,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Icon name={icon} size={26} color={color} />
      <Text style={{ color, fontWeight: '800', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

function SpendRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const { settings } = useStore();
  const pct = total > 0 ? value / total : 0;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: colors.sub }}>
          {fmtMoney(settings, value)} · {fmtNum(pct * 100)}%
        </Text>
      </View>
      <Progress value={pct} color={color} />
    </View>
  );
}
