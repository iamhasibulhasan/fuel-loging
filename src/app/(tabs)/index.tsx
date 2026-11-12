import { Link, router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart } from '../../components/BarChart';
import { Logo } from '../../components/Logo';
import { FadeIn, PressableScale, Pulse, useCountUp } from '../../components/motion';
import { buildEntries, LogItem } from '../../components/LogItem';
import { Avatar, Button, Card, Icon, Progress, Screen, SectionTitle, Stat, StatGrid } from '../../components/ui';
import { VehicleSwitcher } from '../../components/VehicleSwitcher';
import { fmtEconomy, fmtVolume, pricePerUnit, useActiveStats } from '../../lib/display';
import { daysBetween, fmtDate, fmtMoney, fmtNum, lastMonths, monthLabel, todayISO, toISODate } from '../../lib/format';
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
        <FadeIn>
          <LinearGradient
            colors={['#0F172A', '#134E4A', '#0F766E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 26, padding: 24, alignItems: 'center', marginTop: 8, overflow: 'hidden' }}
          >
            <View pointerEvents="none" style={{ position: 'absolute', left: -50, top: -50, width: 180, height: 180, borderRadius: 90, borderWidth: 26, borderColor: 'rgba(255,255,255,0.05)' }} />
            <View style={{ marginTop: 8 }}>
              <Logo size={92} />
            </View>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 18 }}>Welcome to Fuel Burn</Text>
            <Text style={{ color: '#CCFBF1', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
              Your smart logbook for fuel, mileage, servicing and engine oil.
            </Text>
          </LinearGradient>
        </FadeIn>

        <View style={{ gap: 10, marginTop: 16, marginBottom: 16 }}>
          {[
            { icon: 'gas-station', color: colors.fuel, bg: colors.fuelSoft, title: 'Log every fill-up', text: 'Full or partial tank, total auto-calculated' },
            { icon: 'speedometer', color: colors.success, bg: colors.successSoft, title: 'Know your real mileage', text: 'km/L, cost per km and monthly reports' },
            { icon: 'oil', color: colors.oil, bg: colors.oilSoft, title: 'Never miss an oil change', text: 'Reminders for engine oil and servicing' },
          ].map((f, i) => (
            <FadeIn key={f.title} delay={200 + i * 120} distance={20}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 0 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: f.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={f.icon} size={24} color={f.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: colors.text }}>{f.title}</Text>
                  <Text style={{ color: colors.sub, fontSize: 12, marginTop: 2 }}>{f.text}</Text>
                </View>
              </Card>
            </FadeIn>
          ))}
        </View>

        <FadeIn delay={600}>
          <Button title="Add your first vehicle" icon="plus" onPress={() => router.push('/vehicle')} />
        </FadeIn>
        <Text style={{ textAlign: 'center', color: colors.faint, fontSize: 12, marginTop: 16 }}>{copyright()}</Text>
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

  const profile = data.profile;
  const firstName = profile.name.trim().split(/\s+/)[0];
  const licenseDays = profile.licenseExpiry ? daysBetween(todayISO(), profile.licenseExpiry) : null;

  return (
    <Screen>
      {firstName ? (
        <FadeIn distance={8}>
          <Pressable onPress={() => router.push('/profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Avatar name={profile.name} photo={profile.photo} size={42} />
            <View>
              <Text style={{ color: colors.sub, fontSize: 12 }}>{greeting()}</Text>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{firstName} 👋</Text>
            </View>
          </Pressable>
        </FadeIn>
      ) : null}

      {licenseDays != null && licenseDays <= 30 ? (
        <Pressable onPress={() => router.push('/profile')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.dangerSoft, borderColor: colors.danger }}>
            <Pulse>
              <Icon name="card-account-details-outline" color={colors.danger} />
            </Pulse>
            <Text style={{ flex: 1, color: colors.danger, fontWeight: '700' }}>
              {licenseDays < 0
                ? `Driving licence expired ${-licenseDays} days ago`
                : licenseDays === 0
                  ? 'Driving licence expires today'
                  : `Driving licence expires in ${licenseDays} days (${fmtDate(profile.licenseExpiry)})`}
            </Text>
          </Card>
        </Pressable>
      ) : null}

      <VehicleSwitcher />

      {/* Hero */}
      <FadeIn>
      <LinearGradient
        colors={['#0F172A', '#134E4A', '#0F766E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 18, padding: 14, marginBottom: 10, overflow: 'hidden' }}
      >
        {/* decorative rings */}
        <View pointerEvents="none" style={{ position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, borderWidth: 28, borderColor: 'rgba(255,255,255,0.05)' }} />
        <View pointerEvents="none" style={{ position: 'absolute', right: 30, bottom: -90, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(94,234,212,0.08)' }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={categoryInfo(v.category).icon} size={22} color="#5EEAD4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }} numberOfLines={1}>
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
        <Text style={{ color: '#99F6E4', fontSize: 11, marginTop: 12, letterSpacing: 1.5, fontWeight: '700' }}>ODOMETER</Text>
        <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: 1 }}>
          <CountUpText value={st.currentOdometer} /> <Text style={{ fontSize: 16, color: '#99F6E4' }}>{unit}</Text>
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
          <HeroStat icon="speedometer" label="Avg mileage" value={fmtEconomy(settings, v, st.avgRate)} />
          <HeroStat icon="cash" label={`Fuel cost / ${unit}`} value={fmtMoney(settings, st.fuelCostPerDistance, 2)} />
          <HeroStat icon="wallet" label="Total spent" value={fmtMoney(settings, st.totalCost, 0)} />
        </View>
      </LinearGradient>
      </FadeIn>

      {/* Quick actions */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <QuickAction icon="gas-station" label="Add Fuel" gradient={['#3B82F6', '#1D4ED8']} href="/fuel" delay={120} />
        <QuickAction icon="wrench" label="Service" gradient={['#8B5CF6', '#6D28D9']} href="/service" delay={190} />
        <QuickAction icon="oil" label="Oil Change" gradient={['#F59E0B', '#B45309']} href="/oil" delay={260} />
      </View>

      {/* Engine oil */}
      <FadeIn delay={320}>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Icon name="oil" color={colors.oil} />
          <Text style={{ fontWeight: '800', fontSize: 15, color: colors.text, flex: 1 }}>Engine Oil</Text>
          {st.oil ? (
            <Pulse active={st.oil.remaining <= 0}>
              <Text style={{ color: oilColor, fontWeight: '700' }}>
                {st.oil.remaining <= 0 ? 'Change due!' : `${fmtNum(st.oil.remaining)} ${unit} left`}
              </Text>
            </Pulse>
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
      </FadeIn>

      {/* Service due */}
      {st.service ? (
        <FadeIn delay={380}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon name="calendar-clock" color={colors.service} />
            <Text style={{ fontWeight: '800', fontSize: 15, color: colors.text, flex: 1 }}>Next Service</Text>
            {(st.service.remaining != null && st.service.remaining <= 0) || (st.service.daysLeft != null && st.service.daysLeft <= 0) ? (
              <Pulse>
                <Text style={{ color: colors.danger, fontWeight: '700' }}>Due now</Text>
              </Pulse>
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
        </FadeIn>
      ) : null}

      <FadeIn delay={440}>
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
      </FadeIn>

      <FadeIn delay={520}>
      <SectionTitle>Spending</SectionTitle>
      <Card>
        <SpendRow label="Fuel" value={st.totalFuelCost} total={st.totalCost} color={colors.fuel} delay={600} />
        <SpendRow label="Service" value={st.serviceCost} total={st.totalCost} color={colors.service} delay={700} />
        <SpendRow label="Engine oil" value={st.oilCost} total={st.totalCost} color={colors.oil} delay={800} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontWeight: '700', color: colors.text }}>Total</Text>
          <Text style={{ fontWeight: '800', color: colors.text }}>{fmtMoney(settings, st.totalCost)}</Text>
        </View>
      </Card>
      </FadeIn>

      <FadeIn delay={600}>
      <SectionTitle>Fuel cost · last 6 months</SectionTitle>
      <Card>
        <BarChart data={months6} color={colors.fuel} />
      </Card>
      </FadeIn>

      <FadeIn delay={680}>
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
          recent.map((e, i) => <LogItem key={e.log.id} entry={e} settings={settings} vehicle={v} index={i} />)
        ) : (
          <Text style={{ color: colors.sub, paddingVertical: 12 }}>No entries yet. Add your first fuel fill-up above.</Text>
        )}
      </Card>
      </FadeIn>

      <Text style={{ textAlign: 'center', color: colors.faint, fontSize: 12, marginTop: 8 }}>{copyright()}</Text>
    </Screen>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function CountUpText({ value }: { value: number | null }) {
  const n = useCountUp(value, 1100);
  return <>{n != null ? fmtNum(n) : '—'}</>;
}

function HeroStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Icon name={icon} size={12} color="#99F6E4" />
        <Text style={{ color: '#CBD5E1', fontSize: 11, flexShrink: 1 }} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={{ color: '#fff', fontWeight: '800', marginTop: 4 }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  gradient,
  href,
  delay,
}: {
  icon: string;
  label: string;
  gradient: [string, string];
  href: '/fuel' | '/service' | '/oil';
  delay: number;
}) {
  return (
    <FadeIn delay={delay} distance={24} style={{ flex: 1 }}>
      <PressableScale onPress={() => router.push(href)} scaleTo={0.92}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 16, paddingVertical: 10, alignItems: 'center', gap: 5 }}
        >
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={20} color="#fff" />
          </View>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{label}</Text>
        </LinearGradient>
      </PressableScale>
    </FadeIn>
  );
}

function SpendRow({ label, value, total, color, delay }: { label: string; value: number; total: number; color: string; delay?: number }) {
  const { settings } = useStore();
  const pct = total > 0 ? value / total : 0;
  return (
    <View style={{ marginBottom: 9 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: colors.text, fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: colors.sub }}>
          {fmtMoney(settings, value)} · {fmtNum(pct * 100)}%
        </Text>
      </View>
      <Progress value={pct} color={color} delay={delay} />
    </View>
  );
}
