import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { Card, Chips, Col, Field, Icon, Label, Row, Screen, SectionTitle } from '../../components/ui';
import { exportBackup, exportCsv, pickBackup } from '../../lib/backup';
import { useStore } from '../../lib/store';
import { colors, copyright } from '../../lib/theme';
import type { DistanceUnit, EconomyFormat, VolumeUnit } from '../../lib/types';
import { COUNTRIES, economyUnitLabel, VOLUME_NAME } from '../../lib/units';

export default function SettingsScreen() {
  const { data, settings, updateSettings, replaceAll, resetAll } = useStore();

  const applyCountry = (code: string) => {
    const c = COUNTRIES.find((x) => x.code === code);
    if (!c) return;
    updateSettings({
      country: c.code,
      currencyCode: c.currencyCode,
      currencySymbol: c.currencySymbol,
      distanceUnit: c.distanceUnit,
      volumeUnit: c.volumeUnit,
      economyFormat: c.economyFormat,
    });
  };

  const run = (fn: () => Promise<void>) => fn().catch((e) => Alert.alert('Something went wrong', String(e?.message ?? e)));

  const doImport = () =>
    run(async () => {
      const d = await pickBackup();
      if (!d) return;
      Alert.alert(
        'Restore backup?',
        `Found ${d.vehicles.length} vehicles, ${d.fuel.length} fuel, ${d.services.length} service and ${d.oils.length} oil entries. This replaces all current data.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Restore', style: 'destructive', onPress: () => replaceAll(d) },
        ],
      );
    });

  const doReset = () =>
    Alert.alert('Erase all data?', 'All vehicles and entries will be deleted permanently. Export a backup first if unsure.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: resetAll },
    ]);

  return (
    <Screen>
      <SectionTitle>Country / region</SectionTitle>
      <Card>
        <Text style={{ color: colors.sub, marginBottom: 10, fontSize: 13 }}>
          Picks the currency and units used in that country. You can fine-tune them below.
        </Text>
        <Chips options={COUNTRIES.map((c) => ({ key: c.code, label: `${c.flag} ${c.name}` }))} value={settings.country} onChange={applyCountry} />
      </Card>

      <SectionTitle>Currency</SectionTitle>
      <Card>
        <Row>
          <Col>
            <Field label="Code" value={settings.currencyCode} onChangeText={(t) => updateSettings({ currencyCode: t.toUpperCase(), country: 'custom' })} autoCapitalize="characters" maxLength={4} />
          </Col>
          <Col>
            <Field label="Symbol" value={settings.currencySymbol} onChangeText={(t) => updateSettings({ currencySymbol: t, country: 'custom' })} maxLength={4} />
          </Col>
        </Row>
      </Card>

      <SectionTitle>Units</SectionTitle>
      <Card>
        <Label>Default distance unit (new vehicles)</Label>
        <View style={{ marginBottom: 14 }}>
          <Chips<DistanceUnit>
            options={[
              { key: 'km', label: 'Kilometres' },
              { key: 'mi', label: 'Miles' },
            ]}
            value={settings.distanceUnit}
            onChange={(u) => updateSettings({ distanceUnit: u })}
          />
        </View>
        <Label>Fuel volume unit</Label>
        <View style={{ marginBottom: 14 }}>
          <Chips<VolumeUnit>
            options={(['L', 'galUS', 'galUK'] as VolumeUnit[]).map((u) => ({ key: u, label: VOLUME_NAME[u] }))}
            value={settings.volumeUnit}
            onChange={(u) => updateSettings({ volumeUnit: u })}
          />
        </View>
        <Label>Mileage format</Label>
        <Chips<EconomyFormat>
          options={[
            { key: 'distPerVol', label: economyUnitLabel({ ...settings, economyFormat: 'distPerVol' }, settings.distanceUnit) },
            { key: 'volPer100', label: economyUnitLabel({ ...settings, economyFormat: 'volPer100' }, settings.distanceUnit) },
          ]}
          value={settings.economyFormat}
          onChange={(f) => updateSettings({ economyFormat: f })}
        />
      </Card>

      <SectionTitle>Data</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <MenuRow icon="cloud-upload-outline" title="Export backup (JSON)" sub="Save to Drive, WhatsApp, email…" onPress={() => run(() => exportBackup(data))} />
        <MenuRow icon="cloud-download-outline" title="Restore from backup" sub="Replace data with a backup file" onPress={doImport} />
        <MenuRow icon="file-delimited-outline" title="Export as CSV" sub="Open in Excel / Google Sheets" onPress={() => run(() => exportCsv(data))} />
        <MenuRow icon="delete-forever-outline" title="Erase all data" danger onPress={doReset} last />
      </Card>

      <SectionTitle>App</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        <MenuRow icon="information-outline" title="About FuelLog" sub={copyright()} onPress={() => router.push('/about')} last />
      </Card>
    </Screen>
  );
}

function MenuRow({ icon, title, sub, onPress, danger, last }: { icon: string; title: string; sub?: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  const c = danger ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 14,
        opacity: pressed ? 0.6 : 1,
        borderBottomWidth: last ? 0 : 0.5,
        borderBottomColor: colors.border,
      })}
    >
      <Icon name={icon} size={22} color={danger ? colors.danger : colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c, fontWeight: '600', fontSize: 15 }}>{title}</Text>
        {sub ? <Text style={{ color: colors.sub, fontSize: 12, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <Icon name="chevron-right" size={20} color={colors.faint} />
    </Pressable>
  );
}
