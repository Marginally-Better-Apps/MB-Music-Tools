import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/use-theme';
import { ClickRhythm, CLICK_RHYTHMS } from '@/lib/click-rhythm';

const TRACK_INSET = 3;

type ClickRhythmPickerProps = {
  onChange: (rhythm: ClickRhythm) => void;
  value: ClickRhythm;
};

export function ClickRhythmPicker({ onChange, value }: ClickRhythmPickerProps) {
  const theme = useTheme();
  const supportsGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
  const Track = supportsGlass ? GlassView : View;
  const selectedIndex = CLICK_RHYTHMS.findIndex(({ id }) => id === value);
  const [trackWidth, setTrackWidth] = useState(0);
  const [position] = useState(() => new Animated.Value(selectedIndex));
  const trackWidthRef = useRef(trackWidth);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const lastDragIndex = useRef(selectedIndex);
  const segmentWidth = Math.max(0, (trackWidth - TRACK_INSET * 2) / CLICK_RHYTHMS.length);

  useEffect(() => {
    trackWidthRef.current = trackWidth;
    valueRef.current = value;
    onChangeRef.current = onChange;
    lastDragIndex.current = selectedIndex;

    Animated.spring(position, {
      toValue: selectedIndex,
      damping: 19,
      stiffness: 260,
      mass: 0.72,
      useNativeDriver: true,
    }).start();
  }, [onChange, position, selectedIndex, trackWidth, value]);

  const selectIndex = (index: number) => {
    const option = CLICK_RHYTHMS[index];
    if (option && option.id !== valueRef.current) {
      valueRef.current = option.id;
      void Haptics.selectionAsync();
      onChangeRef.current(option.id);
    }
  };

  const indexAt = (x: number) => {
    const usableWidth = trackWidthRef.current - TRACK_INSET * 2;
    const width = usableWidth / CLICK_RHYTHMS.length;
    return Math.max(
      0,
      Math.min(CLICK_RHYTHMS.length - 1, Math.floor((x - TRACK_INSET) / width))
    );
  };

  // A horizontal drag can scrub through the same six choices as a tap.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > 5 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderGrant: (event) => {
        const index = indexAt(event.nativeEvent.locationX);
        lastDragIndex.current = index;
        selectIndex(index);
      },
      onPanResponderMove: (event) => {
        const index = indexAt(event.nativeEvent.locationX);
        if (index !== lastDragIndex.current) {
          lastDragIndex.current = index;
          selectIndex(index);
        }
      },
      onPanResponderTerminationRequest: () => false,
    })
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <Track
      glassEffectStyle="clear"
      tintColor={theme.backgroundElement}
      onLayout={handleLayout}
      style={[
        styles.track,
        { backgroundColor: supportsGlass ? 'transparent' : theme.backgroundElement },
      ]}
      testID="click-rhythm-picker"
      {...panResponder.panHandlers}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.selection,
          {
            backgroundColor: theme.backgroundSelected,
            shadowColor: theme.text,
            transform: [
              { translateX: Animated.multiply(position, segmentWidth) },
            ],
            width: segmentWidth,
          },
        ]}
        testID="click-rhythm-selection"
      />

      {CLICK_RHYTHMS.map((option, index) => {
        const selected = option.id === value;
        const color = selected ? theme.text : theme.textSecondary;
        return (
          <Pressable
            accessibilityLabel={`${option.label} click rhythm${selected ? ', selected' : ''}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            key={option.id}
            onPress={() => selectIndex(index)}
            style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            testID="click-rhythm-option">
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={styles.iconFrame}
              testID="click-rhythm-icon">
              {'tupletGlyph' in option ? (
                <>
                  <Text style={[styles.tupletNumber, { color }]}>{option.tupletGlyph}</Text>
                  <Text style={[styles.tripletNotes, { color }]}>{option.glyph}</Text>
                </>
              ) : (
                <Text style={[styles.noteGlyph, { color }]}>{option.glyph}</Text>
              )}
            </View>
          </Pressable>
        );
      })}
    </Track>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    maxWidth: 380,
    height: 54,
    padding: TRACK_INSET,
    borderRadius: 27,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  selection: {
    position: 'absolute',
    left: TRACK_INSET,
    top: TRACK_INSET,
    bottom: TRACK_INSET,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  option: {
    flex: 1,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.56,
  },
  iconFrame: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteGlyph: {
    fontFamily: 'Bravura Text',
    fontSize: 34,
    lineHeight: 40,
    textAlign: 'center',
  },
  tripletNotes: {
    fontFamily: 'Bravura Text',
    fontSize: 17,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  tupletNumber: {
    position: 'absolute',
    top: 0,
    fontFamily: 'Bravura Text',
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
  },
});
