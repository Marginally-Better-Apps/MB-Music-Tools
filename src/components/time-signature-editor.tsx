import { StyleSheet, View } from 'react-native';

import { AnimatedGlassButton } from '@/components/animated-glass-button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  changeBeatCount,
  changeBeatUnit,
  getBeatUnit,
  getBeatsPerMeasure,
  TimeSignature,
} from '@/lib/time-signature';

type TimeSignatureEditorProps = {
  onChange: (signature: TimeSignature) => void;
  value: TimeSignature;
};

type MeterValueProps = {
  decreaseLabel: string;
  increaseLabel: string;
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
  value: number;
};

function MeterValue({
  decreaseLabel,
  increaseLabel,
  label,
  onDecrease,
  onIncrease,
  value,
}: MeterValueProps) {
  const theme = useTheme();

  return (
    <View style={styles.valueGroup}>
      <View style={styles.valueRow}>
        <AnimatedGlassButton
          accessibilityLabel={decreaseLabel}
          contentStyle={styles.adjustButton}
          glowColor={theme.accent}
          onPress={onDecrease}
          testID="meter-editor-glass"
          tintColor={theme.backgroundElement}>
          <ThemedText style={styles.adjustLabel}>−</ThemedText>
        </AnimatedGlassButton>
        <ThemedText style={styles.meterValue}>{value}</ThemedText>
        <AnimatedGlassButton
          accessibilityLabel={increaseLabel}
          contentStyle={styles.adjustButton}
          glowColor={theme.accent}
          onPress={onIncrease}
          testID="meter-editor-glass"
          tintColor={theme.backgroundElement}>
          <ThemedText style={styles.adjustLabel}>+</ThemedText>
        </AnimatedGlassButton>
      </View>
      <ThemedText style={[styles.valueLabel, { color: theme.textSecondary }]}>
        {label}
      </ThemedText>
    </View>
  );
}

export function TimeSignatureEditor({ onChange, value }: TimeSignatureEditorProps) {
  return (
    <View style={styles.editor}>
      <View style={styles.header}>
        <ThemedText
          accessibilityLabel={`Time signature, ${value} selected`}
          style={styles.title}>
          Custom meter
        </ThemedText>
        <ThemedText style={styles.readout}>{value}</ThemedText>
      </View>
      <View style={styles.controls}>
        <MeterValue
          decreaseLabel="Decrease beats per measure"
          increaseLabel="Increase beats per measure"
          label="beats"
          onDecrease={() => onChange(changeBeatCount(value, -1))}
          onIncrease={() => onChange(changeBeatCount(value, 1))}
          value={getBeatsPerMeasure(value)}
        />
        <ThemedText accessibilityElementsHidden style={styles.slash}>
          /
        </ThemedText>
        <MeterValue
          decreaseLabel="Decrease beat unit"
          increaseLabel="Increase beat unit"
          label="note value"
          onDecrease={() => onChange(changeBeatUnit(value, -1))}
          onIncrease={() => onChange(changeBeatUnit(value, 1))}
          value={getBeatUnit(value)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  editor: {
    width: '100%',
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.one,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  readout: {
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  valueGroup: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  adjustButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  adjustLabel: {
    fontSize: 25,
    fontWeight: '500',
    lineHeight: 28,
  },
  meterValue: {
    width: 34,
    height: 44,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 44,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  valueLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  slash: {
    marginTop: 5,
    fontSize: 32,
    fontWeight: '300',
  },
});
