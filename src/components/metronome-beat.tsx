import { useLayoutEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { TimeSignature } from '@/lib/time-signature';

const DOT_SIZE = 36;
const DOT_SLOT_SIZE = 48;

type MetronomeBeatProps = {
  beat: number;
  beatPhase: number;
  beatPhaseCount: number;
  beatsPerMeasure: number;
  playing: boolean;
  intervalMs: number;
  timeSignature: TimeSignature;
};

type BeatPulseProps = {
  beatPhase: number;
  beatPhaseCount: number;
  intervalMs: number;
  isDownbeat: boolean;
  size?: number;
};

/** A solid ripple that leaves the active dot on every click, including subdivisions. */
export function BeatPulse({
  beatPhase,
  beatPhaseCount,
  intervalMs,
  isDownbeat,
  size = DOT_SIZE,
}: BeatPulseProps) {
  const theme = useTheme();
  const [pulse] = useState(() => new Animated.Value(0));

  useLayoutEffect(() => {
    pulse.setValue(0);
    const animation = Animated.timing(pulse, {
      toValue: 1,
      duration: Math.max(90, Math.min(320, intervalMs * 0.85)),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [beatPhase, beatPhaseCount, intervalMs, pulse]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulse,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: theme.accent,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [isDownbeat ? 0.5 : 0.35, 0] }),
          transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, isDownbeat ? 1.9 : 1.6] }) }],
        },
      ]}
      testID="beat-pulse"
    />
  );
}

export function MetronomeBeat({
  beat,
  beatPhase,
  beatPhaseCount,
  beatsPerMeasure,
  playing,
  intervalMs,
  timeSignature,
}: MetronomeBeatProps) {
  const theme = useTheme();
  const compact = beatsPerMeasure > 8;
  const dotSize = compact ? 20 : DOT_SIZE;
  const isDownbeat = playing && beat === 1;

  const accessibilityValue = !playing
    ? `Stopped, ${timeSignature}`
    : beat === 0
      ? `Waiting for beat 1, ${timeSignature}`
      : beatPhaseCount > 1
        ? `Beat ${beat} of ${beatsPerMeasure}, pulse ${beatPhase} of ${beatPhaseCount}, ${timeSignature}`
        : `Beat ${beat} of ${beatsPerMeasure}, ${timeSignature}`;

  return (
    <View
      accessible
      accessibilityLabel="Metronome beat"
      accessibilityValue={{ text: accessibilityValue }}
      style={styles.stage}>
      <View style={[styles.dotField, compact && { gap: 8 }]}>
        {Array.from({ length: beatsPerMeasure }, (_, index) => {
          const dotBeat = index + 1;
          const isActive = playing && beat === dotBeat;
          const isFirst = dotBeat === 1;
          const ring = dotSize + 8;

          return (
            <View key={dotBeat} style={[styles.dotSlot, compact && { width: 28, height: 28 }]} testID="beat-dot-slot">
              {isFirst ? (
                <View
                  pointerEvents="none"
                  style={[styles.downbeatRing, { width: ring, height: ring, borderRadius: ring / 2, borderColor: theme.accent }]}
                  testID="downbeat-ring"
                />
              ) : null}
              {isActive ? (
                <BeatPulse
                  beatPhase={beatPhase}
                  beatPhaseCount={beatPhaseCount}
                  intervalMs={intervalMs}
                  isDownbeat={isDownbeat}
                  size={dotSize}
                />
              ) : null}
              <View
                testID="beat-dot"
                style={[
                  styles.dot,
                  {
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    backgroundColor: isActive ? theme.accent : theme.beatRest,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tall enough for 32 compact dots (four rows), so meter changes never move the controls below.
  stage: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotField: {
    width: '100%',
    maxWidth: 360,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  dotSlot: {
    width: DOT_SLOT_SIZE,
    height: DOT_SLOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  downbeatRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  pulse: {
    position: 'absolute',
  },
});
