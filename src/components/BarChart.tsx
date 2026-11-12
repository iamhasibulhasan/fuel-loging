import { Text, View } from 'react-native';
import { colors } from '../lib/theme';

export interface Bar {
  label: string;
  value: number;
  display?: string;
}

/** Simple vertical bar chart built from Views (no native chart dependency). */
export function BarChart({ data, color = colors.primary, height = 140 }: { data: Bar[]; color?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: height + 36 }}>
      {data.map((d, i) => {
        const h = Math.max(2, (d.value / max) * height);
        return (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Text style={{ fontSize: 9, color: colors.sub, marginBottom: 3 }} numberOfLines={1} adjustsFontSizeToFit>
              {d.value > 0 ? (d.display ?? String(Math.round(d.value))) : ''}
            </Text>
            <View
              style={{
                width: '72%',
                height: h,
                backgroundColor: d.value > 0 ? color : colors.border,
                borderTopLeftRadius: 6,
                borderTopRightRadius: 6,
              }}
            />
            <Text style={{ fontSize: 10, color: colors.sub, marginTop: 4 }} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
