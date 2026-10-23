#!/usr/bin/env bash
# Ship from this computer instead of GitHub Actions on every push: run every check here before pushing.
#
#   npm run ship              run every check
#   npm run ship -- --checks  only the checks (before pushing, or to try a Dependabot update)
#
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
only_checks=""; [ "${1:-}" = "--checks" ] && only_checks=1

step() { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }

step "Install"; npm ci
step "Icon checks"; npm run check
step "Typecheck"; npm run typecheck
step "Build"; npm run build

echo; echo "✓ All checks passed. To publish to npm: Actions → Release → Run workflow (see .github/workflows/release.yml)."
