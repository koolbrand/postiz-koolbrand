# Pasarela de autorización de canales Postiz

Servicio interno para el modelo **Koolbrand gestiona; el titular autoriza su cuenta**. Crea organizaciones de cliente en el Postiz propio de Koolbrand y conserva cada clave API en el archivo secreto del Mac mini.

## Flujo

1. Una persona autorizada de Koolbrand ejecuta `provision-tenant.mjs` en el Mac mini con el ID estable del cliente, su nombre y las redes que quiere conectar. El script firma la solicitud servidor a servidor, recibe una clave de organización y actualiza el archivo secreto con backup y permisos `0600`; la clave no se imprime.
2. La persona de Koolbrand ejecuta `issue-link.mjs` en el Mac mini con el identificador de cliente y la red.
3. El CLI devuelve un enlace HTTPS temporal. El token aleatorio viaja en el fragmento `#` del enlace, que no se envía al servidor ni al proxy al abrirlo.
4. El cliente ve el nombre del cliente y la red; después pulsa **Continuar**. La pasarela consume la autorización de un solo uso y pide a Postiz la URL OAuth para la clave de esa organización.
5. La pasarela valida que el destino sea HTTPS y esté en la lista de hosts permitidos. El titular completa el acceso y consentimiento en la red social. Postiz asocia el canal a la organización que corresponde a esa clave.

La pantalla no pide ni recibe contraseñas sociales ni la clave de Postiz. Los enlaces caducan en 10 minutos por defecto y se consumen al continuar; `GET` solo muestra la pantalla y la vista previa no consume el enlace.

## Configuración

Variables requeridas:

- `PORT` (por defecto `8090`)
- `REDIS_URL` (instancia privada y aislada del acceso público)
- `POSTIZ_PUBLIC_API_URL` (URL HTTPS de la API pública de la instancia, por ejemplo `https://redes.koolbrand.com/api/public/v1`)
- `POSTIZ_BACKEND_URL` (origen HTTPS de Postiz para el CLI de alta, por ejemplo `https://redes.koolbrand.com`)
- `KOOLBRAND_TENANT_PROVISIONER_SECRET` (secreto compartido de al menos 32 caracteres, solo entre el backend Postiz y el CLI del Mac mini)
- `PUBLIC_BASE_URL` (URL HTTPS pública de esta pasarela)
- `TENANTS_FILE` (por defecto `/run/secrets/postiz-oauth-tenants.json`)
- `LINK_TTL_SECONDS` (60–1800, por defecto 600)
- `POSTIZ_TENANT_PROVIDERS` (lista separada por comas de `facebook`, `instagram`, `tiktok`, `tiktok-business`, `youtube`, `linkedin`, `x`, `threads`, `pinterest` o `reddit` al dar de alta una organización). Cada OAuth requiere que su app y credenciales estén configuradas en Postiz; esta allowlist no crea ni aprueba esas apps.

El CLI toma un bloqueo local al actualizar el registro para evitar que dos altas simultáneas pierdan entradas. Si el proceso se interrumpe antes de retirar el bloqueo, confirma que no siga ejecutándose y elimina manualmente el directorio `postiz-oauth-tenants.json.lock` antes de reintentar.

El archivo de tenants debe ser un secreto de solo lectura, accesible al usuario `node` del contenedor, y contener solo organizaciones ya provisionadas. El CLI corre en el host del Mac mini y por defecto escribe en `~/.koolbrand/postiz-oauth-tenants.json`; el servicio debe montar exactamente ese archivo en el contenedor:

```yaml
services:
  postiz-oauth-gateway:
    environment:
      TENANTS_FILE: /run/secrets/postiz-oauth-tenants.json
    volumes:
      - ${POSTIZ_TENANTS_HOST_FILE}:/run/secrets/postiz-oauth-tenants.json:ro
```

Define `POSTIZ_TENANTS_HOST_FILE` en el entorno protegido de Compose con la ruta absoluta del Mac mini. Para provisión, usa el mismo archivo del host en el CLI:

```json
{
  "bella": {
    "name": "Bella Valenti",
    "organizationId": "<id Postiz>",
    "apiKey": "<clave API de la organización Bella>",
    "providers": {
      "instagram": ["www.facebook.com", "facebook.com"],
      "tiktok": ["www.tiktok.com", "tiktok.com"]
    }
  }
}
```

La pasarela permite Facebook/Instagram, TikTok, TikTok for Business, YouTube, LinkedIn, X, Threads, Pinterest y Reddit; los dominios autorizados se fijan por proveedor a los usados por Postiz v2.25.3. La lista de hosts debe revisarse por proveedor y actualizarse solo con dominios OAuth oficiales. No se deben usar claves API de producción en una instalación de staging. La clave Postiz da acceso a la API pública de su organización y nunca se devuelve al navegador.

