#!/usr/bin/env bash
# Gala Engine recipe: builds an unsigned Release device IPA; Gala signs and publishes it.
set -euo pipefail

: "${GALA_BUILD_DIR:?Gala Engine sets this}"
: "${GALA_ARTIFACT_DIR:?Gala Engine sets this}"

source scripts/gala-prepare.sh
install_js_dependencies
prebuild_ios

ARCHIVE="$GALA_BUILD_DIR/MBMusicTools.xcarchive"
rm -rf "$ARCHIVE"
RCT_NO_LAUNCH_PACKAGER=1 xcodebuild archive -quiet \
  -workspace ios/MBMusicTools.xcworkspace \
  -scheme MBMusicTools \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE" \
  -derivedDataPath "$GALA_BUILD_DIR/DerivedData" \
  -jobs "${GALA_JOBS:-2}" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  DEVELOPMENT_TEAM=""

IPA="$GALA_ARTIFACT_DIR/MB-Music-Tools-unsigned.ipa"
scripts/package-ipa.sh "$ARCHIVE" "$IPA"
scripts/assert-embedded-bundle.sh "$IPA"
shasum -a 256 "$IPA"
