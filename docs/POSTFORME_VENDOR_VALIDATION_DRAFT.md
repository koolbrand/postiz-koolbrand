# Post for Me Quickstart: validación antes del piloto

**Estado:** borrador interno preparado el 26-oct-2026; no enviado. No crear cuenta, activar un plan ni conectar cuentas sociales hasta resolver estas preguntas.

## Objetivo

Confirmar que Post for Me Quickstart puede sostener el flujo de agencia de Koolbrand en Postiz: Koolbrand opera la plataforma y cada cliente autoriza su propia cuenta TikTok. La respuesta debe cubrir publicación pública en cuentas de terceros y el cumplimiento de los requisitos de TikTok; que Quickstart use credenciales aprobadas no demuestra por sí solo que nuestro flujo concreto esté autorizado.

## Draft en inglés

Subject: TikTok Quickstart approval and agency use case

Hi Post for Me team,

We operate a self-hosted Postiz workspace for our social media agency. Our staff manage a separate workspace for each client, and each client owner authorizes their own TikTok account through OAuth. We do not collect passwords or publish to an account without the owner's authorization.

Before we enable the Post for Me Quickstart TikTok adapter, could you confirm the following in writing?

1. Is the Quickstart TikTok app approved for public Direct Post, including scheduled posts, to external clients' accounts? Does that approval cover both personal/creator accounts and Business accounts?
2. Does Quickstart's TikTok access pass the current TikTok Content Posting API audit for public visibility, and are there user or daily creator limits we must enforce?
3. What app name, publisher, and permissions does a client see during OAuth? Can a client select which account to authorize, and how should our callback handle cancellation and partial authorization?
4. Does the API expose the current creator information and allowed privacy/interactions for each account? If not, what must our Postiz composer display and collect to meet TikTok's Direct Post UX requirements, including explicit privacy selection, interaction controls, commercial-content disclosure, Music Usage Confirmation, content preview, and publish status?
5. Is it permitted to use the project API key for this agency workflow with a separate external ID per Postiz organization? Please confirm account token ownership, retention, deletion/revocation behavior, data region, and available DPA/subprocessor documentation.
6. Which TikTok feed and post analytics are available in Quickstart, and which account types/scopes are required?
7. Please confirm current billing for 1,000 successful posts per month, what counts as a post across multiple networks/accounts, rate limits, and any overage or enterprise terms.

We will keep the adapter disabled and will not connect a client account until these points are clear. If Quickstart cannot support this use case, please let us know whether a White Label project or another approved option is required.

Best,
Koolbrand

## Gate de decisión

- Respuesta escrita que cubra publicación pública en cuentas de clientes y límites de la app.
- Decisión sobre Quickstart frente a otra ruta, con costes y condiciones revisados.
- UX del compositor ajustada a las respuestas del proveedor y a la guía vigente de TikTok.
- Callback, publicación, resultado asíncrono, analytics, revocación y separación por organización verificados en staging.
- Activación de una cuenta de cliente solo después de cumplir las puertas anteriores y contar con autorización del titular.
