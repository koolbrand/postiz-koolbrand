#!/bin/sh
# Postiz en ESPAÑOL por defecto (14-oct-2026). Postiz elige idioma por la cookie «i18next» y, si no
# hay, por la cabecera del navegador; en la práctica salía en inglés con Chrome en es-ES. Aquí el
# idioma de reserva pasa de «en» a «es». Quien quiera otro lo elige con la bandera (pone la cookie).
set -eu
n=0
for f in $(grep -rlF '"fallbackLng",0,"en"' /app/apps/frontend/.next 2>/dev/null | grep -v '\.map$' | grep -v '/cache/'); do
  sed -i 's/"fallbackLng",0,"en"/"fallbackLng",0,"es"/g' "$f"; n=$((n+1))
done
[ "$n" -gt 0 ] || { echo 'idioma-es: no encuentro fallbackLng en el frontend'; exit 1; }
grep -rlF '"fallbackLng",0,"en"' /app/apps/frontend/.next 2>/dev/null | grep -v '\.map$' | grep -v '/cache/' | grep -q . && { echo 'idioma-es: quedan fallbackLng en inglés'; exit 1; }
# Next sirve static/chunks con caché «immutable» de un año: un navegador que ya tenía el fichero
# seguiría en inglés. Los chunks cambiados se RENOMBRAN (-kbes) y se actualizan sus referencias.
for f in $(grep -rlF '"fallbackLng",0,"es"' /app/apps/frontend/.next/static 2>/dev/null | grep -v '\.map$'); do
  viejo=$(basename "$f"); nuevo="${viejo%.js}-kbes.js"
  mv "$f" "$(dirname "$f")/$nuevo"
  find /app/apps/frontend/.next -path '*/cache' -prune -o -type f \( -name '*.json' -o -name '*.js' -o -name '*.html' -o -name '*.rsc' -o -name '*.body' -o -name '*.meta' \) -print \
    | while read -r g; do if grep -qF "$viejo" "$g"; then sed -i "s/$viejo/$nuevo/g" "$g"; fi; done
  if find /app/apps/frontend/.next -path '*/cache' -prune -o -type f \( -name '*.json' -o -name '*.js' -o -name '*.html' \) -print | xargs grep -lF "$viejo" 2>/dev/null | grep -q .; then
    echo "idioma-es: quedan referencias a $viejo"; exit 1; fi
  echo "idioma-es: $viejo -> $nuevo"
done
echo "idioma-es: $n ficheros con español por defecto"
