import { useColorScheme as useSystemColorScheme } from 'react-native';
import { usePreferences } from '@/lib/preferences';
export function useColorScheme() {
  const system = useSystemColorScheme();
  const { appearance } = usePreferences();
  return appearance === 'system' ? system : appearance;
}
