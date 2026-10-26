FROM node:22.16.0-alpine3.22
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY server.mjs issue-link.mjs ./
USER node
EXPOSE 8090
CMD ["node", "server.mjs"]
