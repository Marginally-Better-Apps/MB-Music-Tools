import {
  bpmToIntervalMs,
  calculateTapTempo,
  clampBpm,
  interpolateTempoEaseOut,
} from '@/lib/tempo';

describe('tempo', () => {
  test('maps 120 BPM to a 500ms interval', () => {
    expect(bpmToIntervalMs(120)).toBe(500);
  });

  test('clamps tempo to 30 and 300', () => {
    expect(clampBpm(29)).toBe(30);
    expect(clampBpm(30)).toBe(30);
    expect(clampBpm(120)).toBe(120);
    expect(clampBpm(300)).toBe(300);
    expect(clampBpm(301)).toBe(300);
  });

  test('averages the intervals from four taps', () => {
    expect(calculateTapTempo([0, 500, 1010, 1500])).toBe(120);
  });

  test('rounds the measured tap tempo to a whole BPM', () => {
    expect(calculateTapTempo([0, 487, 974, 1461])).toBe(123);
  });

  test('clamps measured tap tempo to 30 through 300 BPM', () => {
    expect(calculateTapTempo([0, 100, 200, 300])).toBe(300);
    expect(calculateTapTempo([0, 3000, 6000, 9000])).toBe(30);
  });

  test('does not commit a tempo before four taps', () => {
    expect(calculateTapTempo([0])).toBeNull();
    expect(calculateTapTempo([0, 500, 1000])).toBeNull();
  });

  test('interpolates tempo with a quadratic ease-out instead of a linear count', () => {
    expect(interpolateTempoEaseOut(120, 87, 0)).toBe(120);
    expect(interpolateTempoEaseOut(120, 87, 0.25)).toBe(106);
    expect(interpolateTempoEaseOut(120, 87, 0.5)).toBe(95);
    expect(interpolateTempoEaseOut(120, 87, 1)).toBe(87);
  });
});
