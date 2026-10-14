#!/bin/sh
# Aprobación (14-oct-2026). Postiz no tiene flujo de aprobación: sus permisos solo miran los
# límites del plan, así que cualquier miembro podía programar o publicar. Aquí, en el servidor,
# un miembro con rol USER (el equipo) solo puede guardar BORRADORES; programar y publicar queda
# para ADMIN / SUPERADMIN (quien aprueba). La clave pública (La Puerta) no pasa por aquí: allí
# programar ya pide OK por Telegram.
set -eu
n=0
for f in $(find /app -path '*/node_modules' -prune -o -type f -path '*/api/routes/posts.controller.js' -print); do
  grep -q 'kb-aprobacion' "$f" && continue
  sed -i 's|    async createPost(org, rawBody) {|    async createPost(org, rawBody) {\n        /* kb-aprobacion */ if (org?.users?.[0]?.role === "USER" \&\& rawBody?.type !== "draft") { throw new common_1.HttpException("Solo quien aprueba puede programar o publicar. Guárdalo como borrador y avisa para que lo apruebe.", 403); }|' "$f"
  grep -q 'kb-aprobacion' "$f" || { echo "aprobacion: no pude insertar la regla en $f"; exit 1; }
  n=$((n+1))
done
[ "$n" -gt 0 ] || { echo 'aprobacion: no encuentro posts.controller.js'; exit 1; }
echo "aprobacion: regla en $n controladores"
