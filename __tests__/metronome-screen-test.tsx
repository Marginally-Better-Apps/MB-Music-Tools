import { fireEvent, render } from '@testing-library/react-native';

import MetronomeScreen from '@/app/metronome';

jest.mock('@/native/metronome', () => ({
  NativeMetronome: {
    start: jest.fn(),
    stop: jest.fn(),
    setTempo: jest.fn(),
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
  });

  test('start marks the beat as playing and stop returns it to rest', async () => {
    const { getByLabelText, getAllByTestId, queryByLabelText } = await render(<MetronomeScreen />);

    expect(getByLabelText('Beat pulse at rest')).toBeTruthy();
    expect(getAllByTestId('metronome-pulse')).toHaveLength(1);
    expect(queryByLabelText('Beat marks at rest')).toBeNull();

    await fireEvent.press(getByLabelText('Start metronome'));
    expect(getByLabelText('Stop metronome')).toBeTruthy();
    expect(getByLabelText('Beat pulse playing')).toBeTruthy();

    await fireEvent.press(getByLabelText('Stop metronome'));
    expect(getByLabelText('Start metronome')).toBeTruthy();
    expect(getByLabelText('Beat pulse at rest')).toBeTruthy();
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
