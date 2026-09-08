import { NativeModule, requireOptionalNativeModule } from 'expo-modules-core';

type MetronomeBeatEvent = {
  beat: number;
  phase: number;
  phaseCount: number;
};

type NativeMetronomeEvents = {
  onBeat(event: MetronomeBeatEvent): void;
};

declare class NativeMetronomeModule extends NativeModule<NativeMetronomeEvents> {
  start(bpm: number, beatsPerMeasure: number, beatUnit: number): void;
  stop(): void;
  setTempo(bpm: number): void;
  setTimeSignature(beatsPerMeasure: number, beatUnit: number): void;
}

const iosMetronome = requireOptionalNativeModule<NativeMetronomeModule>('NativeMetronome');

const unavailableMetronome = {
  start() {},
  stop() {},
  setTempo() {},
  setTimeSignature() {},
  addListener() {
    return { remove() {} };
  },
};

export const NativeMetronome = iosMetronome ?? unavailableMetronome;
