import { useEffect, useRef, useState } from 'react';

import { bpmToIntervalMs, clampBpm, DEFAULT_BPM } from '@/lib/tempo';
import { NativeMetronome } from '@/native/metronome';

export function useMetronome() {
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const bpmRef = useRef(bpm);

  useEffect(() => {
    const beatSubscription = NativeMetronome.addListener('onBeat', (event) => {
      setBeat(event.beat);
    });
    return () => {
      beatSubscription.remove();
      NativeMetronome.stop();
    };
  }, []);

  const updateBpm = (nextBpm: number) => {
    const clamped = clampBpm(nextBpm);
    bpmRef.current = clamped;
    setBpm(clamped);
    NativeMetronome.setTempo(clamped);
  };

  return {
    bpm,
    beat,
    playing,
    intervalMs: bpmToIntervalMs(bpm),
    toggle() {
      setPlaying((current) => {
        if (current) {
          NativeMetronome.stop();
          return false;
        }

        setBeat(0);
        NativeMetronome.start(bpmRef.current);
        return true;
      });
    },
    increase() {
      updateBpm(bpmRef.current + 1);
    },
    decrease() {
      updateBpm(bpmRef.current - 1);
    },
  };
}
