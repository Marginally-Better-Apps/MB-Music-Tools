import { bpmToIntervalMs, clampBpm } from '@/lib/tempo';

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
});
