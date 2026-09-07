import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';

import { useTheme } from '@/hooks/use-theme';
import { TimeSignature } from '@/lib/time-signature';

const DOT_SIZE = 20;
const FIRST_DOT_SIZE = 30;

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
    outputRange: [1, isDownbeat ? 1.52 : 1.4],
  });

  const accessibilityValue = !playing
    ? `Stopped, ${timeSignature}`
    : beat === 0
      ? `Waiting for beat 1, ${timeSignature}`
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
            <Animated.View
              key={dotBeat}
              style={[
                styles.dotShell,
                {
                  width: isFirst ? FIRST_DOT_SIZE : DOT_SIZE,
                  height: isFirst ? FIRST_DOT_SIZE : DOT_SIZE,
                  borderRadius: isFirst ? FIRST_DOT_SIZE / 2 : DOT_SIZE / 2,
                },
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
                    width: isFirst ? FIRST_DOT_SIZE : DOT_SIZE,
                    height: isFirst ? FIRST_DOT_SIZE : DOT_SIZE,
                    borderRadius: isFirst ? FIRST_DOT_SIZE / 2 : DOT_SIZE / 2,
                    backgroundColor: supportsGlass
                      ? 'transparent'
                      : isActive
                        ? theme.accent
                        : isFirst
                          ? theme.backgroundSelected
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
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOffset: { width: 0, height: 2 },
  },
  dot: {
    overflow: 'hidden',
  },
});
