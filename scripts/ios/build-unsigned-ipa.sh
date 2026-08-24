#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
artifact_dir="${ARTIFACT_DIR:-$project_root/artifacts}"
derived_data="${DERIVED_DATA_PATH:-$project_root/build/ios-device}"

cd "$project_root"
mkdir -p "$artifact_dir"

if [[ ! -d ios ]]; then
  bash scripts/ios/prepare-native.sh
fi

workspace="$(find ios -maxdepth 1 -name '*.xcworkspace' -print -quit)"
scheme="$(basename "$workspace" .xcworkspace)"

xcodebuild \
  -workspace "$workspace" \
  -scheme "$scheme" \
  -configuration Release \
  -sdk iphoneos \
  -destination 'generic/platform=iOS' \
  -derivedDataPath "$derived_data" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY='' \
  build

app_path="$(find "$derived_data/Build/Products/Release-iphoneos" -maxdepth 1 -name '*.app' -print -quit)"

if [[ -z "$app_path" ]]; then
  echo "No unsigned iOS app was produced." >&2
  exit 1
fi

package_dir="$(mktemp -d)"
trap 'rm -rf "$package_dir"' EXIT
mkdir -p "$package_dir/Payload"
ditto "$app_path" "$package_dir/Payload/$(basename "$app_path")"

ipa_path="$artifact_dir/MB-Music-Tools-unsigned.ipa"
(
  cd "$package_dir"
  zip -qry "$ipa_path" Payload
)

echo "$ipa_path"
