import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** How far the disc slides away from the ring, as a share of the lens diameter, at ±50 cents. */
const MAX_SHIFT = 0.5;

/**
 * Sounding cents become a horizontal disc offset: flat slides left, sharp slides right.
 * The curve is steeper near zero so the last few cents are still easy to see.
 */
export function lensOffset(cents: number, diameter: number) {
  const amount = Math.min(Math.abs(cents), 50) / 50;
  return Math.sign(cents) * diameter * MAX_SHIFT * amount ** 0.7;
}

type TunerLensProps = {
  pitch: { note: string; cents: number } | null;
  locked: boolean;
  reduceMotion: boolean;
  diameter: number;
};

/**
 * One element: a fixed ring (the target) and a solid disc (your pitch).
 * The disc drifts left when flat and right when sharp. In tune it drops
 * into the ring and the two become one solid, green lens.
 */
export function TunerLens({ pitch, locked, reduceMotion, diameter }: TunerLensProps) {
  const theme = useTheme();
  const target = pitch && !locked ? lensOffset(pitch.cents, diameter) : 0;
  const [shift] = useState(() => new Animated.Value(target));
  const [counterShift] = useState(() => Animated.multiply(shift, -1));
  useEffect(() => {
    if (reduceMotion) { shift.setValue(target); return; }
    const animation = Animated.spring(shift, { toValue: target, stiffness: 140, damping: 22, mass: 1, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [reduceMotion, shift, target]);

  const cents = pitch?.cents ?? 0;
  const description = !pitch ? 'Listening for a note' : locked ? 'In tune' : `${Math.abs(cents)} cents ${cents < 0 ? 'flat' : 'sharp'}`;
  const signed = pitch && !locked ? `${cents > 0 ? '+' : cents < 0 ? '−' : ''}${Math.abs(cents)}` : '';
  const size = { width: diameter, height: diameter, borderRadius: diameter / 2 };
  const noteSize = Math.round(diameter * 0.36);
  const readout = (color: string, secondary: string, hidden: boolean) => <View style={styles.readout} accessibilityElementsHidden={hidden} importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}>
    <ThemedText testID={hidden ? undefined : 'tuner-note'} accessibilityLabel={hidden ? undefined : pitch?.note ?? 'No pitch'} style={[styles.note, { color, fontSize: noteSize, lineHeight: Math.round(noteSize * 1.15), letterSpacing: -noteSize * 0.04 }]}>{pitch?.note ?? ''}</ThemedText>
    <ThemedText accessibilityLabel={hidden ? undefined : description} style={[styles.cents, { color: secondary }]}>{signed}</ThemedText>
  </View>;

  return <View testID="tuner-horizon" style={size}>
    <View style={[StyleSheet.absoluteFill, size, styles.ring, { borderColor: pitch ? theme.textSecondary : theme.backgroundSelected }]} />
    {readout(theme.text, theme.textSecondary, false)}
    {pitch && <Animated.View testID="tuner-disc" style={[StyleSheet.absoluteFill, size, styles.disc, { backgroundColor: locked ? theme.success : theme.text, transform: [{ translateX: shift }] }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: counterShift }] }]}>
        {readout(locked ? theme.tunerOnLock : theme.background, locked ? theme.tunerOnLock : theme.background, true)}
      </Animated.View>
    </Animated.View>}
  </View>;
}

const styles = StyleSheet.create({
  ring: { borderWidth: 2.5 },
  disc: { overflow: 'hidden', pointerEvents: 'none' },
  readout: { ...StyleSheet.absoluteFill, pointerEvents: 'none', alignItems: 'center', justifyContent: 'center', paddingTop: 28 },
  note: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  cents: { fontSize: 22, lineHeight: 28, minHeight: 28, fontWeight: '500', fontVariant: ['tabular-nums'] },
});
