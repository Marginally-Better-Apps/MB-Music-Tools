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
  start(bpm: number, beatsPerMeasure: number, subdivision: number): void;
  stop(): void;
  setTempo(bpm: number): void;
  setTimeSignature(beatsPerMeasure: number): void;
  setSubdivision(subdivision: number): void;
}

const iosMetronome = requireOptionalNativeModule<NativeMetronomeModule>('NativeMetronome');

const unavailableMetronome = {
  start() {},
  stop() {},
  setTempo() {},
  setTimeSignature() {},
  setSubdivision() {},
  addListener() {
    return { remove() {} };
  },
};

export const NativeMetronome = iosMetronome ?? unavailableMetronome;
