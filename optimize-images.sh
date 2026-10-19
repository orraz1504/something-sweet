#!/usr/bin/env bash
# ממיר תמונות JPG/PNG מהתיקייה images/originals לפורמט WebP (רוחב מקסימלי 1200px)
# ושומר אותן ב-images/products עם אותו שם קובץ
# (חוץ מהתמונה הראשית והמארזים – hero, box-medium, box-large – שנשמרות ב-images/site).
# אופציונלי לגמרי – האתר עובד גם בלי זה.
#
# שימוש:   bash optimize-images.sh
# דרישות:  cwebp  (brew install webp)   או   ImageMagick  (brew install imagemagick)
#
# טיפ: תנו לקבצים המקוריים את השם הנכון מראש, למשל tricolad.jpg -> tricolad.webp

set -euo pipefail
cd "$(dirname "$0")"

SRC="images/originals"
OUT="images/products"
MAX=1200
QUALITY=80

mkdir -p "$OUT"
shopt -s nullglob nocaseglob

if command -v cwebp >/dev/null 2>&1; then TOOL=cwebp
elif command -v magick >/dev/null 2>&1; then TOOL=magick
elif command -v convert >/dev/null 2>&1; then TOOL=convert
else
  echo "לא נמצא cwebp או ImageMagick. התקינו:  brew install webp" >&2
  exit 1
fi

count=0
for f in "$SRC"/*.jpg "$SRC"/*.jpeg "$SRC"/*.png; do
  name="$(basename "${f%.*}")"
  case "$name" in
    hero|box-medium|box-large) dest="images/site/$name.webp" ;;
    *) dest="$OUT/$name.webp" ;;
  esac
  if [ "$TOOL" = cwebp ]; then
    # -resize W 0 keeps aspect ratio; only shrink images wider than MAX
    width=$(sips -g pixelWidth "$f" 2>/dev/null | awk '/pixelWidth/{print $2}' || true)
    if [ -n "${width:-}" ] && [ "$width" -gt "$MAX" ]; then
      cwebp -quiet -q "$QUALITY" -resize "$MAX" 0 "$f" -o "$dest"
    else
      cwebp -quiet -q "$QUALITY" "$f" -o "$dest"
    fi
  else
    "$TOOL" "$f" -auto-orient -resize "${MAX}x>" -quality "$QUALITY" "$dest"
  fi
  echo "✓ $dest"
  count=$((count + 1))
done

echo "הומרו $count תמונות."
