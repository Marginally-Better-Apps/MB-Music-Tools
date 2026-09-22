import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Host, Picker, Text } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SettingsSheet } from '@/components/settings-sheet';
import { useTheme } from '@/hooks/use-theme';
import { useTuner } from '@/hooks/use-tuner';
import { savePreferences, usePreferences } from '@/lib/preferences';
import { Transposition } from '@/lib/pitch';

const instruments: { value: Transposition; label: string }[] = [
  { value: 'concert', label: 'Concert' }, { value: 'bb', label: 'B♭' }, { value: 'eb', label: 'E♭' }, { value: 'f', label: 'F' },
];
export default function TunerScreen() {
  const theme = useTheme();
  const { pitch, inTune, status } = useTuner();
  const { transposition, appearance } = usePreferences();
  const [motion] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => listener.remove();
  }, []);
  const cents = pitch?.cents ?? 0;
  useEffect(() => {
    const animation = Animated.spring(motion, { toValue: inTune ? 0 : cents, stiffness: 160, damping: 24, mass: 1, useNativeDriver: true });
    if (reduceMotion) motion.setValue(inTune ? 0 : cents);
    else animation.start();
    return () => animation.stop();
  }, [cents, inTune, motion, reduceMotion]);
  const description = !pitch ? 'Listening for a note' : inTune ? 'In tune' : `${Math.abs(cents)} cents ${cents < 0 ? 'flat' : 'sharp'}`;
  return <ThemedView style={styles.screen}>
    <SafeAreaView style={styles.safeArea}>
      <SettingsSheet />
      <View style={styles.readout}>
        <ThemedText testID="tuner-note" style={[styles.note, !pitch && { color: theme.textSecondary }]} accessibilityLabel={pitch?.note ?? 'No pitch'}>{pitch?.note ?? '—'}</ThemedText>
        <ThemedText accessibilityLabel={description} style={[styles.cents, { color: pitch ? theme.text : theme.textSecondary }]}>{pitch ? `${cents > 0 ? '+' : cents < 0 ? '−' : ''}${Math.abs(cents)}` : ' '}</ThemedText>
      </View>
      <View testID="tuner-horizon" accessible={false} style={styles.level}>
        <View style={[styles.fixedLine, { backgroundColor: theme.backgroundSelected }]} />
        <Animated.View style={[styles.plane, { backgroundColor: theme.backgroundElement, transform: [{ rotate: motion.interpolate({ inputRange: [-50, 50], outputRange: ['-15deg', '15deg'], extrapolate: 'clamp' }) }] }]} />
        <View style={styles.marks}>
          <Animated.View style={[styles.mark, { backgroundColor: pitch ? theme.text : theme.textSecondary, transform: [{ translateY: motion.interpolate({ inputRange: [-50, 50], outputRange: [48, -48], extrapolate: 'clamp' }) }] }]} />
          <View style={[styles.center, { borderColor: pitch ? theme.text : theme.textSecondary }]} />
          <Animated.View style={[styles.mark, { backgroundColor: pitch ? theme.text : theme.textSecondary, transform: [{ translateY: motion.interpolate({ inputRange: [-50, 50], outputRange: [-48, 48], extrapolate: 'clamp' }) }] }]} />
        </View>
      </View>
      <View style={styles.footer}>
        {(status === 'denied' || status === 'unavailable') && <Pressable accessibilityRole="button" accessibilityLabel="Open microphone settings" onPress={() => { void Linking.openSettings(); }} style={styles.permission}>
          <SymbolView name="mic.slash" tintColor={theme.textSecondary} size={20} />
          <ThemedText>{status === 'denied' ? 'Microphone access is off' : 'Microphone unavailable'}</ThemedText>
          <SymbolView name="arrow.up.right" tintColor={theme.textSecondary} size={14} />
        </Pressable>}
        <Host style={styles.picker} colorScheme={appearance === 'system' ? undefined : appearance}>
          <Picker label="Instrument transposition" selection={transposition} onSelectionChange={(value: Transposition) => savePreferences({ transposition: value })} modifiers={[pickerStyle('segmented')]} testID="transposition-picker">
            {instruments.map(instrument => <Text key={instrument.value} modifiers={[tag(instrument.value)]}>{instrument.label}</Text>)}
          </Picker>
        </Host>
      </View>
    </SafeAreaView>
  </ThemedView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingTop: 64, paddingBottom: 24 },
  readout: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  note: { fontSize: 104, lineHeight: 120, fontWeight: '500', letterSpacing: -5, fontVariant: ['tabular-nums'] },
  cents: { fontSize: 32, lineHeight: 44, fontWeight: '400', fontVariant: ['tabular-nums'] },
  level: { height: 220, width: '100%', overflow: 'hidden', justifyContent: 'center' },
  fixedLine: { position: 'absolute', width: '100%', height: StyleSheet.hairlineWidth, top: '50%' },
  plane: { position: 'absolute', top: '50%', left: '-20%', width: '140%', height: 250, transformOrigin: '50% 0%' },
  marks: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 12 },
  mark: { width: 64, height: 3, borderRadius: 2 },
  center: { width: 12, height: 12, borderWidth: 2, borderRadius: 6 },
  footer: { flex: 0.65, justifyContent: 'flex-end', alignItems: 'center', width: '100%', paddingHorizontal: 24, gap: 24 },
  picker: { height: 44, width: '100%', maxWidth: 336 },
  permission: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 },
});
