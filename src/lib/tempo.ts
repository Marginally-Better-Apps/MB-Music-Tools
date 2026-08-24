export const DEFAULT_BPM = 120;
export const MIN_BPM = 30;
export const MAX_BPM = 300;

export function clampBpm(bpm: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

export function bpmToIntervalMs(bpm: number): number {
  return 60_000 / clampBpm(bpm);
}
