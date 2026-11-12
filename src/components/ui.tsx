import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import type { ComponentProps, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { fmtDate, parseISODate, toISODate } from '../lib/format';
import { colors, radius } from '../lib/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({ name, size = 20, color = colors.text }: { name: IconName | string; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name as IconName} size={size} color={color} />;
}

export function Screen({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[padded && { padding: 16 }, { paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={s.label}>{children}</Text>;
}

interface FieldProps extends TextInputProps {
  label: string;
  suffix?: string;
  hint?: string;
  error?: string | null;
  numeric?: boolean;
}

export function Field({ label, suffix, hint, error, numeric, style, ...rest }: FieldProps) {
  return (
    <View style={s.field}>
      <Label>{label}</Label>
      <View style={[s.inputWrap, error ? { borderColor: colors.danger } : null]}>
        <TextInput
          placeholderTextColor={colors.faint}
          keyboardType={numeric ? 'decimal-pad' : 'default'}
          style={[s.input, style]}
          {...rest}
        />
        {suffix ? <Text style={s.suffix}>{suffix}</Text> : null}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Row({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  return <View style={{ flexDirection: 'row', gap }}>{children}</View>;
}

export function Col({ children, flex = 1 }: { children: ReactNode; flex?: number }) {
  return <View style={{ flex }}>{children}</View>;
}

export function DateField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  if (Platform.OS !== 'android') {
    return <Field label={label} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" hint={fmtDate(value)} />;
  }
  const open = () =>
    DateTimePickerAndroid.open({
      value: parseISODate(value),
      mode: 'date',
      maximumDate: new Date(2100, 0, 1),
      onValueChange: (_e, d) => d && onChange(toISODate(d)),
    });
  return (
    <View style={s.field}>
      <Label>{label}</Label>
      <Pressable onPress={open} style={[s.inputWrap, { paddingVertical: 12 }]}>
        <Icon name="calendar" size={18} color={colors.sub} />
        <Text style={[s.input, { paddingVertical: 0, marginLeft: 8 }]}>{fmtDate(value)}</Text>
        <Text style={s.suffix}>Change</Text>
      </Pressable>
    </View>
  );
}

export function Chips<T extends string | number>({
  options,
  value,
  onChange,
  color = colors.primary,
  wrap = true,
}: {
  options: { key: T; label: string; icon?: string }[];
  value: T | T[];
  onChange: (v: T) => void;
  color?: string;
  wrap?: boolean;
}) {
  const selected = (k: T) => (Array.isArray(value) ? value.includes(k) : value === k);
  const body = options.map((o) => {
    const on = selected(o.key);
    return (
      <Pressable
        key={String(o.key)}
        onPress={() => onChange(o.key)}
        style={[s.chip, on && { backgroundColor: color, borderColor: color }]}
      >
        {o.icon ? <Icon name={o.icon} size={16} color={on ? '#fff' : colors.sub} /> : null}
        <Text style={[s.chipText, on && { color: '#fff' }]}>{o.label}</Text>
      </Pressable>
    );
  });
  if (!wrap) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {body}
      </ScrollView>
    );
  }
  return <View style={s.chipWrap}>{body}</View>;
}

export function SwitchRow({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <View style={[s.field, { flexDirection: 'row', alignItems: 'center' }]}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, color: colors.text, fontWeight: '500' }}>{label}</Text>
        {hint ? <Text style={s.hint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
    </View>
  );
}

export function Button({
  title,
  onPress,
  icon,
  variant = 'primary',
  color = colors.primary,
  style,
}: {
  title: string;
  onPress: () => void;
  icon?: string;
  variant?: 'primary' | 'outline' | 'danger';
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const bg = variant === 'primary' ? color : variant === 'danger' ? colors.dangerSoft : 'transparent';
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? colors.danger : color;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, borderColor: variant === 'outline' ? color : bg, opacity: pressed ? 0.8 : 1 },
        style,
      ]}
    >
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Stat({ label, value, sub, icon, color = colors.primary }: { label: string; value: string; sub?: string; icon?: string; color?: string }) {
  return (
    <View style={s.stat}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {icon ? <Icon name={icon} size={16} color={color} /> : null}
        <Text style={s.statLabel} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={s.statValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? (
        <Text style={s.statSub} numberOfLines={1}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <View style={s.grid}>{children}</View>;
}

export function Progress({ value, color }: { value: number; color: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={s.progressTrack}>
      <View style={{ width: `${pct * 100}%`, backgroundColor: color, height: '100%', borderRadius: 6 }} />
    </View>
  );
}

export function Empty({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 8 }}>
      <View style={[s.emptyIcon]}>
        <Icon name={icon} size={36} color={colors.primary} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' }}>{title}</Text>
      {text ? <Text style={{ color: colors.sub, textAlign: 'center', lineHeight: 20 }}>{text}</Text> : null}
      {action ? <View style={{ marginTop: 12, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export function KV({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <View style={s.kv}>
      <Text style={{ color: colors.sub, flex: 1 }}>{k}</Text>
      <Text style={{ color: colors.text, fontWeight: bold ? '700' : '600' }}>{v}</Text>
    </View>
  );
}

export const s = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.sub, textTransform: 'uppercase', letterSpacing: 0.6 },
  label: { fontSize: 13, color: colors.sub, marginBottom: 6, fontWeight: '600' },
  field: { marginBottom: 14 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 11 },
  suffix: { color: colors.sub, fontWeight: '600', marginLeft: 8 },
  hint: { color: colors.faint, fontSize: 12, marginTop: 4 },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statLabel: { color: colors.sub, fontSize: 12, fontWeight: '600', flexShrink: 1 },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 6 },
  statSub: { color: colors.faint, fontSize: 11, marginTop: 2 },
  progressTrack: { height: 10, backgroundColor: colors.border, borderRadius: 6, overflow: 'hidden' },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  kv: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
});
