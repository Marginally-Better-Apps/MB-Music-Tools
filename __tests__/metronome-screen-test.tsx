import { act, fireEvent, render } from '@testing-library/react-native';

import MetronomeScreen from '@/app/metronome';

jest.mock('@/native/metronome', () => ({
  NativeMetronome: {
    start: jest.fn(),
    stop: jest.fn(),
    setTempo: jest.fn(),
    setTimeSignature: jest.fn(),
    addListener: jest.fn(() => ({ remove: jest.fn() })),
  },
}));

jest.mock('expo-glass-effect', () => {
  const React = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');

  return {
    GlassView: (props: object) => React.createElement(View, props),
    isGlassEffectAPIAvailable: () => true,
    isLiquidGlassAvailable: () => true,
  };
});

describe('<MetronomeScreen />', () => {
  test('shows a large default tempo and a play control a stranger can find', async () => {
    const { getByLabelText, getByText, queryByText } = await render(<MetronomeScreen />);

    expect(getByText('120')).toBeTruthy();
    expect(getByLabelText('Start metronome')).toBeTruthy();
    expect(queryByText('Set a tempo when you are ready.')).toBeNull();
    expect(queryByText('Explore')).toBeNull();
    expect(getByLabelText('Time signature, 4/4 selected')).toBeTruthy();
  });

  test('builds 3/4, shows three beat dots, and reports the downbeat', async () => {
    const nativeMetronome = jest.requireMock('@/native/metronome').NativeMetronome;
    let beatListener: ((event: { beat: number }) => void) | undefined;
    nativeMetronome.addListener.mockImplementation(
      (_eventName: string, listener: (event: { beat: number }) => void) => {
        beatListener = listener;
        return { remove: jest.fn() };
      }
    );
    const { getAllByTestId, getByLabelText, getByText } = await render(
      <MetronomeScreen />
    );

    expect(getAllByTestId('beat-dot')).toHaveLength(4);
    await fireEvent.press(getByLabelText('Decrease beats per measure'));
    expect(getByLabelText('Time signature, 3/4 selected')).toBeTruthy();
    expect(getAllByTestId('beat-dot')).toHaveLength(3);

    await fireEvent.press(getByLabelText('Start metronome'));
    await act(async () => {
      beatListener?.({ beat: 1 });
    });

    expect(getByText('Downbeat')).toBeTruthy();
    expect(getByText('Beat 1 of 3')).toBeTruthy();
    expect(getByLabelText('Downbeat').props.accessibilityValue).toEqual({
      text: 'Beat 1 of 3, 3/4',
    });
  });

  test('start marks the beat as playing and stop returns it to rest', async () => {
    const { getByLabelText, getAllByTestId, queryByLabelText } = await render(<MetronomeScreen />);

    expect(getByLabelText('Metronome beat').props.accessibilityValue).toEqual({
      text: 'Stopped, 4/4',
    });
    expect(getAllByTestId('beat-dot')).toHaveLength(4);
    expect(queryByLabelText('Beat marks at rest')).toBeNull();

    await fireEvent.press(getByLabelText('Start metronome'));
    expect(getByLabelText('Stop metronome')).toBeTruthy();
    expect(getByLabelText('Metronome beat').props.accessibilityValue).toEqual({
      text: 'Waiting for beat 1, 4/4',
    });

    await fireEvent.press(getByLabelText('Stop metronome'));
    expect(getByLabelText('Start metronome')).toBeTruthy();
    expect(getByLabelText('Metronome beat').props.accessibilityValue).toEqual({
      text: 'Stopped, 4/4',
    });
  });

  test('creates an uncommon 7/8 meter with seven dots', async () => {
    const { getAllByTestId, getByLabelText } = await render(<MetronomeScreen />);

    for (let step = 0; step < 3; step += 1) {
      await fireEvent.press(getByLabelText('Increase beats per measure'));
    }
    await fireEvent.press(getByLabelText('Increase beat unit'));

    expect(getByLabelText('Time signature, 7/8 selected')).toBeTruthy();
    expect(getAllByTestId('beat-dot')).toHaveLength(7);
  });

  test('keeps all 32 beat dots at the custom-meter upper bound', async () => {
    const { getAllByTestId, getByLabelText } = await render(<MetronomeScreen />);

    for (let step = 0; step < 28; step += 1) {
      await fireEvent.press(getByLabelText('Increase beats per measure'));
    }

    expect(getByLabelText('Time signature, 32/4 selected')).toBeTruthy();
    expect(getAllByTestId('beat-dot')).toHaveLength(32);
  });

  test('renders every meter editor button as interactive Liquid Glass', async () => {
    const { getAllByTestId } = await render(<MetronomeScreen />);

    const meterButtons = getAllByTestId('meter-editor-glass');

    expect(meterButtons).toHaveLength(4);
    for (const button of meterButtons) {
      expect(button.props.glassEffectStyle).toBe('regular');
      expect(button.props.isInteractive).toBe(true);
    }
  });

  test('plus and minus change BPM by 1 immediately, including while clicking', async () => {
    const { getByLabelText, getByText } = await render(<MetronomeScreen />);

    await fireEvent.press(getByLabelText('Increase tempo'));
    expect(getByText('121')).toBeTruthy();

    await fireEvent.press(getByLabelText('Decrease tempo'));
    expect(getByText('120')).toBeTruthy();

    await fireEvent.press(getByLabelText('Start metronome'));
    await fireEvent.press(getByLabelText('Increase tempo'));
    expect(getByText('121')).toBeTruthy();
  });

  test('renders both tempo steppers as interactive Liquid Glass controls', async () => {
    const { getAllByTestId } = await render(<MetronomeScreen />);

    const glassSteppers = getAllByTestId('tempo-stepper-glass');

    expect(glassSteppers).toHaveLength(2);
    for (const stepper of glassSteppers) {
      expect(stepper.props.glassEffectStyle).toBe('regular');
      expect(stepper.props.isInteractive).toBe(true);
    }
  });

  test('shows a thumb-sized interactive Liquid Glass Tap control beside Play', async () => {
    const { getByLabelText, getByTestId } = await render(<MetronomeScreen />);

    expect(getByLabelText('Tap tempo')).toBeTruthy();
    expect(getByTestId('tap-tempo-glass')).toHaveStyle({ minHeight: 88 });
    expect(getByTestId('tap-tempo-glass').props.glassEffectStyle).toBe('regular');
    expect(getByTestId('tap-tempo-glass').props.isInteractive).toBe(true);
  });

  test('waits for four taps, then counts the large BPM label to the measured tempo', async () => {
    jest.useFakeTimers();
    let timestamp = 0;
    const now = jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
    const { getByLabelText, getByText } = await render(<MetronomeScreen />);

    for (timestamp of [0, 690, 1380]) {
      await fireEvent.press(getByLabelText('Tap tempo'));
      expect(getByText('120')).toBeTruthy();
    }

    timestamp = 2070;
    await fireEvent.press(getByLabelText('Tap tempo'));
    expect(getByText('120')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(320);
    });
    expect(getByText('87')).toBeTruthy();
    expect(getByLabelText('87 BPM')).toBeTruthy();

    now.mockRestore();
    jest.useRealTimers();
  });

  test('keeps tempo inside 30 to 300', async () => {
    const { getByLabelText, getByText } = await render(<MetronomeScreen />);

    for (let step = 0; step < 91; step += 1) {
      await fireEvent.press(getByLabelText('Decrease tempo'));
    }
    expect(getByText('30')).toBeTruthy();

    await fireEvent.press(getByLabelText('Decrease tempo'));
    expect(getByText('30')).toBeTruthy();

    for (let step = 0; step < 271; step += 1) {
      await fireEvent.press(getByLabelText('Increase tempo'));
    }
    expect(getByText('300')).toBeTruthy();

    await fireEvent.press(getByLabelText('Increase tempo'));
    expect(getByText('300')).toBeTruthy();
  });
});
