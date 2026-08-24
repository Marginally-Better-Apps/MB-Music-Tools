import { render } from '@testing-library/react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import AppTabs from '@/components/app-tabs';

jest.mock('expo-router/unstable-native-tabs', () => {
  const React = require('react');
  const { Text, View } = require('react-native');

  function Trigger({ children }: { children: React.ReactNode }) {
    return <View>{children}</View>;
  }
  Trigger.Label = ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>;
  Trigger.Icon = () => null;

  const NativeTabsMock = Object.assign(
    jest.fn(({ children }: { children: React.ReactNode }) => (
      <View testID="native-tabs">{children}</View>
    )),
    { Trigger }
  );

  return { NativeTabs: NativeTabsMock };
});

const mockedNativeTabs = NativeTabs as unknown as jest.Mock;

describe('<AppTabs />', () => {
  test('uses sidebar-adaptable NativeTabs with Tuner and Metronome destinations', async () => {
    const { getByText } = await render(<AppTabs />);

    expect(mockedNativeTabs).toHaveBeenCalledWith(
      expect.objectContaining({ sidebarAdaptable: true }),
      undefined
    );
    expect(getByText('Tuner')).toBeTruthy();
    expect(getByText('Metronome')).toBeTruthy();
  });
});
