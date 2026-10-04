import { defaults, savePreferences } from '@/lib/preferences';
beforeEach(() => savePreferences(defaults));
import { act, fireEvent, render } from '@testing-library/react-native';
import { Animated, StyleSheet } from 'react-native';

import MetronomeScreen from '@/app/metronome';
import { BeatPulse } from '@/components/metronome-beat';

jest.mock('@/components/settings-sheet', () => ({ SettingsSheet: () => null }));

jest.mock('@/native/metronome', () => ({
  NativeMetronome: {
    start: jest.fn(),
    stop: jest.fn(),
    setTempo: jest.fn(),
    setTimeSignature: jest.fn(),
    setClickRate: jest.fn(),
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

jest.mock('@expo/ui/swift-ui', () => {
  const React = jest.requireActual('react');
  const { Text: NativeText, View } = jest.requireActual('react-native');

  const Stack = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, null, children);

  return {
    BottomSheet: ({ children, isPresented }: { children: React.ReactNode; isPresented: boolean }) =>
      isPresented ? React.createElement(View, { testID: 'meter-sheet' }, children) : null,
    Button: ({ onPress }: { onPress: () => void }) =>
      React.createElement(jest.requireActual('react-native').Pressable, { accessibilityLabel: 'Done', onPress }),
    HStack: Stack,
    Spacer: () => null,
    VStack: Stack,
    ZStack: Stack,
    Host: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
    Image: ({ modifiers = [], ...props }: { modifiers?: { type: string; label?: string }[] }) =>
      React.createElement(View, {
        ...props,
        accessibilityLabel: modifiers.find(({ type }) => type === 'accessibilityLabel')?.label,
        modifiers,
        testID: 'click-rhythm-option',
      }),
    Picker: ({ children, ...props }: { children: React.ReactNode }) =>
      React.createElement(View, props, children),
    Text: ({
      children,
      modifiers = [],
      ...props
    }: {
      children: React.ReactNode;
      modifiers?: { type: string; label?: string }[];
    }) => {
      const tagged = modifiers.some(({ type }) => type === 'tag');
      return React.createElement(
        NativeText,
        {
          ...props,
          accessibilityLabel: modifiers.find(({ type }) => type === 'accessibilityLabel')?.label,
          modifiers,
          testID: tagged ? 'click-rhythm-text-option' : undefined,
        },
        children
      );
    },
  };
});

jest.mock('@expo/ui/swift-ui/modifiers', () => ({
  accessibilityLabel: (label: string) => ({ type: 'accessibilityLabel', label }),
  aspectRatio: (configuration: object) => ({ type: 'aspectRatio', ...configuration }),
  controlSize: (size: string) => ({ type: 'controlSize', size }),
  font: (configuration: object) => ({ type: 'font', ...configuration }),
  frame: (configuration: object) => ({ type: 'frame', ...configuration }),
  padding: (configuration: object) => ({ type: 'padding', ...configuration }),
  pickerStyle: (style: string) => ({ type: 'pickerStyle', style }),
  presentationDetents: (detents: object[]) => ({ type: 'presentationDetents', detents }),
  presentationDragIndicator: (visibility: string) => ({ type: 'presentationDragIndicator', visibility }),
  resizable: () => ({ type: 'resizable' }),
  tag: (value: string) => ({ type: 'tag', value }),
}));

describe('<MetronomeScreen />', () => {
  test('shows a large default tempo and a play control a stranger can find', async () => {
    const { getByLabelText, getByTestId, getByText, queryByText } = await render(
      <MetronomeScreen />
    );

    expect(getByText('120')).toBeTruthy();
    expect(getByLabelText('Tempo, 120 BPM')).toBeTruthy();
    expect(getByLabelText('Start metronome')).toBeTruthy();
    expect(queryByText('Set a tempo when you are ready.')).toBeNull();
    expect(queryByText('Explore')).toBeNull();
    expect(getByLabelText('Tap tempo')).toBeTruthy();
    expect(getByLabelText('4/4 time').props.accessibilityState).toMatchObject({ selected: true });
    expect(getByLabelText('Quarter click rhythm')).toBeTruthy();
    expect(getByTestId('click-rhythm-picker')).toBeTruthy();
    expect(getByTestId('native-click-rhythm-picker').props.selection).toBe('quarter');
  });

  test('builds 3/4, shows three beat dots, and makes beat one distinct without a label', async () => {
    const nativeMetronome = jest.requireMock('@/native/metronome').NativeMetronome;
    let beatListener:
      | ((event: { beat: number; phase: number; phaseCount: number }) => void)
      | undefined;
    nativeMetronome.addListener.mockImplementation(
      (
        _eventName: string,
        listener: (event: { beat: number; phase: number; phaseCount: number }) => void
      ) => {
        beatListener = listener;
        return { remove: jest.fn() };
      }
    );
    const { getAllByTestId, getByLabelText, queryByText } = await render(
      <MetronomeScreen />
    );

    expect(getAllByTestId('beat-dot')).toHaveLength(4);
    await fireEvent.press(getByLabelText('3/4 time'));
    expect(getByLabelText('3/4 time').props.accessibilityState).toMatchObject({ selected: true });
    expect(getAllByTestId('beat-dot')).toHaveLength(3);

    await fireEvent.press(getByLabelText('Start metronome'));
    await act(async () => {
      beatListener?.({ beat: 1, phase: 1, phaseCount: 1 });
    });

    expect(queryByText('Downbeat')).toBeNull();
    expect(queryByText('Beat 1 of 3')).toBeNull();
    expect(getByLabelText('Metronome beat').props.accessibilityValue).toEqual({
      text: 'Beat 1 of 3, 3/4',
    });
  });

  test('start marks the beat as playing and stop returns it to rest', async () => {
    const { getByLabelText, getAllByTestId, queryByLabelText } = await render(<MetronomeScreen />);

    expect(getByLabelText('Metronome beat').props.accessibilityValue).toEqual({
      text: 'Stopped, 4/4',
    });
    expect(getAllByTestId('beat-dot')).toHaveLength(4);
    expect(queryByLabelText('Beat marks at rest')).toBeNull();

    await fireEvent.press(getByLabelText('Start metronome'));
    expect(getByLabelText('Stop metronome')).toBeTruthy();
    expect(getByLabelText('Metronome beat').props.accessibilityValue).toEqual({
      text: 'Waiting for beat 1, 4/4',
    });

    await fireEvent.press(getByLabelText('Stop metronome'));
    expect(getByLabelText('Start metronome')).toBeTruthy();
    expect(getByLabelText('Metronome beat').props.accessibilityValue).toEqual({
      text: 'Stopped, 4/4',
    });
  });

  test('creates an uncommon 7/8 meter from the custom sheet with seven dots', async () => {
    const { getAllByTestId, getByLabelText, getByTestId, queryByTestId } = await render(
      <MetronomeScreen />
    );

    expect(queryByTestId('meter-sheet')).toBeNull();
    await fireEvent.press(getByLabelText('Custom time'));
    expect(getByTestId('meter-sheet')).toBeTruthy();
    await fireEvent(getByTestId('meter-beats-wheel'), 'selectionChange', 7);
    await fireEvent(getByTestId('meter-unit-wheel'), 'selectionChange', 8);

    expect(getByTestId('meter-beats-wheel').props.selection).toBe(7);
    expect(getByTestId('meter-unit-wheel').props.selection).toBe(8);
    expect(getByLabelText('Custom time, 7/8').props.accessibilityState).toMatchObject({ selected: true });
    expect(getAllByTestId('beat-dot')).toHaveLength(7);

    await fireEvent.press(getByLabelText('Done'));
    expect(queryByTestId('meter-sheet')).toBeNull();
  });

  test('opens the custom sheet over the screen without moving the controls below it', async () => {
    const { getByLabelText, getByTestId } = await render(<MetronomeScreen />);

    await fireEvent.press(getByLabelText('Custom time'));
    expect(getByTestId('meter-sheet')).toBeTruthy();
    expect(StyleSheet.flatten(getByTestId('meter-sheet-host').props.style)).toMatchObject({
      position: 'absolute',
      width: 0,
      height: 0,
    });
  });

  test('keeps all 32 beat dots at the custom-meter upper bound', async () => {
    const { getAllByTestId, getByLabelText, getByTestId } = await render(<MetronomeScreen />);

    await fireEvent.press(getByLabelText('Custom time'));
    await fireEvent(getByTestId('meter-beats-wheel'), 'selectionChange', 32);

    expect(getByLabelText('Custom time, 32/4')).toBeTruthy();
    expect(getAllByTestId('beat-dot')).toHaveLength(32);
  });

  test('labels the two control groups and shows no extra explanatory text', async () => {
    const { getByText, queryByText } = await render(<MetronomeScreen />);

    expect(getByText('Time signature')).toBeTruthy();
    expect(getByText('Clicks')).toBeTruthy();
    for (const text of ['Allegro', 'Beats per minute', '1 click per beat', 'Tap 3 more times']) {
      expect(queryByText(text)).toBeNull();
    }
  });

  test('shows six peer rhythm icons and gives triplets three audible phases', async () => {
    const nativeMetronome = jest.requireMock('@/native/metronome').NativeMetronome;
    let beatListener:
      | ((event: { beat: number; phase: number; phaseCount: number }) => void)
      | undefined;
    nativeMetronome.addListener.mockImplementation(
      (
        _eventName: string,
        listener: (event: { beat: number; phase: number; phaseCount: number }) => void
      ) => {
        beatListener = listener;
        return { remove: jest.fn() };
      }
    );
    const { getAllByTestId, getByLabelText, getByTestId, queryAllByTestId, queryByText } = await render(
      <MetronomeScreen />
    );

    expect(getAllByTestId('click-rhythm-option')).toHaveLength(6);
    for (const label of ['Whole', 'Half', 'Quarter', 'Eighth', 'Triplet', '16th']) {
      expect(queryByText(label)).toBeNull();
    }
    expect(queryAllByTestId(/subdivision-glyph|note-value-glyph/)).toHaveLength(0);
    for (const option of getAllByTestId('click-rhythm-option', {
      includeHiddenElements: true,
    })) {
      expect(option.props.modifiers).toContainEqual({ type: 'resizable' });
      expect(option.props.modifiers).toContainEqual({
        type: 'frame',
        width: 24,
        height: 30,
      });
    }

    await fireEvent(getByTestId('native-click-rhythm-picker'), 'selectionChange', 'triplet');
    expect(getByTestId('native-click-rhythm-picker').props.selection).toBe('triplet');
    expect(getByLabelText('Triplet click rhythm')).toBeTruthy();
    expect(getByLabelText('4/4 time').props.accessibilityState).toMatchObject({ selected: true });

    await fireEvent.press(getByLabelText('Start metronome'));
    await act(async () => {
      beatListener?.({ beat: 1, phase: 1, phaseCount: 3 });
    });
    expect(getByLabelText('Metronome beat').props.accessibilityValue).toEqual({
      text: 'Beat 1 of 4, pulse 1 of 3, 4/4',
    });

    await act(async () => {
      beatListener?.({ beat: 1, phase: 3, phaseCount: 3 });
    });
    expect(getByLabelText('Metronome beat').props.accessibilityValue).toEqual({
      text: 'Beat 1 of 4, pulse 3 of 3, 4/4',
    });
  });

  test('ripples a solid pulse from the active dot on every 16th-note click', async () => {
    const nativeMetronome = jest.requireMock('@/native/metronome').NativeMetronome;
    let beatListener:
      | ((event: { beat: number; phase: number; phaseCount: number }) => void)
      | undefined;
    nativeMetronome.addListener.mockImplementation(
      (
        _eventName: string,
        listener: (event: { beat: number; phase: number; phaseCount: number }) => void
      ) => {
        beatListener = listener;
        return { remove: jest.fn() };
      }
    );
    const { getAllByTestId, getByLabelText, getByTestId } = await render(<MetronomeScreen />);

    await fireEvent(getByTestId('native-click-rhythm-picker'), 'selectionChange', 'sixteenth');
    await fireEvent.press(getByLabelText('Start metronome'));
    await act(async () => {
      beatListener?.({ beat: 2, phase: 1, phaseCount: 4 });
    });

    const pulse = StyleSheet.flatten(getByTestId('beat-pulse').props.style);
    expect(pulse.backgroundColor).toBe('#315BE8');
    expect(StyleSheet.flatten(getAllByTestId('beat-dot')[1].props.style).backgroundColor).toBe('#315BE8');
    expect(StyleSheet.flatten(getAllByTestId('beat-dot')[0].props.style).backgroundColor).toBe('#D6D8DE');
  });

  test('a newly mounted 16th-note pulse begins at resting scale', async () => {
    const timing = jest.spyOn(Animated, 'timing').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    });

    const { getByTestId } = await render(
      <BeatPulse beatPhase={4} beatPhaseCount={4} intervalMs={125} isDownbeat={false} />
    );

    expect(StyleSheet.flatten(getByTestId('beat-pulse').props.style).transform).toEqual([
      { scale: 1 },
    ]);
    timing.mockRestore();
  });

  test('keeps every resting beat dot and its layout slot exactly consistent', async () => {
    const { getAllByTestId } = await render(<MetronomeScreen />);
    const dots = getAllByTestId('beat-dot');
    const slots = getAllByTestId('beat-dot-slot');

    expect(slots).toHaveLength(4);
    for (const slot of slots) {
      expect(StyleSheet.flatten(slot.props.style)).toMatchObject({ width: 48, height: 48 });
    }
    for (const dot of dots) {
      expect(StyleSheet.flatten(dot.props.style)).toMatchObject({
        width: 36,
        height: 36,
      });
      expect(StyleSheet.flatten(dot.props.style)).toMatchObject({ backgroundColor: '#D6D8DE' });
      expect(dot.props.glassEffectStyle).toBeUndefined();
    }
    expect(getAllByTestId('downbeat-ring')).toHaveLength(1);
  });

  test('keeps Tap and Start together at the bottom, within thumb reach', async () => {
    const { toJSON } = await render(<MetronomeScreen />);
    const tree = JSON.stringify(toJSON());
    const rhythmIndex = tree.indexOf('click-rhythm-picker');
    const tapIndex = tree.indexOf('tap-glass');
    const playIndex = tree.indexOf('playback-glass');

    expect(rhythmIndex).toBeGreaterThanOrEqual(0);
    expect(tapIndex).toBeGreaterThan(rhythmIndex);
    expect(playIndex).toBeGreaterThan(tapIndex);
  });

  test('keeps the click rhythms compact and centred instead of stretching the notes across the screen', async () => {
    const { getByTestId } = await render(<MetronomeScreen />);

    expect(StyleSheet.flatten(getByTestId('click-rhythm-picker').props.style)).toMatchObject({
      alignItems: 'center',
    });
    expect(getByTestId('native-click-rhythm-picker').props.modifiers).toContainEqual({
      type: 'frame',
      width: 300,
    });
  });

  test('does not scroll while the controls fit, but still can on a screen too small for them', async () => {
    const { getByTestId } = await render(<MetronomeScreen />);
    const scroll = () => getByTestId('metronome-scroll');

    await fireEvent(scroll(), 'layout', { nativeEvent: { layout: { height: 700 } } });
    await fireEvent(scroll(), 'contentSizeChange', 390, 700);
    expect(scroll().props.scrollEnabled).toBe(false);

    await fireEvent(scroll(), 'contentSizeChange', 390, 820);
    expect(scroll().props.scrollEnabled).toBe(true);
  });

  test('four presses of the Tap button set the measured BPM', async () => {
    jest.useFakeTimers();
    let timestamp = 0;
    const now = jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
    const { getByLabelText, getByText } = await render(<MetronomeScreen />);

    for (timestamp of [0, 690, 1380]) {
      await fireEvent.press(getByLabelText('Tap tempo'));
      expect(getByText('120')).toBeTruthy();
    }

    timestamp = 2070;
    await fireEvent.press(getByLabelText('Tap tempo'));

    await act(async () => {
      jest.advanceTimersByTime(320);
    });
    expect(getByText('87')).toBeTruthy();
    expect(getByLabelText('Tempo, 87 BPM')).toBeTruthy();

    now.mockRestore();
    jest.useRealTimers();
  });

  test('exposes accessible horizontal tempo adjustment inside 30 to 300', async () => {
    const { getByLabelText, getByText } = await render(<MetronomeScreen />);

    for (let step = 0; step < 91; step += 1) {
      await fireEvent(getByLabelText(/Tempo, \d+ BPM/), 'accessibilityAction', {
        nativeEvent: { actionName: 'decrement' },
      });
    }
    expect(getByText('30')).toBeTruthy();

    await fireEvent(getByLabelText('Tempo, 30 BPM'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(getByText('30')).toBeTruthy();

    for (let step = 0; step < 271; step += 1) {
      await fireEvent(getByLabelText(/Tempo, \d+ BPM/), 'accessibilityAction', {
        nativeEvent: { actionName: 'increment' },
      });
    }
    expect(getByText('300')).toBeTruthy();

    await fireEvent(getByLabelText('Tempo, 300 BPM'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(getByText('300')).toBeTruthy();
  }, 30_000);
});
