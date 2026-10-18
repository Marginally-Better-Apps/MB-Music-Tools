import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { frequencyToPitch } from '@/lib/pitch';
import { usePreferences } from '@/lib/preferences';
import { NativeTuner, TunerStatus } from '@/native/tuner';

export function useTuner() {
  const { transposition } = usePreferences();
  const [frequency, setFrequency] = useState(0);
  const [status, setStatus] = useState<TunerStatus>('idle');
  const locked = useRef(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    const start = () => {
      if (!NativeTuner) { setStatus('unavailable'); return; }
      void NativeTuner.start().then(next => { if (active) setStatus(next); }).catch(() => { if (active) setStatus('unavailable'); });
    };
    const pitch = NativeTuner?.addListener('onPitch', event => { if (active) setFrequency(event.frequency); });
    const state = NativeTuner?.addListener('onStatus', event => { if (active) setStatus(event.status); });
    const app = AppState.addEventListener('change', next => {
      if (next === 'active') start();
      else { NativeTuner?.stop(); setFrequency(0); }
    });
    start();
    return () => { active = false; pitch?.remove(); state?.remove(); app.remove(); NativeTuner?.stop(); setFrequency(0); };
  }, []));
  const pitch = frequencyToPitch(frequency, transposition);
  const inTune = pitch !== null && Math.abs(pitch.cents) <= 3;
  useEffect(() => {
    if (inTune && !locked.current) void Haptics.selectionAsync();
    // Hysteresis avoids repeating the lock tick at the edge of the window.
    if (inTune) locked.current = true;
    else if (!pitch || Math.abs(pitch.cents) > 6) locked.current = false;
  }, [inTune, pitch]);
  return { pitch, inTune, status };
}
