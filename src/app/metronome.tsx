import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedGlassButton } from '@/components/animated-glass-button';
import { ClickRhythmPicker } from '@/components/click-rhythm-picker';
import { MetronomeBeat } from '@/components/metronome-beat';
import { ScrubbableNumber } from '@/components/scrubbable-number';
import { TimeSignatureEditor } from '@/components/time-signature-editor';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useMetronome } from '@/hooks/use-metronome';
import { useTheme } from '@/hooks/use-theme';

const TEMPO_VALUES = Array.from({ length: 271 }, (_, index) => index + 30);

export default function MetronomeScreen() {
  const theme = useTheme();
  const metronome = useMetronome();

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrubbableNumber
          accessibilityLabel={`Tempo, ${metronome.displayBpm} BPM`}
          displayValue={metronome.displayBpm}
          onChange={metronome.setTempo}
          onTap={metronome.tap}
          style={styles.tempo}
          textStyle={styles.bpm}
          value={metronome.bpm}
          values={TEMPO_VALUES}
        />

        <View style={styles.signatureGroup}>
          <TimeSignatureEditor
            onChange={metronome.selectTimeSignature}
            value={metronome.timeSignature}
          />
        </View>

        <MetronomeBeat
          beat={metronome.beat}
          beatPhase={metronome.beatPhase}
          beatPhaseCount={metronome.beatPhaseCount}
          beatsPerMeasure={metronome.beatsPerMeasure}
          playing={metronome.playing}
          intervalMs={metronome.intervalMs}
          timeSignature={metronome.timeSignature}
        />

        <View style={styles.transportRow}>
          <AnimatedGlassButton
            accessibilityLabel={metronome.playing ? 'Stop metronome' : 'Start metronome'}
            contentStyle={styles.transportControl}
            glowColor={theme.accent}
            onPress={metronome.toggle}
            style={styles.transportHit}
            testID="playback-glass"
            tintColor={metronome.playing ? theme.accentSoft : theme.backgroundSelected}>
            <ThemedText style={styles.transportLabel}>
              {metronome.playing ? 'Stop' : 'Play'}
            </ThemedText>
          </AnimatedGlassButton>
        </View>

        <ClickRhythmPicker
          onChange={metronome.selectClickRhythm}
          value={metronome.clickRhythm}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  tempo: {
    minWidth: 240,
  },
  bpm: {
    fontFamily: Fonts.sans,
    fontSize: 104,
    fontWeight: '600',
    lineHeight: 112,
    letterSpacing: -2,
    minWidth: 180,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  signatureGroup: {
    width: '100%',
    maxWidth: 420,
  },
  transportRow: {
    width: 240,
    flexDirection: 'row',
  },
  transportHit: {
    flex: 1,
    borderRadius: 44,
  },
  transportControl: {
    width: '100%',
    minHeight: 94,
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
