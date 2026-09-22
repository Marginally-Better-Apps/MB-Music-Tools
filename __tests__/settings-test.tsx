import { fireEvent, render } from '@testing-library/react-native';
import { SettingsSheet } from '@/components/settings-sheet';
import { getPreferences } from '@/lib/preferences';
jest.mock('expo-glass-effect', () => ({ GlassView: jest.requireActual('react-native').View }));

test('opens settings, changes appearance, and exposes repository and licenses', async () => {
  const screen = await render(<SettingsSheet />);
  await fireEvent.press(screen.getByLabelText('Settings'));
  await fireEvent.press(screen.getByLabelText('Dark appearance'));
  expect(getPreferences().appearance).toBe('dark');
  expect(screen.getByText('GitHub')).toBeTruthy();
  await fireEvent.press(screen.getByText('Open source'));
  expect(screen.getByText('Bravura')).toBeTruthy();
  expect(screen.getByText('React Native')).toBeTruthy();
});
