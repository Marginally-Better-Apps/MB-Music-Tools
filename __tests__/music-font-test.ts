import appJson from '../app.json';

const fs = require('fs') as {
  existsSync: (path: string) => boolean;
};
const { join } = require('path') as {
  join: (...parts: string[]) => string;
};

describe('music notation font', () => {
  test('embeds the Bravura Text SMuFL font and its license', () => {
    const fontPath = './assets/fonts/BravuraText.otf';
    const fontPlugin = appJson.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-font'
    );

    expect(fontPlugin).toEqual(['expo-font', { fonts: [fontPath] }]);
    expect(fs.existsSync(join(process.cwd(), fontPath))).toBe(true);
    expect(fs.existsSync(join(process.cwd(), 'assets/fonts/Bravura-OFL.txt'))).toBe(true);
  });
});
