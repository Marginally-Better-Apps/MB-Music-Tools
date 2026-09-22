import { render } from '@testing-library/react-native';
import TunerScreen from '@/app/index';
jest.mock('@/hooks/use-tuner', () => ({ useTuner: jest.fn(() => ({ pitch: null, inTune: false, status: 'listening' })) }));
jest.mock('@/components/settings-sheet', () => ({ SettingsSheet: () => null }));
jest.mock('@expo/ui/swift-ui', () => {
  const React = jest.requireActual('react');
  const { View, Text } = jest.requireActual('react-native');
  return { Host: View, Picker: View, Text: (props: object) => React.createElement(Text, props) };
});
jest.mock('expo-glass-effect', () => ({ GlassView: jest.requireActual('react-native').View }));

test('silence shows a settled horizon without a fake note or instructions', async () => {
  const screen = await render(<TunerScreen />);
  expect(screen.getByTestId('tuner-horizon')).toBeTruthy();
  expect(screen.queryByText('Play a note when you are ready.')).toBeNull();
  expect(screen.queryByText('A4')).toBeNull();
});
test('a detected pitch shows the written note and cents', async () => {
  jest.requireMock('@/hooks/use-tuner').useTuner.mockReturnValue({ pitch: { note: 'B♭3', cents: -12 }, inTune: false, status: 'listening' });
  const screen = await render(<TunerScreen />);
  expect(screen.getByText('B♭3')).toBeTruthy();
  expect(screen.getByText('−12')).toBeTruthy();
  expect(screen.getByLabelText('12 cents flat')).toBeTruthy();
});
test('denied microphone has an honest explanation and Settings action', async () => {
  jest.requireMock('@/hooks/use-tuner').useTuner.mockReturnValue({ pitch: null, inTune: false, status: 'denied' });
  const screen = await render(<TunerScreen />);
  expect(screen.getByText('Microphone access is off')).toBeTruthy();
  expect(screen.getByLabelText('Open microphone settings')).toBeTruthy();
});
