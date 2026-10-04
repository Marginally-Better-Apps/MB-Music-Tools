import { fireEvent, render } from '@testing-library/react-native';
import { SettingsSheet } from '@/components/settings-sheet';
import { getPreferences } from '@/lib/preferences';
jest.mock('expo-glass-effect', () => ({ GlassView: jest.requireActual('react-native').View }));
jest.mock('@expo/ui/swift-ui', () => {
  const React = jest.requireActual('react');
  const { Pressable, Text: NativeText, View } = jest.requireActual('react-native');
  type MockProps = { children?: React.ReactNode; modifiers?: { $type: string; label?: string; title?: string }[] };
  const container = ({ children, modifiers = [] }: MockProps) => {
    const title = modifiers.find(({ $type }) => $type === 'navigationTitle')?.title;
    return React.createElement(View, null, title ? React.createElement(NativeText, null, title) : null, children);
  };
  const Toolbar = Object.assign(container, { Content: container });
  return {
    Host: container,
    Form: container,
    List: container,
    ScrollView: container,
    Toolbar,
    Section: ({ children, title }: MockProps & { title?: string }) =>
      React.createElement(View, null, React.createElement(NativeText, null, title), children),
    LabeledContent: ({ children, label }: MockProps & { label: string }) =>
      React.createElement(View, null, React.createElement(NativeText, null, label), children),
    Text: ({ children, modifiers = [] }: MockProps) =>
      React.createElement(
        NativeText,
        { accessibilityLabel: modifiers.find(({ $type }) => $type === 'accessibilityLabel')?.label },
        children
      ),
    Picker: ({ children, onSelectionChange, selection, testID }: MockProps & { onSelectionChange: (value: string) => void; selection: string; testID: string }) =>
      React.createElement(View, { onSelectionChange, selection, testID }, children),
    Link: ({ destination, label }: { destination: string; label: string }) =>
      React.createElement(NativeText, { accessibilityRole: 'link', href: destination }, label),
    Button: ({ modifiers = [], onPress }: MockProps & { onPress: () => void }) =>
      React.createElement(Pressable, {
        accessibilityLabel: modifiers.find(({ $type }) => $type === 'accessibilityLabel')?.label,
        onPress,
      }),
    NavigationStack: ({ children, onPathChange, path }: MockProps & { onPathChange: (path: string[]) => void; path: string[] }) =>
      React.createElement(View, { onPathChange, path, testID: 'settings-stack' }, children),
    NavigationLink: ({ children, value }: MockProps & { value: string }) =>
      React.createElement(Pressable, { testID: `link-${value}` }, children),
    NavigationDestination: ({ children, value }: MockProps & { value: string }) =>
      React.createElement(View, { testID: `destination-${value}` }, children),
  };
});

test('opens native settings, changes appearance, and links source code and acknowledgements', async () => {
  const screen = await render(<SettingsSheet />);
  await fireEvent.press(screen.getByLabelText('Settings'));
  expect(screen.getByText('Settings')).toBeTruthy();
  expect(screen.getByLabelText('Dark appearance')).toBeTruthy();

  await fireEvent(screen.getByTestId('appearance-picker'), 'selectionChange', 'dark');
  expect(getPreferences().appearance).toBe('dark');
  expect(screen.getByTestId('appearance-picker').props.selection).toBe('dark');

  expect(screen.getByText('Version')).toBeTruthy();
  expect(screen.getByText('Source Code').props.href).toBe('https://github.com/Marginally-Better-Apps/MB-Music-Tools');
  expect(screen.getByTestId('link-licenses')).toBeTruthy();
  expect(screen.getByText('Bravura')).toBeTruthy();
  expect(screen.getByText('React Native')).toBeTruthy();
});

test('builds a license page only when it is pushed', async () => {
  const screen = await render(<SettingsSheet />);
  await fireEvent.press(screen.getByLabelText('Settings'));
  expect(screen.queryByTestId('destination-license-0')).toBeNull();

  await fireEvent(screen.getByTestId('settings-stack'), 'pathChange', ['licenses', 'license-0']);
  expect(screen.getByTestId('destination-license-0')).toBeTruthy();
  expect(screen.getAllByText('Bravura').length).toBeGreaterThan(1);

  await fireEvent.press(screen.getByLabelText('Close settings'));
  expect(screen.queryByText('Acknowledgements')).toBeNull();
});
