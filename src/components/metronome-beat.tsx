import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { TimeSignature } from '@/lib/time-signature';

const DOT_SIZE = 22;

type MetronomeBeatProps = {
  beat: number;
  beatsPerMeasure: number;
  playing: boolean;
  intervalMs: number;
  timeSignature: TimeSignature;
};

export function MetronomeBeat({
  beat,
  beatsPerMeasure,
  playing,
  intervalMs,
  timeSignature,
}: MetronomeBeatProps) {
  const theme = useTheme();
  const [pulse] = useState(() => new Animated.Value(0));
  const supportsGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const Dot = supportsGlass ? GlassView : View;
  const isDownbeat = playing && beat === 1;

  useEffect(() => {
    if (!playing || beat === 0) {
      pulse.setValue(0);
      return;
    }

    const animation = Animated.sequence([
      Animated.timing(pulse, {
        toValue: 1,
        duration: Math.min(90, intervalMs * 0.2),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pulse, {
        toValue: 0,
        duration: Math.max(90, intervalMs * 0.68),
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [beat, intervalMs, playing, pulse]);

  const activeScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1.12, isDownbeat ? 1.58 : 1.42],
  });

  const accessibilityValue = !playing
    ? `Stopped, ${timeSignature}`
    : beat === 0
      ? `Waiting for beat 1, ${timeSignature}`
      : `Beat ${beat} of ${beatsPerMeasure}, ${timeSignature}`;

  return (
    <View
      accessible
      accessibilityLabel={isDownbeat ? 'Downbeat' : 'Metronome beat'}
      accessibilityValue={{ text: accessibilityValue }}
      style={styles.stage}>
      <View style={styles.dotField}>
        {Array.from({ length: beatsPerMeasure }, (_, index) => {
          const dotBeat = index + 1;
          const isActive = playing && beat === dotBeat;
          const isFirst = dotBeat === 1;

          return (
            <Animated.View
              key={dotBeat}
              style={[
                styles.dotShell,
                isActive && {
                  shadowColor: theme.accent,
                  shadowOpacity: isDownbeat ? 0.72 : 0.52,
                  shadowRadius: isDownbeat ? 16 : 11,
                  transform: [{ scale: activeScale }],
                },
              ]}>
              <Dot
                testID="beat-dot"
                glassEffectStyle="clear"
                tintColor={isActive ? theme.accent : theme.backgroundElement}
                style={[
                  styles.dot,
                  {
                    backgroundColor: supportsGlass
                      ? 'transparent'
                      : isActive
                        ? theme.accent
                        : theme.backgroundElement,
                    borderColor: isFirst ? theme.accent : theme.textSecondary,
                    borderWidth: isFirst ? 1.5 : StyleSheet.hairlineWidth,
                  },
                ]}
              />
            </Animated.View>
          );
        })}
      </View>
      <View pointerEvents="none" style={styles.beatLabel}>
        {isDownbeat ? (
          <ThemedText style={[styles.downbeat, { color: theme.accent }]}>
            Downbeat
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.beatCount, { color: theme.textSecondary }]}>
          {playing && beat > 0 ? `Beat ${beat} of ${beatsPerMeasure}` : timeSignature}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    minHeight: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  dotField: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dotShell: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    shadowOffset: { width: 0, height: 2 },
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  beatLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    gap: 2,
  },
  downbeat: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  beatCount: {
    fontSize: 14,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
