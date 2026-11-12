import { Pressable, ScrollView, Text, View } from 'react-native';
import { useStore } from '../lib/store';
import { colors } from '../lib/theme';
import { categoryInfo } from '../lib/units';
import { Icon } from './ui';

/** Horizontal vehicle selector shown when more than one vehicle exists. */
export function VehicleSwitcher() {
  const { data, activeVehicle, setActiveVehicle } = useStore();
  if (data.vehicles.length < 2) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
      {data.vehicles.map((v) => {
        const on = v.id === activeVehicle?.id;
        return (
          <Pressable
            key={v.id}
            onPress={() => setActiveVehicle(v.id)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 999,
              backgroundColor: on ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: on ? colors.primary : colors.border,
            }}
          >
            <Icon name={categoryInfo(v.category).icon} size={16} color={on ? '#fff' : colors.sub} />
            <Text style={{ color: on ? '#fff' : colors.text, fontWeight: '600' }}>{v.name}</Text>
          </Pressable>
        );
      })}
      <View style={{ width: 4 }} />
    </ScrollView>
  );
}
