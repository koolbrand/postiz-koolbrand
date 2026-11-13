# Capa simple: la imagen que corre hoy en producción

Desde el 13-nov-2026, `redes.koolbrand.com` corre **Postiz v2.25.3 oficial + la capa de marca**, construida con
este `Dockerfile`. No lleva el parche multi-cliente (`patches/`): esa es la construcción desde fuente del
`Dockerfile` de la raíz, que todavía no se ha desplegado.

## Qué hace

Parte de `ghcr.io/gitroomhq/postiz-app:<versión>` y aplica, sobre el frontend ya compilado:

| Script | Qué cambia |
|---|---|
| (en el `Dockerfile`) | CSS de marca, logos y favicon |
| `marca/recolorear.sh` | colores de Postiz por los de la marca |
| `marca/linkedin-perfil.sh` | el perfil de LinkedIn pide solo los permisos mínimos |
| `capa-simple/idioma-es.sh` | español por defecto |
| `marca/aprobacion.sh` | el rol USER solo guarda borradores |
| `marca/uploads-video.sh` | los vídeos subidos cargan al abrirlos en una pestaña |

Cada script **falla y corta la construcción** si no encuentra lo que tiene que cambiar. Así una versión nueva de
Postiz que cambie por dentro no llega a producción a medias.

`capa-simple/idioma-es.sh` es distinto de `marca/idioma-es.sh` a propósito: aquí no hay fuente que cambiar, se
cambia el resultado compilado. Reconoce las tres formas vistas hasta la v2.25.3.

## Construir

Desde la raíz del repositorio, en el Mac mini (arm64):

```bash
docker build -f capa-simple/Dockerfile --build-arg POSTIZ_VERSION=v2.25.3 -t local/postiz-kb:v2.25.3-kb-AAAAMMDD .
```

La imagen queda solo en esa máquina. No se publica en GHCR: las etiquetas `:<versión>-kb` y `:latest-kb` de GHCR
son de la construcción desde fuente.

## Poner en producción

En `~/servicios/postiz` del Mac mini:

1. Copia: `pg_dump -Fc` de la base a `backups/pre-<versión>-<fecha>/`, más `compose.yml` y `.env`. Comprobar que
   la copia se lee con `pg_restore -l`.
2. Poner `POSTIZ_IMAGE=local/postiz-kb:<etiqueta>` en `.env`.
3. `docker compose up -d postiz` y esperar a que `GET /api/auth/can-register` devuelva `{"register":false}`.
4. Comprobar: versión, canales, marca, idioma y una publicación real.

**Volver atrás:** restaurar el valor anterior de `POSTIZ_IMAGE` (o borrar la línea para la imagen por defecto del
compose) y `docker compose up -d postiz`. De la v2.25.1 a la v2.25.3 el único cambio de esquema es una columna
opcional, `User.timezoneName`.

## Los vídeos subidos (`marca/uploads-video.sh`)

Postiz sirve `/uploads/` con `Content-Security-Policy: …; sandbox`. Con `sandbox` a secas la página queda con origen
opaco y Chrome no carga el vídeo en su reproductor: se abre vacío en 0:00. Probado con el mismo MP4 y seis
cabeceras: añadir el host a `media-src` o usar `media-src *` no lo arregla; `sandbox allow-same-origin` sí.
Los archivos subidos siguen sin poder ejecutar código: no hay `allow-scripts` y `script-src 'none'` no se toca.
