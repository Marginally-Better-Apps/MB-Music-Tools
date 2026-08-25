export const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '6/8'] as const;

export type TimeSignature = (typeof TIME_SIGNATURES)[number];

export const DEFAULT_TIME_SIGNATURE: TimeSignature = '4/4';

export function getBeatsPerMeasure(signature: TimeSignature): number {
  return Number(signature.split('/')[0]);
}

export function nextBeat(currentBeat: number, signature: TimeSignature): number {
  return (currentBeat % getBeatsPerMeasure(signature)) + 1;
}
