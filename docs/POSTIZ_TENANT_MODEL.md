# Postiz multi-cliente: modelo operativo

**Decisión:** Koolbrand opera Postiz. Cada cliente concede OAuth de sus propias redes desde un enlace controlado por Koolbrand. El cliente no recibe acceso al panel de Postiz.

## Aislamiento

- Una organización Postiz por cliente; canales, calendario, medios, miembros y analítica quedan dentro de esa organización.
- Personal interno de Koolbrand es miembro de las organizaciones que gestiona, con el rol mínimo que permita el trabajo.
- Una API key distinta por organización. La clave vive en el servidor de la pasarela, con acceso restringido; nunca en el navegador, enlaces, tickets o repositorio.
- Bella, Koolbrand y Northkin aparecen en organizaciones separadas en la lectura en vivo de canales del 26-oct. La asignación visible no demuestra aislamiento de medios, publicaciones, métricas ni miembros; falta comprobar esos límites con usuarios de prueba.
- Cada autorización social la completa el titular en el dominio oficial de la plataforma. Koolbrand nunca solicita su contraseña ni código 2FA.

## Flujo de conexión

1. Operador Koolbrand identifica cliente, red y organización ya provisionada.
2. La pasarela emite un enlace de un solo uso, limitado a ese cliente y proveedor, que caduca en 10 minutos.
3. El cliente revisa el nombre del cliente y la red y pulsa continuar.
4. La pasarela llama a la API pública de Postiz con la clave interna de esa organización y valida el destino OAuth antes de entregar la navegación.
5. El cliente inicia sesión directamente en la plataforma y acepta los permisos mostrados.
6. Se comprueba que el canal recién conectado aparece solo en la organización esperada, y se registra proveedor, fecha y resultado sin guardar tokens de OAuth en logs.

La aprobación de una app de plataforma y sus permisos no la sustituye Postiz. TikTok requiere aprobación de su propia app/scopes y políticas; una conexión OAuth exitosa no garantiza permiso para publicación pública.

## Publicación y aprobación

- Postiz es la agenda y motor de publicación; el panel interno de Koolbrand añade el flujo de aprobación y auditoría.
- Las claves de publicación permanecen en servidor. Para toda creación, edición o envío desde API se valida el ID de canal contra el tenant autenticado y se registra autor, aprobador, payload, red, hora y resultado.
- Borradores no salen a la red. Programar o publicar queda sujeto al flujo de aprobación vigente y a los controles nativos de la plataforma.
- No considerar suficiente el parche actual del controlador de publicaciones del panel: la API pública de Postiz tiene una ruta separada.

## Camino hacia un “Metricool propio”

1. **Base segura:** actualizar el Postiz mantenido a una versión sin avisos críticos; respaldar Postgres y compose; verificar restauración documentada; mantener registro privado cerrado.
2. **Piloto de tenants:** Bella y un cliente piloto con organizaciones separadas, autorización Facebook/Instagram y TikTok solo si el proveedor permite la app y los scopes.
3. **Operación agencia:** alta/baja de tenants, enlaces OAuth, permisos por empleado, secretos por tenant, renovación/reconexión y registro de auditoría.
4. **Capa de aprobación:** borrador → revisión interna → aprobación explícita del cliente o su regla acordada → programación/publicación. Incluir preview por red y estado del trabajo.
5. **Analítica:** importar métricas soportadas por API y permiso, normalizar cuenta/red/periodo, mostrar cobertura y última actualización; no inventar métricas que el proveedor no expone.
6. **Comparativas e informes:** rendimiento por red y cliente, histórico, mejores horas cuando hay datos suficientes, exportación y tareas de optimización. Respetar scopes y retención.

## Límites comprobados y pendientes

- La publicación Postiz v2.25.3 corrige dos avisos de seguridad comunicados por el proyecto; se debe reconstruir y revisar esta versión antes de desplegar. Producción y el candidato local necesitan verificación con La Puerta antes de confirmar sus hashes/versiones actuales.
- La pasarela OAuth existe como candidato local, pero no está configurada ni desplegada; faltan Redis, dominio, configuración de tenants, API keys aisladas y una prueba por proveedor.
- No encontramos una ruta administrativa pública de privilegio mínimo para crear tenants. El código oficial incluye `POST /enterprise/create-user`, pero crea un usuario `SUPERADMIN` sintético y una organización `ULTIMATE` con cuota de un millón de canales mediante un JWT firmado con `JWT_SECRET`; no usarlo como aprovisionamiento de clientes. Implementar un endpoint interno específico de Koolbrand con autorización de operador, idempotencia, rol mínimo, límites de canales y auditoría, y someterlo a revisión antes de staging. No hacer escrituras directas SQL.
- TikTok y cualquier red pueden limitar scopes, tipos de cuenta, publicación directa, analytics o revisión de app. La matriz de capacidades debe reflejarlo por proveedor y cuenta.
- Postiz no aparece en el inventario de apps desplegables de Coolify de La Puerta; por tanto, el despliegue no está habilitado por ese camino. No usar SSH como atajo: incorporar una capacidad autorizada en La Puerta o pedir al responsable de infraestructura que lo ejecute mediante el procedimiento documentado.

## Criterios para llamar al piloto listo

- Dos tenants sin exposición de canales, medios, posts o analytics entre sí.
- Enlace caducado/reutilizado y proveedor o tenant manipulado fallan cerrados.
- OAuth completado por el titular y el canal aparece bajo el cliente correcto.
- Una publicación de prueba en borrador no sale; una programada solo sale tras la autorización prevista y deja evidencia.
- Reconectar, revocar, rotar claves, respaldar y restaurar están documentados.
- El dashboard informa datos disponibles y ausentes por API, no promedia periodos incompatibles y muestra la fecha de sincronización.

