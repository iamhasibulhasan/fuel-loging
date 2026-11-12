import { useEffect, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { colors } from '../lib/theme';

export interface Bar {
  label: string;
  value: number;
  display?: string;
}

/** Vertical bar chart built from Views. Bars grow in with a stagger whenever the data changes. */
export function BarChart({ data, color = colors.primary, height = 140 }: { data: Bar[]; color?: string; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const key = data.map((d) => d.value).join('|') + color;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: height + 36 }}>
      {data.map((d, i) => (
        <BarCol key={i} bar={d} index={i} height={Math.max(2, (d.value / max) * height)} color={color} animKey={key} />
      ))}
    </View>
  );
}

function BarCol({ bar, index, height, color, animKey }: { bar: Bar; index: number; height: number; color: string; animKey: string }) {
  const grow = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    grow.setValue(0);
    Animated.timing(grow, {
      toValue: 1,
      duration: 650,
      delay: index * 70,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  }, [grow, index, animKey]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
      <Animated.Text
        style={{ fontSize: 9, color: colors.sub, marginBottom: 3, opacity: grow }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {bar.value > 0 ? (bar.display ?? String(Math.round(bar.value))) : ''}
      </Animated.Text>
      <Animated.View
        style={{
          width: '72%',
          height,
          backgroundColor: bar.value > 0 ? color : colors.border,
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          transformOrigin: 'bottom',
          transform: [{ scaleY: grow }],
        }}
      />
      <Text style={{ fontSize: 10, color: colors.sub, marginTop: 4 }} numberOfLines={1}>
        {bar.label}
      </Text>
    </View>
  );
}
