import { act, renderHook } from '@testing-library/react-native';

import { useMetronome } from '@/hooks/use-metronome';

describe('useMetronome', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('clicks on the 500ms interval at 120 BPM and goes silent on stop', async () => {
    const onBeat = jest.fn();
    const { result } = await renderHook(() => useMetronome(onBeat));

    await act(async () => {
      result.current.toggle();
    });
    expect(onBeat).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(onBeat).toHaveBeenCalledTimes(1);

    await act(async () => {
      result.current.increase();
    });
    expect(result.current.bpm).toBe(121);
    expect(result.current.intervalMs).toBeCloseTo(60_000 / 121);

    await act(async () => {
      result.current.toggle();
    });

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    expect(onBeat).toHaveBeenCalledTimes(1);
  });
});
