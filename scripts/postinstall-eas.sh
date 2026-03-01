#!/usr/bin/env bash
set -euo pipefail

#!/usr/bin/env bash
set -euo pipefail

# Normalise la variable (retire \r éventuels, trim, passe en minuscule)
raw="${EAS_BUILD_PROFILE:-}"
profile="$(printf '%s' "$raw" | tr -d '\r' | tr '[:upper:]' '[:lower:]' | xargs)"

echo "[postinstall] Detected EAS_BUILD_PROFILE='${raw}' (normalized='${profile}')"

case "$profile" in
  production|preview|preview-store)
    echo "✅ Optimize images for profile: $profile"
    bash scripts/optimize-images.sh
    ;;
  *)
    echo "⏭️  Skip image optimize for profile: $profile"
    ;;
esac