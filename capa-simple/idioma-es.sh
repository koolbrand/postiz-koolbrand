#!/bin/sh
# Postiz en ESPAÑOL por defecto (14-oct-2026). Postiz elige idioma por la cookie «i18next» y, si no
# hay, por la cabecera del navegador; en la práctica salía en inglés con Chrome en es-ES. Aquí el
# idioma de reserva pasa de «en» a «es». Quien quiera otro lo elige con la bandera (pone la cookie).
#
# 13-nov-2026: desde la v2.25.3 el compilador acorta el nombre exportado («fallbackLng» pasa a «o»)
# y en un fichero de servidor lo deja escrito tal cual. Se reconocen las tres formas:
#   A  "fallbackLng",0,"en"            (hasta la v2.25.2)
#   B  ,"o",0,"en","S",0,              (v2.25.3: módulo de configuración de idiomas)
#   C  fallbackLng:"en",lng:void 0     (v2.25.3: init() con el valor ya sustituido)
set -eu
R=/app/apps/frontend/.next
lista() { grep -rlF -e '"fallbackLng",0,"en"' -e ',"o",0,"en","S",0,' -e 'fallbackLng:"en",lng:void 0' "$R" 2>/dev/null | grep -v '\.map$' | grep -v '/cache/' || true; }
n=0
for f in $(lista); do
  sed -i -e 's/"fallbackLng",0,"en"/"fallbackLng",0,"es"/g' \
         -e 's/,"o",0,"en","S",0,/,"o",0,"es","S",0,/g' \
         -e 's/fallbackLng:"en",lng:void 0/fallbackLng:"es",lng:void 0/g' "$f"; n=$((n+1))
done
[ "$n" -gt 0 ] || { echo 'idioma-es: no encuentro el idioma de reserva en el frontend'; exit 1; }
[ -z "$(lista)" ] || { echo 'idioma-es: quedan idiomas de reserva en inglés'; exit 1; }
# Next sirve static/chunks con caché «immutable» de un año: un navegador que ya tenía el fichero
# seguiría en inglés. Los chunks cambiados se RENOMBRAN (-kbes) y se actualizan sus referencias.
for f in $(grep -rlF -e '"fallbackLng",0,"es"' -e ',"o",0,"es","S",0,' "$R/static" 2>/dev/null | grep -v '\.map$'); do
  viejo=$(basename "$f"); nuevo="${viejo%.js}-kbes.js"
  mv "$f" "$(dirname "$f")/$nuevo"
  find "$R" -path '*/cache' -prune -o -type f \( -name '*.json' -o -name '*.js' -o -name '*.html' -o -name '*.rsc' -o -name '*.body' -o -name '*.meta' \) -print \
    | while read -r g; do if grep -qF "$viejo" "$g"; then sed -i "s/$viejo/$nuevo/g" "$g"; fi; done
  if find "$R" -path '*/cache' -prune -o -type f \( -name '*.json' -o -name '*.js' -o -name '*.html' \) -print | xargs grep -lF "$viejo" 2>/dev/null | grep -q .; then
    echo "idioma-es: quedan referencias a $viejo"; exit 1; fi
  echo "idioma-es: $viejo -> $nuevo"
done
echo "idioma-es: $n ficheros con español por defecto"
