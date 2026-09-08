import { SubdivisionGlyph } from '@/components/subdivision-glyph';
import { ScrubbableNumber } from '@/components/scrubbable-number';
import {
  getSubdivisionName,
  Subdivision,
  SUBDIVISIONS,
} from '@/lib/subdivision';

type SubdivisionEditorProps = {
  beatUnit: number;
  onChange: (subdivision: Subdivision) => void;
  value: Subdivision;
};

export function SubdivisionEditor({
  beatUnit,
  onChange,
  value,
}: SubdivisionEditorProps) {
  return (
    <ScrubbableNumber
      accessibilityLabel={`Subdivision, ${getSubdivisionName(value, beatUnit)}`}
      displayAccessory={<SubdivisionGlyph beatUnit={beatUnit} subdivision={value} />}
      displayValue={null}
      onChange={(nextValue) => onChange(nextValue as Subdivision)}
      value={value}
      values={SUBDIVISIONS}
    />
  );
}
