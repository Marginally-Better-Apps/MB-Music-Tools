import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import {
  bpmToIntervalMs,
  calculateTapTempo,
  clampBpm,
  DEFAULT_BPM,
  interpolateTempoEaseOut,
} from '@/lib/tempo';
import { NativeMetronome } from '@/native/metronome';

const TAP_TEMPO_RESET_MS = 2000;
const TEMPO_ANIMATION_DURATION_MS = 300;
const TEMPO_ANIMATION_FRAME_MS = 16;

export function useMetronome() {
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [displayBpm, setDisplayBpm] = useState(DEFAULT_BPM);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const bpmRef = useRef(bpm);
  const displayBpmRef = useRef(displayBpm);
  const tapTimestampsRef = useRef<number[]>([]);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const beatSubscription = NativeMetronome.addListener('onBeat', (event) => {
      setBeat(event.beat);
    });
    return () => {
      beatSubscription.remove();
      NativeMetronome.stop();
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotionEnabled(enabled);
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const showBpm = (nextBpm: number, animated: boolean) => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }

    const startBpm = displayBpmRef.current;
    if (!animated || reduceMotionEnabled || startBpm === nextBpm) {
      displayBpmRef.current = nextBpm;
      setDisplayBpm(nextBpm);
      return;
    }

    let elapsedMs = 0;
    animationRef.current = setInterval(() => {
      elapsedMs = Math.min(TEMPO_ANIMATION_DURATION_MS, elapsedMs + TEMPO_ANIMATION_FRAME_MS);
      const nextDisplayBpm = interpolateTempoEaseOut(
        startBpm,
        nextBpm,
        elapsedMs / TEMPO_ANIMATION_DURATION_MS
      );
      displayBpmRef.current = nextDisplayBpm;
      setDisplayBpm(nextDisplayBpm);

      if (elapsedMs === TEMPO_ANIMATION_DURATION_MS && animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    }, TEMPO_ANIMATION_FRAME_MS);
  };

  const updateBpm = (nextBpm: number, animated = false) => {
    const clamped = clampBpm(nextBpm);
    bpmRef.current = clamped;
    setBpm(clamped);
    showBpm(clamped, animated);
    NativeMetronome.setTempo(clamped);
  };

  return {
    bpm,
    displayBpm,
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
      tapTimestampsRef.current = [];
      updateBpm(bpmRef.current + 1);
    },
    decrease() {
      tapTimestampsRef.current = [];
      updateBpm(bpmRef.current - 1);
    },
    tap() {
      const timestamp = Date.now();
      const previousTap = tapTimestampsRef.current.at(-1);

      if (previousTap !== undefined && timestamp - previousTap > TAP_TEMPO_RESET_MS) {
        tapTimestampsRef.current = [timestamp];
      } else {
        tapTimestampsRef.current = [...tapTimestampsRef.current, timestamp].slice(-4);
      }

      const measuredBpm = calculateTapTempo(tapTimestampsRef.current);
      if (measuredBpm !== null) {
        updateBpm(measuredBpm, true);
      }
    },
  };
}
