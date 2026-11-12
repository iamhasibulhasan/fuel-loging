import Constants from 'expo-constants';
import { Linking, Pressable, Text, View } from 'react-native';
import { Logo } from '../components/Logo';
import { Card, Icon, Screen } from '../components/ui';
import { colors, COMPANY, copyright } from '../lib/theme';

export default function About() {
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <Screen>
      <View style={{ alignItems: 'center', marginVertical: 24, gap: 8 }}>
        <Logo size={96} showName />
        <Text style={{ color: colors.sub }}>Version {version}</Text>
      </View>

      <Card>
        <Text style={{ color: colors.text, lineHeight: 22 }}>
          Track fuel fill-ups, mileage, servicing and engine oil changes for every vehicle you own — motorcycles, cars, trucks and more.
          All data stays on your phone. Use Settings → Export backup to keep a copy.
        </Text>
      </Card>

      <Card>
        <Text style={{ color: colors.sub, fontSize: 12, marginBottom: 4 }}>Developed by</Text>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{COMPANY.name}</Text>
        <Pressable onPress={() => Linking.openURL(COMPANY.url)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Icon name="web" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: '700' }}>{COMPANY.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</Text>
        </Pressable>
      </Card>

      <Text style={{ textAlign: 'center', color: colors.sub, marginTop: 12 }}>{copyright()}</Text>
      <Text style={{ textAlign: 'center', color: colors.faint, fontSize: 11, marginTop: 4, paddingHorizontal: 16 }}>
        This software and its source code are proprietary. Unauthorized copying, distribution or modification is prohibited.
      </Text>
    </Screen>
  );
}
