#!/bin/sh
# Postiz en español por defecto: cambia el fallback de i18next en la fuente antes del build.
# Esto deja que Next regenere sus chunks con hashes correctos y evita reescribir bundles minificados.
set -eu
root=${POSTIZ_SOURCE_ROOT:-/app}
f=$root/libraries/react-shared-libraries/src/translation/i18n.config.ts
[ -f "$f" ] || { echo 'idioma-es: no encuentro i18n.config.ts de Postiz'; exit 1; }
grep -Fqx "export const fallbackLng = 'en';" "$f" || {
  echo 'idioma-es: la fuente upstream cambió; revisa fallbackLng antes de actualizar'; exit 1;
}
sed -i.bak "s/^export const fallbackLng = 'en';$/export const fallbackLng = 'es';/" "$f"
rm -f "$f.bak"
grep -Fqx "export const fallbackLng = 'es';" "$f" || { echo 'idioma-es: no se pudo aplicar el español por defecto'; exit 1; }
echo 'idioma-es: fallbackLng de la fuente fijado en es'
