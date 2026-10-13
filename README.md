# Postiz · capa de marca Koolbrand × Simuloo

Nuestro «Blotato propio» (https://redes.koolbrand.com) es **Postiz** (AGPL-3.0, https://github.com/gitroomhq/postiz-app)
con una capa de marca encima. **No es un fork**: la imagen parte de la oficial y solo añade:

- `marca/kb-postiz.css` — redefine las variables de color de Postiz con los tokens de Simuloo/Koolbrand
  (lima `#CCE673`, tinta `#111111`, crema `#F2F1EF`), Inter Tight + JetBrains Mono, foco en lima, logos.
- Logos y favicon de Koolbrand.

Así cada versión nueva de Postiz se aprovecha cambiando una línea (`POSTIZ_VERSION`).

## Cómo se actualiza
1. `vigilar-version.yml` abre una issue cada vez que Postiz publica versión.
2. Se revisan las notas, se cambia `POSTIZ_VERSION` y se hace push.
3. `construir.yml` publica `ghcr.io/koolbrand/postiz-koolbrand:<versión>-kb`.
4. Se prueba y se cambia la etiqueta en Coolify.

Si un cambio de Postiz rompe una pieza de la marca, esa pieza vuelve al estilo original de Postiz; la app no se rompe.

## Licencia
AGPL-3.0, como Postiz. Este repositorio publica todos los cambios que hacemos sobre su código.
