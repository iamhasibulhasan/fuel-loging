import { Tabs } from 'expo-router/js-tabs';
import { Icon } from '../../components/ui';
import { colors } from '../../lib/theme';

const tab = (title: string, icon: string) => ({
  title,
  tabBarIcon: ({ color, size }: { color: unknown; size: number }) => (
    <Icon name={icon} color={typeof color === 'string' ? color : colors.faint} size={size} />
  ),
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.faint,
        headerStyle: { backgroundColor: colors.card },
        headerTitleStyle: { fontWeight: '800', color: colors.text },
        tabBarStyle: { backgroundColor: colors.card },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ ...tab('Dashboard', 'view-dashboard'), headerTitle: 'Fuel Burn' }} />
      <Tabs.Screen name="history" options={tab('History', 'history')} />
      <Tabs.Screen name="stats" options={tab('Reports', 'chart-bar')} />
      <Tabs.Screen name="vehicles" options={tab('Vehicles', 'garage')} />
      <Tabs.Screen name="settings" options={tab('Settings', 'cog')} />
    </Tabs>
  );
}
