#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
artifact_dir="${ARTIFACT_DIR:-$project_root/artifacts}"
video_path="$artifact_dir/e2e-demo.mp4"
recording_pid=''

finish_recording() {
  if [[ -n "$recording_pid" ]]; then
    kill -INT "$recording_pid" 2>/dev/null || true
    wait "$recording_pid" 2>/dev/null || true
  fi
}

trap finish_recording EXIT

cd "$project_root"
mkdir -p "$artifact_dir"

if ! command -v maestro >/dev/null 2>&1; then
  echo "Maestro is required. Install version 2.8.0 from https://docs.maestro.dev/getting-started/installing-maestro" >&2
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
maestro_log="$(mktemp)"

# Run the acceptance flow once before recording. This proves the simulator and
# XCTest driver are ready, so the public demo contains the story rather than a
# multi-minute hosted-runner startup screen.
if maestro --device "$device_id" test .maestro/smoke.yaml 2>&1 | tee "$maestro_log"; then
  :
elif grep -Fq 'iOS driver not ready in time' "$maestro_log"; then
  echo "Maestro driver startup failed once; retrying on the booted simulator." >&2
  maestro --device "$device_id" test .maestro/smoke.yaml
else
  exit 1
fi

xcrun simctl io "$device_id" recordVideo --codec=h264 --force "$video_path" &
recording_pid=$!
sleep 2

if ! kill -0 "$recording_pid" 2>/dev/null; then
  wait "$recording_pid"
  echo "The iOS simulator recorder stopped before the acceptance flow began." >&2
  exit 1
fi

maestro --device "$device_id" test .maestro/smoke.yaml

finish_recording
recording_pid=''

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "FFmpeg is required to normalize the acceptance recording for upload." >&2
  exit 1
fi

compressed_video="$(mktemp "$artifact_dir/e2e-demo.XXXXXX.mp4")"
ffmpeg \
  -v error \
  -i "$video_path" \
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

video_size="$(stat -f '%z' "$video_path")"
if (( video_size >= 1048576 )); then
  echo "The acceptance recording is too large for Planista: ${video_size} bytes." >&2
  exit 1
fi

echo "$video_path"
