import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedGlassButton } from '@/components/animated-glass-button';
import { MetronomeBeat } from '@/components/metronome-beat';
import { TimeSignatureEditor } from '@/components/time-signature-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useMetronome } from '@/hooks/use-metronome';
import { useTheme } from '@/hooks/use-theme';

export default function MetronomeScreen() {
  const theme = useTheme();
  const metronome = useMetronome();

  return (
    <ThemedView style={styles.screen}>
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlow,
          styles.ambientGlowTop,
          { backgroundColor: theme.accentSoft },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlow,
          styles.ambientGlowBottom,
          { backgroundColor: theme.accentSoft },
        ]}
      />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.tempoRow}>
          <AnimatedGlassButton
            accessibilityLabel="Decrease tempo"
            contentStyle={styles.stepper}
            glowColor={theme.accent}
            onPress={metronome.decrease}
            style={styles.stepperHit}
            testID="tempo-stepper-glass"
            tintColor={theme.backgroundElement}>
            <ThemedText style={styles.stepperLabel}>−</ThemedText>
          </AnimatedGlassButton>

          <ThemedText
            accessibilityLabel={`${metronome.displayBpm} BPM`}
            style={styles.bpm}>
            {metronome.displayBpm}
          </ThemedText>

          <AnimatedGlassButton
            accessibilityLabel="Increase tempo"
            contentStyle={styles.stepper}
            glowColor={theme.accent}
            onPress={metronome.increase}
            style={styles.stepperHit}
            testID="tempo-stepper-glass"
            tintColor={theme.backgroundElement}>
            <ThemedText style={styles.stepperLabel}>+</ThemedText>
          </AnimatedGlassButton>
        </View>

        <View style={styles.signatureGroup}>
          <TimeSignatureEditor
            onChange={metronome.selectTimeSignature}
            value={metronome.timeSignature}
          />
        </View>

        <MetronomeBeat
          beat={metronome.beat}
          beatsPerMeasure={metronome.beatsPerMeasure}
          playing={metronome.playing}
          intervalMs={metronome.intervalMs}
          timeSignature={metronome.timeSignature}
        />

        <View style={styles.transportRow}>
          <AnimatedGlassButton
            accessibilityLabel="Tap tempo"
            accessibilityHint="Tap four steady beats to set the tempo"
            contentStyle={styles.transportControl}
            glowColor={theme.accent}
            onPress={metronome.tap}
            style={styles.transportHit}
            testID="tap-tempo-glass"
            tintColor={theme.backgroundSelected}>
            <ThemedText style={styles.transportLabel}>Tap</ThemedText>
          </AnimatedGlassButton>

          <AnimatedGlassButton
            accessibilityLabel={metronome.playing ? 'Stop metronome' : 'Start metronome'}
            contentStyle={styles.transportControl}
            glowColor={theme.accent}
            onPress={metronome.toggle}
            style={styles.transportHit}
            tintColor={metronome.playing ? theme.accentSoft : theme.backgroundSelected}>
            <ThemedText style={styles.transportLabel}>
              {metronome.playing ? 'Stop' : 'Play'}
            </ThemedText>
          </AnimatedGlassButton>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.34,
  },
  ambientGlowTop: {
    top: -120,
    right: -90,
  },
  ambientGlowBottom: {
    bottom: 22,
    left: -150,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
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
  signatureGroup: {
    width: '100%',
    maxWidth: 380,
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
    maxWidth: 380,
    flexDirection: 'row',
    gap: Spacing.three,
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
