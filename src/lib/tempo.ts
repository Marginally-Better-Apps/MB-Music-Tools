export const DEFAULT_BPM = 120;
export const MIN_BPM = 30;
export const MAX_BPM = 300;

export function clampBpm(bpm: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

export function bpmToIntervalMs(bpm: number): number {
  return 60_000 / clampBpm(bpm);
}

export function calculateTapTempo(timestamps: readonly number[]): number | null {
  if (timestamps.length < 4) {
    return null;
  }

  const recentTaps = timestamps.slice(-4);
  const intervals = recentTaps.slice(1).map((timestamp, index) => timestamp - recentTaps[index]);

  if (intervals.some((interval) => interval <= 0)) {
    return null;
  }

  const averageInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  return clampBpm(60_000 / averageInterval);
}

export function interpolateTempoEaseOut(start: number, end: number, progress: number): number {
  const boundedProgress = Math.min(1, Math.max(0, progress));
  const easedProgress = 1 - (1 - boundedProgress) ** 2;
  return Math.round(start + (end - start) * easedProgress);
}
