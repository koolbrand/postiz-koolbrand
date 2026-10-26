# Postiz como centro de publicaciones multi-cliente

Estado del descubrimiento: 26-oct-2026. Documento de trabajo; no implica despliegue ni cambios en cuentas sociales.

## Objetivo

Operar Postiz en el Mac mini como plataforma de publicación de Koolbrand para varios clientes. Koolbrand gestiona el calendario y las publicaciones; cada cliente autoriza sus propias cuentas por OAuth. Cada cliente tiene una organización aislada. La capa Koolbrand aporta onboarding, permisos, soporte, analítica transversal e informes: la experiencia que esperamos de un Metricool propio.

## Estado confirmado

- `https://redes.koolbrand.com` sirve `ghcr.io/koolbrand/postiz-koolbrand:v2.25.1-kb` en el Mac mini, desde `~/servicios/postiz/compose.yml`. Los seis contenedores están activos; `DISABLE_REGISTRATION=true`. El 26-oct una consulta GET a `/api/auth/can-register` devolvió `{"register":false}`, confirmando el cierre del registro local. Hay copias de `compose.yml` en el mismo directorio.
- Postiz separa por organizaciones, pero el aislamiento está incompleto ahora mismo: Bella Valenti tiene su propia organización con 3 canales; la organización Koolbrand concentra 9 canales activos, incluidos 3 de Northkin. Por tanto, cualquier miembro de Koolbrand puede ver esos canales de Northkin. “Cliente” en el listado de canales es una etiqueta, no una frontera de acceso.
- Hay canales activos de Facebook, Instagram y YouTube de Bella; Koolbrand también tiene TikTok. Bella no tiene un canal TikTok conectado.
- Lectura actual de La Puerta: la autorización TikTok independiente de Bella está vigente y tiene `user.info.basic`, `video.publish` y `video.upload`; la consulta oficial de creator info devuelve `hellobellavalenti` y opciones de privacidad válidas. Ese flujo vuelve a `https://mcp.koolgrowth.com/oauth/tiktok/callback`; no es la app OAuth de Postiz y no prueba que TikTok haya aprobado la aplicación usada en Postiz. Bella aún no aparece como canal TikTok en Postiz.
- La analítica de La Puerta ya tiene resumen de rendimiento, mejores horas, comentarios de Instagram/Facebook (lectura), análisis de competidores de Instagram e informes Markdown/PDF. Postiz aporta calendario, composición y programación. La cobertura y los límites varían por red/API; queda medir qué comparativas realmente faltan.
- El repo `postiz-koolbrand` parte de la imagen oficial y no contiene la aplicación ni el runtime de producción, pero además de marca modifica comportamiento: `marca/aprobacion.sh` parchea `posts.controller.js` con una condición `org?.users?.[0]?.role` destinada a limitar la programación/publicación de roles USER. No hemos verificado en el runtime que identifique correctamente al usuario actual; confirmar el comportamiento y los permisos en staging antes de abrir acceso a clientes.
- La página pública `https://koolbrand.com/redes/` (“Koolbrand Redes”, WordPress página 5976) ya existe, se publicó específicamente como Website URL de la app TikTok de Koolbrand el 15-oct y responde HTTP 200 sin problemas. Explica el servicio, los datos de TikTok, el acceso por invitación y enlaza privacidad, aviso legal y eliminación de datos. El sitio corporativo completo también existe.
- La app TikTok fue rechazada el 22-oct por uso personal/interno, después de publicarse esa página. Por tanto, la página pública ya está; falta demostrar acceso y uso real por clientes externos. El registro Postiz sigue cerrado y el flujo de invitación externa no está probado.
- El enlace de la página dice “Aviso legal y condiciones”, pero la página de Aviso Legal revisada contiene información legal del titular y no se encontró una página separada de Términos/Condiciones de servicio. La política de privacidad y eliminación de datos sí existen.
- En el runtime, `FRONTEND_URL` y `MAIN_URL` son `https://redes.koolbrand.com`; Postiz forma el callback de TikTok como `{FRONTEND_URL}/integrations/social/tiktok`, es decir `https://redes.koolbrand.com/integrations/social/tiktok`. No se leyeron secretos.
- La app de TikTok recibió rechazo por «uso personal o interno». Añadir Bella como usuario sandbox sirvió para probar la autorización, pero no da acceso público ni aprueba Content Posting API.
- La separación de Bella se hizo el 15-oct con un cambio directo de `organizationId` respaldado. No se debe repetir ese método para nuevos clientes: el respaldo previo era del 15-oct y no se ha verificado un método soportado de transferencia de canales/publicaciones entre organizaciones. El flujo objetivo de onboarding es autorizar las cuentas por OAuth en la organización cliente, una vez construido el provisionamiento; para Northkin hay que diseñar una migración con respaldo actual y revisar publicaciones pendientes.
- El runtime sigue documentado como `v2.25.1-kb`; falta revalidarlo desde la instancia antes de cualquier intervención. Postiz publicó `v2.25.2` el 23-oct y `v2.25.3` el 24-oct; la última añade correcciones de seguridad y el release recomienda actualizar. El repo local fija ahora `v2.25.3`, pero esta versión no se ha construido ni desplegado. El candidato `v2.25.2` queda supersedido y no debe desplegarse. Verificar la imagen en entorno aislado antes de abrir acceso de clientes.
- El listado actual de miembros muestra a Adrián (SUPERADMIN) y Víctor (ADMIN), ambos internos; no hay miembros externos. No hay evidencia de que un cliente haya visto datos de otro. La separación actual sí deja los canales de Northkin visibles para ambos mientras permanezcan en Koolbrand. La app TikTok recibió rechazo por uso interno; una web pública no demuestra por sí sola que haya clientes usando el servicio.
- Reconsulta de La Puerta el 26-oct-2026: el calendario no devuelve publicaciones programadas de Northkin entre el 26-oct-2026 y el 26-ene-2027. La consulta no cubre borradores, contenido histórico ni evidencia de publicaciones externas.
- En la versión revisada, Postiz estándar crea la organización durante el registro del usuario. El runtime tenía `DISABLE_REGISTRATION=true` y el endpoint público confirma `register=false` para el alta local. La excepción de OIDC descrita abajo deja pendiente comprobar el cierre total. La invitación de equipo añade miembros a una organización existente; no crea una organización nueva. No se ha encontrado una operación soportada de traslado de canales/publicaciones entre organizaciones. Hace falta un provisionamiento administrativo cerrado o un flujo de autorización que permita al titular conectar sus redes sin habilitar el registro no invitado.
- Hallazgo de código oficial v2.25.3: `AuthService.canRegister()` devuelve `true` para `Provider.GENERIC` (OIDC) aunque `DISABLE_REGISTRATION=true`. Si ese proveedor está configurado, su primer acceso puede crear un usuario y una organización. El endpoint `GET /api/auth/can-register` confirma que el alta local está cerrada, pero no informa de OIDC. No se ha leído la configuración de proveedores de producción; verificarla y bloquear altas OIDC no invitadas antes de abrir el servicio a clientes.
- El 26-oct se creó `~/servicios/postiz/backups/pre-v2252-20261026/` con `compose.yml` y dump PostgreSQL custom-format. `pg_restore --list` confirmó que el dump se puede listar; no se ha ensayado restaurarlo. Ambos archivos son 0600 y el directorio 0700. Sirve como punto de reversión candidato para el upgrade; confirmar presencia/legibilidad y crear un respaldo nuevo justo antes de cualquier migración de Northkin.

