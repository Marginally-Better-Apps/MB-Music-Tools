import { useState } from 'react';
import { Image as ReactNativeImage, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { SymbolView } from 'expo-symbols';
import { GlassView } from 'expo-glass-effect';
import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  LabeledContent,
  Link,
  List,
  NavigationDestination,
  NavigationLink,
  NavigationStack,
  Picker,
  ScrollView,
  Section,
  Spacer,
  Text,
  Toolbar,
  VStack,
} from '@expo/ui/swift-ui';
import {
  accessibilityLabel,
  clipShape,
  font,
  frame,
  foregroundStyle,
  labelsHidden,
  listRowBackground,
  navigationTitle,
  padding,
  pickerStyle,
  resizable,
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
                <Section>
                  <HStack modifiers={[listRowBackground('clear')]}>
                    <Spacer />
                    <VStack spacing={8} modifiers={[padding({ vertical: 8 })]}>
                      <Image
                        uiImage={ReactNativeImage.resolveAssetSource(require('../../assets/images/icon.png')).uri}
                        modifiers={[resizable(), frame({ width: 76, height: 76 }), clipShape('roundedRectangle', 17)]}
                      />
                      <Text modifiers={[font({ size: 20, weight: 'bold' })]}>MB Music Tools</Text>
                      <Text modifiers={[foregroundStyle({ type: 'hierarchical', style: 'secondary' })]}>Free tools for band practice</Text>
                    </VStack>
                    <Spacer />
                  </HStack>
                </Section>
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
                  <LabeledContent label="Name">
                      <Text>MB Music Tools</Text>
                  </LabeledContent>
                  <LabeledContent label="Version">
                      <Text>{Constants.expoConfig?.version ?? '1.0.0'}</Text>
                  </LabeledContent>
                  <LabeledContent label="Build">
                      <Text>{Constants.platform?.ios?.buildNumber ?? Constants.expoConfig?.ios?.buildNumber ?? '1'}</Text>
                  </LabeledContent>
                  <Link destination={REPOSITORY_URL} label="View on GitHub" />
                  <NavigationLink value="licenses">
                      <Text>Open Source Licenses</Text>
                  </NavigationLink>
                  <NavigationLink value="privacy">
                      <Text>Privacy Policy</Text>
                  </NavigationLink>
                  <Link destination={`${REPOSITORY_URL}/issues`} label="Help and Feedback" />
                </Section>
              </Form>
              <Toolbar.Content>
                <Button modifiers={[accessibilityLabel('Close settings')]} onPress={close} role="close" />
              </Toolbar.Content>
            </Toolbar>
            <NavigationDestination value="licenses">
              <List modifiers={[navigationTitle('Open Source Licenses')]}>
                {licenses.map((license, index) => (
                  <NavigationLink key={`${license.name}-${index}`} value={`license-${index}`}>
                      <Text>{license.name}</Text>
                  </NavigationLink>
                ))}
              </List>
            </NavigationDestination>
            <NavigationDestination value="privacy">
              <ScrollView modifiers={[navigationTitle('Privacy Policy')]}>
                <Text modifiers={[padding({ all: 20 }), textSelection(true)]}>
                  {'The tuner processes microphone audio on your device to measure pitch. Audio is not recorded, saved, or uploaded. Microphone access stops when you leave the tuner or put the app in the background.\n\nTempo, time signature, click rhythm, transposition, and appearance preferences are saved on your device. Delete the app to remove these preferences. Device backups may retain app settings under your Apple backup settings.\n\nMB Music Tools has no accounts, ads, purchases, analytics SDKs, or tracking. We do not collect your microphone audio or practice activity.\n\nOpening GitHub links connects to GitHub, which has its own privacy policy. Feedback posted to GitHub issues is public. Apple may share diagnostic reports according to your device settings. TestFlight beta testing is covered by Apple\'s TestFlight privacy policy.\n\nFor privacy questions, use Help and Feedback. Do not post sensitive information in public issues.\n\nUpdated October 9, 2026.'}
                </Text>
              </ScrollView>
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
