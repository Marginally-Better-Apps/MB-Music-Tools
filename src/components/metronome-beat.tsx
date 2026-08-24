import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';

import { useTheme } from '@/hooks/use-theme';

const TRACK_WIDTH = 220;
const MARK_SIZE = 28;
const TRAVEL = (TRACK_WIDTH - MARK_SIZE) / 2;

type MetronomeBeatProps = {
  playing: boolean;
  intervalMs: number;
};

export function MetronomeBeat({ playing, intervalMs }: MetronomeBeatProps) {
  const theme = useTheme();
  const [progress] = useState(() => new Animated.Value(0));
  const Mark = isLiquidGlassAvailable() ? GlassView : View;

  useEffect(() => {
    if (!playing) {
      const rest = Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      });
      rest.start();
      return () => rest.stop();
    }

    progress.setValue(0);
    const travel = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: intervalMs,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      })
    );
    travel.start();
    return () => travel.stop();
  }, [intervalMs, playing, progress]);

  return (
    <View
      accessibilityLabel={playing ? 'Beat marks traveling' : 'Beat marks at rest'}
      style={styles.track}>
      <Animated.View
        style={[
          styles.markSlot,
          styles.leftSlot,
          {
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, TRAVEL],
                }),
              },
            ],
          },
        ]}>
        <Mark
          glassEffectStyle="regular"
          style={[styles.mark, { backgroundColor: theme.text }]}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.markSlot,
          styles.rightSlot,
          {
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -TRAVEL],
                }),
              },
            ],
          },
        ]}>
        <Mark
          glassEffectStyle="regular"
          style={[styles.mark, { backgroundColor: theme.text }]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: MARK_SIZE,
    justifyContent: 'center',
  },
  markSlot: {
    position: 'absolute',
  },
  leftSlot: {
    left: 0,
  },
  rightSlot: {
    right: 0,
  },
  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: MARK_SIZE / 2,
  },
});
