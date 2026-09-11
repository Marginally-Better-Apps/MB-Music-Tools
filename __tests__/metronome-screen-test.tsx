import { act, fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import MetronomeScreen from '@/app/metronome';

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

  return {
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
  pickerStyle: (style: string) => ({ type: 'pickerStyle', style }),
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
    expect(getByLabelText('Beats per measure, 4')).toBeTruthy();
    expect(getByLabelText('Note type, quarter note')).toBeTruthy();
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
    await fireEvent(getByLabelText('Beats per measure, 4'), 'onAccessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });
    expect(getByLabelText('Beats per measure, 3')).toBeTruthy();
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

  test('creates an uncommon 7/8 meter with seven dots', async () => {
    const { getAllByTestId, getByLabelText, queryAllByTestId } = await render(
      <MetronomeScreen />
    );

    for (let step = 0; step < 3; step += 1) {
      await fireEvent(getByLabelText(`Beats per measure, ${step + 4}`), 'onAccessibilityAction', {
        nativeEvent: { actionName: 'increment' },
      });
    }
    await fireEvent(getByLabelText('Note type, quarter note'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });

    expect(getByLabelText('Beats per measure, 7')).toBeTruthy();
    expect(getByLabelText('Note type, eighth note')).toBeTruthy();
    expect(queryAllByTestId(/note-value-glyph/)).toHaveLength(0);
    expect(getAllByTestId('beat-dot')).toHaveLength(7);
  });

  test('keeps all 32 beat dots at the custom-meter upper bound', async () => {
    const { getAllByTestId, getByLabelText } = await render(<MetronomeScreen />);

    for (let step = 0; step < 28; step += 1) {
      await fireEvent(
        getByLabelText(`Beats per measure, ${step + 4}`),
        'onAccessibilityAction',
        { nativeEvent: { actionName: 'increment' } }
      );
    }

    expect(getByLabelText('Beats per measure, 32')).toBeTruthy();
    expect(getAllByTestId('beat-dot')).toHaveLength(32);
  });

  test('shows only bare meter numbers with no cards, labels, or instructions', async () => {
    const { queryAllByTestId, queryByText } = await render(<MetronomeScreen />);

    expect(queryByText('Time signature')).toBeNull();
    expect(queryByText('Drag numbers')).toBeNull();
    expect(queryByText('BEATS')).toBeNull();
    expect(queryByText('NOTE VALUE')).toBeNull();
    expect(queryAllByTestId('meter-scrubber-glass')).toHaveLength(0);
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
    expect(getByLabelText('Note type, quarter note')).toBeTruthy();

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
      expect(StyleSheet.flatten(dot.props.style).transform).toBeUndefined();
      expect(dot.props.glassEffectStyle).toBe('clear');
      expect(dot.props.isInteractive).toBe(true);
    }
  });

  test('places the click-rhythm pill below the Play button', async () => {
    const { toJSON } = await render(<MetronomeScreen />);
    const tree = JSON.stringify(toJSON());
    const playIndex = tree.indexOf('playback-glass');
    const rhythmIndex = tree.indexOf('click-rhythm-picker');

    expect(playIndex).toBeGreaterThanOrEqual(0);
    expect(rhythmIndex).toBeGreaterThan(playIndex);
  });

  test('removes tempo steppers and Tap so Play is the only bottom control', async () => {
    const { getByTestId, queryByLabelText, queryByText } = await render(<MetronomeScreen />);

    expect(queryByLabelText('Increase tempo')).toBeNull();
    expect(queryByLabelText('Decrease tempo')).toBeNull();
    expect(queryByLabelText('Tap tempo')).toBeNull();
    expect(queryByText('Tap')).toBeNull();
    expect(getByTestId('playback-glass').props.glassEffectStyle).toBe('regular');
  });

  test('repeated taps on the large tempo number set the measured BPM', async () => {
    jest.useFakeTimers();
    let timestamp = 0;
    const now = jest.spyOn(Date, 'now').mockImplementation(() => timestamp);
    const { getByLabelText, getByText } = await render(<MetronomeScreen />);

    for (timestamp of [0, 690, 1380]) {
      await fireEvent(getByLabelText('Tempo, 120 BPM'), 'accessibilityAction', {
        nativeEvent: { actionName: 'activate' },
      });
      expect(getByText('120')).toBeTruthy();
    }

    timestamp = 2070;
    await fireEvent(getByLabelText('Tempo, 120 BPM'), 'accessibilityAction', {
      nativeEvent: { actionName: 'activate' },
    });
    expect(getByText('120')).toBeTruthy();

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
  });
});
