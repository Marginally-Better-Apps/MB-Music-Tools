import {
  Image as ReactNativeImage,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import { Host, Image, Picker } from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  aspectRatio,
  controlSize,
  frame,
  pickerStyle,
  resizable,
  tag,
} from '@expo/ui/swift-ui/modifiers';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { ClickRhythm, CLICK_RHYTHMS } from '@/lib/click-rhythm';

const NOTE_ICONS: Record<
  ClickRhythm,
  { dark: ImageSourcePropType; light: ImageSourcePropType }
> = {
  whole: {
    light: require('../../assets/images/note-rhythms/whole-light.png'),
    dark: require('../../assets/images/note-rhythms/whole-dark.png'),
  },
  half: {
    light: require('../../assets/images/note-rhythms/half-light.png'),
    dark: require('../../assets/images/note-rhythms/half-dark.png'),
  },
  quarter: {
    light: require('../../assets/images/note-rhythms/quarter-light.png'),
    dark: require('../../assets/images/note-rhythms/quarter-dark.png'),
  },
  eighth: {
    light: require('../../assets/images/note-rhythms/eighth-light.png'),
    dark: require('../../assets/images/note-rhythms/eighth-dark.png'),
  },
  triplet: {
    light: require('../../assets/images/note-rhythms/triplet-light.png'),
    dark: require('../../assets/images/note-rhythms/triplet-dark.png'),
  },
  sixteenth: {
    light: require('../../assets/images/note-rhythms/sixteenth-light.png'),
    dark: require('../../assets/images/note-rhythms/sixteenth-dark.png'),
  },
};

/** About 50pt per note: snug around each glyph instead of stretched across the screen. */
const PICKER_WIDTH = 300;

type ClickRhythmPickerProps = {
  onChange: (rhythm: ClickRhythm) => void;
  value: ClickRhythm;
};

export function ClickRhythmPicker({ onChange, value }: ClickRhythmPickerProps) {
  const theme = useTheme();
  const palette = useColorScheme() === 'dark' ? 'dark' : 'light';

  return (
    <View style={styles.shell} testID="click-rhythm-picker">
      <Host seedColor={theme.accent} style={styles.host}>
        <Picker
          label="Click rhythm"
          modifiers={[pickerStyle('segmented'), controlSize('large'), frame({ width: PICKER_WIDTH })]}
          onSelectionChange={onChange}
          selection={value}
          testID="native-click-rhythm-picker">
          {CLICK_RHYTHMS.map((option) => (
            <Image
              key={option.id}
              uiImage={ReactNativeImage.resolveAssetSource(NOTE_ICONS[option.id][palette]).uri}
              modifiers={[
                tag(option.id),
                accessibilityLabel(`${option.label} click rhythm`),
                resizable(),
                aspectRatio({ contentMode: 'fit' }),
                frame({ width: 24, height: 30 }),
              ]}
            />
          ))}
        </Picker>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  // The native control keeps its natural width so the note glyphs are never stretched.
  shell: {
    width: '100%',
    height: 56,
    alignItems: 'center',
  },
  host: {
    width: PICKER_WIDTH,
    height: 56,
  },
});
