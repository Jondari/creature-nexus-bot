#!/usr/bin/env bash
set -euo pipefail

# Dossier racine d’images à optimiser (modifiable via 1er arg)
ROOT="${1:-assets/images}"

# Réglages PNG (≈ équivalent expo-optimize --quality 70)
PNG_Q_MIN="${PNG_Q_MIN:-0.65}"
PNG_Q_MAX="${PNG_Q_MAX:-0.80}"
PNG_SPEED="${PNG_SPEED:-1}"

echo "🔧 Optimizing PNG under: $ROOT"
echo "   quality: $PNG_Q_MIN..$PNG_Q_MAX, speed: $PNG_SPEED"

# - Traite racine + sous-dossiers
# - Réécrit chaque fichier dans SON dossier (préserve l’arbo)
# - NUL-delimited pour gérer les espaces dans les noms
found=0
while IFS= read -r -d '' f; do
  found=1
  outdir="$(dirname "$f")"
  npx imagemin "$f" \
    --plugin=pngquant \
    --plugin.pngquant.quality="$PNG_Q_MIN" \
    --plugin.pngquant.quality="$PNG_Q_MAX" \
    --plugin.pngquant.speed="$PNG_SPEED" \
    --out-dir="$outdir" \
    --verbose
done < <(find "$ROOT" -type f \( -iname '*.png' -o -iname '*.PNG' \) -print0)

if [ "$found" -eq 0 ]; then
  echo "ℹ️  Aucun PNG trouvé sous $ROOT"
fi

# (Optionnel) Active aussi JPG/JPEG si tu en ajoutes plus tard
if [ "${OPTIMIZE_JPEG:-1}" = "1" ]; then
  echo "🔧 Optimizing JPEG under: $ROOT (mozjpeg q=70)"
  while IFS= read -r -d '' f; do
    outdir="$(dirname "$f")"
    npx imagemin "$f" \
      --plugin=mozjpeg \
      --plugin.mozjpeg.quality=70 \
      --plugin.mozjpeg.progressive \
      --out-dir="$outdir" \
      --verbose
  done < <(find "$ROOT" -type f \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.JPG' -o -iname '*.JPEG' \) -print0)
fi

echo "✅ Image optimization done."