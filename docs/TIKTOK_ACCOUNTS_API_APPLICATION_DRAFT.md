# TikTok Accounts API — borrador de solicitud de acceso

**Estado:** borrador interno, no enviado. Preparado el 26-oct-2026 para la app de TikTok for Business de Koolbrand. TikTok exige el formulario de Accounts API antes de enviar una app nueva o pedir scopes que incluyan «TikTok Accounts».

## Producto y caso de uso

**Producto:** Koolbrand Redes, servicio gestionado por Koolbrand sobre Postiz, alojado en `https://redes.koolbrand.com`.

**Caso de uso propuesto (inglés para el formulario):**

> Koolbrand is a social media operations agency. Our managed publishing workspace lets each business or creator connect its own TikTok account through TikTok OAuth, plan and review organic content, schedule posts, and monitor account and post performance. Koolbrand staff operate the workspace for each client. Each client authorizes its own account; we do not ask for TikTok passwords, transfer content between accounts, or publish from an account without the account owner's authorization. TikTok account data is used only to provide publishing and reporting to that same client.

**Importante:** este texto describe el producto previsto; no afirmar que el flujo esté desplegado o aprobado hasta probarlo en staging y completar el onboarding multi-tenant.

## Scopes solicitados por Postiz

| Scope | Uso previsto en el producto |
|---|---|
| `user.info.basic` | Identificar la cuenta que el cliente autorizó y mostrarla en el canal correspondiente. |
| `user.info.username` | Mostrar el nombre de usuario de la cuenta conectada. |
| `user.info.stats` | Presentar métricas de la cuenta al cliente y al equipo Koolbrand que la gestiona. |
| `video.list` | Consultar publicaciones propias y métricas asociadas. |
| `video.upload` | Preparar un borrador en la cuenta autorizada cuando el titular elige ese flujo. |
| `video.publish` | Publicar contenido orgánico programado en la cuenta autorizada por su titular. |

## Flujo que debe mostrarse en la demo

1. Koolbrand crea una organización aislada para un cliente y envía un enlace de autorización temporal.
2. El cliente inicia sesión en TikTok y autoriza la cuenta que controla.
3. Postiz devuelve la cuenta al tenant correcto; el cliente no comparte su contraseña con Koolbrand.
4. El equipo prepara una publicación y el titular revisa el canal, el contenido y la fecha antes de programarla.
5. Postiz publica únicamente en la cuenta autorizada y muestra el estado y los datos que TikTok devuelve.
6. El titular puede revocar el acceso desde TikTok; Koolbrand documenta cómo desconectar el canal y borrar los datos retenidos.

## Configuración técnica conocida

- Provider Postiz: `tiktok-business`.
- Callback registrado para la instancia: `https://redes.koolbrand.com/integrations/social/tiktok-business/` (incluida la barra final).
- Variables requeridas en el servidor: `TIKTOK_BUSINESS_CLIENT_ID` y `TIKTOK_BUSINESS_CLIENT_SECRET`.
- La app tiene que recibir el permiso «TikTok Accounts» y los scopes que el provider solicita antes de probar OAuth con una cuenta cliente.

## Pendientes antes de enviar

- Confirmar titular legal, dirección y cuenta TikTok for Business dueña de la app.
- Completar el alta de clientes en Postiz y demostrar aislamiento real entre tenants.
- Terminar y publicar términos de servicio accesibles directamente; el enlace actual de la página de redes apunta al aviso legal, y no se encontró una página separada de términos.
- Confirmar textos de privacidad, retención de tokens, borrado y revocación después de revisar la configuración real del servidor.
- Capturar vídeo de demo y pantallas del flujo OAuth y programación en un entorno de pruebas.
- Estimar cuentas conectadas activas y publicaciones mensuales; no inventar volumen.
- Probar primero con cuentas de sandbox. No usar ni mover Bella hasta confirmar acceso y completar la revisión técnica.
- Enviar la solicitud desde TikTok for Business Portal y registrar la respuesta, el scope concedido y cualquier límite de uso.

## Fuentes

- [TikTok Accounts API: alcance, cuentas compatibles y casos permitidos](https://business-api.tiktok.com/portal/docs/accounts-api-overview/v1.3)
- [TikTok API for Business: guía y formulario de acceso a Accounts API](https://business-api.tiktok.com/gateway/docs/index?doc_id=1737565048641538)
- [Provider TikTok Business de Postiz v2.25.3](https://github.com/gitroomhq/postiz-app/blob/v2.25.3/libraries/nestjs-libraries/src/integrations/social/tiktok.business.provider.ts)
