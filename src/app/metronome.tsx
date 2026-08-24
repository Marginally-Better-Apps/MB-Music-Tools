import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import { MetronomeBeat } from '@/components/metronome-beat';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useMetronome } from '@/hooks/use-metronome';
import { useTheme } from '@/hooks/use-theme';

const clickSource = require('@/assets/sounds/metronome-click.wav');

export default function MetronomeScreen() {
  const theme = useTheme();
  const player = useAudioPlayer(clickSource);
  const Surface = isLiquidGlassAvailable() ? GlassView : View;

  const playClick = useCallback(() => {
    void player.seekTo(0).then(() => {
      player.play();
    });
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  }, [player]);

  const metronome = useMetronome(playClick);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      allowsRecording: false,
      interruptionMode: 'mixWithOthers',
    });
  }, []);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.tempoRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease tempo"
            hitSlop={8}
            onPress={metronome.decrease}
            style={({ pressed }) => [
              styles.stepper,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ThemedText style={styles.stepperLabel}>−</ThemedText>
          </Pressable>

          <ThemedText
            accessibilityLabel={`${metronome.bpm} BPM`}
            style={styles.bpm}>
            {metronome.bpm}
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase tempo"
            hitSlop={8}
            onPress={metronome.increase}
            style={({ pressed }) => [
              styles.stepper,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.7 : 1 },
            ]}>
            <ThemedText style={styles.stepperLabel}>+</ThemedText>
          </Pressable>
        </View>

        <MetronomeBeat playing={metronome.playing} intervalMs={metronome.intervalMs} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={metronome.playing ? 'Stop metronome' : 'Start metronome'}
          onPress={metronome.toggle}
          style={styles.playHit}>
          <Surface
            glassEffectStyle="regular"
            style={[
              styles.playControl,
              { backgroundColor: theme.backgroundSelected },
            ]}>
            <ThemedText style={styles.playLabel}>{metronome.playing ? 'Stop' : 'Play'}</ThemedText>
          </Surface>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.five,
  },
  tempoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  bpm: {
    fontFamily: Fonts.sans,
    fontSize: 96,
    fontWeight: '600',
    lineHeight: 104,
    letterSpacing: -2,
    minWidth: 180,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  stepper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperLabel: {
    fontSize: 36,
    fontWeight: '500',
    lineHeight: 40,
  },
  playHit: {
    marginTop: Spacing.two,
  },
  playControl: {
    minWidth: 168,
    minHeight: 88,
    paddingHorizontal: Spacing.five,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playLabel: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
  },
});
