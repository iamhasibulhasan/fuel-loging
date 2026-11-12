import { router } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { Select } from '../../components/Select';
import { Avatar, Card, Col, Field, Icon, Row, Screen, SectionTitle } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { exportBackup, exportCsv, pickBackup } from '../../lib/backup';
import { deletePhoto } from '../../lib/photo';
import type { ThemePref } from '../../lib/theme';
import { setReturnRoute } from '../../lib/themeRoute';
import { useStore } from '../../lib/store';
import { colors, copyright } from '../../lib/theme';
import type { DistanceUnit, EconomyFormat, VolumeUnit } from '../../lib/types';
import { COUNTRIES, economyUnitLabel, VOLUME_LABEL, VOLUME_NAME } from '../../lib/units';

export default function SettingsScreen() {
  const { data, settings, updateSettings, replaceAll, resetAll } = useStore();
  const auth = useAuth();

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
          {
            text: 'Restore',
            style: 'destructive',
            onPress: () => {
              if (data.profile.photo && data.profile.photo !== d.profile.photo) deletePhoto(data.profile.photo);
              replaceAll(d);
            },
          },
        ],
      );
    });

  const doReset = () =>
    Alert.alert('Erase all data?', 'All vehicles and entries will be deleted permanently. Export a backup first if unsure.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Erase',
        style: 'destructive',
        onPress: () => {
          deletePhoto(data.profile.photo);
          resetAll();
        },
      },
    ]);

  // signing out (or leaving guest mode) returns to the login screen; on-device data is kept
  const doSignOut = () => {
    if (auth.status !== 'user') {
      auth.signOut();
      return;
    }
    Alert.alert('Sign out?', 'Your fuel, service and oil records stay on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => auth.signOut().catch((e) => Alert.alert('Sign out failed', String(e?.message ?? e))) },
    ]);
  };

  const pr = data.profile;
  const contact = [pr.phone, pr.email].filter(Boolean);

  return (
    <Screen>
      <Pressable onPress={() => router.push('/profile')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar name={pr.name} photo={pr.photo} size={60} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }} numberOfLines={1}>
              {pr.name || 'Set up your profile'}
            </Text>
            {contact.length ? (
              contact.map((c) => (
                <Text key={c} style={{ color: colors.sub, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                  {c}
                </Text>
              ))
            ) : (
              <Text style={{ color: colors.sub, fontSize: 13, marginTop: 2 }}>Add your name, phone and email</Text>
            )}
          </View>
          <Icon name="chevron-right" size={22} color={colors.faint} />
        </Card>
      </Pressable>

      <SectionTitle>Account</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {auth.status === 'user' && auth.account ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
              <Icon name={auth.account.provider === 'google' ? 'google' : 'email-check-outline'} size={22} color={auth.account.provider === 'google' ? '#EA4335' : colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '600' }} numberOfLines={1}>
                  {auth.account.email}
                </Text>
                <Text style={{ color: colors.sub, fontSize: 12 }}>Signed in with {auth.account.provider === 'google' ? 'Google' : 'email'}</Text>
              </View>
            </View>
            <MenuRow icon="logout" title="Sign out" sub="Your records stay on this phone" danger onPress={doSignOut} last />
          </>
        ) : (
          <MenuRow icon="login" title="Sign in / Create account" sub="You’re using Fuel Burn as a guest" onPress={doSignOut} last />
        )}
      </Card>

      <SectionTitle>Appearance</SectionTitle>
      <Card>
        <Select<ThemePref>
          label="Theme"
          searchable={false}
          options={[
            { key: 'system', label: '📱  System default', sub: 'Follow the phone’s light / dark setting' },
            { key: 'light', label: '☀️  Light' },
            { key: 'dark', label: '🌙  Dark' },
          ]}
          value={settings.theme}
          onChange={(t) => {
            if (t === settings.theme) return;
            setReturnRoute('/settings');
            updateSettings({ theme: t });
          }}
        />
      </Card>

      <SectionTitle>Country / region</SectionTitle>
      <Card>
        <Select
          label="Country"
          options={[
            ...COUNTRIES.map((c) => ({
              key: c.code,
              label: `${c.flag}  ${c.name}`,
              sub: `${c.currencyCode} (${c.currencySymbol}) · ${c.distanceUnit} · ${VOLUME_NAME[c.volumeUnit]}`,
            })),
            ...(settings.country === 'custom' ? [{ key: 'custom', label: '⚙️  Custom', sub: 'Your own currency / units' }] : []),
          ]}
          value={settings.country}
          onChange={applyCountry}
        />
        <Text style={{ color: colors.sub, fontSize: 13, marginTop: -6 }}>
          Sets the currency and units used in that country. You can fine-tune them below.
        </Text>
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
        <Select<DistanceUnit>
          label="Default distance unit (new vehicles)"
          searchable={false}
          options={[
            { key: 'km', label: 'Kilometres (km)' },
            { key: 'mi', label: 'Miles (mi)' },
          ]}
          value={settings.distanceUnit}
          onChange={(u) => updateSettings({ distanceUnit: u })}
        />
        <Select<VolumeUnit>
          label="Fuel volume unit"
          searchable={false}
          options={(['L', 'galUS', 'galUK'] as VolumeUnit[]).map((u) => ({ key: u, label: `${VOLUME_NAME[u]} (${VOLUME_LABEL[u]})` }))}
          value={settings.volumeUnit}
          onChange={(u) => updateSettings({ volumeUnit: u })}
        />
        <Select<EconomyFormat>
          label="Mileage format"
          searchable={false}
          options={[
            {
              key: 'distPerVol',
              label: economyUnitLabel({ ...settings, economyFormat: 'distPerVol' }, settings.distanceUnit),
              sub: 'Distance per unit of fuel (higher is better)',
            },
            {
              key: 'volPer100',
              label: economyUnitLabel({ ...settings, economyFormat: 'volPer100' }, settings.distanceUnit),
              sub: `Fuel per 100 ${settings.distanceUnit} (lower is better)`,
            },
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
        <MenuRow icon="information-outline" title="About Fuel Burn" sub={copyright()} onPress={() => router.push('/about')} last />
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
        paddingVertical: 11,
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
