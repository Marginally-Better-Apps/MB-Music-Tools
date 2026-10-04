import { useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { SymbolView } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import {
  Button,
  Form,
  Host,
  LabeledContent,
  Link,
  List,
  NavigationDestination,
  NavigationLink,
  NavigationStack,
  Picker,
  ScrollView,
  Section,
  Text,
  Toolbar,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  font,
  foregroundStyle,
  labelsHidden,
  navigationTitle,
  padding,
  pickerStyle,
  tag,
  textSelection,
} from '@expo/ui/swift-ui/modifiers';

import { useTheme } from '@/hooks/use-theme';
import { Preferences, savePreferences, usePreferences } from '@/lib/preferences';
import licenses from '@/constants/licenses.json';

const REPOSITORY_URL = 'https://github.com/Marginally-Better-Apps/MB-Music-Tools';
const APPEARANCES: { value: Preferences['appearance']; label: string; accessibility: string }[] = [
  { value: 'system', label: 'Automatic', accessibility: 'System appearance' },
  { value: 'light', label: 'Light', accessibility: 'Light appearance' },
  { value: 'dark', label: 'Dark', accessibility: 'Dark appearance' },
];

export function SettingsSheet() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { appearance } = usePreferences();
  const [visible, setVisible] = useState(false);
  const [path, setPath] = useState<string[]>([]);
  const close = () => {
    setVisible(false);
    setPath([]);
  };

  return (
    <>
      <Pressable
        accessibilityLabel="Settings"
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={[styles.gear, { top: insets.top + 8 }]}>
        <GlassView isInteractive style={styles.glass}>
          <SymbolView name="gearshape" tintColor={theme.text} size={22} />
        </GlassView>
      </Pressable>
      <Modal animationType="slide" onRequestClose={close} presentationStyle="pageSheet" visible={visible}>
        <Host colorScheme={appearance === 'system' ? undefined : appearance} style={styles.host}>
          <NavigationStack onPathChange={setPath} path={path}>
            <Toolbar>
              <Form modifiers={[navigationTitle('Settings')]}>
                <Section title="Appearance">
                  <Picker
                    label="Appearance"
                    modifiers={[pickerStyle('segmented'), labelsHidden()]}
                    onSelectionChange={(mode: Preferences['appearance']) => savePreferences({ appearance: mode })}
                    selection={appearance}
                    testID="appearance-picker">
                    {APPEARANCES.map((option) => (
                      <Text key={option.value} modifiers={[tag(option.value), accessibilityLabel(option.accessibility)]}>
                        {option.label}
                      </Text>
                    ))}
                  </Picker>
                </Section>
                <Section footer={<Text>Free and open source, made for musicians.</Text>} title="About">
                  <LabeledContent label="Version">
                    <Text>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
                  </LabeledContent>
                  <Link destination={REPOSITORY_URL} label="Source Code" />
                  <NavigationLink value="licenses">
                    <Text>Acknowledgements</Text>
                  </NavigationLink>
                </Section>
              </Form>
              <Toolbar.Content>
                <Button modifiers={[accessibilityLabel('Close settings')]} onPress={close} role="close" />
              </Toolbar.Content>
            </Toolbar>
            <NavigationDestination value="licenses">
              <List modifiers={[navigationTitle('Acknowledgements')]}>
                {licenses.map((license, index) => (
                  <NavigationLink key={`${license.name}-${index}`} value={`license-${index}`}>
                    <Text>{license.name}</Text>
                  </NavigationLink>
                ))}
              </List>
            </NavigationDestination>
            {path
              .filter((value) => value.startsWith('license-'))
              .map((value) => {
                const license = licenses[Number(value.slice('license-'.length))];
                return (
                  <NavigationDestination key={value} value={value}>
                    <ScrollView modifiers={[navigationTitle(license?.name ?? '')]}>
                      <Text
                        modifiers={[
                          font({ size: 13, design: 'monospaced' }),
                          foregroundStyle({ type: 'hierarchical', style: 'secondary' }),
                          textSelection(true),
                          padding({ all: 20 }),
                        ]}>
                        {license?.text ?? ''}
                      </Text>
                    </ScrollView>
                  </NavigationDestination>
                );
              })}
          </NavigationStack>
        </Host>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  gear: { position: 'absolute', right: 20, zIndex: 5 },
  glass: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  host: { flex: 1 },
});
