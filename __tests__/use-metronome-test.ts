import { act, renderHook } from '@testing-library/react-native';

import { useMetronome } from '@/hooks/use-metronome';

jest.mock('@/native/metronome', () => ({
  NativeMetronome: {
    start: jest.fn(),
    stop: jest.fn(),
    setTempo: jest.fn(),
    addListener: jest.fn(),
  },
}));

const mockNativeMetronome = jest.requireMock('@/native/metronome').NativeMetronome;
let mockNativeBeatListener: ((event: { beat: number }) => void) | undefined;

describe('useMetronome', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockNativeBeatListener = undefined;
    mockNativeMetronome.addListener.mockImplementation(
      (_eventName: string, listener: (event: { beat: number }) => void) => {
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
    expect(mockNativeMetronome.start).toHaveBeenCalledWith(120);

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
      mockNativeBeatListener?.({ beat: 1 });
    });

    expect(result.current.beat).toBe(1);
  });
});
