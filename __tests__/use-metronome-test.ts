import { act, renderHook } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { useMetronome } from '@/hooks/use-metronome';

jest.mock('@/native/metronome', () => ({
  NativeMetronome: {
    start: jest.fn(),
    stop: jest.fn(),
    setTempo: jest.fn(),
    setTimeSignature: jest.fn(),
    setSubdivision: jest.fn(),
    addListener: jest.fn(),
  },
}));

const mockNativeMetronome = jest.requireMock('@/native/metronome').NativeMetronome;
const mockIsReduceMotionEnabled = jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled');
let mockNativeBeatListener:
  | ((event: { beat: number; phase: number; phaseCount: number }) => void)
  | undefined;

describe('useMetronome', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockIsReduceMotionEnabled.mockResolvedValue(false);
    mockNativeBeatListener = undefined;
    mockNativeMetronome.addListener.mockImplementation(
      (
        _eventName: string,
        listener: (event: { beat: number; phase: number; phaseCount: number }) => void
      ) => {
        mockNativeBeatListener = listener;
        return { remove: jest.fn() };
      }
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('starts and stops the native clock at the selected tempo', async () => {
    const { result } = await renderHook(() => useMetronome());

    await act(async () => {
      result.current.toggle();
    });
    expect(mockNativeMetronome.start).toHaveBeenCalledWith(120, 4, 1);

    await act(async () => {
      result.current.increase();
    });
    expect(result.current.bpm).toBe(121);
    expect(result.current.intervalMs).toBeCloseTo(60_000 / 121);
    expect(mockNativeMetronome.setTempo).toHaveBeenCalledWith(121);

    await act(async () => {
      result.current.toggle();
    });
    expect(mockNativeMetronome.stop).toHaveBeenCalledTimes(1);
  });

  test('turns native beat events into a visual beat count', async () => {
    const { result } = await renderHook(() => useMetronome());

    expect(result.current.beat).toBe(0);

    await act(async () => {
      mockNativeBeatListener?.({ beat: 1, phase: 1, phaseCount: 1 });
    });

    expect(result.current.beat).toBe(1);
    expect(result.current.beatPhase).toBe(1);
    expect(result.current.beatPhaseCount).toBe(1);
  });

  test.each([
    ['2/4', [1, 2, 1, 2]],
    ['3/4', [1, 2, 3, 1]],
    ['4/4', [1, 2, 3, 4, 1]],
    ['6/8', [1, 2, 3, 4, 5, 6, 1]],
  ] as const)('cycles native ticks through %s', async (signature, expectedBeats) => {
    const { result } = await renderHook(() => useMetronome());

    await act(async () => {
      result.current.selectTimeSignature(signature);
      result.current.toggle();
    });

    const actualBeats: number[] = [];
    for (const expectedBeat of expectedBeats) {
      await act(async () => {
        mockNativeBeatListener?.({ beat: expectedBeat, phase: 1, phaseCount: 1 });
      });
      actualBeats.push(result.current.beat);
    }

    expect(actualBeats).toEqual(expectedBeats);
  });

  test('applies a live signature change without starting another clock', async () => {
    const { result } = await renderHook(() => useMetronome());

    await act(async () => {
      result.current.toggle();
      mockNativeBeatListener?.({ beat: 1, phase: 1, phaseCount: 1 });
      result.current.selectTimeSignature('3/4');
    });

    expect(result.current.timeSignature).toBe('3/4');
    expect(result.current.beat).toBe(0);
    expect(mockNativeMetronome.setTimeSignature).toHaveBeenCalledWith(3);
    expect(mockNativeMetronome.start).toHaveBeenCalledTimes(1);

    await act(async () => {
      mockNativeBeatListener?.({ beat: 1, phase: 1, phaseCount: 1 });
    });
    expect(result.current.beat).toBe(1);
  });

  test('sends a custom beat count to the native clock', async () => {
    const { result } = await renderHook(() => useMetronome());

    await act(async () => {
      result.current.selectTimeSignature('7/8');
    });

    expect(result.current.timeSignature).toBe('7/8');
    expect(result.current.beatsPerMeasure).toBe(7);
    expect(mockNativeMetronome.setTimeSignature).toHaveBeenCalledWith(7);
  });

  test('keeps meter note value separate from click subdivision', async () => {
    const { result } = await renderHook(() => useMetronome());

    await act(async () => {
      result.current.selectTimeSignature('4/2');
      result.current.toggle();
    });
    expect(result.current.timeSignature).toBe('4/2');
    expect(result.current.subdivision).toBe(1);
    expect(result.current.intervalMs).toBe(500);
    expect(mockNativeMetronome.start).toHaveBeenCalledWith(120, 4, 1);
  });

  test('holds a triplet beat for three audible phases before the next dot', async () => {
    const { result } = await renderHook(() => useMetronome());

    await act(async () => {
      result.current.selectSubdivision(3);
      result.current.toggle();
    });
    expect(result.current.timeSignature).toBe('4/4');
    expect(result.current.subdivision).toBe(3);
    expect(result.current.intervalMs).toBeCloseTo(500 / 3);
    expect(mockNativeMetronome.setSubdivision).toHaveBeenCalledWith(3);
    expect(mockNativeMetronome.start).toHaveBeenCalledWith(120, 4, 3);

    await act(async () => {
      mockNativeBeatListener?.({ beat: 1, phase: 1, phaseCount: 3 });
    });
    expect(result.current.beat).toBe(1);
    expect(result.current.beatPhase).toBe(1);
    expect(result.current.beatPhaseCount).toBe(3);

    await act(async () => {
      mockNativeBeatListener?.({ beat: 1, phase: 2, phaseCount: 3 });
    });
    expect(result.current.beat).toBe(1);
    expect(result.current.beatPhase).toBe(2);

    await act(async () => {
      mockNativeBeatListener?.({ beat: 1, phase: 3, phaseCount: 3 });
    });
    expect(result.current.beat).toBe(1);
    expect(result.current.beatPhase).toBe(3);

    await act(async () => {
      mockNativeBeatListener?.({ beat: 2, phase: 1, phaseCount: 3 });
    });
    expect(result.current.beat).toBe(2);
  });

  test('commits four steady taps and eases the displayed number to the measured tempo', async () => {
    const now = jest.spyOn(Date, 'now');
    const { result } = await renderHook(() => useMetronome());

    for (const timestamp of [0, 690, 1380]) {
      now.mockReturnValueOnce(timestamp);
      await act(async () => {
        result.current.tap();
      });
      expect(result.current.bpm).toBe(120);
    }

    now.mockReturnValueOnce(2070);
    await act(async () => {
      result.current.tap();
    });

    expect(result.current.bpm).toBe(87);
    expect(result.current.displayBpm).toBe(120);
    expect(result.current.intervalMs).toBeCloseTo(60_000 / 87);
    expect(mockNativeMetronome.setTempo).toHaveBeenLastCalledWith(87);

    await act(async () => {
      jest.advanceTimersByTime(16);
    });
    expect(result.current.displayBpm).toBe(117);

    await act(async () => {
      jest.advanceTimersByTime(16);
    });
    expect(result.current.displayBpm).toBe(113);

    await act(async () => {
      jest.advanceTimersByTime(288);
    });
    expect(result.current.displayBpm).toBe(87);
  });

  test('drops a stray tap after a long pause before measuring four new taps', async () => {
    const now = jest.spyOn(Date, 'now');
    const { result } = await renderHook(() => useMetronome());

    for (const timestamp of [0, 3000, 3750, 4500]) {
      now.mockReturnValueOnce(timestamp);
      await act(async () => {
        result.current.tap();
      });
    }
    expect(result.current.bpm).toBe(120);

    now.mockReturnValueOnce(5250);
    await act(async () => {
      result.current.tap();
    });
    expect(result.current.bpm).toBe(80);
  });

  test('skips the count animation when Reduce Motion is enabled', async () => {
    mockIsReduceMotionEnabled.mockResolvedValue(true);
    let timestamp = 0;
    jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
    const { result } = await renderHook(() => useMetronome());

    await act(async () => undefined);
    for (timestamp of [0, 690, 1380, 2070]) {
      await act(async () => {
        result.current.tap();
      });
    }

    expect(result.current.bpm).toBe(87);
    expect(result.current.displayBpm).toBe(87);
  });
});
