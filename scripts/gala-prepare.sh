#!/usr/bin/env bash
# Shared setup for the Gala Engine recipes. Gala's Mac mirror skips gitignored
# node_modules/ and ios/, so install JS dependencies and prebuild on the Mac.
: "${GALA_BUILD_DIR:?Gala Engine sets this}"

export PATH="/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
export npm_config_cache="$GALA_BUILD_DIR/npm-cache"
export CP_HOME_DIR="$GALA_BUILD_DIR/cocoapods"

install_js_dependencies() {
  local stamp
  stamp="$(shasum -a 256 package-lock.json | cut -d' ' -f1)"
  if [[ ! -d node_modules || "$(cat node_modules/.gala-lock 2>/dev/null)" != "$stamp" ]]; then
    npm ci --no-audit --no-fund
    echo "$stamp" > node_modules/.gala-lock
  fi
}

prebuild_ios() {
  local stamp
  stamp="$(cat package-lock.json app.json | shasum -a 256 | cut -d' ' -f1)-$(find plugins modules -type f -print0 | sort -z | xargs -0 shasum -a 256 | shasum -a 256 | cut -d' ' -f1)"
  if [[ ! -f ios/MBMusicTools.xcworkspace/contents.xcworkspacedata || "$(cat ios/.gala-prebuild 2>/dev/null)" != "$stamp" ]]; then
    CI=1 npx expo prebuild --platform ios --clean
    echo "$stamp" > ios/.gala-prebuild
  fi
}
