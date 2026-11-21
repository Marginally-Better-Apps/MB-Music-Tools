// Render the checked-in SVG assets. Pass a path to an installed @resvg/resvg-js
// package to keep this optional design tool out of the app's dependencies.
const fs = require('node:fs');
const path = require('node:path');
const { Resvg } = require(process.argv[2] || '@resvg/resvg-js');
const root = path.resolve(__dirname, '..');
for (const [source, destination, width] of [
  ['assets/icon-source/app-icon.svg', 'assets/images/icon.png', 1024],
  ['assets/icon-source/splash.svg', 'assets/images/splash-icon.png', 256],
]) {
  const renderer = new Resvg(fs.readFileSync(path.join(root, source)), {
    fitTo: { mode: 'width', value: width },
  });
  fs.writeFileSync(path.join(root, destination), renderer.render().asPng());
}
