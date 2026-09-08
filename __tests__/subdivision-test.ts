import {
  getSubdivisionName,
  SUBDIVISIONS,
  subdivisionIntervalMs,
} from '@/lib/subdivision';

describe('beat subdivisions', () => {
  test.each([
    [1, 'quarter notes'],
    [2, 'eighth notes'],
    [3, 'eighth-note triplets'],
    [4, 'sixteenth notes'],
  ] as const)('maps %i pulses per beat to %s', (subdivision, name) => {
    expect(getSubdivisionName(subdivision)).toBe(name);
  });

  test('offers straight and triplet choices in musical order', () => {
    expect(SUBDIVISIONS).toEqual([1, 2, 3, 4]);
  });

  test('names subnotes from the time-signature beat unit', () => {
    expect(getSubdivisionName(1, 8)).toBe('eighth notes');
    expect(getSubdivisionName(2, 8)).toBe('sixteenth notes');
    expect(getSubdivisionName(3, 8)).toBe('sixteenth-note triplets');
    expect(getSubdivisionName(4, 8)).toBe('thirty-second notes');
  });

  test.each([
    [1, 500],
    [2, 250],
    [3, 500 / 3],
    [4, 125],
  ] as const)('splits a 500ms beat into %i audible pulses', (subdivision, expected) => {
    expect(subdivisionIntervalMs(500, subdivision)).toBeCloseTo(expected);
  });
});
