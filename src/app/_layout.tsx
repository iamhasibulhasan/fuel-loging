import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DataProvider, useStore } from '../lib/store';
import { colors } from '../lib/theme';

function Gate() {
  const { ready } = useStore();
  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="fuel" options={{ title: 'Fuel Entry', presentation: 'modal' }} />
      <Stack.Screen name="service" options={{ title: 'Service Entry', presentation: 'modal' }} />
      <Stack.Screen name="oil" options={{ title: 'Engine Oil Change', presentation: 'modal' }} />
      <Stack.Screen name="vehicle" options={{ title: 'Vehicle', presentation: 'modal' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <StatusBar style="dark" />
        <Gate />
      </DataProvider>
    </SafeAreaProvider>
  );
}
