import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';

import { useTheme } from '@/hooks/use-theme';

const PULSE_SIZE = 184;
const RESTING_SCALE = 0.72;

type MetronomeBeatProps = {
  beat: number;
  playing: boolean;
  intervalMs: number;
};

export function MetronomeBeat({ beat, playing, intervalMs }: MetronomeBeatProps) {
  const theme = useTheme();
  const [scale] = useState(() => new Animated.Value(RESTING_SCALE));
  const supportsGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const Pulse = supportsGlass ? GlassView : View;

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
        toValue: 1,
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
  }, [beat, intervalMs, playing, scale]);

  return (
    <View
      accessibilityLabel={playing ? 'Beat pulse playing' : 'Beat pulse at rest'}
      style={styles.stage}>
      <Animated.View style={[styles.pulseSlot, { transform: [{ scale }] }]}>
        <Pulse
          testID="metronome-pulse"
          glassEffectStyle="regular"
          tintColor={theme.backgroundSelected}
          style={[
            styles.pulse,
            {
              backgroundColor: supportsGlass ? 'transparent' : theme.backgroundSelected,
              borderColor: theme.textSecondary,
            },
          ]}
        />
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
    borderWidth: StyleSheet.hairlineWidth,
  },
});
