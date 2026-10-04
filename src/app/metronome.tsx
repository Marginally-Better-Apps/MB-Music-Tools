import * as Haptics from 'expo-haptics';
import { SymbolView } from 'expo-symbols';
import { SettingsSheet } from '@/components/settings-sheet';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedGlassButton } from '@/components/animated-glass-button';
import { ClickRhythmPicker } from '@/components/click-rhythm-picker';
import { MeterPicker } from '@/components/meter-picker';
import { MetronomeBeat } from '@/components/metronome-beat';
import { ScrubbableNumber } from '@/components/scrubbable-number';
import { TempoRuler } from '@/components/tempo-ruler';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useMetronome } from '@/hooks/use-metronome';
import { useTheme } from '@/hooks/use-theme';

const TEMPO_VALUES = Array.from({ length: 271 }, (_, index) => index + 30);

export default function MetronomeScreen() {
  const theme = useTheme();
  const metronome = useMetronome();
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  // Only scroll when the controls genuinely don't fit (small phones, large text),
  // so dragging the tempo never nudges the page.
  const needsScroll = contentHeight > viewportHeight + 1;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <SettingsSheet />
        <ScrollView
          alwaysBounceVertical={false}
          bounces={needsScroll}
          contentContainerStyle={styles.content}
          onContentSizeChange={(_, height) => setContentHeight(height)}
          onLayout={(event) => setViewportHeight(event.nativeEvent.layout.height)}
          scrollEnabled={needsScroll}
          showsVerticalScrollIndicator={false}
          testID="metronome-scroll">
          <View style={styles.tempoBlock}>
            <ScrubbableNumber
              accessibilityLabel={`Tempo, ${metronome.displayBpm} BPM`}
              displayValue={metronome.displayBpm}
              onChange={metronome.setTempo}
              style={styles.tempo}
              textStyle={styles.bpm}
              value={metronome.bpm}
              values={TEMPO_VALUES}
            />
            <TempoRuler onChange={metronome.setTempo} value={metronome.bpm} />
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

          <View style={styles.section}>
            <SectionHeader title="Time signature" />
            <MeterPicker onChange={metronome.selectTimeSignature} value={metronome.timeSignature} />
          </View>

          <View style={styles.section}>
            <SectionHeader title="Clicks" />
            <ClickRhythmPicker onChange={metronome.selectClickRhythm} value={metronome.clickRhythm} />
          </View>
        </ScrollView>

        <View style={styles.transportRow}>
          <AnimatedGlassButton
            accessibilityHint="Tap along with the music to set the tempo"
            accessibilityLabel="Tap tempo"
            contentStyle={styles.transportControl}
            glowColor={theme.accent}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              metronome.tap();
            }}
            style={styles.tapHit}
            testID="tap-glass"
            tintColor={theme.backgroundElement}>
            <SymbolView name="hand.tap.fill" tintColor={theme.text} size={22} />
            <ThemedText style={styles.transportLabel}>Tap</ThemedText>
          </AnimatedGlassButton>
          <AnimatedGlassButton
            accessibilityLabel={metronome.playing ? 'Stop metronome' : 'Start metronome'}
            contentStyle={styles.transportControl}
            glowColor={theme.accent}
            onPress={metronome.toggle}
            style={styles.playHit}
            testID="playback-glass"
            tintColor={metronome.playing ? theme.accentSoft : theme.accent}>
            <SymbolView
              name={metronome.playing ? 'stop.fill' : 'play.fill'}
              tintColor={metronome.playing ? theme.text : theme.background}
              size={24}
            />
            <ThemedText
              style={[styles.transportLabel, { color: metronome.playing ? theme.text : theme.background }]}>
              {metronome.playing ? 'Stop' : 'Start'}
            </ThemedText>
          </AnimatedGlassButton>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionHeader}>
      {title}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: 36,
    paddingBottom: Spacing.three,
  },
  tempoBlock: {
    width: '100%',
    alignItems: 'center',
  },
  tempo: {
    minWidth: 240,
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
  section: {
    width: '100%',
    maxWidth: 420,
    gap: Spacing.two,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.one,
  },
  transportRow: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  tapHit: {
    flex: 1,
    borderRadius: 32,
  },
  playHit: {
    flex: 1.6,
    borderRadius: 32,
  },
  transportControl: {
    width: '100%',
    minHeight: 64,
    borderRadius: 32,
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transportLabel: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
});
