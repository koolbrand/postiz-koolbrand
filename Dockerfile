# Build reproducible desde el código fuente oficial de Postiz más el patch Koolbrand.
# POSTIZ_VERSION y POSTIZ_UPSTREAM_COMMIT fijan exactamente la fuente que se compila.
ARG POSTIZ_VERSION=v2.25.3
ARG POSTIZ_UPSTREAM_COMMIT
ARG NEXT_PUBLIC_VERSION=${POSTIZ_VERSION}
FROM node:22.23.4-bookworm-slim
ARG POSTIZ_VERSION
ARG POSTIZ_UPSTREAM_COMMIT
ARG NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_VERSION=${NEXT_PUBLIC_VERSION}

RUN apt-get update && apt-get install -y --no-install-recommends \
      git g++ make python3-pip bash nginx \
    && rm -rf /var/lib/apt/lists/*
RUN npm --no-update-notifier --no-fund --global install pnpm@10.6.1 pm2

WORKDIR /app
RUN test -n "${POSTIZ_UPSTREAM_COMMIT}" \
    && git clone --depth 1 --branch "${POSTIZ_VERSION}" https://github.com/gitroomhq/postiz-app.git /app \
    && git checkout --detach "${POSTIZ_UPSTREAM_COMMIT}" \
    && test "$(git rev-parse HEAD)" = "${POSTIZ_UPSTREAM_COMMIT}" \
    && git config --global url."https://github.com/".insteadOf "git@github.com:" \
    && git submodule update --init --depth 1

COPY patches/postiz-v2.25.3.patch /tmp/postiz-koolbrand.patch
RUN git apply --unidiff-zero --check /tmp/postiz-koolbrand.patch \
    && git apply --unidiff-zero /tmp/postiz-koolbrand.patch

COPY marca/ /kb-marca/
RUN cp /app/var/docker/nginx.conf /etc/nginx/nginx.conf \
    && sed -i 's/^user[[:space:]]\+www;/user www-data;/' /etc/nginx/nginx.conf
RUN pnpm install
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm run build

# 1) CSS: cada CSS compilado de Next (static/css hasta v2.10, static/chunks con Turbopack desde v2.2x) importa al principio Google Fonts y nuestra capa
#    (/kb-postiz.css?v=<hash>) y se RENOMBRA a <nombre>-kb<hash>.css, actualizando
#    los manifiestos de Next: así ningún navegador se queda con una copia vieja
#    (Next sirve su CSS con caché «immutable» de un año).
# 2) Logos: ficheros propios en public/ con prefijo kb- (en la RAÍZ: el middleware
#    de Postiz manda al login cualquier ruta con carpeta, p. ej. /kb/…) y sustitución
#    de favicon/postiz.svg/logo.svg.
# La imagen usa busybox: nada de grep --include. Si algo no cuadra, la construcción FALLA.
RUN set -eu; \
    V=$(sha256sum /kb-marca/kb-postiz.css | cut -c1-10); \
    PUB=$(find / -path /proc -prune -o -path '*/frontend/public/postiz.svg' -print 2>/dev/null); \
    [ -n "$PUB" ] || { echo 'No encuentro public/ de Postiz'; exit 1; }; \
    for p in $PUB; do d=$(dirname "$p"); \
      cp /kb-marca/kb-postiz.css "$d/kb-postiz.css"; cp /kb-marca/k.svg "$d/kb-k.svg"; \
      cp /kb-marca/koolbrand-negativo.svg "$d/kb-koolbrand-negativo.svg"; cp /kb-marca/koolbrand-positivo.svg "$d/kb-koolbrand-positivo.svg"; \
      cp /kb-marca/k.svg "$d/postiz.svg"; cp /kb-marca/k.svg "$d/logo.svg"; \
      cp /kb-marca/favicon.ico "$d/favicon.ico"; cp /kb-marca/favicon.png "$d/favicon.png"; cp /kb-marca/favicon.png "$d/postiz-fav.png"; \
      [ -f "$d/no-channels-colors.svg" ] && sed -i 's/#DACBFB/#CCE673/Ig; s/#E7DDFE/#E3F1B9/Ig' "$d/no-channels-colors.svg"; \
    done; \
    CSS=$(find / -path /proc -prune -o \( -path '*/.next/static/css/*.css' -o -path '*/.next/static/chunks/*.css' \) -print 2>/dev/null | grep -v node_modules || true); \
    [ -n "$CSS" ] || { echo 'No encuentro el CSS compilado de Postiz'; exit 1; }; \
    for f in $CSS; do \
      viejo=$(basename "$f"); nuevo="${viejo%.css}-kb$V.css"; \
      raiz=$(dirname "$(dirname "$(dirname "$f")")"); \
      { printf "@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');\n"; \
        printf "@import url('/kb-postiz.css?v=%s');\n" "$V"; \
        cat "$f"; } > "$(dirname "$f")/$nuevo"; rm "$f"; \
      find "$raiz" -path "$raiz/cache" -prune -o -type f \( -name '*.json' -o -name '*.js' -o -name '*.html' -o -name '*.rsc' -o -name '*.body' -o -name '*.meta' \) -print \
        | while read -r g; do if grep -qF "$viejo" "$g"; then sed -i "s/$viejo/$nuevo/g" "$g"; fi; done; \
      if find "$raiz" -path "$raiz/cache" -prune -o -type f \( -name '*.json' -o -name '*.js' -o -name '*.html' \) -print | xargs grep -lF "$viejo" 2>/dev/null | grep -q .; then \
        echo "Quedan referencias a $viejo"; exit 1; fi; \
    done; \
    find /app/apps/frontend/.next -path '*/cache' -prune -o -type f \( -name '*.json' -o -name '*.js' \) -print | xargs grep -lF "kb$V" 2>/dev/null | grep -q . || { echo 'Ningún manifiesto apunta al CSS nuevo'; exit 1; }; \
    echo "Capa de marca v=$V aplicada a $(echo "$CSS" | wc -l) CSS"; \
    for n in $(find / -path /proc -prune -o -type d -name .next -print 2>/dev/null | grep -v node_modules); do sh /kb-marca/recolorear.sh "$n"; done; \
    for p in $PUB; do sh /kb-marca/recolorear.sh "$(dirname "$p")"; done; \
    sh /kb-marca/linkedin-perfil.sh; \
    sh /kb-marca/idioma-es.sh

LABEL org.opencontainers.image.source="https://github.com/koolbrand/postiz-koolbrand" \
      org.opencontainers.image.description="Postiz source build con aislamiento multi-cliente y marca Koolbrand" \
      org.opencontainers.image.licenses="AGPL-3.0"

CMD ["sh", "-c", "nginx && pnpm run pm2"]
