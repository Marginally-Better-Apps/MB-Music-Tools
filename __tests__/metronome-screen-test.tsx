import { fireEvent, render } from '@testing-library/react-native';

import MetronomeScreen from '@/app/metronome';

jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({
    play: jest.fn(),
    seekTo: jest.fn(() => Promise.resolve()),
  }),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Soft: 'soft' },
}));

describe('<MetronomeScreen />', () => {
  test('shows a large default tempo and a play control a stranger can find', async () => {
    const { getByLabelText, getByText, queryByText } = await render(<MetronomeScreen />);

    expect(getByText('120')).toBeTruthy();
    expect(getByLabelText('Start metronome')).toBeTruthy();
    expect(queryByText('Set a tempo when you are ready.')).toBeNull();
    expect(queryByText('Explore')).toBeNull();
  });

  test('start marks the beat as playing and stop returns it to rest', async () => {
    const { getByLabelText } = await render(<MetronomeScreen />);

    await fireEvent.press(getByLabelText('Start metronome'));
    expect(getByLabelText('Stop metronome')).toBeTruthy();

    await fireEvent.press(getByLabelText('Stop metronome'));
    expect(getByLabelText('Start metronome')).toBeTruthy();
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
