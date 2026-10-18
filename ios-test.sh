#!/usr/bin/env bash
# Gala Engine test gate: type correctness and the Jest suite.
set -euo pipefail

source scripts/gala-prepare.sh
install_js_dependencies

npm run typecheck
npx jest --runInBand --testTimeout=60000
