import { StyleSheet, View } from 'react-native';

import { ScrubbableNumber } from '@/components/scrubbable-number';
import { useTheme } from '@/hooks/use-theme';
import {
  BEAT_UNITS,
  getBeatUnit,
  getBeatsPerMeasure,
  getNoteTypeName,
  MAX_BEATS_PER_MEASURE,
  MIN_BEATS_PER_MEASURE,
  TimeSignature,
} from '@/lib/time-signature';

const NUMERATOR_VALUES = Array.from(
  { length: MAX_BEATS_PER_MEASURE - MIN_BEATS_PER_MEASURE + 1 },
  (_, index) => index + MIN_BEATS_PER_MEASURE
);

type TimeSignatureEditorProps = {
  onChange: (signature: TimeSignature) => void;
  value: TimeSignature;
};

export function TimeSignatureEditor({ onChange, value }: TimeSignatureEditorProps) {
  const theme = useTheme();
  const beats = getBeatsPerMeasure(value);
  const unit = getBeatUnit(value);

  return (
    <View style={styles.fraction}>
      <ScrubbableNumber
        accessibilityLabel={`Beats per measure, ${beats}`}
        onChange={(nextBeats) => onChange(`${nextBeats}/${unit}`)}
        textStyle={styles.number}
        value={beats}
        values={NUMERATOR_VALUES}
      />
      <View style={[styles.fractionBar, { backgroundColor: theme.text }]} />
      <ScrubbableNumber
        accessibilityLabel={`Note type, ${getNoteTypeName(unit)}`}
        onChange={(nextUnit) => onChange(`${beats}/${nextUnit}`)}
        textStyle={styles.number}
        value={unit}
        values={BEAT_UNITS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fraction: {
    alignItems: 'center',
  },
  fractionBar: {
    width: 92,
    height: 2,
    borderRadius: 1,
    opacity: 0.82,
  },
  number: {
    fontSize: 58,
    fontWeight: '500',
    lineHeight: 66,
    letterSpacing: -1,
  },
});
