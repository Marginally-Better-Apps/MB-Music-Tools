import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Appearance } from 'react-native';
import { useEffect } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePreferences } from '@/lib/preferences';

import AppTabs from '@/components/app-tabs';

export default function TabLayout() {
  const { appearance } = usePreferences();
  useEffect(() => { Appearance.setColorScheme(appearance === 'system' ? 'unspecified' : appearance); }, [appearance]);
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppTabs />
    </ThemeProvider>
  );
}
