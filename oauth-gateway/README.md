# Pasarela de autorización de canales Postiz

Servicio interno para el modelo **Koolbrand gestiona; el titular autoriza su cuenta**. No crea organizaciones ni usuarios de Postiz. Cada clave API queda vinculada a una sola organización en el archivo secreto del servidor.

## Flujo

1. Una persona autorizada de Koolbrand ejecuta `issue-link.mjs` en el Mac mini con el identificador de cliente y la red.
2. El CLI devuelve un enlace HTTPS temporal. El token aleatorio viaja en el fragmento `#` del enlace, que no se envía al servidor ni al proxy al abrirlo.
3. El cliente ve el nombre del cliente y la red; después pulsa **Continuar**. La pasarela consume la autorización de un solo uso y pide a Postiz la URL OAuth para la clave de esa organización.
4. La pasarela valida que el destino sea HTTPS y esté en la lista de hosts permitidos. El titular completa el acceso y consentimiento en la red social. Postiz asocia el canal a la organización que corresponde a esa clave.

La pantalla no pide ni recibe contraseñas sociales ni la clave de Postiz. Los enlaces caducan en 10 minutos por defecto y se consumen al continuar; `GET` solo muestra la pantalla y la vista previa no consume el enlace.

## Configuración

Variables requeridas:

- `PORT` (por defecto `8090`)
- `REDIS_URL` (instancia privada y aislada del acceso público)
- `POSTIZ_PUBLIC_API_URL` (URL HTTPS de la API pública de la instancia, por ejemplo `https://redes.koolbrand.com/api/public/v1`)
- `PUBLIC_BASE_URL` (URL HTTPS pública de esta pasarela)
- `TENANTS_FILE` (por defecto `/run/secrets/postiz-oauth-tenants.json`)
- `LINK_TTL_SECONDS` (60–1800, por defecto 600)

El archivo de tenants debe ser un secreto de solo lectura, accesible al usuario `node` del contenedor, y contener solo organizaciones ya provisionadas:

```json
{
  "bella": {
    "name": "Bella Valenti",
    "apiKey": "<clave API de la organización Bella>",
    "providers": {
      "instagram": ["www.facebook.com", "facebook.com"],
      "tiktok": ["www.tiktok.com", "tiktok.com"]
    }
  }
}
```

La lista de hosts debe revisarse por proveedor y actualizarse solo con dominios OAuth oficiales. No se deben usar claves API de producción en una instalación de staging. La clave Postiz da acceso a la API pública de su organización y nunca se devuelve al navegador.

## Endpoints

- `GET /healthz`: estado del proceso.
- `GET /authorize#<token>`: página de consentimiento, sin consumir el enlace.
- `POST /v1/preview` y `POST /v1/authorize`: llamadas de la propia página. La segunda consume el token y redirige al OAuth del proveedor.

La emisión no tiene endpoint HTTP. Solo una persona con acceso administrativo al Mac mini puede ejecutar el CLI dentro del contenedor, lo que registra el operador **declarado** en el comando, el cliente y el proveedor, sin imprimir la clave Postiz. El campo declarado no demuestra criptográficamente quién ejecutó el comando:

```sh
docker exec postiz-oauth-gateway node /app/issue-link.mjs bella instagram --actor adrian@koolbrand.com
```

El CLI imprime el enlace al final; compártelo con el cliente por el canal acordado y no lo pegues en tickets públicos. El proxy debe forzar HTTPS, no registrar cuerpos ni fragmentos y aplicar límites de frecuencia a los endpoints públicos. No configurar CORS. Mantener Redis y el puerto de la pasarela en una red privada; publicar solo por el proxy TLS.

## Límites actuales

- No provisiona organizaciones ni crea API keys; eso requiere un flujo administrativo previo.
- Postiz rechaza por esta API a proveedores cuyo conector requiera una URL externa. El enlace solo funciona para proveedores OAuth compatibles.
- La política de TikTok, los permisos aprobados y el uso externo real siguen dependiendo de TikTok. Esta pasarela no cambia la revisión ni permite publicar con scopes no aprobados.
- El flujo requiere una prueba aislada por proveedor antes de producción, incluida la vuelta del callback sin una sesión Postiz.

## Estado de implementación · 26-oct-2026

- La pasarela se construyó en el Mac mini como `local/postiz-oauth-gateway:candidate-20261026`. No está desplegada ni tiene tenants, API keys, Redis o dominio configurados.
- El candidato Postiz `v2.25.2` quedó supersedido y no debe desplegarse: el proyecto publicó `v2.25.3` con dos correcciones de seguridad adicionales. Producción continúa en `v2.25.1-kb`; la versión fijada en este repositorio ya apunta a `v2.25.3`, pendiente de reconstrucción controlada.
- La revisión estática del flujo OAuth de la versión candidata anterior indica que el endpoint público fija el ID de organización y el verifier al generar `state`; el callback de integraciones sin sesión recupera la organización y trata el estado como usado/caducado tras consumirlo. En principio permite autorizar sin cuenta Postiz; queda validación en navegador aislado por proveedor. La pasarela local no ha completado ese flujo de extremo a extremo.
- La pasarela no resuelve el provisionamiento privado de organizaciones ni la creación de sus API keys; ese es el siguiente bloque antes de probar una cuenta real.
- La capa de marca existente modifica `posts.controller.js` para roles `USER`, mientras que el controlador de Public API tiene su propia ruta `POST /posts` con clave de organización. No usar el parche actual como aprobación completa; imponer aprobación en la futura API de publicaciones de Koolbrand y proteger las claves.
- La emisión de enlaces se movió a un CLI interno después de la revisión: el servicio público no expone un endpoint que permita solicitar OAuth para cualquier cliente. La configuración de `PUBLIC_BASE_URL` también falla si incluye una subruta, se rechazan destinos OAuth con credenciales embebidas o puertos no estándar y la API Postiz no puede redirigir la solicitud HTTP a otro host.
- Modelo acordado: Koolbrand gestiona Postiz; cada cliente inicia y autoriza su propia conexión social. Cada cliente debe tener una organización Postiz aislada y una clave API distinta; no reutilizar la organización Koolbrand para canales de clientes.
- El alta de organizaciones y la custodia de claves siguen pendientes. La ruta debe usar servicios oficiales de Postiz (sin escrituras directas a SQL), autenticar al operador Koolbrand y guardar la clave en un almacén secreto del servidor; nunca devolverla al cliente ni al navegador.