## Ruta de implementación

### 1. Producto y aislamiento

- Mantener una organización Postiz por cliente y limitar el acceso al personal/cliente correspondiente.
- Decisión de Adrián: Koolbrand gestiona Postiz; cada cliente autoriza sus redes. La meta es registro no invitado cerrado, organización aislada por cliente y miembros persistentes solo del equipo Koolbrand que opere esa marca. El código oficial v2.25.3 permite el alta OIDC de `Provider.GENERIC` aunque `DISABLE_REGISTRATION=true`; falta verificar si producción tiene GENERIC configurado y cerrar ese camino si aplica. La inspección estática de v2.25.2 muestra que la ruta OAuth pública liga state/verifier a la organización de la API key y el callback sin login recupera ese estado; esto indica viabilidad, pero no demuestra el flujo completo. Validar por proveedor en navegador aislado antes de usar enlaces reales. El candidato local liga un enlace de un uso a cliente/proveedor y la clave reside en servidor; falta despliegue y prueba. No pedir contraseñas sociales. Implementar provisionamiento seguro; la app estándar no crea una organización desde el panel de administrador.
- Corregir primero la contaminación de Northkin. Verificar el aislamiento con usuarios de prueba antes de conectar clientes: una organización solo debe mostrar los canales, publicaciones, calendario y métricas de esa marca.
- No pedir contraseñas de redes. Verificar dónde y cómo Postiz protege los tokens OAuth, y documentar retención, revocación y baja antes de prometerlo en privacidad.

