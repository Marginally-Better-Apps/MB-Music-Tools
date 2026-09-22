import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

import {
  bpmToIntervalMs,
  calculateTapTempo,
  clampBpm,
  interpolateTempoEaseOut,
} from '@/lib/tempo';
import {
  getBeatsPerMeasure,
  TimeSignature,
} from '@/lib/time-signature';
import {
  ClickRhythm,
  clickIntervalMs,
  getBeatPhaseCount,
  getClickRate,
} from '@/lib/click-rhythm';
import { getPreferences, savePreferences } from '@/lib/preferences';
import { NativeMetronome } from '@/native/metronome';

const TAP_TEMPO_RESET_MS = 2000;
const TEMPO_ANIMATION_DURATION_MS = 300;
const TEMPO_ANIMATION_FRAME_MS = 16;

export function useMetronome() {
  const [bpm, setBpm] = useState(() => getPreferences().bpm);
  const [displayBpm, setDisplayBpm] = useState(() => getPreferences().bpm);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const [beatPhase, setBeatPhase] = useState(0);
  const [beatPhaseCount, setBeatPhaseCount] = useState(1);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>(() => getPreferences().timeSignature);
  const [clickRhythm, setClickRhythm] = useState<ClickRhythm>(() => getPreferences().clickRhythm);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const bpmRef = useRef(bpm);
  const timeSignatureRef = useRef(timeSignature);
  const clickRhythmRef = useRef(clickRhythm);
  const displayBpmRef = useRef(displayBpm);
  const tapTimestampsRef = useRef<number[]>([]);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const playbackSubscription = NativeMetronome.addListener('onPlayback', event => setPlaying(event.playing));
    const beatSubscription = NativeMetronome.addListener('onBeat', (event) => {
      setBeat(event.beat);
      setBeatPhase(event.phase);
      setBeatPhaseCount(event.phaseCount);
    });
    return () => {
      beatSubscription.remove();
      playbackSubscription.remove();
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
    savePreferences({ bpm: clamped });
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
    clickRhythm,
    timeSignature,
    intervalMs: clickIntervalMs(bpmToIntervalMs(bpm), clickRhythm),
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
          getClickRate(clickRhythmRef.current)
        );
        return true;
      });
    },
    selectTimeSignature(signature: TimeSignature) {
      timeSignatureRef.current = signature;
      setTimeSignature(signature);
      savePreferences({ timeSignature: signature });
      setBeat(0);
      setBeatPhase(0);
      setBeatPhaseCount(getBeatPhaseCount(clickRhythmRef.current));
      NativeMetronome.setTimeSignature(getBeatsPerMeasure(signature));
    },
    selectClickRhythm(nextRhythm: ClickRhythm) {
      clickRhythmRef.current = nextRhythm;
      setClickRhythm(nextRhythm);
      savePreferences({ clickRhythm: nextRhythm });
      setBeat(0);
      setBeatPhase(0);
      setBeatPhaseCount(getBeatPhaseCount(nextRhythm));
      NativeMetronome.setClickRate(getClickRate(nextRhythm));
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
