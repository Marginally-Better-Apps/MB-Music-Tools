import { render } from '@testing-library/react-native';

import HomeScreen from '@/app/index';

jest.mock('@/components/animated-icon', () => ({
  AnimatedIcon: () => null,
  AnimatedSplashOverlay: () => null,
}));

jest.mock('@/components/web-badge', () => ({
  WebBadge: () => null,
}));

jest.mock('expo-device', () => ({
  isDevice: false,
}));

describe('<HomeScreen />', () => {
  test('renders the Expo starter welcome and onboarding hints', async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText('Welcome to Expo')).toBeTruthy();
    expect(getByText('Try editing')).toBeTruthy();
    expect(getByText('Fresh start')).toBeTruthy();
  });
});