### 2. Capa pública de producto

- Mantener `koolbrand.com/redes/` como Website URL del producto y completar sus condiciones de servicio. Alinear esa URL con el dominio visible en el vídeo y el origen `FRONTEND_URL`/redirect URI; el dominio registrado históricamente y el callback actual son subdominios distintos del mismo dominio raíz, pero debe comprobarse con el portal de TikTok antes de reenviar. El portal de desarrolladores está cerrado en el navegador actual, así que la Website URL y comentarios actuales no se han revalidado allí.
- Añadir acceso a la aplicación desde esa página; no presentar un login como sitio público completo.
- Redactar privacidad, retención, soporte, seguridad y condiciones según el flujo que implementemos; validar jurídicamente antes de publicarlos.
- Para una nueva revisión TikTok, grabar la integración completa en sandbox y demostrar el recorrido para un cliente externo. La página `koolbrand.com/redes/` ya es pública; mostrarla y luego conectar la cuenta mediante Postiz en `redes.koolbrand.com`. Confirmar en el portal que TikTok acepta estos subdominios y usar exactamente esos dominios en el vídeo. Un OAuth iniciado por el titular no garantiza por sí solo que TikTok considere la app un servicio para terceros; validar con un piloto externo real y el criterio vigente del portal antes de reenviar.

### 3. Redes y aprobaciones

- Inventariar por proveedor: app de desarrollador, propietario, estado de revisión, scopes aprobados, callbacks y quién puede conectarse.
- TikTok: el OAuth directo de Bella ya tiene `video.publish` y responde a creator info, pero usa otra app/callback. Crear una demo que refleje un servicio activo para clientes; revisar el rechazo de la app TikTok que usa Postiz, solicitar solo los scopes necesarios y volver a revisión con vídeo sandbox y configuración de dominio/callback coherente. No pedir a Bella que vuelva a autorizar hasta que el callback y la app de Postiz estén listos.
- Revisar el uso compartido de la app Meta «Koolbrand» (publicación Postiz y Marketing API) antes de cambiar claves o apps: el mismo App ID sostiene servicios activos.
- Tratar «cualquier cuenta» como «cualquier cuenta compatible con Postiz y con autorización/aprobación vigente del proveedor»; no prometer compatibilidad universal.

### 4. Experiencia Metricool propia

- Ya existen el calendario/publicador de Postiz y capacidades de La Puerta para métricas por canal, mejores horas (Instagram/Facebook), comentarios (lectura), competidores de Instagram e informes para cliente.
- Auditar los informes existentes y su cobertura por red antes de construir otra capa. Añadir comparativas por cliente, periodo, red y publicación, e informes recurrentes solo donde la API entregue datos fiables.
- Verificar disponibilidad de inbox completo, aprobaciones, analítica histórica y respuestas por proveedor; no asumir paridad con Metricool.
- Separar los datos de cada cliente en consultas y exportaciones. Validar la separación antes de habilitar acceso externo.

## Orden de trabajo y puertas

