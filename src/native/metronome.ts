import { NativeModule, requireOptionalNativeModule } from 'expo-modules-core';

type MetronomeBeatEvent = {
  beat: number;
  phase: number;
  phaseCount: number;
};

type NativeMetronomeEvents = {
  onPlayback(event: { playing: boolean }): void;
  onBeat(event: MetronomeBeatEvent): void;
};

declare class NativeMetronomeModule extends NativeModule<NativeMetronomeEvents> {
  readPreferences(): string | null;
  writePreferences(value: string): void;
  start(bpm: number, beatsPerMeasure: number, clickRate: number): void;
  stop(): void;
  setTempo(bpm: number): void;
  setTimeSignature(beatsPerMeasure: number): void;
  setClickRate(clickRate: number): void;
}

const iosMetronome = requireOptionalNativeModule<NativeMetronomeModule>('NativeMetronome');

const unavailableMetronome = {
  readPreferences: () => null,
  writePreferences(_value: string) {},
  start() {},
  stop() {},
  setTempo() {},
  setTimeSignature() {},
  setClickRate() {},
  addListener() {
    return { remove() {} };
  },
};

export const NativeMetronome = iosMetronome ?? unavailableMetronome;
