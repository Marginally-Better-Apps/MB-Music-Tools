#!/usr/bin/env bash
set -euo pipefail
TEST_DIR="$(mktemp -d)"
trap 'rm -rf "$TEST_DIR"' EXIT
cp scripts/test-pitch-detector.swift "$TEST_DIR/main.swift"
swiftc -O modules/native-metronome/ios/PitchDetector.swift "$TEST_DIR/main.swift" -o "$TEST_DIR/pitch-tests"
"$TEST_DIR/pitch-tests"
