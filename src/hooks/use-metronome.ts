import { useEffect, useRef, useState } from 'react';

import { bpmToIntervalMs, clampBpm, DEFAULT_BPM } from '@/lib/tempo';

export function useMetronome(onBeat: () => void) {
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [playing, setPlaying] = useState(false);
  const onBeatRef = useRef(onBeat);
  const bpmRef = useRef(bpm);

  useEffect(() => {
    onBeatRef.current = onBeat;
  }, [onBeat]);

  useEffect(() => {
    bpmRef.current = bpm;
  }, [bpm]);

  useEffect(() => {
    if (!playing) {
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timeout = setTimeout(() => {
        onBeatRef.current();
        schedule();
      }, bpmToIntervalMs(bpmRef.current));
    };

    schedule();
    return () => {
      clearTimeout(timeout);
    };
  }, [playing]);

  return {
    bpm,
    playing,
    intervalMs: bpmToIntervalMs(bpm),
    toggle() {
      setPlaying((current) => !current);
    },
    increase() {
      setBpm((current) => clampBpm(current + 1));
    },
    decrease() {
      setBpm((current) => clampBpm(current - 1));
    },
  };
}
