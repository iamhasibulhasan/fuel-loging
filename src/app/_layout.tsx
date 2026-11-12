import { isRunningInExpoGo } from 'expo';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../lib/auth';
import { DataProvider, useStore } from '../lib/store';
import { applyTheme, colors, type ThemeName } from '../lib/theme';
import { consumeReturnRoute } from '../lib/themeRoute';

// Keep the native splash (icon on teal) visible until saved data is loaded.
SplashScreen.preventAutoHideAsync().catch(() => {});
// splash fade options only apply to real builds; Expo Go warns if they're set
if (!isRunningInExpoGo()) {
  SplashScreen.setOptions({ duration: 400, fade: true });
}

function Gate() {
  const { ready: dataReady, settings } = useStore();
  const { status } = useAuth();
  const ready = dataReady && status !== 'loading';
  const signedIn = status === 'user' || status === 'guest';
  const system = useColorScheme();
  const theme: ThemeName = settings.theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : settings.theme;
  applyTheme(theme); // must run before children render so they read the right colours

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
    // the tree remounts on theme change; go back to where the user switched it
    const back = consumeReturnRoute();
    if (back) setTimeout(() => router.navigate(back), 0);
  }, [theme]);

  if (!ready) return null;

  const base = theme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: { ...base.colors, primary: colors.primary, background: colors.bg, card: colors.card, text: colors.text, border: colors.border },
  };

  return (
    // key={theme} remounts everything so all styles pick up the new palette
    <View key={theme} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '700', fontSize: 17 },
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Protected guard={signedIn} redirectTo="/login">
            <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="fuel" options={{ title: 'Fuel Entry', presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="service" options={{ title: 'Service Entry', presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="oil" options={{ title: 'Engine Oil Change', presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="vehicle" options={{ title: 'Vehicle', presentation: 'modal', animation: 'slide_from_bottom' }} />
            <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
          </Stack.Protected>
          <Stack.Protected guard={!signedIn} redirectTo="/">
            <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
          </Stack.Protected>
          <Stack.Screen name="about" options={{ title: 'About' }} />
        </Stack>
      </ThemeProvider>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DataProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </DataProvider>
    </SafeAreaProvider>
  );
}
