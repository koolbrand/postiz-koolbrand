#!/bin/sh
# Sustituye los morados/rosas escritos a mano en el código COMPILADO de Postiz por la paleta
# Koolbrand × Simuloo. Se ejecuta al construir la imagen (ver Dockerfile).
# Postiz v2.25.1 tiene #612bd3 escrito 89 veces en componentes: taparlo con CSS no escala.
#
#   morados de botones/fondos (texto blanco encima) → lima-800 #5C6C16 (5,8:1 con blanco)
#   rosa de foco/realce (#fc69ff, sobre fondo oscuro) → lima-500 #CCE673 (12,5:1 con #1A1A1A)
#   lilas claros (iconos, enlaces)                    → lima-600 #ACC451
#   degradado del indicador de menú (#662FDA→#5720CB) → lima-500 → lima-600
# Cubre hex (#rrggbb, sin distinguir mayúsculas) y los tripletes rgb que genera Tailwind.
set -eu
RAIZ="$1"
MAPA='612bd3:5c6c16 612ad5:5c6c16 7236f1:5c6c16 8155dd:5c6c16 7950f2:5c6c16 832ad5:5c6c16 5826c2:5c6c16 4f46e5:5c6c16 8b5cf6:5c6c16 d82d7e:5c6c16 9333ea:5c6c16 7c3aed:5c6c16 fc69ff:cce673 662fda:cce673 5720cb:acc451 b69dec:acc451 a78bfa:acc451 cebdf2:e3f1b9'
expr=""
for par in $MAPA; do
  de=${par%%:*}; a=${par##*:}
  r=$(printf '%d' 0x$(echo $de | cut -c1-2)); g=$(printf '%d' 0x$(echo $de | cut -c3-4)); b=$(printf '%d' 0x$(echo $de | cut -c5-6))
  ra=$(printf '%d' 0x$(echo $a | cut -c1-2)); ga=$(printf '%d' 0x$(echo $a | cut -c3-4)); ba=$(printf '%d' 0x$(echo $a | cut -c5-6))
  expr="$expr;s/#$de/#$a/Ig;s/rgb($r $g $b/rgb($ra $ga $ba/g;s/rgb($r,$g,$b)/rgb($ra,$ga,$ba)/g;s/rgb($r, $g, $b)/rgb($ra, $ga, $ba)/g;s/rgba($r,$g,$b,/rgba($ra,$ga,$ba,/g"
done
expr=${expr#;}
n=0
for f in $(find "$RAIZ" -path "$RAIZ/cache" -prune -o -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.rsc' -o -name '*.svg' \) -print); do
  if grep -qiE '#(612bd3|612ad5|7236f1|8155dd|7950f2|832ad5|5826c2|4f46e5|8b5cf6|d82d7e|9333ea|7c3aed|fc69ff|662fda|5720cb|b69dec|a78bfa|cebdf2)|rgba?\((97 43 211|97,43,211|97, 43, 211|252 105 255|252,105,255)' "$f"; then
    sed -i "$expr" "$f"; n=$((n+1))
  fi
done
quedan=$(find "$RAIZ" -path "$RAIZ/cache" -prune -o -type f \( -name '*.js' -o -name '*.css' \) -print | xargs grep -liE '#612bd3|#fc69ff' 2>/dev/null | wc -l)
echo "recolorear: $n ficheros cambiados, quedan $quedan con #612bd3/#fc69ff"
[ "$quedan" -eq 0 ]
