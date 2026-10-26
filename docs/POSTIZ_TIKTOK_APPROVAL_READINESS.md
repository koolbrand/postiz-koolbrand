# Koolbrand Redes: preparación para aprobación de TikTok

**Estado:** lista interna de requisitos; no son condiciones contractuales y no se han publicado.
**Actualizado:** 26-oct-2026.

## Vía técnica elegida

- Mantener a Koolbrand como operador de Postiz; cada titular autoriza su propia cuenta.
- Preparar el provider nativo de Postiz `tiktok-business` con TikTok for Business Organic API / Accounts API.
- La documentación de TikTok contempla agencias, socios terceros y publicación orgánica en cuentas Business y personales. La app de Koolbrand todavía necesita completar el formulario de Accounts API y recibir aprobación.
- No contactar ni seleccionar Post for Me. Su prototipo opcional del PR sigue desactivado y no es la ruta elegida.

## Evidencia pública actual

- Producto: `https://koolbrand.com/redes/` (página 5976, publicada). Describe el servicio, OAuth del titular, programación, datos básicos de TikTok, publicación, métricas y desconexión/borrado.
- Privacidad: `https://koolbrand.com/politica-de-privacidad/` (página 3565, publicada). La política actual cubre el sitio y los tratamientos generales de Koolbrand; debe verificarse que explica específicamente datos TikTok, finalidades, retención, proveedores, derechos y baja para este servicio.
- Aviso legal: `https://koolbrand.com/aviso-legal/` (página 3550, publicada); identifica a BRAND EXPERIENCE YA ESPAÑA, S.L., CIF B36979110, domicilio y correo de contacto.
- En Koolbrand Redes, el enlace visible es “Aviso legal y condiciones” y apunta al aviso legal. No se encontró una página separada de Términos de Servicio.
- Acceso a Postiz sigue por invitación; el onboarding multi-tenant del PR no está desplegado ni probado con un cliente externo.

## Requisitos de TikTok que hay que demostrar

- Completar el formulario de acceso a Accounts API y registrar la respuesta, scopes concedidos, límites y titular de la app.
- Tener el servicio funcionando con datos y recorrido reales en staging; demostrar aislamiento entre organizaciones.
- Grabar el flujo exacto que se revisará: Koolbrand crea un tenant, el cliente autoriza TikTok, el equipo prepara una publicación y el titular confirma la cuenta, privacidad, contenido y hora.
- No presentar la publicación de prueba de Koolbrand del 15-oct (`v_inbox_file`) como publicación pública.
- Verificar en el portal qué URL de producto, redirect URI, privacidad, términos, dominios y demo exige específicamente la revisión de Accounts API. La revisión de TikTok for Developers y la de TikTok for Business son procesos distintos; no asumir que una sustituye la otra.

## Decisiones que debe cerrar asesoría jurídica

1. Identificación de partes y roles de privacidad: Koolbrand, el cliente titular de la cuenta y proveedores técnicos; confirmar responsabilidades reales antes de etiquetar responsable/encargado.
2. Alcance contratado: calendario, publicación, analítica y soporte; quién aprueba el contenido y la programación.
3. Precio, facturación, duración, renovación y cancelación. No se han aportado datos para redactar esos términos.
4. Autorizaciones del cliente sobre sus cuentas y materiales, propiedad intelectual y reclamaciones sobre contenido.
5. Retención y eliminación de tokens, publicaciones, métricas, medios y logs; plazos y proceso al cerrar el servicio o revocar OAuth.
6. Proveedores/subencargados, alojamiento, transferencias internacionales y contacto para privacidad/incidentes.
7. Disponibilidad, límites de las APIs, cambios de plataforma, fallos de publicación y tratamiento de errores.
8. Responsabilidad, exclusiones, ley aplicable, jurisdicción y mecanismo de reclamación.

No completar estos puntos con condiciones inventadas. Tras revisión legal, preparar una página de Términos separada, enlazarla directamente desde `koolbrand.com/redes/`, verificarla en el portal y mantener coherencia con la política de privacidad.

## Fuentes oficiales

- [TikTok API for Business: Accounts API, usos y formulario](https://business-api.tiktok.com/portal/docs/accounts-api-overview/v1.3)
- [TikTok API for Business: overview y perfiles previstos, incluidas agencias](https://business-api.tiktok.com/gateway/docs/index?doc_id=1735712062490625)
- [TikTok for Developers: App Review Guidelines](https://developers.tiktok.com/docs/en/app-review-guidelines)
- [TikTok for Developers: verificación de URLs del sitio, privacidad y términos](https://developers.tiktok.com/docs/en/getting-started-create-an-app)
