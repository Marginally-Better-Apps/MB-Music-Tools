export const MIN_BEATS_PER_MEASURE = 1;
export const MAX_BEATS_PER_MEASURE = 32;
export const BEAT_UNITS = [1, 2, 4, 8, 16, 32] as const;

export type TimeSignature = `${number}/${number}`;

export const DEFAULT_TIME_SIGNATURE: TimeSignature = '4/4';

export function getBeatsPerMeasure(signature: TimeSignature): number {
  return Number(signature.split('/')[0]);
}

export function getBeatUnit(signature: TimeSignature): number {
  return Number(signature.split('/')[1]);
}

export function changeBeatCount(
  signature: TimeSignature,
  direction: -1 | 1
): TimeSignature {
  const nextCount = Math.min(
    MAX_BEATS_PER_MEASURE,
    Math.max(MIN_BEATS_PER_MEASURE, getBeatsPerMeasure(signature) + direction)
  );
  return `${nextCount}/${getBeatUnit(signature)}`;
}

export function changeBeatUnit(
  signature: TimeSignature,
  direction: -1 | 1
): TimeSignature {
  const currentIndex = BEAT_UNITS.findIndex((unit) => unit === getBeatUnit(signature));
  const nextIndex = Math.min(
    BEAT_UNITS.length - 1,
    Math.max(0, currentIndex + direction)
  );
  return `${getBeatsPerMeasure(signature)}/${BEAT_UNITS[nextIndex]}`;
}

export function nextBeat(currentBeat: number, signature: TimeSignature): number {
  return (currentBeat % getBeatsPerMeasure(signature)) + 1;
}
