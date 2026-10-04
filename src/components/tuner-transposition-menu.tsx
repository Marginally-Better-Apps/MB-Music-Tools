import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassView } from 'expo-glass-effect';
import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import { useTheme } from '@/hooks/use-theme';
import { savePreferences, usePreferences } from '@/lib/preferences';
import { Transposition } from '@/lib/pitch';

export const transpositions: { value: Transposition; label: string }[] = [
  { value: 'concert', label: 'Concert' },
  { value: 'bb', label: 'B♭' },
  { value: 'eb', label: 'E♭' },
  { value: 'f', label: 'F' },
];

/** A single quiet menu in the top-left corner, opposite the Settings gear. */
export function TunerTranspositionMenu() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { transposition, appearance } = usePreferences();
  return <GlassView style={[styles.corner, { top: insets.top + 8 }]}>
    <Host matchContents colorScheme={appearance === 'system' ? undefined : appearance}>
      <Picker label="Instrument transposition" selection={transposition} onSelectionChange={(value: Transposition) => savePreferences({ transposition: value })} modifiers={[pickerStyle('menu'), tint(theme.text)]} testID="transposition-picker">
        {transpositions.map(option => <Text key={option.value} modifiers={[tag(option.value)]}>{option.label}</Text>)}
      </Picker>
    </Host>
  </GlassView>;
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', left: 20, height: 48, borderRadius: 24, paddingHorizontal: 16, justifyContent: 'center', zIndex: 5 },
});
