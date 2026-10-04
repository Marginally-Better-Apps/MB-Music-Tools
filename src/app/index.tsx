import { useEffect, useState } from 'react';
import { AccessibilityInfo, Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SettingsSheet } from '@/components/settings-sheet';
import { TunerLens } from '@/components/tuner-lens';
import { TunerTranspositionMenu } from '@/components/tuner-transposition-menu';
import { useTheme } from '@/hooks/use-theme';
import { useTuner } from '@/hooks/use-tuner';

/** Once locked, stay locked until the pitch drifts past this many cents (matches the haptic re-arm). */
const RELEASE_CENTS = 6;

export default function TunerScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const { pitch, inTune, status } = useTuner();
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => listener.remove();
  }, []);
  // Hysteresis keeps the lens from flickering between locked and unlocked at the edge of the window.
  const [locked, setLocked] = useState(false);
  const nextLocked = inTune || (locked && pitch !== null && Math.abs(pitch.cents) <= RELEASE_CENTS);
  if (nextLocked !== locked) setLocked(nextLocked);
  const micBlocked = status === 'denied' || status === 'unavailable';
  const diameter = Math.min(width - 128, 300);

  return <ThemedView style={styles.screen}>
    <SafeAreaView style={styles.safeArea}>
      <TunerTranspositionMenu />
      <SettingsSheet />
      <View style={styles.stage}>
        <TunerLens pitch={micBlocked ? null : pitch} locked={nextLocked && !micBlocked} reduceMotion={reduceMotion} diameter={diameter} />
        {micBlocked && <Pressable accessibilityRole="button" accessibilityLabel="Open microphone settings" onPress={() => { void Linking.openSettings(); }} style={[styles.permission, { marginTop: diameter / 2 + 40, backgroundColor: theme.backgroundElement }]}>
          <SymbolView name="mic.slash" tintColor={theme.textSecondary} size={20} />
          <ThemedText>{status === 'denied' ? 'Microphone access is off' : 'Microphone unavailable'}</ThemedText>
          <SymbolView name="arrow.up.right" tintColor={theme.textSecondary} size={14} />
        </Pressable>}
      </View>
    </SafeAreaView>
  </ThemedView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center' },
  stage: { ...StyleSheet.absoluteFill, pointerEvents: 'box-none', alignItems: 'center', justifyContent: 'center' },
  permission: { position: 'absolute', top: '50%', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderRadius: 22 },
});
