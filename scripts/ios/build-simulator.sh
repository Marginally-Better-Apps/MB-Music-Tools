#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
derived_data="${DERIVED_DATA_PATH:-$project_root/build/ios-simulator}"

cd "$project_root"

if [[ ! -d ios ]]; then
  bash scripts/ios/prepare-native.sh
fi

workspace="$(find ios -maxdepth 1 -name '*.xcworkspace' -print -quit)"
scheme="$(basename "$workspace" .xcworkspace)"

xcodebuild \
  -workspace "$workspace" \
  -scheme "$scheme" \
  -configuration Release \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath "$derived_data" \
  CODE_SIGNING_ALLOWED=NO \
  build

app_path="$(find "$derived_data/Build/Products/Release-iphonesimulator" -maxdepth 1 -name '*.app' -print -quit)"

if [[ -z "$app_path" ]]; then
  echo "No iOS simulator app was produced." >&2
  exit 1
fi

echo "$app_path"
