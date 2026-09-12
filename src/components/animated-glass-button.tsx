import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';

const DRAG_LIMIT = 8;
const HOLD_DELAY_MS = 420;
const REPEAT_START_MS = 230;
const REPEAT_MIN_MS = 70;

type AnimatedGlassButtonProps = {
  accessibilityHint?: string;
  accessibilityLabel: string;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  glowColor: string;
  onPress: () => void;
  repeatOnHold?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  tintColor: string;
};

export function AnimatedGlassButton({
  accessibilityHint,
  accessibilityLabel,
  children,
  contentStyle,
  disabled = false,
  glowColor,
  onPress,
  repeatOnHold = false,
  style,
  testID,
  tintColor,
}: AnimatedGlassButtonProps) {
  const supportsGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const Surface = supportsGlass ? GlassView : View;
  const [drag] = useState(() => new Animated.ValueXY());
  const [scale] = useState(() => new Animated.Value(1));
  const [glow] = useState(() => new Animated.Value(0));
  const holdDelay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const repeatTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHolding = useRef(false);
  const didRepeat = useRef(false);
  const repeatCount = useRef(0);
  const onPressRef = useRef(onPress);

  useEffect(() => {
    onPressRef.current = onPress;
  }, [onPress]);

  const clearHoldTimers = () => {
    if (holdDelay.current) clearTimeout(holdDelay.current);
    if (repeatTimer.current) clearTimeout(repeatTimer.current);
    holdDelay.current = null;
    repeatTimer.current = null;
  };

  const scheduleRepeat = () => {
    const delay = Math.max(REPEAT_MIN_MS, REPEAT_START_MS - repeatCount.current * 24);
    repeatTimer.current = setTimeout(() => {
      if (!isHolding.current) return;
      didRepeat.current = true;
      repeatCount.current += 1;
      onPressRef.current();
      scheduleRepeat();
    }, delay);
  };

  const startHold = () => {
    if (!repeatOnHold || disabled) return;
    clearHoldTimers();
    isHolding.current = true;
    didRepeat.current = false;
    repeatCount.current = 0;
    holdDelay.current = setTimeout(() => {
      if (!isHolding.current) return;
      didRepeat.current = true;
      onPressRef.current();
      scheduleRepeat();
    }, HOLD_DELAY_MS);
  };

  const stopHold = () => {
    isHolding.current = false;
    clearHoldTimers();
  };

  useEffect(
    () => () => {
      if (holdDelay.current) clearTimeout(holdDelay.current);
      if (repeatTimer.current) clearTimeout(repeatTimer.current);
    },
    []
  );

  const animatePressed = (pressed: boolean) => {
    Animated.spring(scale, {
      toValue: pressed ? 0.94 : 1,
      damping: 14,
      stiffness: 280,
      mass: 0.55,
      useNativeDriver: true,
    }).start();
    Animated.timing(glow, {
      toValue: pressed ? 1 : 0,
      duration: pressed ? 90 : 220,
      useNativeDriver: false,
    }).start();
  };

  const returnToRest = () => {
    stopHold();
    Animated.spring(drag, {
      toValue: { x: 0, y: 0 },
      damping: 12,
      stiffness: 190,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
    animatePressed(false);
  };

  // The responder callbacks read refs only after a gesture begins.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderGrant: () => animatePressed(true),
        onPanResponderMove: (_, gesture) => {
          drag.setValue({
            x: Math.max(-DRAG_LIMIT, Math.min(DRAG_LIMIT, gesture.dx * 0.18)),
            y: Math.max(-DRAG_LIMIT, Math.min(DRAG_LIMIT, gesture.dy * 0.18)),
          });
        },
        onPanResponderRelease: returnToRest,
        onPanResponderTerminate: returnToRest,
      })
  );

  const glowStyle = {
    shadowColor: glowColor,
    shadowOpacity: glow.interpolate({
      inputRange: [0, 1],
      outputRange: [0.08, 0.52],
    }),
    shadowRadius: glow.interpolate({
      inputRange: [0, 1],
      outputRange: [4, 16],
    }),
  };

  const transformStyle = {
    transform: [{ translateX: drag.x }, { translateY: drag.y }, { scale }],
  };

  return (
    <Animated.View
      style={[styles.animatedShell, style, glowStyle]}
      {...panResponder.panHandlers}>
      <Animated.View style={transformStyle}>
        <Pressable
          accessibilityHint={accessibilityHint}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="button"
          disabled={disabled}
          onPress={() => {
            if (!didRepeat.current) onPressRef.current();
          }}
          onPressIn={() => {
            didRepeat.current = false;
            animatePressed(true);
            startHold();
          }}
          onPressOut={returnToRest}
          style={styles.pressable}>
          <Surface
            testID={testID}
            glassEffectStyle="regular"
            isInteractive={supportsGlass}
            tintColor={tintColor}
            style={[
              styles.surface,
              contentStyle,
              { backgroundColor: supportsGlass ? 'transparent' : tintColor },
            ]}>
            {children}
          </Surface>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animatedShell: {
    shadowOffset: { width: 0, height: 4 },
  },
  pressable: {
    borderRadius: 999,
  },
  surface: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
