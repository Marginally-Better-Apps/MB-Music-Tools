import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomSheet, Button, HStack, Host, Picker, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { font, frame, padding, pickerStyle, presentationDetents, presentationDragIndicator, tag } from '@expo/ui/swift-ui/modifiers';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import {
  BEAT_UNITS,
  getBeatsPerMeasure,
  getBeatUnit,
  MAX_BEATS_PER_MEASURE,
  MIN_BEATS_PER_MEASURE,
  TimeSignature,
} from '@/lib/time-signature';

export const METER_PRESETS: readonly TimeSignature[] = ['2/4', '3/4', '4/4', '6/8'];

const BEAT_COUNTS = Array.from(
  { length: MAX_BEATS_PER_MEASURE - MIN_BEATS_PER_MEASURE + 1 },
  (_, index) => index + MIN_BEATS_PER_MEASURE
);

type MeterPickerProps = {
  onChange: (signature: TimeSignature) => void;
  value: TimeSignature;
};

export function MeterPicker({ onChange, value }: MeterPickerProps) {
  const theme = useTheme();
  const isCustom = !METER_PRESETS.includes(value);
  const [editing, setEditing] = useState(false);
  const beats = getBeatsPerMeasure(value);
  const unit = getBeatUnit(value);

  return (
    <View style={[styles.segments, { backgroundColor: theme.backgroundElement }]} testID="meter-picker">
      {METER_PRESETS.map((preset) => {
        const selected = preset === value;
        return (
          <Pressable
            key={preset}
            accessibilityLabel={`${preset} time`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(preset)}
            style={[styles.segment, selected && [styles.selected, { backgroundColor: theme.background }]]}>
            <ThemedText style={styles.segmentText} themeColor={selected ? 'text' : 'textSecondary'}>
              {preset}
            </ThemedText>
          </Pressable>
        );
      })}
      <Pressable
        accessibilityHint="Choose any time signature"
        accessibilityLabel={isCustom ? `Custom time, ${value}` : 'Custom time'}
        accessibilityRole="button"
        accessibilityState={{ selected: isCustom }}
        onPress={() => setEditing(true)}
        style={[styles.segment, styles.customSegment, isCustom && [styles.selected, { backgroundColor: theme.background }]]}>
        <ThemedText style={styles.segmentText} themeColor={isCustom ? 'text' : 'textSecondary'}>
          {isCustom ? value : '•••'}
        </ThemedText>
      </Pressable>

      <Host matchContents style={styles.sheetHost} testID="meter-sheet-host">
        <BottomSheet isPresented={editing} onIsPresentedChange={setEditing}>
          <VStack modifiers={[presentationDetents([{ height: 300 }]), presentationDragIndicator('visible'), padding({ top: 16 })]} spacing={4}>
            <ZStack modifiers={[padding({ horizontal: 20 })]}>
              <Text modifiers={[font({ size: 17, weight: 'semibold' })]}>Time Signature</Text>
              <HStack>
                <Spacer />
                <Button label="Done" modifiers={[font({ size: 17, weight: 'semibold' })]} onPress={() => setEditing(false)} />
              </HStack>
            </ZStack>
            <HStack spacing={0}>
              <Picker
                label="Beats per measure"
                modifiers={[pickerStyle('wheel'), frame({ width: 110 })]}
                onSelectionChange={(next: number) => onChange(`${next}/${unit}`)}
                selection={beats}
                testID="meter-beats-wheel">
                {BEAT_COUNTS.map((count) => (
                  <Text key={count} modifiers={[tag(count), font({ size: 26, weight: 'medium' })]}>
                    {String(count)}
                  </Text>
                ))}
              </Picker>
              <Text modifiers={[font({ size: 34, weight: 'light' })]}>/</Text>
              <Picker
                label="Note type"
                modifiers={[pickerStyle('wheel'), frame({ width: 110 })]}
                onSelectionChange={(next: number) => onChange(`${beats}/${next}`)}
                selection={unit}
                testID="meter-unit-wheel">
                {BEAT_UNITS.map((option) => (
                  <Text key={option} modifiers={[tag(option), font({ size: 26, weight: 'medium' })]}>
                    {String(option)}
                  </Text>
                ))}
              </Picker>
            </HStack>
          </VStack>
        </BottomSheet>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  segments: {
    width: '100%',
    flexDirection: 'row',
    borderRadius: 14,
    padding: 3,
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: 42,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customSegment: {
    flex: 1.2,
  },
  selected: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  sheetHost: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
});
