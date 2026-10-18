import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { MAX_BPM, MIN_BPM } from '@/lib/tempo';

const TICK_SPACING = 10;
/** Velocity kept per millisecond while coasting; lower stops sooner. */
const FRICTION = 0.9965;
/** Below this speed (BPM per ms) a fling settles on the nearest whole tempo. */
const REST_SPEED = 0.004;

type TempoRulerProps = {
  onChange: (bpm: number) => void;
  value: number;
};

const clamp = (bpm: number) => Math.max(MIN_BPM, Math.min(MAX_BPM, bpm));

/** A weighted dial: drag it sideways, flick it to coast, and feel a detent at every BPM. */
export function TempoRuler({ onChange, value }: TempoRulerProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [position, setPosition] = useState<number | null>(null);
  const positionRef = useRef(value);
  const startValue = useRef(value);
  const lastValue = useRef(value);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [onChange, value]);

  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    []
  );

  const moveTo = (next: number) => {
    positionRef.current = next;
    setPosition(next);
    const rounded = Math.round(next);
    if (rounded !== lastValue.current) {
      lastValue.current = rounded;
      onChangeRef.current(rounded);
      if (rounded % 10 === 0) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else void Haptics.selectionAsync();
    }
  };

  const settle = () => {
    frame.current = null;
    moveTo(Math.round(positionRef.current));
    setPosition(null);
  };

  const coast = (velocity: number) => {
    let speed = velocity;
    let last = Date.now();
    const step = () => {
      const now = Date.now();
      const elapsed = Math.min(48, now - last);
      last = now;
      const next = clamp(positionRef.current + speed * elapsed);
      speed *= FRICTION ** elapsed;
      moveTo(next);
      if (Math.abs(speed) < REST_SPEED || next === MIN_BPM || next === MAX_BPM) settle();
      else frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };

  // The responder callbacks read refs only after a gesture begins.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        const coasting = frame.current !== null;
        if (coasting) cancelAnimationFrame(frame.current!);
        frame.current = null;
        startValue.current = coasting ? positionRef.current : valueRef.current;
        lastValue.current = Math.round(startValue.current);
        positionRef.current = startValue.current;
        setPosition(startValue.current);
      },
      onPanResponderMove: (_, gesture) => moveTo(clamp(startValue.current - gesture.dx / TICK_SPACING)),
      onPanResponderRelease: (_, gesture) => {
        const velocity = -gesture.vx / TICK_SPACING;
        if (Math.abs(velocity) < REST_SPEED * 4) settle();
        else coast(velocity);
      },
      onPanResponderTerminate: settle,
    })
  );

  const center = position ?? value;
  const half = width / 2;
  const reach = Math.ceil(half / TICK_SPACING) + 1;
  const first = Math.max(MIN_BPM, Math.floor(center) - reach);
  const last = Math.min(MAX_BPM, Math.ceil(center) + reach);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
      style={styles.ruler}
      testID="tempo-ruler"
      {...panResponder.panHandlers}>
      {width > 0 &&
        Array.from({ length: last - first + 1 }, (_, index) => {
          const bpm = first + index;
          const x = half + (bpm - center) * TICK_SPACING;
          const fade = Math.max(0, 1 - (Math.abs(x - half) / half) ** 1.6);
          const major = bpm % 10 === 0;
          const mid = bpm % 5 === 0;
          return (
            <View key={bpm} pointerEvents="none" style={[styles.tickSlot, { left: x - 16, opacity: fade }]}>
              <View
                style={[
                  styles.tick,
                  {
                    height: major ? 16 : mid ? 11 : 7,
                    backgroundColor: major ? theme.text : theme.textSecondary,
                  },
                ]}
              />
              {major && (
                <ThemedText themeColor="textSecondary" style={styles.tickLabel}>
                  {bpm}
                </ThemedText>
              )}
            </View>
          );
        })}
      <View pointerEvents="none" style={[styles.needle, { backgroundColor: theme.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  ruler: {
    alignSelf: 'center',
    width: 240,
    height: 44,
    overflow: 'hidden',
  },
  tickSlot: {
    position: 'absolute',
    top: 4,
    width: 32,
    alignItems: 'center',
  },
  tick: {
    width: 1.5,
    borderRadius: 1,
  },
  tickLabel: {
    position: 'absolute',
    top: 19,
    fontSize: 10,
    lineHeight: 14,
    fontVariant: ['tabular-nums'],
  },
  needle: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: 2.5,
    height: 22,
    marginLeft: -1.25,
    borderRadius: 1.25,
  },
});
