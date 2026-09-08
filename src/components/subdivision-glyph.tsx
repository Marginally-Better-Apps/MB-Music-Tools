import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { getSubdivisionNoteUnit, Subdivision } from '@/lib/subdivision';

const NOTE_SPACING = 20;

type SubdivisionGlyphProps = {
  beatUnit: number;
  subdivision: Subdivision;
};

export function SubdivisionGlyph({ beatUnit, subdivision }: SubdivisionGlyphProps) {
  const theme = useTheme();
  const noteCount = subdivision;
  const noteUnit = getSubdivisionNoteUnit(subdivision, beatUnit);
  const isWholeNote = noteUnit === 1;
  const isOpenNote = noteUnit <= 2;
  const beamCount = noteCount > 1 && noteUnit >= 8
    ? Math.min(3, Math.log2(noteUnit / 4))
    : 0;
  const width = noteCount === 1 ? 34 : (noteCount - 1) * NOTE_SPACING + 34;

  return (
    <View
      accessible={false}
      style={[styles.frame, { width }]}
      testID={`subdivision-glyph-${subdivision}`}>
      {subdivision === 3 && (
        <ThemedText style={[styles.triplet, { left: width / 2 - 5 }]}>3</ThemedText>
      )}
      {Array.from({ length: noteCount }, (_, index) => {
        const left = index * NOTE_SPACING;
        return (
          <Fragment key={index}>
            <View
              style={[
                styles.head,
                isWholeNote && styles.wholeHead,
                {
                  left,
                  backgroundColor: isOpenNote ? 'transparent' : theme.text,
                  borderColor: theme.text,
                },
              ]}
            />
            {!isWholeNote && (
              <View
                style={[
                  styles.stem,
                  { left: left + 20, backgroundColor: theme.text },
                ]}
              />
            )}
          </Fragment>
        );
      })}
      {Array.from({ length: beamCount }, (_, index) => (
        <View
          key={index}
          style={[
            styles.beam,
            {
              backgroundColor: theme.text,
              left: 20,
              top: 17 + index * 7,
              width: (noteCount - 1) * NOTE_SPACING + 3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 58,
  },
  triplet: {
    position: 'absolute',
    top: -7,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 18,
  },
  head: {
    position: 'absolute',
    bottom: 2,
    width: 22,
    height: 14,
    borderRadius: 10,
    borderWidth: 3,
    transform: [{ rotate: '-18deg' }],
  },
  wholeHead: {
    bottom: 17,
    width: 30,
    height: 17,
  },
  stem: {
    position: 'absolute',
    bottom: 10,
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  beam: {
    position: 'absolute',
    height: 4,
    borderRadius: 2,
  },
});
