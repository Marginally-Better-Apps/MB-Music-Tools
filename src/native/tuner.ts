import { NativeModule, requireOptionalNativeModule } from 'expo-modules-core';
export type TunerStatus = 'idle' | 'listening' | 'denied' | 'unavailable';
declare class TunerModule extends NativeModule<{
  onPitch: (event: { frequency: number }) => void;
  onStatus: (event: { status: TunerStatus }) => void;
}> {
  start(): Promise<TunerStatus>;
  stop(): Promise<void>;
}
export const NativeTuner = requireOptionalNativeModule<TunerModule>('NativeTuner');
