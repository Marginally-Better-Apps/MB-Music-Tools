import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type NoteValueGlyphProps = {
  unit: number;
};

export function NoteValueGlyph({ unit }: NoteValueGlyphProps) {
  const theme = useTheme();
  const isWholeNote = unit === 1;
  const isOpenNote = unit <= 2;
  const flagCount = unit >= 8 ? Math.log2(unit / 4) : 0;

  return (
    <View
      accessible={false}
      style={styles.frame}
      testID={`note-value-glyph-${unit}`}>
      <View
        style={[
          styles.head,
          isWholeNote && styles.wholeHead,
          {
            backgroundColor: isOpenNote ? 'transparent' : theme.text,
            borderColor: theme.text,
          },
        ]}
      />
      {!isWholeNote && (
        <View style={[styles.stem, { backgroundColor: theme.text }]} />
      )}
      {Array.from({ length: flagCount }, (_, index) => (
        <View
          key={index}
          style={[
            styles.flag,
            { backgroundColor: theme.text, top: 5 + index * 9 },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: 42,
    height: 50,
  },
  head: {
    position: 'absolute',
    left: 2,
    bottom: 3,
    width: 23,
    height: 15,
    borderRadius: 10,
    borderWidth: 3,
    transform: [{ rotate: '-18deg' }],
  },
  wholeHead: {
    left: 5,
    bottom: 17,
    width: 31,
    height: 17,
  },
  stem: {
    position: 'absolute',
    left: 23,
    bottom: 10,
    width: 3,
    height: 36,
    borderRadius: 2,
  },
  flag: {
    position: 'absolute',
    left: 24,
    width: 16,
    height: 4,
    borderRadius: 2,
    transform: [{ rotate: '25deg' }],
  },
});
