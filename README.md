# Postiz · capa de marca Koolbrand × Simuloo

Nuestro centro de publicaciones (https://redes.koolbrand.com) es **Postiz** (AGPL-3.0, https://github.com/gitroomhq/postiz-app)
con una capa de marca y ajustes funcionales encima. **No es un fork**: la imagen parte de la oficial y añade:

- `marca/kb-postiz.css` — redefine las variables de color de Postiz con los tokens de Simuloo/Koolbrand
  (lima `#CCE673`, tinta `#111111`, crema `#F2F1EF`), Inter Tight + JetBrains Mono, foco en lima, logos.
- Logos y favicon de Koolbrand.
- `marca/aprobacion.sh` — parche de `posts.controller.js` destinado a limitar la programación/publicación de roles `USER` mediante `org?.users?.[0]?.role`. El efecto real de esa condición aún debe verificarse en staging antes de confiarle permisos de producción.

La imagen base se fija en `POSTIZ_VERSION`; el flujo de actualización y el destino de producción deben revisarse antes de cada cambio.

## Producción actual

Verificado el 26-oct-2026: `redes.koolbrand.com` corre en el Mac mini, con Colima, desde `~/servicios/postiz/compose.yml`. La imagen activa es `ghcr.io/koolbrand/postiz-koolbrand:v2.25.1-kb`; el entorno tenía `DISABLE_REGISTRATION=true`. En v2.25.3 el alta OIDC `GENERIC` puede quedar exceptuada de esa variable; la configuración de proveedores de producción no se ha podido verificar, así que el cierre completo del registro sigue pendiente de comprobación. El runtime tiene seis contenedores activos y copias del compose.

Este repositorio solo construye la imagen con la capa de marca; no contiene la aplicación Postiz ni el compose de producción. **Las referencias históricas a Coolify que queden en automatizaciones no describen el destino activo. No desplegar con esas instrucciones.** El procedimiento de actualización/rollback del Mac mini está pendiente de documentar.

## Construcción de imagen

1. `vigilar-version.yml` abre una issue cada vez que Postiz publica versión.
2. Se revisan las notas, se cambia `POSTIZ_VERSION` y se hace push.
3. `construir.yml` publica `ghcr.io/koolbrand/postiz-koolbrand:<versión>-kb`.
4. La imagen se debe validar en staging y actualizarse en el Mac mini solo con procedimiento de backup y rollback documentado.

Si un override visual de la marca deja de aplicarse, la interfaz puede volver a los estilos de Postiz. Los parches funcionales pueden cambiar o romper permisos/API; hay que validarlos en staging antes de producción.

## Licencia
AGPL-3.0, como Postiz. Este repositorio publica todos los cambios que hacemos sobre su código.
