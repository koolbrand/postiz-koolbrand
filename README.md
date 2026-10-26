# Postiz · source build multi-cliente de Koolbrand

Nuestro centro de publicaciones (https://redes.koolbrand.com) es **Postiz** (AGPL-3.0, https://github.com/gitroomhq/postiz-app),
con la fuente oficial fijada por tag y commit y el patch multi-cliente de Koolbrand compilados en una imagen propia.

- `marca/kb-postiz.css` — redefine las variables de color de Postiz con los tokens de Simuloo/Koolbrand
  (lima `#CCE673`, tinta `#111111`, crema `#F2F1EF`), Inter Tight + JetBrains Mono, foco en lima, logos.
- Logos y favicon de Koolbrand.
- `patches/postiz-v2.25.3.patch` — alta idempotente de organizaciones por ID externo, clave API solo por conexión servidor a servidor, membresía del operador interno y un límite de 30 canales por organización.
- `oauth-gateway/` — enlaces OAuth de un uso y CLI para aprovisionar clientes y guardar su clave en el archivo secreto local del Mac mini. El cliente autoriza en la red social y no accede al panel de Postiz.

La versión y el commit de la fuente están fijados en `POSTIZ_VERSION` y `POSTIZ_UPSTREAM_COMMIT`. El parche falla cerrado si no aplica a la fuente descargada.

## Producción actual

Verificado el 26-oct-2026: `redes.koolbrand.com` corre en el Mac mini, con Colima, desde `~/servicios/postiz/compose.yml`. La imagen activa documentada es `ghcr.io/koolbrand/postiz-koolbrand:v2.25.1-kb`; el entorno tenía `DISABLE_REGISTRATION=true` y `GET /api/auth/can-register` devuelve `{"register":false}`. Esto confirma que el alta local está cerrada. En v2.25.3 el alta OIDC `GENERIC` puede quedar exceptuada de esa variable; el patch candidato la bloquea para identidades nuevas y conserva el acceso a usuarios OIDC existentes. La configuración de proveedores de producción no se ha podido verificar, así que el cierre completo del registro sigue pendiente de comprobación. El runtime tiene seis contenedores activos y copias del compose.

Este repositorio solo construye la imagen con la capa de marca; no contiene la aplicación Postiz ni el compose de producción. **Las referencias históricas a Coolify que queden en automatizaciones no describen el destino activo. No desplegar con esas instrucciones.** El procedimiento de actualización/rollback del Mac mini está pendiente de documentar.

## Construcción desde fuente

1. `vigilar-version.yml` abre una issue cada vez que Postiz publica versión.
2. Se revisan las notas y se actualizan en la misma PR `POSTIZ_VERSION`, `POSTIZ_UPSTREAM_COMMIT` y el patch.
3. `construir.yml` descarga la fuente oficial fijada, aplica el patch y compila frontend y backend.
4. La PR y `workflow_dispatch` construyen sin publicar. Solo un `push` a `main` publica `ghcr.io/koolbrand/postiz-koolbrand:<versión>-kb` y `latest-kb` para amd64 y arm64.
5. Antes de actualizar producción: backup verificable, prueba aislada, rollback y despliegue autorizado en el Mac mini.

El patch cambia la organización y el provisionamiento; cada actualización upstream requiere volver a aplicarlo y compilar. La instancia sigue compartiendo runtime y base de datos entre organizaciones, aunque los canales se separan por `organizationId`.

## Licencia
AGPL-3.0, como Postiz. Este repositorio publica todos los cambios que hacemos sobre su código.
