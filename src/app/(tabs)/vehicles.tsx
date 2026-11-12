import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { FadeIn, PressableScale } from '../../components/motion';
import { Button, Card, Empty, Icon, Screen } from '../../components/ui';
import { fmtEconomy } from '../../lib/display';
import { fmtMoney, fmtNum } from '../../lib/format';
import { computeStats } from '../../lib/stats';
import { useStore } from '../../lib/store';
import { colors } from '../../lib/theme';
import { categoryInfo, fuelLabel } from '../../lib/units';

export default function Vehicles() {
  const { data, settings, activeVehicle, setActiveVehicle } = useStore();

  return (
    <Screen>
      {data.vehicles.length === 0 ? (
        <Card>
          <Empty icon="garage" title="No vehicles" text="Motorcycle, car, truck, bus — add as many as you own." />
        </Card>
      ) : (
        data.vehicles.map((v, i) => {
          const st = computeStats(data, v);
          const active = v.id === activeVehicle?.id;
          const cat = categoryInfo(v.category);
          return (
            <FadeIn key={v.id} delay={i * 90}>
              <PressableScale scaleTo={0.98} onPress={() => setActiveVehicle(v.id)}>
              <Card style={active ? { borderColor: colors.primary, borderWidth: 2 } : undefined}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={cat.icon} size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>{v.name}</Text>
                    <Text style={{ color: colors.sub, fontSize: 12 }} numberOfLines={1}>
                      {[cat.label, [v.make, v.model, v.year].filter(Boolean).join(' '), v.regNumber].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  {active ? (
                    <View style={{ backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>ACTIVE</Text>
                    </View>
                  ) : null}
                  <Pressable hitSlop={12} onPress={() => router.push({ pathname: '/vehicle', params: { id: v.id } })}>
                    <Icon name="pencil" size={20} color={colors.sub} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  <Tag text={fuelLabel(v.fuelType)} />
                  {v.engineCC ? <Tag text={`${fmtNum(v.engineCC)} cc`} /> : null}
                  {v.power ? <Tag text={`${v.power} ${v.powerUnit}`} /> : null}
                  <Tag text={`Odometer: ${v.odometerUnit}`} />
                  {v.tankCapacity ? <Tag text={`Tank ${v.tankCapacity} L`} /> : null}
                </View>
                <View style={{ flexDirection: 'row', marginTop: 8, gap: 6 }}>
                  <Mini label="Odometer" value={st.currentOdometer != null ? `${fmtNum(st.currentOdometer)} ${v.odometerUnit}` : '—'} />
                  <Mini label="Mileage" value={fmtEconomy(settings, v, st.avgRate)} />
                  <Mini label="Spent" value={fmtMoney(settings, st.totalCost, 0)} />
                </View>
              </Card>
              </PressableScale>
            </FadeIn>
          );
        })
      )}
      <Button title="Add vehicle" icon="plus" onPress={() => router.push('/vehicle')} />
    </Screen>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: colors.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
      <Text style={{ color: colors.sub, fontSize: 12, fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.faint, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}
