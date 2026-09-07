import { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  BEAT_UNITS,
  getBeatUnit,
  getBeatsPerMeasure,
  MAX_BEATS_PER_MEASURE,
  MIN_BEATS_PER_MEASURE,
  TimeSignature,
} from '@/lib/time-signature';

const DRAG_POINTS_PER_STEP = 24;
const NUMERATOR_VALUES = Array.from(
  { length: MAX_BEATS_PER_MEASURE - MIN_BEATS_PER_MEASURE + 1 },
  (_, index) => index + MIN_BEATS_PER_MEASURE
);

type TimeSignatureEditorProps = {
  onChange: (signature: TimeSignature) => void;
  value: TimeSignature;
};

type MeterScrubberProps = {
  accessibilityName: string;
  label: string;
  onChange: (value: number) => void;
  values: readonly number[];
  value: number;
};

function MeterScrubber({
  accessibilityName,
  label,
  onChange,
  values,
  value,
}: MeterScrubberProps) {
  const theme = useTheme();
  const supportsGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const Surface = supportsGlass ? GlassView : View;
  const [drag] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(1));
  const startIndex = useRef(0);
  const lastIndex = useRef(0);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
    onChangeRef.current = onChange;
  }, [onChange, value]);

  const changeBy = (direction: -1 | 1) => {
    const currentIndex = values.indexOf(valueRef.current);
    const nextIndex = Math.max(0, Math.min(values.length - 1, currentIndex + direction));
    if (nextIndex !== currentIndex) onChangeRef.current(values[nextIndex]);
  };

  const returnToRest = () => {
    Animated.parallel([
      Animated.spring(drag, {
        toValue: 0,
        damping: 13,
        stiffness: 240,
        mass: 0.6,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 14,
        stiffness: 260,
        mass: 0.55,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // The responder callbacks read refs only after a gesture begins.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        startIndex.current = values.indexOf(valueRef.current);
        lastIndex.current = startIndex.current;
        Animated.spring(scale, {
          toValue: 1.045,
          damping: 16,
          stiffness: 300,
          mass: 0.45,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gesture) => {
        const stepOffset = Math.round(-gesture.dy / DRAG_POINTS_PER_STEP);
        const nextIndex = Math.max(
          0,
          Math.min(values.length - 1, startIndex.current + stepOffset)
        );
        drag.setValue(Math.max(-10, Math.min(10, gesture.dy * 0.12)));
        if (nextIndex !== lastIndex.current) {
          lastIndex.current = nextIndex;
          onChangeRef.current(values[nextIndex]);
        }
      },
      onPanResponderRelease: returnToRest,
      onPanResponderTerminate: returnToRest,
    })
  );

  return (
    <View
      accessible
      accessibilityActions={[
        { name: 'increment', label: `Increase ${accessibilityName.toLowerCase()}` },
        { name: 'decrement', label: `Decrease ${accessibilityName.toLowerCase()}` },
      ]}
      accessibilityHint="Drag up or down to adjust"
      accessibilityLabel={`${accessibilityName}, ${value}`}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: values[0], max: values[values.length - 1], now: value }}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') changeBy(1);
        if (event.nativeEvent.actionName === 'decrement') changeBy(-1);
      }}
      style={styles.accessibleScrubber}>
      <Animated.View
        style={[
          styles.scrubberShell,
          {
            shadowColor: theme.accent,
            transform: [{ translateY: drag }, { scale }],
          },
        ]}
        {...panResponder.panHandlers}>
        <Surface
          glassEffectStyle="regular"
          isInteractive={supportsGlass}
          testID="meter-scrubber-glass"
          tintColor={theme.backgroundElement}
          style={[
            styles.scrubber,
            { backgroundColor: supportsGlass ? 'transparent' : theme.backgroundElement },
          ]}>
          <ThemedText style={[styles.scrubberLabel, { color: theme.textSecondary }]}>
            {label}
          </ThemedText>
          <ThemedText style={styles.scrubberValue}>{value}</ThemedText>
          <View pointerEvents="none" style={styles.dragRail}>
            <View style={[styles.railTick, { backgroundColor: theme.textSecondary }]} />
            <View
              style={[
                styles.railTick,
                styles.railTickWide,
                { backgroundColor: theme.accent },
              ]}
            />
            <View style={[styles.railTick, { backgroundColor: theme.textSecondary }]} />
          </View>
        </Surface>
      </Animated.View>
    </View>
  );
}

export function TimeSignatureEditor({ onChange, value }: TimeSignatureEditorProps) {
  const theme = useTheme();
  const beats = getBeatsPerMeasure(value);
  const unit = getBeatUnit(value);

  return (
    <View style={styles.editor}>
      <View style={styles.header}>
        <ThemedText
          accessibilityLabel={`Time signature, ${value} selected`}
          style={styles.title}>
          Time signature
        </ThemedText>
        <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>Drag numbers</ThemedText>
      </View>
      <View style={styles.fraction}>
        <MeterScrubber
          accessibilityName="Beats per measure"
          label="BEATS"
          onChange={(nextBeats) => onChange(`${nextBeats}/${unit}`)}
          value={beats}
          values={NUMERATOR_VALUES}
        />
        <View style={[styles.fractionBar, { backgroundColor: theme.text }]} />
        <MeterScrubber
          accessibilityName="Beat unit"
          label="NOTE VALUE"
          onChange={(nextUnit) => onChange(`${beats}/${nextUnit}`)}
          value={unit}
          values={BEAT_UNITS}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    width: '100%',
    gap: Spacing.two,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  fraction: {
    alignItems: 'center',
    gap: 6,
  },
  fractionBar: {
    width: 94,
    height: 2,
    borderRadius: 1,
    opacity: 0.72,
  },
  accessibleScrubber: {
    width: '100%',
  },
  scrubberShell: {
    width: '100%',
    borderRadius: 28,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.13,
    shadowRadius: 10,
  },
  scrubber: {
    width: '100%',
    height: 68,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  scrubberLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  scrubberValue: {
    minWidth: 82,
    fontSize: 42,
    fontWeight: '600',
    lineHeight: 48,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  dragRail: {
    width: 22,
    alignItems: 'flex-end',
    gap: 4,
  },
  railTick: {
    width: 11,
    height: 2,
    borderRadius: 1,
    opacity: 0.46,
  },
  railTickWide: {
    width: 18,
    opacity: 0.85,
  },
});
