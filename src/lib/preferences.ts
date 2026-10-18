import { useSyncExternalStore } from 'react';
import { NativeMetronome } from '@/native/metronome';
import { ClickRhythm, CLICK_RHYTHMS } from '@/lib/click-rhythm';
import { TimeSignature, BEAT_UNITS } from '@/lib/time-signature';
import { Transposition } from '@/lib/pitch';

export type Preferences = {
  bpm: number;
  timeSignature: TimeSignature;
  clickRhythm: ClickRhythm;
  transposition: Transposition;
  appearance: 'system' | 'light' | 'dark';
};
export const defaults: Preferences = { bpm: 120, timeSignature: '4/4', clickRhythm: 'quarter', transposition: 'concert', appearance: 'system' };
export function decodePreferences(raw: string | null | undefined): Preferences {
  let data: Partial<Preferences>;
  try { data = JSON.parse(raw ?? '{}'); } catch { return { ...defaults }; }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ...defaults };
  const meter = typeof data.timeSignature === 'string' ? data.timeSignature.match(/^(\d+)\/(\d+)$/) : null;
  const validMeter = meter && +meter[1] >= 1 && +meter[1] <= 32 && BEAT_UNITS.some(unit => unit === +meter[2]);
  return {
    bpm: Number.isInteger(data.bpm) && data.bpm! >= 30 && data.bpm! <= 300 ? data.bpm! : defaults.bpm,
    timeSignature: validMeter ? data.timeSignature! : defaults.timeSignature,
    clickRhythm: CLICK_RHYTHMS.some(option => option.id === data.clickRhythm) ? data.clickRhythm! : defaults.clickRhythm,
    transposition: ['concert', 'bb', 'eb', 'f'].includes(data.transposition ?? '') ? data.transposition! : defaults.transposition,
    appearance: ['system', 'light', 'dark'].includes(data.appearance ?? '') ? data.appearance! : defaults.appearance,
  };
}
let current = decodePreferences(NativeMetronome.readPreferences?.());
const listeners = new Set<() => void>();
export function getPreferences() { return current; }
export function savePreferences(update: Partial<Preferences>) {
  current = decodePreferences(JSON.stringify({ ...current, ...update }));
  NativeMetronome.writePreferences?.(JSON.stringify(current));
  listeners.forEach(listener => listener());
}
export function usePreferences() {
  return useSyncExternalStore(listener => { listeners.add(listener); return () => { listeners.delete(listener); }; }, getPreferences, getPreferences);
}
