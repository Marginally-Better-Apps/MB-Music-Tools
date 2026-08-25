import {
  DEFAULT_TIME_SIGNATURE,
  getBeatsPerMeasure,
  nextBeat,
  TIME_SIGNATURES,
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
  ] as const)('%s cycles through every beat and returns to 1', (signature, expected) => {
    const actual = expected.map((_, index) =>
      expected.slice(0, index + 1).reduce((beat) => nextBeat(beat, signature), 0)
    );

    expect(actual).toEqual(expected);
    expect(getBeatsPerMeasure(signature)).toBe(Number(signature.split('/')[0]));
  });

  test('offers only the four ensemble signatures in the requested order', () => {
    expect(TIME_SIGNATURES).toEqual(['2/4', '3/4', '4/4', '6/8']);
  });
});
