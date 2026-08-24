import appJson from '../app.json';
import iconComposer from '../assets/expo.icon/icon.json';

const EXPO_STARTER_ICON_SHA256 =
  '7a667804bb80a6a424a5daf18a2599c4f32237cf06fe78fc0de45dbb09e0eccf';
const EXPO_STARTER_SPLASH_SHA256 =
  '27b060a757a29038c9618586baa0ba3894dbe60d084c6059df497ff429c2d92f';
const EXPO_BLUE = '#208aef';

type Hash = {
  update: (data: string | Uint8Array) => Hash;
  digest: (encoding: 'hex') => string;
};

const fs = require('fs') as {
  existsSync: (path: string) => boolean;
  readdirSync: (
    path: string,
    options: { withFileTypes: true }
  ) => Array<{ name: string; isDirectory: () => boolean }>;
  readFileSync: (path: string, encoding?: 'utf8') => string | Uint8Array;
};
const { createHash } = require('crypto') as {
  createHash: (algorithm: string) => Hash;
};
const { join } = require('path') as {
  join: (...parts: string[]) => string;
};

const root = process.cwd();

function sha256File(path: string) {
  return createHash('sha256').update(fs.readFileSync(path) as Uint8Array).digest('hex');
}

function splashPluginConfig() {
  const splash = appJson.expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-splash-screen'
  );
  if (!Array.isArray(splash) || splash[1] == null || typeof splash[1] !== 'object') {
    throw new Error('app.json is missing the expo-splash-screen plugin');
  }
  return splash[1] as Record<string, unknown>;
}

function walkSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkSourceFiles(path);
    }
    return ['.ts', '.tsx', '.css'].some((suffix) => entry.name.endsWith(suffix)) ? [path] : [];
  });
}

describe('app icon and splash branding', () => {
  test('home screen raster icon is not the Expo starter mark', () => {
    const iconPath = join(root, appJson.expo.icon);
    expect(fs.existsSync(iconPath)).toBe(true);
    expect(sha256File(iconPath)).not.toBe(EXPO_STARTER_ICON_SHA256);
  });

  test('launch screen is not Expo blue with the Expo splash glyph', () => {
    const splash = splashPluginConfig();
    expect(String(splash.backgroundColor).toLowerCase()).not.toBe(EXPO_BLUE);

    const splashImage = join(root, String(splash.image));
    expect(fs.existsSync(splashImage)).toBe(true);
    expect(sha256File(splashImage)).not.toBe(EXPO_STARTER_SPLASH_SHA256);
  });

  test('iPhone and iPad share Icon Composer and splash plugin assets', () => {
    const splash = splashPluginConfig();
    expect(appJson.expo.ios.icon).toMatch(/\.icon$/);
    expect(appJson.expo.ios.supportsTablet).toBe(true);

    const iconJson = JSON.stringify(iconComposer);
    expect(iconJson).not.toMatch(/expo-symbol/i);
    expect(iconJson).not.toContain('0.47843');

    const assetNames = fs
      .readdirSync(join(root, appJson.expo.ios.icon, 'Assets'), { withFileTypes: true })
      .map((entry) => entry.name);
    expect(assetNames.some((name) => /expo/i.test(name))).toBe(false);
    expect(splash.ios).toBeUndefined();
    expect(splash.android).toBeUndefined();
  });

  test('JS launch overlay does not keep the Expo glyph or Expo blue', () => {
    for (const file of walkSourceFiles(join(root, 'src'))) {
      const source = fs.readFileSync(file, 'utf8') as string;
      expect(`${file}: ${source}`).not.toMatch(/#208AEF/i);
      expect(`${file}: ${source}`).not.toMatch(/expo-logo/i);
    }
  });
});
