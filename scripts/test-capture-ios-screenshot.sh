#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_DIR="$(mktemp -d)"
TEST_BIN="$TEST_DIR/bin"
TEST_LOG="$TEST_DIR/events.log"
TEST_SCREENSHOT="$TEST_DIR/review.png"

cleanup() {
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

mkdir -p "$TEST_BIN"
export TEST_LOG ROOT_DIR

cat > "$TEST_BIN/java" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

cat > "$TEST_BIN/open" <<'EOF'
#!/usr/bin/env bash
exit 0
EOF

cat > "$TEST_BIN/maestro" <<'EOF'
#!/usr/bin/env bash
echo maestro >> "$TEST_LOG"
output_dir=""
screenshot_name=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --test-output-dir)
      output_dir="$2"
      shift 2
      ;;
    -e)
      screenshot_name="${2#REVIEW_SCREENSHOT=}"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done
mkdir -p "$output_dir"
printf png > "$output_dir/${screenshot_name}.png"
exit 0
EOF

cat > "$TEST_BIN/xcodebuild" <<'EOF'
#!/usr/bin/env bash
echo build >> "$TEST_LOG"
mkdir -p "$ROOT_DIR/DerivedData/Screenshot/Build/Products/Release-iphonesimulator/MarginallyBetterMusicTools.app"
exit 0
EOF

cat > "$TEST_BIN/xcrun" <<'EOF'
#!/usr/bin/env bash
if [[ "$*" == "simctl list devices available --json" ]]; then
  cat <<'JSON'
{"devices":{"com.apple.CoreSimulator.SimRuntime.iOS-26-5":[{"name":"iPhone 17 Pro","udid":"TEST-DEVICE","state":"Shutdown","isAvailable":true}]}}
JSON
elif [[ " $* " == *" simctl install "* ]]; then
  echo install >> "$TEST_LOG"
fi
exit 0
EOF

chmod +x "$TEST_BIN"/*

PATH="$TEST_BIN:/usr/bin:/bin" \
  "$ROOT_DIR/scripts/capture-ios-screenshot.sh" \
  "$ROOT_DIR/e2e/click-rhythm-review.yaml" \
  "$TEST_SCREENSHOT" \
  iPhone >/dev/null

actual="$(grep -E '^(build|install|maestro)$' "$TEST_LOG" | paste -sd ' ' -)"
expected="build install maestro"

if [[ "$actual" != "$expected" ]]; then
  echo "expected: $expected" >&2
  echo "actual:   $actual" >&2
  exit 1
fi

test -s "$TEST_SCREENSHOT"
grep -q 'takeScreenshot:.*REVIEW_SCREENSHOT' "$ROOT_DIR/e2e/click-rhythm-review.yaml"
echo "capture-ios-screenshot ordering passed"
