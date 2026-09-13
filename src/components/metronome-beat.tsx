import { useLayoutEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { GlassView } from 'expo-glass-effect';

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
};

export function BeatPulse({
  beatPhase,
  beatPhaseCount,
  intervalMs,
  isDownbeat,
}: BeatPulseProps) {
  const theme = useTheme();
  const [pulse] = useState(() => new Animated.Value(0));

  useLayoutEffect(() => {
    if (beatPhase === 1) pulse.setValue(0);
    const animation = Animated.timing(pulse, {
      toValue: beatPhase / beatPhaseCount,
      duration: Math.min(130, intervalMs * 0.24),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [beatPhase, beatPhaseCount, intervalMs, pulse]);

  const activeScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, isDownbeat ? 1.78 : 1.6],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulse,
        {
          shadowColor: theme.accent,
          shadowOpacity: isDownbeat ? 0.58 : 0.4,
          shadowRadius: isDownbeat ? 15 : 10,
          transform: [{ scale: activeScale }],
        },
      ]}
      testID="beat-pulse">
      <GlassView
        glassEffectStyle="clear"
        testID="beat-pulse-glass"
        tintColor={theme.accentSoft}
        style={styles.pulseGlass}
      />
    </Animated.View>
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
  const isDownbeat = playing && beat === 1 && beatPhase === 1;

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
      <View style={styles.dotField}>
        {Array.from({ length: beatsPerMeasure }, (_, index) => {
          const dotBeat = index + 1;
          const isActive = playing && beat === dotBeat;
          const isFirst = dotBeat === 1;

          return (
            <View key={dotBeat} style={styles.dotSlot} testID="beat-dot-slot">
              {isActive ? (
                <BeatPulse
                  beatPhase={beatPhase}
                  beatPhaseCount={beatPhaseCount}
                  intervalMs={intervalMs}
                  isDownbeat={isDownbeat}
                />
              ) : null}
              <GlassView
                glassEffectStyle="clear"
                hitSlop={6}
                isInteractive
                testID="beat-dot"
                tintColor={isActive ? theme.accentSoft : theme.backgroundElement}
                style={[
                  styles.dot,
                  {
                    backgroundColor: 'transparent',
                    borderColor: isFirst || isActive ? theme.accent : theme.textSecondary,
                    borderWidth: isFirst || isActive ? 2 : StyleSheet.hairlineWidth,
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
  stage: {
    width: '100%',
    minHeight: 72,
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
  pulse: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    shadowOffset: { width: 0, height: 2 },
  },
  pulseGlass: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
