#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
artifact_dir="${ARTIFACT_DIR:-$project_root/artifacts}"
video_path="$artifact_dir/e2e-demo.mp4"
maestro_output_dir=''
compressed_video=''

cleanup() {
  if [[ -n "$maestro_output_dir" && "$maestro_output_dir" == "$artifact_dir"/maestro-output.* ]]; then
    rm -rf -- "$maestro_output_dir"
  fi
  if [[ -n "$compressed_video" && "$compressed_video" == "$artifact_dir"/e2e-demo.*.mp4 ]]; then
    rm -f -- "$compressed_video"
  fi
}

trap cleanup EXIT

cd "$project_root"
mkdir -p "$artifact_dir"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro is required. Install version 2.8.0 from https://docs.maestro.dev/getting-started/installing-maestro" >&2
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "FFmpeg and FFprobe are required to normalize and validate the acceptance recording." >&2
  exit 1
fi

if [[ -z "${JAVA_HOME:-}" ]] && command -v brew >/dev/null 2>&1 && brew --prefix openjdk@21 >/dev/null 2>&1; then
  export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

if [[ -n "${E2E_APP_PATH:-}" ]]; then
  app_path="$E2E_APP_PATH"
else
  bash scripts/ios/prepare-native.sh
  app_path="$(bash scripts/ios/build-simulator.sh | tail -1)"
fi

if [[ ! -d "$app_path" ]]; then
  echo "The iOS simulator app does not exist: $app_path" >&2
  exit 1
fi

device_id="$(xcrun simctl list devices booted -j | jq -r '[.devices[][] | select(.isAvailable and (.name | startswith("iPhone")))] | first | .udid // empty')"

if [[ -z "$device_id" ]]; then
  device_id="$(xcrun simctl list devices available -j | jq -r '[.devices[][] | select(.isAvailable and (.name | startswith("iPhone")))] | first | .udid // empty')"
fi

if [[ -z "$device_id" ]]; then
  echo "No available iPhone simulator was found." >&2
  exit 1
fi

xcrun simctl boot "$device_id" 2>/dev/null || true
xcrun simctl bootstatus "$device_id" -b
xcrun simctl install "$device_id" "$app_path"

# Fresh GitHub-hosted simulators can take several minutes to finish bringing up
# XCTest after simctl reports that booting and data migration are complete.
export MAESTRO_DRIVER_STARTUP_TIMEOUT="${MAESTRO_DRIVER_STARTUP_TIMEOUT:-300000}"
rm -f -- "$video_path"
maestro_output_dir="$(mktemp -d "$artifact_dir/maestro-output.XXXXXX")"
maestro_log="$maestro_output_dir/maestro.log"

# Recording starts and stops inside the Maestro flow. Driver startup, app reset,
# and CLI teardown therefore stay outside the public demo.
if maestro --device "$device_id" test --test-output-dir "$maestro_output_dir" .maestro/smoke.yaml 2>&1 | tee "$maestro_log"; then
  :
elif grep -Fq 'iOS driver not ready in time' "$maestro_log"; then
  echo "Maestro driver startup failed once; retrying on the booted simulator." >&2
  cleanup
  maestro_output_dir="$(mktemp -d "$artifact_dir/maestro-output.XXXXXX")"
  maestro --device "$device_id" test --test-output-dir "$maestro_output_dir" .maestro/smoke.yaml
else
  exit 1
fi

raw_video="$(find "$maestro_output_dir" -type f -name 'e2e-demo-raw*.mp4' -print -quit)"
if [[ -z "$raw_video" || ! -s "$raw_video" ]]; then
  echo "Maestro did not produce the bounded acceptance recording." >&2
  exit 1
fi

# Maestro's recorder can spend several seconds showing the ready screen while
# its encoder starts. Detect that initial frozen segment instead of assuming a
# runner-specific delay, and retain half a second of context before the first tap.
freeze_log="$maestro_output_dir/freeze.log"
ffmpeg \
  -hide_banner \
  -i "$raw_video" \
  -vf 'freezedetect=n=0.01:d=2' \
  -an \
  -f null \
  - 2>"$freeze_log" || true
initial_freeze_end="$(awk '
  /freeze_start: 0([.]0*)?$/ { starts_at_zero = 1; next }
  starts_at_zero && /freeze_end:/ { print $NF; exit }
' "$freeze_log")"
trim_start="$(awk -v freeze_end="${initial_freeze_end:-0}" 'BEGIN {
  start = freeze_end - 0.5
  if (start < 0) start = 0
  printf "%.3f", start
}')"
raw_duration="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$raw_video")"
remaining_after_trim="$(awk -v duration="$raw_duration" -v start="$trim_start" 'BEGIN { printf "%.3f", duration - start }')"
if ! awk -v remaining="$remaining_after_trim" 'BEGIN { exit !(remaining >= 3) }'; then
  # Quiet empty states look frozen to the detector. Keep the Maestro bounds.
  trim_start=0
fi

compressed_video="$(mktemp "$artifact_dir/e2e-demo.XXXXXX.mp4")"
ffmpeg \
  -v error \
  -ss "$trim_start" \
  -i "$raw_video" \
  -vf 'fps=30,scale=440:-2' \
  -c:v libx264 \
  -preset medium \
  -crf 28 \
  -maxrate 400k \
  -bufsize 800k \
  -an \
  -movflags +faststart \
  -y \
  "$compressed_video"
mv "$compressed_video" "$video_path"
compressed_video=''

video_duration="$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$video_path")"
if ! awk -v duration="$video_duration" 'BEGIN { exit !(duration >= 3 && duration <= 45) }'; then
  echo "The acceptance recording duration is outside the expected 3-45 second range: ${video_duration}s." >&2
  exit 1
fi

video_size="$(stat -f '%z' "$video_path")"
if (( video_size >= 1048576 )); then
  echo "The acceptance recording is too large for Planista: ${video_size} bytes." >&2
  exit 1
fi

echo "$video_path"
