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

const PULSE_SIZE = 184;
const RESTING_SCALE = 0.72;

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
  const [scale] = useState(() => new Animated.Value(RESTING_SCALE));
  const supportsGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const Pulse = supportsGlass ? GlassView : View;
  const isDownbeat = playing && beat === 1;

  useEffect(() => {
    if (!playing) {
      const rest = Animated.spring(scale, {
        toValue: RESTING_SCALE,
        damping: 17,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      });
      rest.start();
      return () => rest.stop();
    }

    if (beat === 0) {
      return;
    }

    const pulse = Animated.sequence([
      Animated.timing(scale, {
        toValue: isDownbeat ? 1.08 : 0.96,
        duration: Math.min(90, intervalMs * 0.2),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: RESTING_SCALE,
        duration: Math.max(90, intervalMs * 0.68),
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    pulse.start();
    return () => pulse.stop();
  }, [beat, intervalMs, isDownbeat, playing, scale]);

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
      <Animated.View style={[styles.pulseSlot, { transform: [{ scale }] }]}>
        <Pulse
          testID="metronome-pulse"
          glassEffectStyle="regular"
          tintColor={isDownbeat ? theme.textSecondary : theme.backgroundSelected}
          style={[
            styles.pulse,
            {
              backgroundColor: supportsGlass
                ? 'transparent'
                : isDownbeat
                  ? theme.textSecondary
                  : theme.backgroundSelected,
              borderColor: theme.textSecondary,
              borderWidth: isDownbeat ? 2 : StyleSheet.hairlineWidth,
            },
          ]}
        />
        <View pointerEvents="none" style={styles.beatLabel}>
          {isDownbeat ? (
            <ThemedText style={[styles.downbeat, { color: theme.background }]}>
              Downbeat
            </ThemedText>
          ) : null}
          <ThemedText
            style={[styles.beatCount, isDownbeat && { color: theme.background }]}>
            {playing ? `Beat ${beat} of ${beatsPerMeasure}` : timeSignature}
          </ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseSlot: {
    width: PULSE_SIZE,
    height: PULSE_SIZE,
  },
  pulse: {
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    borderRadius: PULSE_SIZE / 2,
  },
  beatLabel: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  downbeat: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  beatCount: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
});