1. **Contención y seguridad:** no hay miembros externos en la org Koolbrand; mantener cerrada el alta mientras se crea aislamiento por cliente. El respaldo de producción para el upgrade se creó el 26-oct y `pg_restore --list` pasó (sin ensayo de restauración); no usarlo como sustituto de un respaldo fresco. Reconstruir y revisar `v2.25.3-kb` más reversión documentada. Crear un respaldo inmediatamente antes de separar Northkin.
2. **Alta multi-cliente:** diseñar e implementar en staging un provisionamiento administrativo que cree una organización por cliente y añada solo al personal Koolbrand autorizado; mantener cerrado el registro global. Probar si el OAuth de cada proveedor funciona en navegador del cliente sin sesión Postiz. Solo entonces crear un enlace temporal de un uso para que autorice su cuenta sin compartir contraseña.
3. **Separación de Northkin:** generar respaldo de hoy, inventariar borradores y programaciones, y reconectar sus tres cuentas mediante OAuth en una organización destino. Mantener intactas las integraciones actuales hasta validar la conexión nueva. No se ha encontrado ni validado un método soportado para trasladar publicaciones entre organizaciones; borrar las antiguas también puede borrar su historial. No hay publicaciones futuras de Northkin en el calendario consultado del 26-oct-2026 al 26-ene-2027; eso no descarta borradores ni publicaciones fuera del rango.
4. **Piloto externo en staging:** probar alta de organización, OAuth del titular, asociación de canal a la organización correcta, revocación, permisos y métricas. Confirmar también dónde se guardan los tokens y por cuánto tiempo. Completar condiciones de servicio y demo TikTok. Las invitaciones de equipo se prueban aparte tras el upgrade (v2.25.2 incluyó un arreglo de cookies de invitación).
5. **Revisión previa a clientes:** comprobar aislamiento, callback OAuth, desconexión, términos visibles, respaldos y capacidad del Mac mini. El aislamiento y el uso externo real son requisitos de entrada.
6. **Aprobación humana antes de producción:** mantener registro cerrado; presentar a Adrián los cambios concretos y su reversión antes de migrar Northkin, invitar clientes, enviar la app a TikTok o cambiar OAuth de producción.

## Limitaciones verificadas de TikTok

La guía oficial vigente (actualizada el 4-ago-2026) dice que las apps no pueden ser de uso privado/personal ni seguir en desarrollo/pruebas; el sitio oficial debe estar completo y mostrar enlaces activos a Privacy Policy y Terms of Service directamente, sin abrir un menú. La solicitud necesita explicar cómo se usa cada producto/scope y un vídeo de punta a punta. En una primera revisión debe verse el sandbox; el dominio de la web de la demo debe coincidir con el declarado para la app. Esto encaja con el rechazo de «uso personal/interno»: la página pública por sí sola no basta y falta un Terms of Service visible y un piloto real de cliente.

La documentación de Direct Post también dice que los clientes sin auditoría solo publican contenido privado. Para publicación pública hace falta aprobar `video.publish`, probar la integración y completar auditoría. El OAuth TikTok independiente de Bella funciona con `video.publish`, pero no es la app OAuth de Postiz y no levanta esta restricción. No reenviar la revisión hasta que el flujo Postiz con cliente real esté operativo y la demo muestre ese mismo producto/dominio.

## Fuentes

- TikTok App Review Guidelines: https://developers.tiktok.com/docs/en/app-review-guidelines
- TikTok Developer Guidelines: https://developers.tiktok.com/docs/en/our-guidelines-developer-guidelines
- TikTok Content Posting API: https://developers.tiktok.com/docs/en/content-posting-api-get-started
- TikTok Direct Post API: https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post
- Postiz Quickstart: https://docs.postiz.com/general/quickstart
- Postiz self-hosted providers and redirect URI shape: https://docs.postiz.com/self-host/providers/overview
- Postiz v2.25.3 `canRegister()` (excepción de `Provider.GENERIC`): https://github.com/gitroomhq/postiz-app/blob/v2.25.3/apps/backend/src/services/auth/auth.service.ts
- Postiz v2.25.3 `/auth/register`: https://github.com/gitroomhq/postiz-app/blob/v2.25.3/apps/backend/src/api/routes/auth.controller.ts
