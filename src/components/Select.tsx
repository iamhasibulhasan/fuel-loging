import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { colors } from '../lib/theme';
import { Icon, Label, s } from './ui';

export interface SelectOption<T extends string> {
  key: T;
  label: string;
  sub?: string;
}

/** Dropdown: shows the selected value; tapping opens a searchable list in a popup. */
export function Select<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchable = true,
}: {
  label?: string;
  options: SelectOption<T>[];
  value: T | null;
  onChange: (v: T) => void;
  placeholder?: string;
  searchable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((o) => o.key === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.sub?.toLowerCase().includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery('');
  };

  return (
    <View style={s.field}>
      {label ? <Label>{label}</Label> : null}
      <Pressable onPress={() => setOpen(true)} style={[s.inputWrap, { paddingVertical: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, color: selected ? colors.text : colors.faint }} numberOfLines={1}>
            {selected?.label ?? placeholder}
          </Text>
          {selected?.sub ? <Text style={{ fontSize: 12, color: colors.sub, marginTop: 2 }}>{selected.sub}</Text> : null}
        </View>
        <Icon name="chevron-down" size={22} color={colors.sub} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <Pressable onPress={close} style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: 20 }}>
          {/* inner Pressable stops taps inside the sheet from closing it */}
          <Pressable onPress={() => {}} style={{ backgroundColor: colors.card, borderRadius: 18, maxHeight: '80%', overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingBottom: 8 }}>
              <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: colors.text }}>{label ?? 'Select'}</Text>
              <Pressable onPress={close} hitSlop={10}>
                <Icon name="close" size={22} color={colors.sub} />
              </Pressable>
            </View>
            {searchable ? (
              <View style={[s.inputWrap, { marginHorizontal: 16, marginBottom: 8 }]}>
                <Icon name="magnify" size={18} color={colors.faint} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search"
                  placeholderTextColor={colors.faint}
                  style={[s.input, { marginLeft: 6 }]}
                />
              </View>
            ) : null}
            <FlatList
              data={filtered}
              keyExtractor={(o) => o.key}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={<Text style={{ color: colors.sub, padding: 16, textAlign: 'center' }}>No match</Text>}
              renderItem={({ item }) => {
                const on = item.key === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item.key);
                      close();
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      backgroundColor: on ? colors.primarySoft : pressed ? colors.bg : 'transparent',
                    })}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, color: colors.text, fontWeight: on ? '700' : '500' }}>{item.label}</Text>
                      {item.sub ? <Text style={{ fontSize: 12, color: colors.sub, marginTop: 2 }}>{item.sub}</Text> : null}
                    </View>
                    {on ? <Icon name="check" size={20} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
