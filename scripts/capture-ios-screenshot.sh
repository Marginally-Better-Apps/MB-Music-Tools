#!/usr/bin/env bash
# Build, drive, and capture a review state from one exact iOS Simulator.
# Usage: ./scripts/capture-ios-screenshot.sh [e2e/flow.yaml] [artifacts/review.png] [iPhone|iPad]
set -euo pipefail

FLOW="${1:-e2e/click-rhythm-review.yaml}"
OUTPUT="${2:-artifacts/ios-review.png}"
DEVICE_FAMILY="${3:-iPhone}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DERIVED_DATA="${ROOT_DIR}/DerivedData/Screenshot"
WORKSPACE="${ROOT_DIR}/ios/MarginallyBetterMusicTools.xcworkspace"
SCHEME="MarginallyBetterMusicTools"

for tool in maestro xcodebuild xcrun; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "error: $tool is required" >&2
    exit 1
  fi
done

if ! java -version >/dev/null 2>&1; then
  echo "error: a Java runtime is required by Maestro" >&2
  exit 1
fi

cd "$ROOT_DIR"
if [[ -n "${SIMULATOR_UDID:-}" ]]; then
  DEVICE_ID="$SIMULATOR_UDID"
  echo "Using requested Simulator $DEVICE_ID" >&2
else
  DEVICE_ID="$(./scripts/select-simulator.py "$DEVICE_FAMILY")"
fi

if [[ ! -d "$WORKSPACE" ]]; then
  CI=1 npx expo prebuild --platform ios
fi

xcrun simctl boot "$DEVICE_ID" 2>/dev/null || true
xcrun simctl bootstatus "$DEVICE_ID" -b
open -a Simulator --args -CurrentDeviceUDID "$DEVICE_ID"

FORCE_BUNDLING=1 RCT_NO_LAUNCH_PACKAGER=1 xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "platform=iOS Simulator,id=${DEVICE_ID}" \
  -derivedDataPath "$DERIVED_DATA" \
  CODE_SIGNING_ALLOWED=NO \
  build

APP_PATH="$(find "$DERIVED_DATA/Build/Products" -path "*iphonesimulator/${SCHEME}.app" -type d | head -1)"
if [[ -z "$APP_PATH" ]]; then
  echo "error: ${SCHEME}.app was not produced" >&2
  exit 1
fi

xcrun simctl install "$DEVICE_ID" "$APP_PATH"

CAPTURE_DIR="$(mktemp -d "${TMPDIR:-/tmp}/music-tools-screenshot.XXXXXX")"
cleanup() {
  status=$?
  if [[ $status -eq 0 ]]; then
    rm -rf "$CAPTURE_DIR"
  else
    echo "Screenshot diagnostics preserved at $CAPTURE_DIR" >&2
  fi
}
trap cleanup EXIT

maestro test \
  --device "$DEVICE_ID" \
  --test-output-dir "$CAPTURE_DIR" \
  -e REVIEW_SCREENSHOT=review \
  "$FLOW"

mkdir -p "$(dirname "$OUTPUT")"
CAPTURED_SCREENSHOT="$(find "$CAPTURE_DIR" -type f -name review.png -print -quit)"
if [[ -z "$CAPTURED_SCREENSHOT" ]]; then
  echo "error: Maestro did not produce review.png" >&2
  exit 1
fi
cp "$CAPTURED_SCREENSHOT" "$OUTPUT"
test -s "$OUTPUT"
echo "Screenshot saved to $OUTPUT"
