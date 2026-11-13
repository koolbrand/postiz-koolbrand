#!/bin/sh
# Los vídeos subidos no se reproducían al abrirlos en una pestaña (13-nov-2026, Adrián).
# Postiz sirve /uploads/ con «Content-Security-Policy: …; sandbox». Con «sandbox» a secas la página queda con
# origen opaco y Chrome no carga el vídeo en su propio reproductor (probado con el mismo MP4 y seis cabeceras:
# ni añadir el host a media-src ni «media-src *» lo arreglan; «sandbox allow-same-origin» sí).
# Se cambia SOLO eso. Los archivos subidos siguen sin poder ejecutar código: «sandbox» sin allow-scripts y
# «script-src 'none'» no se tocan.
set -eu
n=0
for f in /etc/nginx/nginx.conf /app/var/docker/nginx.conf; do
  [ -f "$f" ] || continue
  grep -qF "frame-ancestors 'none'; sandbox\" always;" "$f" || { echo "uploads-video: no encuentro la cabecera esperada en $f"; exit 1; }
  sed -i "s#frame-ancestors 'none'; sandbox\" always;#frame-ancestors 'none'; sandbox allow-same-origin\" always;#" "$f"
  grep -qF "sandbox allow-same-origin\" always;" "$f" || { echo "uploads-video: el cambio no se aplicó en $f"; exit 1; }
  grep -F "sandbox" "$f" | grep -q "allow-scripts" && { echo "uploads-video: no debe haber allow-scripts"; exit 1; }
  n=$((n+1))
done
[ "$n" -gt 0 ] || { echo 'uploads-video: no encuentro nginx.conf'; exit 1; }
echo "uploads-video: cabecera ajustada en $n ficheros"
