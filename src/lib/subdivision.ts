export const SUBDIVISIONS = [1, 2, 3, 4] as const;

export type Subdivision = (typeof SUBDIVISIONS)[number];

export const DEFAULT_SUBDIVISION: Subdivision = 1;

const NOTE_NAMES: Record<number, string> = {
  1: 'whole',
  2: 'half',
  4: 'quarter',
  8: 'eighth',
  16: 'sixteenth',
  32: 'thirty-second',
  64: 'sixty-fourth',
  128: 'hundred-twenty-eighth',
};

export function getSubdivisionNoteUnit(
  subdivision: Subdivision,
  beatUnit = 4
): number {
  if (subdivision === 1) return beatUnit;
  return beatUnit * (subdivision === 4 ? 4 : 2);
}

export function getSubdivisionName(
  subdivision: Subdivision,
  beatUnit = 4
): string {
  const noteUnit = getSubdivisionNoteUnit(subdivision, beatUnit);
  const noteName = NOTE_NAMES[noteUnit] ?? `${noteUnit}th`;
  return subdivision === 3 ? `${noteName}-note triplets` : `${noteName} notes`;
}

export function subdivisionIntervalMs(
  beatIntervalMs: number,
  subdivision: Subdivision
): number {
  return beatIntervalMs / subdivision;
}