## Endpoints

- `GET /healthz`: estado del proceso.
- `GET /authorize#<token>`: página de consentimiento, sin consumir el enlace.
- `POST /v1/preview` y `POST /v1/authorize`: llamadas de la propia página. La segunda consume el token y redirige al OAuth del proveedor.

El alta se ejecuta en el Mac mini con Node 22. El endpoint Postiz `POST /api/enterprise/managed-tenants` exige HMAC-SHA256, nonce de un uso en Redis, marca temporal, un operador Postiz global configurado y un ID externo único; no devuelve datos al navegador. El CLI registra el operador **declarado** en el comando —no demuestra criptográficamente su identidad— y el resultado, nunca la clave:

```sh
TENANTS_FILE="$HOME/.koolbrand/postiz-oauth-tenants.json" POSTIZ_TENANT_PROVIDERS=facebook,instagram node provision-tenant.mjs bella "Bella Valenti" --actor adrian@koolbrand.com
docker exec postiz-oauth-gateway node /app/issue-link.mjs bella instagram --actor adrian@koolbrand.com
```

El CLI imprime el enlace al final; compártelo con el cliente por el canal acordado y no lo pegues en tickets públicos. El proxy debe forzar HTTPS, no registrar cuerpos ni fragmentos y aplicar límites de frecuencia a los endpoints públicos. No configurar CORS. Mantener Redis y el puerto de la pasarela en una red privada; publicar solo por el proxy TLS.

## Límites actuales

- La implementación está en la rama; frontend y backend compilaron en el entorno local. Falta construir la imagen completa, desplegarla en el Mac mini, configurar secretos, montar el archivo del registro como solo lectura y validar el recorrido en staging.
- Postiz rechaza por esta API a proveedores cuyo conector requiera una URL externa. El enlace solo funciona para proveedores OAuth compatibles.
- La política de TikTok, los permisos aprobados y el uso externo real siguen dependiendo de TikTok. Esta pasarela no cambia la revisión ni permite publicar con scopes no aprobados.
- El flujo requiere una prueba aislada por proveedor antes de producción, incluida la vuelta del callback sin una sesión Postiz.

## Estado de implementación · 26-oct-2026

- La pasarela se construyó en el Mac mini como `local/postiz-oauth-gateway:candidate-20261026`. No está desplegada ni tiene tenants, API keys, Redis o dominio configurados.
- El candidato Postiz `v2.25.2` quedó supersedido; la fuente fijada en este repositorio es `v2.25.3` más el commit exacto. Producción continúa documentada en `v2.25.1-kb`; falta comprobar el runtime antes de cualquier actualización.
- La revisión estática del flujo OAuth de la versión candidata anterior indica que el endpoint público fija el ID de organización y el verifier al generar `state`; el callback de integraciones sin sesión recupera la organización y trata el estado como usado/caducado tras consumirlo. En principio permite autorizar sin cuenta Postiz; queda validación en navegador aislado por proveedor. La pasarela local no ha completado ese flujo de extremo a extremo.
- El endpoint de alta y el CLI resuelven el provisionamiento de organizaciones y su clave en la rama candidata; todavía no están desplegados ni tienen secretos del runtime o el montaje compartido del registro configurados.
- La capa de marca existente modifica `posts.controller.js` para roles `USER`, mientras que el controlador de Public API tiene su propia ruta `POST /posts` con clave de organización. No usar el parche actual como aprobación completa; imponer aprobación en la futura API de publicaciones de Koolbrand y proteger las claves.
- La emisión de enlaces se movió a un CLI interno después de la revisión: el servicio público no expone un endpoint que permita solicitar OAuth para cualquier cliente. La configuración de `PUBLIC_BASE_URL` también falla si incluye una subruta, se rechazan destinos OAuth con credenciales embebidas o puertos no estándar y la API Postiz no puede redirigir la solicitud HTTP a otro host.
- Modelo acordado: Koolbrand gestiona Postiz; cada cliente inicia y autoriza su propia conexión social. Cada cliente debe tener una organización Postiz aislada y una clave API distinta; no reutilizar la organización Koolbrand para canales de clientes.
- El alta de organizaciones y la custodia de claves están implementados en el patch/CLI de la rama, pero aún requieren build, revisión, configuración y piloto. La ruta usa servicios de Postiz (sin escrituras directas a SQL), autentica un operador Koolbrand y devuelve la clave solo al CLI de servidor para guardarla en el archivo secreto compartido con el gateway; nunca la devuelve al navegador.
