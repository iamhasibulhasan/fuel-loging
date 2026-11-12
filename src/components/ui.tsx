import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import type { ComponentProps, ReactNode } from 'react';
import {
  Animated,
  Image,
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
import { photoUri } from '../lib/photo';
import { Float, PressableScale, useAnimatedTo } from './motion';
import { colors, radius, themeName } from '../lib/theme';

export type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icon({ name, size = 20, color = colors.text }: { name: IconName | string; size?: number; color?: string }) {
  return <MaterialCommunityIcons name={name as IconName} size={size} color={color} />;
}

export function Screen({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[padded && { padding: 12 }, { paddingBottom: 28, width: '100%', maxWidth: 600, alignSelf: 'center' }]}
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

export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Not set',
  onClear,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  /** when given, an empty value is allowed and an "×" clears the date */
  onClear?: () => void;
}) {
  if (Platform.OS !== 'android') {
    return <Field label={label} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" hint={value ? fmtDate(value) : undefined} />;
  }
  const open = () =>
    DateTimePickerAndroid.open({
      value: value ? parseISODate(value) : new Date(),
      mode: 'date',
      maximumDate: new Date(2100, 0, 1),
      onValueChange: (_e, d) => d && onChange(toISODate(d)),
    });
  return (
    <View style={s.field}>
      <Label>{label}</Label>
      <Pressable onPress={open} style={[s.inputWrap, { paddingVertical: 12 }]}>
        <Icon name="calendar" size={18} color={colors.sub} />
        <Text style={[s.input, { paddingVertical: 0, marginLeft: 8 }, !value && { color: colors.faint }]}>
          {value ? fmtDate(value) : placeholder}
        </Text>
        {onClear && value ? (
          <Pressable onPress={onClear} hitSlop={10}>
            <Icon name="close-circle" size={18} color={colors.faint} />
          </Pressable>
        ) : (
          <Text style={s.suffix}>{value ? 'Change' : 'Set'}</Text>
        )}
      </Pressable>
    </View>
  );
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function Avatar({ name, photo, size = 56 }: { name: string; photo?: string | null; size?: number }) {
  const ini = initials(name);
  const uri = photoUri(photo);
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.border }} />;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {ini ? (
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{ini}</Text>
      ) : (
        <Icon name="account" size={size * 0.55} color="#fff" />
      )}
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
        <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{label}</Text>
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
    <PressableScale scaleTo={0.97} onPress={onPress} style={[s.btn, { backgroundColor: bg, borderColor: variant === 'outline' ? color : bg }, style]}>
      {icon ? <Icon name={icon} size={18} color={fg} /> : null}
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </PressableScale>
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

export function Progress({ value, color, delay = 150 }: { value: number; color: string; delay?: number }) {
  const pct = Math.max(0, Math.min(1, value));
  const anim = useAnimatedTo(pct, { delay });
  return (
    <View style={s.progressTrack}>
      <Animated.View
        style={{
          width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          backgroundColor: color,
          height: '100%',
          borderRadius: 6,
        }}
      />
    </View>
  );
}

export function Empty({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', padding: 20, gap: 6 }}>
      <Float>
        <View style={[s.emptyIcon]}>
          <Icon name={icon} size={36} color={colors.primary} />
        </View>
      </Float>
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

// Styles depend on the active theme's colours, so they're built per theme and cached.
const makeStyles = () =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius,
      padding: 12,
      marginBottom: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, marginBottom: 6 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: colors.sub, textTransform: 'uppercase', letterSpacing: 0.6 },
    label: { fontSize: 12, color: colors.sub, marginBottom: 4, fontWeight: '600' },
    field: { marginBottom: 10 },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 10,
    },
    input: { flex: 1, fontSize: 15, color: colors.text, paddingVertical: 8 },
    suffix: { color: colors.sub, fontWeight: '600', marginLeft: 6, fontSize: 13 },
    hint: { color: colors.faint, fontSize: 11, marginTop: 3 },
    error: { color: colors.danger, fontSize: 11, marginTop: 3 },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.input,
    },
    chipText: { color: colors.text, fontWeight: '600', fontSize: 12 },
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1.5,
    },
    btnText: { fontSize: 15, fontWeight: '700' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    stat: {
      flexGrow: 1,
      flexBasis: '45%',
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    statLabel: { color: colors.sub, fontSize: 11, fontWeight: '600', flexShrink: 1 },
    statValue: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 4 },
    statSub: { color: colors.faint, fontSize: 10, marginTop: 1 },
    progressTrack: { height: 8, backgroundColor: colors.track, borderRadius: 5, overflow: 'hidden' },
    emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    kv: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  });

type Styles = ReturnType<typeof makeStyles>;
let styleCache: { theme: string; styles: Styles } | null = null;
const currentStyles = (): Styles => {
  if (!styleCache || styleCache.theme !== themeName()) styleCache = { theme: themeName(), styles: makeStyles() };
  return styleCache.styles;
};

/** Theme-aware styles: `s.card` always returns the style for the active theme. */
export const s = new Proxy({} as Styles, { get: (_t, key) => currentStyles()[key as keyof Styles] });
