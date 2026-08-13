import { compactToolTabs } from '@/constants/tool-tabs';

describe('compactToolTabs', () => {
  test('uses Tuner and Metronome with SF Symbol icons, not starter PNGs', () => {
    expect(compactToolTabs.map((tab) => tab.label)).toEqual(['Tuner', 'Metronome']);
    expect(compactToolTabs.map((tab) => tab.sf)).toEqual(['tuningfork', 'metronome']);
    expect(compactToolTabs.map((tab) => tab.name)).toEqual(['index', 'metronome']);
    expect(compactToolTabs.every((tab) => !('src' in tab))).toBe(true);
  });
});
