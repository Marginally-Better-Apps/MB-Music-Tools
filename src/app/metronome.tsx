import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';

import { MetronomeBeat } from '@/components/metronome-beat';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useMetronome } from '@/hooks/use-metronome';
import { useTheme } from '@/hooks/use-theme';

export default function MetronomeScreen() {
  const theme = useTheme();
  const supportsGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const Surface = supportsGlass ? GlassView : View;
  const metronome = useMetronome();

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.tempoRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease tempo"
            hitSlop={8}
            onPress={metronome.decrease}
            style={styles.stepperHit}>
            <Surface
              testID="tempo-stepper-glass"
              glassEffectStyle="regular"
              isInteractive={supportsGlass}
              tintColor={theme.backgroundElement}
              style={[
                styles.stepper,
                { backgroundColor: supportsGlass ? 'transparent' : theme.backgroundElement },
              ]}>
              <ThemedText style={styles.stepperLabel}>−</ThemedText>
            </Surface>
          </Pressable>

          <ThemedText
            accessibilityLabel={`${metronome.displayBpm} BPM`}
            style={styles.bpm}>
            {metronome.displayBpm}
          </ThemedText>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase tempo"
            hitSlop={8}
            onPress={metronome.increase}
            style={styles.stepperHit}>
            <Surface
              testID="tempo-stepper-glass"
              glassEffectStyle="regular"
              isInteractive={supportsGlass}
              tintColor={theme.backgroundElement}
              style={[
                styles.stepper,
                { backgroundColor: supportsGlass ? 'transparent' : theme.backgroundElement },
              ]}>
              <ThemedText style={styles.stepperLabel}>+</ThemedText>
            </Surface>
          </Pressable>
        </View>

        <MetronomeBeat
          beat={metronome.beat}
          playing={metronome.playing}
          intervalMs={metronome.intervalMs}
        />

        <View style={styles.transportRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tap tempo"
            accessibilityHint="Tap four steady beats to set the tempo"
            onPress={metronome.tap}
            style={styles.transportHit}>
            <Surface
              testID="tap-tempo-glass"
              glassEffectStyle="regular"
              isInteractive={supportsGlass}
              tintColor={theme.backgroundSelected}
              style={[
                styles.transportControl,
                {
                  backgroundColor: supportsGlass ? 'transparent' : theme.backgroundSelected,
                },
              ]}>
              <ThemedText style={styles.transportLabel}>Tap</ThemedText>
            </Surface>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={metronome.playing ? 'Stop metronome' : 'Start metronome'}
            onPress={metronome.toggle}
            style={styles.transportHit}>
            <Surface
              glassEffectStyle="regular"
              isInteractive={supportsGlass}
              tintColor={theme.backgroundSelected}
              style={[
                styles.transportControl,
                {
                  backgroundColor: supportsGlass ? 'transparent' : theme.backgroundSelected,
                },
              ]}>
              <ThemedText style={styles.transportLabel}>
                {metronome.playing ? 'Stop' : 'Play'}
              </ThemedText>
            </Surface>
          </Pressable>
        </View>
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
  stepperHit: {
    borderRadius: 32,
  },
  stepperLabel: {
    fontSize: 36,
    fontWeight: '500',
    lineHeight: 40,
  },
  transportRow: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  transportHit: {
    flex: 1,
    borderRadius: 44,
  },
  transportControl: {
    width: '100%',
    minHeight: 88,
    paddingHorizontal: Spacing.four,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportLabel: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 34,
  },
});
