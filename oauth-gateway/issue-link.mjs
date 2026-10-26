import { createHash, randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { userInfo } from 'node:os';
import { createClient } from 'redis';

const [tenantSlug, provider] = process.argv.slice(2);
const processUser = userInfo().username;
const processUid = typeof process.getuid === 'function' ? process.getuid() : null;
if (!tenantSlug || !provider || !processUser || !Number.isInteger(processUid) || processUid < 1 ||
    (typeof process.geteuid === 'function' && process.geteuid() !== processUid)) {
  console.error('Uso: node issue-link.mjs <tenant> <provider> (ejecutar como usuario de servicio no-root, sin cambiar UID)');
  process.exit(2);
}

const redisUrl = process.env.REDIS_URL;
const publicBaseUrl = process.env.PUBLIC_BASE_URL;
const tenantsFile = process.env.TENANTS_FILE || '/run/secrets/postiz-oauth-tenants.json';
const tokenTtlSeconds = Number(process.env.LINK_TTL_SECONDS || 600);
if (!redisUrl || !publicBaseUrl) throw new Error('Faltan REDIS_URL o PUBLIC_BASE_URL');
if (!Number.isInteger(tokenTtlSeconds) || tokenTtlSeconds < 60 || tokenTtlSeconds > 1800) {
  throw new Error('LINK_TTL_SECONDS debe estar entre 60 y 1800');
}
const base = new URL(publicBaseUrl);
if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash || base.pathname !== '/') {
  throw new Error('PUBLIC_BASE_URL debe ser un origen HTTPS sin ruta');
}
const tenants = JSON.parse(await readFile(tenantsFile, 'utf8'));
const tenant = tenants[tenantSlug];
if (!tenant || typeof tenant.name !== 'string' || !tenant.name ||
    typeof tenant.apiKey !== 'string' || !tenant.apiKey || !tenant.providers ||
    !Array.isArray(tenant.providers[provider]) || tenant.providers[provider].length === 0 ||
    tenant.providers[provider].some(host => typeof host !== 'string' || !/^[a-z0-9.-]+$/.test(host))) {
  throw new Error('Tenant o proveedor no configurado');
}

const token = randomBytes(32).toString('base64url');
const key = `kb-postiz-oauth:${createHash('sha256').update(token).digest('hex')}`;
const redis = createClient({ url: redisUrl });
redis.on('error', () => console.error('redis connection error'));
await redis.connect();
try {
  const result = await redis.set(key, JSON.stringify({ tenant: tenantSlug, provider, issuedAt: Date.now() }), {
    EX: tokenTtlSeconds,
    NX: true,
  });
  if (result !== 'OK') throw new Error('No se pudo crear un enlace único');
} finally {
  await redis.quit();
}

console.log(JSON.stringify({
  event: 'oauth_link_issued',
  processSystemUser: processUser,
  processUid,
  tenant: tenantSlug,
  provider,
  issuedAt: new Date().toISOString(),
  expiresInSeconds: tokenTtlSeconds,
}));
console.log(`${base.origin}/authorize#${token}`);
