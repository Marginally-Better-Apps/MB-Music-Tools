import { AccessibilityInfo, StyleSheet } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import TunerScreen from '@/app/index';
import { lensOffset } from '@/components/tuner-lens';
import { getPreferences, savePreferences } from '@/lib/preferences';

jest.mock('@/hooks/use-tuner', () => ({ useTuner: jest.fn(() => ({ pitch: null, inTune: false, status: 'listening' })) }));
jest.mock('@/components/settings-sheet', () => ({ SettingsSheet: () => null }));
jest.mock('@expo/ui/swift-ui', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return { Host: View, Picker: View, Text: (props: object) => React.createElement(Text, props) };
});
jest.mock('expo-glass-effect', () => ({ GlassView: jest.requireActual('react-native').View }));

const useTuner = () => jest.requireMock('@/hooks/use-tuner').useTuner as jest.Mock;
const hear = (note: string, cents: number) => ({ pitch: { note, cents }, inTune: Math.abs(cents) <= 3, status: 'listening' });
const discShift = (screen: Awaited<ReturnType<typeof render>>) => {
  const style = StyleSheet.flatten(screen.getByTestId('tuner-disc').props.style);
  return (style.transform as { translateX: number }[])[0].translateX;
};

beforeEach(() => {
  useTuner().mockReset();
  useTuner().mockReturnValue({ pitch: null, inTune: false, status: 'listening' });
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
});

test('silence shows only the empty lens: no note, no disc, no instructions', async () => {
  const screen = await render(<TunerScreen />);
  expect(screen.getByTestId('tuner-horizon')).toBeTruthy();
  expect(screen.queryByTestId('tuner-disc')).toBeNull();
  expect(screen.getByLabelText('No pitch')).toBeTruthy();
  expect(screen.getByLabelText('Listening for a note')).toBeTruthy();
  for (const clutter of ['A4', 'Play a note', 'Instrument key', 'cents', 'Piano, flute, oboe, bassoon, trombone, tuba']) {
    expect(screen.queryByText(clutter)).toBeNull();
  }
});

test('a flat pitch shows the written note, quiet cents, and a disc left of the ring', async () => {
  useTuner().mockReturnValue(hear('B♭3', -12));
  const screen = await render(<TunerScreen />);
  expect(screen.getByLabelText('B♭3')).toBeTruthy();
  expect(screen.getByLabelText('12 cents flat')).toBeTruthy();
  expect(screen.getByLabelText('12 cents flat')).toHaveTextContent('−12');
  expect(discShift(screen)).toBeLessThan(0);
});

test('a sharp pitch slides the disc right of the ring', async () => {
  useTuner().mockReturnValue(hear('A4', 20));
  const screen = await render(<TunerScreen />);
  expect(screen.getByLabelText('20 cents sharp')).toHaveTextContent('+20');
  expect(discShift(screen)).toBeGreaterThan(0);
});

test('in tune, the disc sits exactly in the ring and the readout says so', async () => {
  useTuner().mockReturnValue(hear('A4', 2));
  const screen = await render(<TunerScreen />);
  expect(screen.getByLabelText('In tune')).toBeTruthy();
  expect(screen.queryByText('+2')).toBeNull();
  expect(discShift(screen)).toBe(0);
});

test('the lock holds through small wobbles and releases once the pitch drifts away', async () => {
  useTuner().mockReturnValue(hear('A4', 1));
  const screen = await render(<TunerScreen />);
  expect(screen.getByLabelText('In tune')).toBeTruthy();
  useTuner().mockReturnValue(hear('A4', 5));
  await act(async () => screen.rerender(<TunerScreen />));
  expect(screen.getByLabelText('In tune')).toBeTruthy();
  useTuner().mockReturnValue(hear('A4', 9));
  await act(async () => screen.rerender(<TunerScreen />));
  expect(screen.getByLabelText('9 cents sharp')).toHaveTextContent('+9');
});

test('farther off moves the disc farther, with more resolution near zero', () => {
  expect(lensOffset(0, 300)).toBe(0);
  expect(lensOffset(-10, 300)).toBe(-lensOffset(10, 300));
  expect(lensOffset(25, 300)).toBeGreaterThan(lensOffset(10, 300));
  expect(lensOffset(50, 300)).toBeLessThan(300);
  expect(lensOffset(5, 300)).toBeGreaterThan(300 * 0.5 * 0.1);
});

test('denied microphone has one honest line, a Settings action, and no note', async () => {
  useTuner().mockReturnValue({ pitch: null, inTune: false, status: 'denied' });
  const screen = await render(<TunerScreen />);
  expect(screen.getByText('Microphone access is off')).toBeTruthy();
  expect(screen.getByLabelText('Open microphone settings')).toBeTruthy();
  expect(screen.getByTestId('tuner-horizon')).toBeTruthy();
  expect(screen.queryByTestId('tuner-disc')).toBeNull();
});

test('an unavailable microphone says so', async () => {
  useTuner().mockReturnValue({ pitch: null, inTune: false, status: 'unavailable' });
  const screen = await render(<TunerScreen />);
  expect(screen.getByText('Microphone unavailable')).toBeTruthy();
  expect(screen.getByLabelText('Open microphone settings')).toBeTruthy();
});

test('the transposition control offers Concert, B♭, E♭ and F', async () => {
  const screen = await render(<TunerScreen />);
  expect(screen.getByTestId('transposition-picker')).toBeTruthy();
  for (const option of ['Concert', 'B♭', 'E♭', 'F']) expect(screen.getByText(option)).toBeTruthy();
  expect(screen.getByTestId('transposition-picker').props.selection).toBe('concert');
});

test('choosing an instrument key is saved', async () => {
  const screen = await render(<TunerScreen />);
  await act(async () => fireEvent(screen.getByTestId('transposition-picker'), 'selectionChange', 'bb'));
  expect(getPreferences().transposition).toBe('bb');
  expect(screen.getByTestId('transposition-picker').props.selection).toBe('bb');
  await act(async () => savePreferences({ transposition: 'concert' }));
});
