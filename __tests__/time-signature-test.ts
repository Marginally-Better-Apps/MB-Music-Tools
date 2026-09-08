import {
  changeBeatCount,
  changeBeatUnit,
  DEFAULT_TIME_SIGNATURE,
  getBeatUnit,
  getBeatsPerMeasure,
  getNoteTypeName,
  nextBeat,
} from '@/lib/time-signature';

describe('time signatures', () => {
  test('defaults to 4/4', () => {
    expect(DEFAULT_TIME_SIGNATURE).toBe('4/4');
  });

  test.each([
    ['2/4', [1, 2, 1, 2]],
    ['3/4', [1, 2, 3, 1, 2, 3]],
    ['4/4', [1, 2, 3, 4, 1, 2, 3, 4]],
    ['6/8', [1, 2, 3, 4, 5, 6, 1, 2]],
    ['7/8', [1, 2, 3, 4, 5, 6, 7, 1]],
  ] as const)('%s cycles through every beat and returns to 1', (signature, expected) => {
    const actual = expected.map((_, index) =>
      expected.slice(0, index + 1).reduce((beat) => nextBeat(beat, signature), 0)
    );

    expect(actual).toEqual(expected);
    expect(getBeatsPerMeasure(signature)).toBe(Number(signature.split('/')[0]));
  });

  test('changes the beat count without changing the beat unit', () => {
    expect(changeBeatCount('4/4', 1)).toBe('5/4');
    expect(changeBeatCount('4/4', -1)).toBe('3/4');
    expect(changeBeatCount('1/8', -1)).toBe('1/8');
    expect(changeBeatCount('32/8', 1)).toBe('32/8');
  });

  test('steps through standard note values without changing the beat count', () => {
    expect(changeBeatUnit('7/4', 1)).toBe('7/8');
    expect(changeBeatUnit('7/8', -1)).toBe('7/4');
    expect(changeBeatUnit('7/1', -1)).toBe('7/1');
    expect(changeBeatUnit('7/32', 1)).toBe('7/32');
    expect(getBeatUnit('13/16')).toBe(16);
  });

  test.each([
    [1, 'whole note'],
    [2, 'half note'],
    [4, 'quarter note'],
    [8, 'eighth note'],
    [16, 'sixteenth note'],
    [32, 'thirty-second note'],
  ] as const)(
    'maps denominator %i to its time-signature note type',
    (unit, name) => {
      expect(getNoteTypeName(unit)).toBe(name);
    }
  );
});
