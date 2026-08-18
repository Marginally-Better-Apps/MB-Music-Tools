import { render } from '@testing-library/react-native';

import MetronomeScreen from '@/app/metronome';

describe('<MetronomeScreen />', () => {
  test('renders a quiet instrument empty state without Expo starter copy', async () => {
    const { getByText, queryByText } = await render(<MetronomeScreen />);

    expect(getByText('Metronome')).toBeTruthy();
    expect(getByText('Set a tempo when you are ready.')).toBeTruthy();
    expect(queryByText('Explore')).toBeNull();
    expect(queryByText('File-based routing')).toBeNull();
    expect(queryByText('Expo documentation')).toBeNull();
  });
});
