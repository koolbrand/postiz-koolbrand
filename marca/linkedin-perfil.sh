#!/bin/sh
# LinkedIn PERFIL personal sin la Community Management API (14-oct-2026).
# LinkedIn denegó la CM API a «Koolbrand Publisher»; Share on LinkedIn y OpenID se activan al momento.
# El conector de perfil de Postiz pide también los 4 permisos de empresa (r_basicprofile,
# rw_organization_admin, w/r_organization_social) y LinkedIn rechaza TODA la petición
# (invalid_scope_error). Aquí el conector de PERFIL pide solo openid + profile + w_member_social,
# que bastan para publicar en el perfil. El de PÁGINA (linkedin.page.provider.js) NO se toca.
# /v2/me sin r_basicprofile no da vanityName: se usa el nombre como usuario.
set -eu
n=0
for f in $(find /app -path '*/node_modules' -prune -o -type f -name 'linkedin.provider.js' -print); do
  sed -i "/this.scopes = \[/,/\];/{/'r_basicprofile',/d;/'rw_organization_admin',/d;/'w_organization_social',/d;/'r_organization_social',/d}" "$f"
  sed -i 's/username: vanityName,/username: vanityName || name,/g' "$f"
  grep -q "'rw_organization_admin'" "$f" && { echo "linkedin-perfil: quedan permisos de empresa en $f"; exit 1; }
  grep -q "'w_member_social'" "$f" || { echo "linkedin-perfil: falta w_member_social en $f"; exit 1; }
  n=$((n+1))
done
[ "$n" -gt 0 ] || { echo 'linkedin-perfil: no encuentro linkedin.provider.js'; exit 1; }
for f in $(find /app -path '*/node_modules' -prune -o -type f -name 'linkedin.page.provider.js' -print); do
  grep -q "'rw_organization_admin'" "$f" || { echo "linkedin-perfil: he tocado el conector de página $f"; exit 1; }
done
echo "linkedin-perfil: $n conectores de perfil con permisos mínimos"
