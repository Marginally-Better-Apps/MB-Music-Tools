import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import {
  bpmToIntervalMs,
  calculateTapTempo,
  clampBpm,
  DEFAULT_BPM,
  interpolateTempoEaseOut,
} from '@/lib/tempo';
import {
  DEFAULT_TIME_SIGNATURE,
  getBeatsPerMeasure,
  TimeSignature,
} from '@/lib/time-signature';
import {
  DEFAULT_SUBDIVISION,
  Subdivision,
  subdivisionIntervalMs,
} from '@/lib/subdivision';
import { NativeMetronome } from '@/native/metronome';

const TAP_TEMPO_RESET_MS = 2000;
const TEMPO_ANIMATION_DURATION_MS = 300;
const TEMPO_ANIMATION_FRAME_MS = 16;

export function useMetronome() {
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [displayBpm, setDisplayBpm] = useState(DEFAULT_BPM);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [beatPhase, setBeatPhase] = useState(0);
  const [beatPhaseCount, setBeatPhaseCount] = useState(1);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>(DEFAULT_TIME_SIGNATURE);
  const [subdivision, setSubdivision] = useState<Subdivision>(DEFAULT_SUBDIVISION);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const bpmRef = useRef(bpm);
  const timeSignatureRef = useRef(timeSignature);
  const subdivisionRef = useRef(subdivision);
  const displayBpmRef = useRef(displayBpm);
  const tapTimestampsRef = useRef<number[]>([]);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const beatSubscription = NativeMetronome.addListener('onBeat', (event) => {
      setBeat(event.beat);
      setBeatPhase(event.phase);
      setBeatPhaseCount(event.phaseCount);
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
    beatPhase,
    beatPhaseCount,
    beatsPerMeasure: getBeatsPerMeasure(timeSignature),
    playing,
    subdivision,
    timeSignature,
    intervalMs: subdivisionIntervalMs(bpmToIntervalMs(bpm), subdivision),
    toggle() {
      setPlaying((current) => {
        if (current) {
          NativeMetronome.stop();
          return false;
        }

        setBeat(0);
        setBeatPhase(0);
        NativeMetronome.start(
          bpmRef.current,
          getBeatsPerMeasure(timeSignatureRef.current),
          subdivisionRef.current
        );
        return true;
      });
    },
    selectTimeSignature(signature: TimeSignature) {
      timeSignatureRef.current = signature;
      setTimeSignature(signature);
      setBeat(0);
      setBeatPhase(0);
      setBeatPhaseCount(subdivisionRef.current);
      NativeMetronome.setTimeSignature(getBeatsPerMeasure(signature));
    },
    selectSubdivision(nextSubdivision: Subdivision) {
      subdivisionRef.current = nextSubdivision;
      setSubdivision(nextSubdivision);
      setBeat(0);
      setBeatPhase(0);
      setBeatPhaseCount(nextSubdivision);
      NativeMetronome.setSubdivision(nextSubdivision);
    },
    setTempo(nextBpm: number) {
      tapTimestampsRef.current = [];
      updateBpm(nextBpm);
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
