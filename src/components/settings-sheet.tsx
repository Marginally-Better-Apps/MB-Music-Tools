import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { savePreferences, usePreferences } from '@/lib/preferences';
import licenses from '@/constants/licenses.json';

export function SettingsSheet() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { appearance } = usePreferences();
  const [visible, setVisible] = useState(false);
  const [credits, setCredits] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const close = () => { setVisible(false); setCredits(false); setExpanded(null); };
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => setVisible(true)} style={[styles.gear, { top: insets.top + 8 }]}>
      <GlassView isInteractive style={styles.glass}>
        <SymbolView name="gearshape" tintColor={theme.text} size={22} />
      </GlassView>
    </Pressable>
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={[styles.sheet, { backgroundColor: theme.background }]}>
        <View style={styles.toolbar}>
          {credits && <Pressable accessibilityLabel="Back to settings" accessibilityRole="button" onPress={() => setCredits(false)} style={styles.close}>
            <SymbolView name="chevron.left" tintColor={theme.text} size={22} />
          </Pressable>}
          <Pressable accessibilityLabel="Close settings" accessibilityRole="button" onPress={close} style={[styles.close, { marginLeft: 'auto' }]}>
            <GlassView isInteractive style={styles.glass}><SymbolView name="xmark" tintColor={theme.text} size={19} /></GlassView>
          </Pressable>
        </View>
        {credits ? <ScrollView contentContainerStyle={styles.content}>
          {licenses.map(license => <View key={license.name}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: expanded === license.name }} onPress={() => setExpanded(expanded === license.name ? null : license.name)} style={[styles.row, { borderBottomColor: theme.backgroundSelected }]}>
              <ThemedText style={{ flex: 1 }}>{license.name}</ThemedText>
              <SymbolView name={expanded === license.name ? 'chevron.up' : 'chevron.down'} tintColor={theme.textSecondary} size={14} />
            </Pressable>
            {expanded === license.name && <ThemedText selectable style={styles.license}>{license.text}</ThemedText>}
          </View>)}
        </ScrollView> : <View style={styles.content}>
          <GlassView style={styles.appearances}>
            {(['system', 'light', 'dark'] as const).map(mode => <Pressable key={mode} accessibilityRole="button" accessibilityLabel={`${mode[0].toUpperCase() + mode.slice(1)} appearance`} accessibilityState={{ selected: appearance === mode }} onPress={() => savePreferences({ appearance: mode })} style={[styles.mode, appearance === mode && { backgroundColor: theme.backgroundSelected }]}>
              <SymbolView name={mode === 'system' ? 'circle.lefthalf.filled' : mode === 'light' ? 'sun.max' : 'moon'} tintColor={theme.text} size={25} />
            </Pressable>)}
          </GlassView>
          <View style={[styles.links, { backgroundColor: theme.backgroundElement }]}>
            <Pressable accessibilityRole="link" onPress={() => { void Linking.openURL('https://github.com/Marginally-Better-Apps/MB-Music-Tools'); }} style={styles.row}>
              <SymbolView name="chevron.left.forwardslash.chevron.right" tintColor={theme.text} size={20} />
              <ThemedText style={styles.linkText}>GitHub</ThemedText>
              <SymbolView name="arrow.up.right" tintColor={theme.textSecondary} size={16} />
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setCredits(true)} style={styles.row}>
              <SymbolView name="curlybraces" tintColor={theme.text} size={20} />
              <ThemedText style={styles.linkText}>Open source</ThemedText>
              <SymbolView name="chevron.right" tintColor={theme.textSecondary} size={14} />
            </Pressable>
          </View>
        </View>}
      </SafeAreaView>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  gear: { position: 'absolute', top: 8, right: 20, zIndex: 5 },
  glass: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sheet: { flex: 1 },
  toolbar: { flexDirection: 'row', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingBottom: 32, width: '100%', maxWidth: 600, alignSelf: 'center' },
  appearances: { flexDirection: 'row', padding: 5, borderRadius: 32, marginBottom: 32 },
  mode: { flex: 1, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 27 },
  links: { borderRadius: 24, overflow: 'hidden' },
  row: { minHeight: 64, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent' },
  linkText: { flex: 1, fontSize: 18 },
  license: { fontSize: 13, lineHeight: 19, padding: 16, fontWeight: '400' },
});
