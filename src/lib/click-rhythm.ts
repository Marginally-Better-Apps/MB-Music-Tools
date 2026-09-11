export const CLICK_RHYTHMS = [
  { id: 'whole', label: 'Whole', rate: 0.25, glyph: '\uE1D2' },
  { id: 'half', label: 'Half', rate: 0.5, glyph: '\uE1D3' },
  { id: 'quarter', label: 'Quarter', rate: 1, glyph: '\uE1D5' },
  { id: 'eighth', label: 'Eighth', rate: 2, glyph: '\uE1D7' },
  {
    id: 'triplet',
    label: 'Triplet',
    rate: 3,
    glyph: '\uE1D7',
    tupletGlyph: '\uE883',
  },
  { id: 'sixteenth', label: '16th', rate: 4, glyph: '\uE1D9' },
] as const;

export type ClickRhythm = (typeof CLICK_RHYTHMS)[number]['id'];

export const DEFAULT_CLICK_RHYTHM: ClickRhythm = 'quarter';

export function getClickRate(rhythm: ClickRhythm): number {
  return CLICK_RHYTHMS.find(({ id }) => id === rhythm)?.rate ?? 1;
}

export function getBeatPhaseCount(rhythm: ClickRhythm): number {
  return Math.max(1, Math.round(getClickRate(rhythm)));
}

export function getBeatStride(rhythm: ClickRhythm): number {
  const rate = getClickRate(rhythm);
  return rate < 1 ? Math.round(1 / rate) : 1;
}

export function clickIntervalMs(
  quarterNoteIntervalMs: number,
  rhythm: ClickRhythm
): number {
  return quarterNoteIntervalMs / getClickRate(rhythm);
}
