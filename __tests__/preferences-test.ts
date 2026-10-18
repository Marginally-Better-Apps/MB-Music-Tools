import { decodePreferences, defaults, getPreferences, savePreferences } from '@/lib/preferences';
jest.mock('@/native/metronome', () => ({ NativeMetronome: { readPreferences: () => null, writePreferences: jest.fn() } }));

test('fresh and corrupt installs recover safe defaults', () => {
  for (const raw of [null, '', '{', 'null', '[]', '42']) expect(decodePreferences(raw)).toEqual(defaults);
});
test('restores the entire practice setup', () => {
  const saved = { bpm: 72, timeSignature: '7/8', clickRhythm: 'triplet', transposition: 'bb', appearance: 'dark' } as const;
  expect(decodePreferences(JSON.stringify(saved))).toEqual(saved);
  savePreferences(saved);
  expect(getPreferences()).toEqual(saved);
  const stored = jest.requireMock('@/native/metronome').NativeMetronome.writePreferences.mock.calls.at(-1)[0];
  expect(decodePreferences(stored)).toEqual(saved);
});
test('validates each field without losing other preferences', () => {
  expect(decodePreferences(JSON.stringify({ bpm: -4, timeSignature: '33/3', clickRhythm: 'bad', transposition: 'x', appearance: 'pink' }))).toEqual(defaults);
  expect(decodePreferences(JSON.stringify({ bpm: 82, timeSignature: '1/32' }))).toEqual({ ...defaults, bpm: 82, timeSignature: '1/32' });
});
