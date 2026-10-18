import { frequencyToPitch } from '@/lib/pitch';

test('concert A and half-step boundaries retain honest sounding cents', () => {
  expect(frequencyToPitch(440)).toEqual({ note: 'A4', cents: 0 });
  expect(frequencyToPitch(440 * 2 ** (49 / 1200))?.cents).toBe(49);
  expect(frequencyToPitch(440 * 2 ** (51 / 1200))?.note).toBe('B♭4');
  expect(frequencyToPitch(440 * 2 ** (-12 / 1200))?.cents).toBe(-12);
});
test('written notes transpose without changing sounding cents', () => {
  expect(frequencyToPitch(233.08188, 'bb')).toEqual({ note: 'C4', cents: 0 });
  expect(frequencyToPitch(311.12698, 'eb')).toEqual({ note: 'C5', cents: 0 });
  expect(frequencyToPitch(174.61412, 'f')).toEqual({ note: 'C4', cents: 0 });
  expect(frequencyToPitch(442, 'bb')?.cents).toBe(frequencyToPitch(442)?.cents);
});
test.each([0, -440, NaN, Infinity, 30, 3000])('rejects invalid or out-of-range frequency %s', frequency => {
  expect(frequencyToPitch(frequency)).toBeNull();
});
