import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { createClient } from 'redis';

const port = Number(process.env.PORT || 8090);
const redisUrl = process.env.REDIS_URL;
const postizApiUrl = process.env.POSTIZ_PUBLIC_API_URL;
const publicBaseUrl = process.env.PUBLIC_BASE_URL;
const tenantsFile = process.env.TENANTS_FILE || '/run/secrets/postiz-oauth-tenants.json';
const tokenTtlSeconds = Number(process.env.LINK_TTL_SECONDS || 600);
const linkPrefix = 'kb-postiz-oauth:';

for (const [key, value] of Object.entries({ redisUrl, postizApiUrl, publicBaseUrl })) {
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
}
if (!postizApiUrl.startsWith('https://')) throw new Error('POSTIZ_PUBLIC_API_URL must use HTTPS');
if (!publicBaseUrl.startsWith('https://')) throw new Error('PUBLIC_BASE_URL must use HTTPS');
if (!Number.isInteger(tokenTtlSeconds) || tokenTtlSeconds < 60 || tokenTtlSeconds > 1800) {
  throw new Error('LINK_TTL_SECONDS must be between 60 and 1800');
}

const apiBase = new URL(postizApiUrl);
if (apiBase.username || apiBase.password || apiBase.search || apiBase.hash) {
  throw new Error('POSTIZ_PUBLIC_API_URL cannot include credentials, query, or fragment');
}
const publicBase = new URL(publicBaseUrl);
if (publicBase.username || publicBase.password || publicBase.search || publicBase.hash) {
  throw new Error('PUBLIC_BASE_URL cannot include credentials, query, or fragment');
}
if (publicBase.pathname !== '/') throw new Error('PUBLIC_BASE_URL must be an origin without a path');

const tenants = JSON.parse(await readFile(tenantsFile, 'utf8'));
const redis = createClient({ url: redisUrl });
redis.on('error', () => console.error('redis connection error'));
await redis.connect();

const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><meta http-equiv="Cache-Control" content="no-store"><title>Autorizar una red social</title><style>body{font:16px system-ui,sans-serif;color:#111;background:#f2f1ef;margin:0;display:grid;min-height:100vh;place-items:center}.card{background:#fff;border:1px solid #ddd;border-radius:16px;padding:32px;max-width:520px;margin:20px}button{background:#cce673;border:0;border-radius:9px;padding:14px 22px;font:600 16px system-ui;cursor:pointer}button:disabled{opacity:.5}p{line-height:1.5}.muted{color:#555}</style><main class="card"><h1>Conectar una cuenta social</h1><p id="message" class="muted">Comprobando el enlace seguro…</p><button id="continue" hidden disabled>Continuar a la red social</button></main><script>
const token=location.hash.slice(1); history.replaceState(null,'',location.pathname);
const message=document.querySelector('#message'), button=document.querySelector('#continue');
async function send(path){const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({token})});const data=await r.json();if(!r.ok)throw new Error(data.error||'El enlace no está disponible');return data;}
try{if(!token)throw new Error('Falta el código del enlace.');const data=await send('/v1/preview');message.textContent='Vas a autorizar '+data.providerLabel+' para '+data.tenantName+'. Inicia sesión en la red y acepta los permisos que se muestran allí.';button.hidden=false;button.disabled=false;button.onclick=async()=>{button.disabled=true;message.textContent='Abriendo la autorización segura…';try{const next=await send('/v1/authorize');location.replace(next.url)}catch(e){message.textContent=e.message;button.disabled=false}}}catch(e){message.textContent=e.message}
</script></html>`;

const providerLabels = {
  facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube',
  linkedin: 'LinkedIn', x: 'X', threads: 'Threads', pinterest: 'Pinterest', reddit: 'Reddit',
};

function reply(res, status, data, headers = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    ...headers,
  });
  res.end(body);
}

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function readJson(req, maxBytes = 2048) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let body = '';
    req.on('data', chunk => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Request too large'));
        req.destroy();
        return;
      }
      body += chunk.toString('utf8');
    });
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function resolveTenant(slug) {
  const tenant = tenants[slug];
  if (!tenant || typeof tenant.name !== 'string' || !tenant.name ||
      typeof tenant.apiKey !== 'string' || !tenant.apiKey ||
      !tenant.providers || typeof tenant.providers !== 'object') return null;
  return tenant;
}

function resolveProvider(tenant, provider) {
  if (!/^[a-z0-9-]{2,32}$/.test(provider)) return null;
  const hosts = tenant.providers[provider];
  if (!Array.isArray(hosts) || hosts.length === 0 ||
      hosts.some(host => typeof host !== 'string' || !/^[a-z0-9.-]+$/.test(host))) return null;
  return hosts;
}

async function linkRecord(token) {
  const value = await redis.get(`${linkPrefix}${tokenHash(token)}`);
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

async function handle(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/healthz') {
    return reply(res, 200, { ok: true });
  }
  if (req.method === 'GET' && url.pathname === '/authorize') {
    res.writeHead(200, {
      'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store, max-age=0',
      'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
      'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    });
    return res.end(html);
  }
  if (req.method === 'POST' && (url.pathname === '/v1/preview' || url.pathname === '/v1/authorize')) {
    const body = await readJson(req);
    const token = body.token;
    if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{40,64}$/.test(token)) {
      return reply(res, 400, { error: 'Enlace no válido o caducado.' });
    }
    let record;
    if (url.pathname.endsWith('/authorize')) {
      const raw = await redis.getDel(`${linkPrefix}${tokenHash(token)}`);
      try { record = raw ? JSON.parse(raw) : null; } catch { record = null; }
    } else {
      record = await linkRecord(token);
    }
    const tenant = record && resolveTenant(record.tenant);
    const hosts = tenant && resolveProvider(tenant, record.provider);
    if (!record || !tenant || !hosts) return reply(res, 410, { error: 'Enlace no válido o caducado.' });
    if (url.pathname.endsWith('/preview')) {
      return reply(res, 200, { tenantName: tenant.name, providerLabel: providerLabels[record.provider] || record.provider });
    }

    let upstream;
    try {
      upstream = await fetch(new URL(`${apiBase.pathname.replace(/\/$/, '')}/social/${encodeURIComponent(record.provider)}`, apiBase.origin), {
        headers: { Authorization: tenant.apiKey, Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      return reply(res, 502, { error: 'No se pudo iniciar la conexión. Pide a Koolbrand un enlace nuevo.' });
    }
    if (!upstream.ok) {
      return reply(res, 502, { error: 'Postiz no admite esta conexión con la configuración actual. Pide ayuda a Koolbrand.' });
    }
    let data;
    try { data = await upstream.json(); } catch { data = null; }
    let target;
    try { target = new URL(data?.url); } catch { target = null; }
    if (!target || target.protocol !== 'https:' || target.username || target.password ||
        (target.port && target.port !== '443') || !hosts.includes(target.hostname.toLowerCase())) {
      return reply(res, 502, { error: 'El proveedor devolvió un destino de autorización inesperado.' });
    }
    return reply(res, 200, { url: target.toString() });
  }
  return reply(res, 404, { error: 'Not found' });
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(() => {
    if (!res.headersSent) reply(res, 500, { error: 'Internal server error' });
    else res.destroy();
  });
});
server.listen(port, '0.0.0.0', () => console.log(`OAuth gateway listening on ${port}`));

async function shutdown() {
  server.close(async () => {
    await redis.quit();
    process.exit(0);
  });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
