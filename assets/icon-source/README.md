# App icon source

The metronome silhouette comes from Phosphor Icons, under the MIT license. The full notice is in LICENSE and in Settings > Open Source Licenses > Phosphor Icons.

Upstream commit: 2b75f3ad12b420c9504ef05df8d2564a28f8500e

Original: https://github.com/phosphor-icons/core/blob/2b75f3ad12b420c9504ef05df8d2564a28f8500e/assets/fill/metronome-fill.svg

The adaptation scales and recolors the silhouette on the app's blue background. The iOS Icon Composer asset, raster fallback, Settings header, and launch image use the same mark.

To regenerate the raster assets without adding a runtime dependency:

```sh
npm install --prefix /tmp/mb-icon-tools @resvg/resvg-js
node scripts/generate-app-icon.cjs /tmp/mb-icon-tools/node_modules/@resvg/resvg-js
```

Icon Composer uses the foreground SVG directly and adds the native glass treatment. The splash PNG has a transparent background.
