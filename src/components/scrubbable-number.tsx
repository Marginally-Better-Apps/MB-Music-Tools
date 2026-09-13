import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const DRAG_POINTS_PER_STEP = 18;
const DRAG_LIMIT = 18;

type ScrubbableNumberProps = {
  accessibilityLabel: string;
  displayAccessory?: ReactNode;
  displayValue?: number | string | null;
  onChange: (value: number) => void;
  onTap?: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  value: number;
  values: readonly number[];
};

export function ScrubbableNumber({
  accessibilityLabel,
  displayAccessory,
  displayValue,
  onChange,
  onTap,
  style,
  textStyle,
  value,
  values,
}: ScrubbableNumberProps) {
  const theme = useTheme();
  const [drag] = useState(() => new Animated.Value(0));
  const [glow] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(1));
  const startIndex = useRef(0);
  const lastIndex = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onTapRef = useRef(onTap);
  const resolvedDisplayValue = displayValue === undefined ? value : displayValue;

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
    onTapRef.current = onTap;
  }, [onChange, onTap, value]);

  const changeBy = (direction: -1 | 1) => {
    const currentIndex = values.indexOf(valueRef.current);
    const nextIndex = Math.max(0, Math.min(values.length - 1, currentIndex + direction));
    if (nextIndex !== currentIndex) onChangeRef.current(values[nextIndex]);
  };

  const animateTouch = (active: boolean) => {
    Animated.spring(scale, {
      toValue: active ? 1.055 : 1,
      damping: 15,
      stiffness: 290,
      mass: 0.5,
      useNativeDriver: false,
    }).start();
    Animated.timing(glow, {
      toValue: active ? 1 : 0,
      duration: active ? 90 : 240,
      useNativeDriver: false,
    }).start();
  };

  const returnToRest = () => {
    Animated.spring(drag, {
      toValue: 0,
      damping: 12,
      stiffness: 210,
      mass: 0.65,
      useNativeDriver: false,
    }).start();
    animateTouch(false);
  };

  // The responder callbacks read refs only after a gesture begins.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startIndex.current = values.indexOf(valueRef.current);
        lastIndex.current = startIndex.current;
        animateTouch(true);
      },
      onPanResponderMove: (_, gesture) => {
        const stepOffset = Math.round(gesture.dx / DRAG_POINTS_PER_STEP);
        const nextIndex = Math.max(
          0,
          Math.min(values.length - 1, startIndex.current + stepOffset)
        );
        drag.setValue(Math.max(-DRAG_LIMIT, Math.min(DRAG_LIMIT, gesture.dx * 0.1)));
        if (nextIndex !== lastIndex.current) {
          lastIndex.current = nextIndex;
          onChangeRef.current(values[nextIndex]);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (Math.abs(gesture.dx) < 4 && Math.abs(gesture.dy) < 4) {
          onTapRef.current?.();
        }
        returnToRest();
      },
      onPanResponderTerminate: returnToRest,
      onPanResponderTerminationRequest: () => false,
    })
  );

  return (
    <View
      accessible
      accessibilityActions={[
        { name: 'increment' },
        { name: 'decrement' },
        ...(onTap ? [{ name: 'activate' as const }] : []),
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: values[0], max: values[values.length - 1], now: value }}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') changeBy(1);
        if (event.nativeEvent.actionName === 'decrement') changeBy(-1);
        if (event.nativeEvent.actionName === 'activate') onTapRef.current?.();
      }}
      style={[styles.accessibilityShell, style]}>
      <Animated.View
        style={[
          styles.shell,
          {
            shadowColor: theme.accent,
            shadowOpacity: glow.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.56],
            }),
            shadowRadius: glow.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 22],
            }),
            transform: [{ translateX: drag }, { scale }],
          },
        ]}
        {...panResponder.panHandlers}>
        <View style={styles.displayRow}>
          {resolvedDisplayValue !== null && (
            <ThemedText style={[styles.number, textStyle]}>{resolvedDisplayValue}</ThemedText>
          )}
          {displayAccessory}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  accessibilityShell: {
    alignItems: 'center',
  },
  shell: {
    minWidth: 150,
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  number: {
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
