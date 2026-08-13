import { render } from '@testing-library/react-native';

import TunerScreen from '@/app/index';

describe('<TunerScreen />', () => {
  test('renders a quiet instrument empty state without Expo starter copy', async () => {
    const { getByText, queryByText } = await render(<TunerScreen />);

    expect(getByText('Tuner')).toBeTruthy();
    expect(getByText('Play a note when you are ready.')).toBeTruthy();
    expect(queryByText('Welcome to Expo')).toBeNull();
    expect(queryByText('Try editing')).toBeNull();
    expect(queryByText('Fresh start')).toBeNull();
  });
});
