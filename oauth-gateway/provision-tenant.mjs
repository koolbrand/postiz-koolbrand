import { createHmac, randomBytes } from 'node:crypto';
import { constants } from 'node:fs';
import { access, appendFile, chmod, copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

const [externalId, ...rest] = process.argv.slice(2);
const actorIndex = rest.indexOf('--actor');
const actor = actorIndex >= 0 ? rest[actorIndex + 1] : '';
const name = rest.filter((_, index) => index !== actorIndex && index !== actorIndex + 1).join(' ').trim();
const providerList = (process.env.POSTIZ_TENANT_PROVIDERS || '').split(',').map(x => x.trim()).filter(Boolean);
const oauthHosts = {
  facebook: ['www.facebook.com'],
  instagram: ['www.facebook.com'],
  tiktok: ['www.tiktok.com'],
  'tiktok-business': ['www.tiktok.com'],
  youtube: ['accounts.google.com'],
  linkedin: ['www.linkedin.com'],
};

if (!externalId || !/^[a-z0-9][a-z0-9_-]{1,63}$/.test(externalId) ||
    name.length < 3 || name.length > 128 ||
    actorIndex < 0 || !/^[^\s@]+@koolbrand\.com$/i.test(actor) ||
    providerList.some(provider => !Object.hasOwn(oauthHosts, provider))) {
  console.error('Uso: POSTIZ_TENANT_PROVIDERS=facebook,instagram node provision-tenant.mjs <id-cliente> <nombre> --actor <email-koolbrand>');
  process.exit(2);
}

const backendUrl = process.env.POSTIZ_BACKEND_URL;
const secret = process.env.KOOLBRAND_TENANT_PROVISIONER_SECRET;
const tenantsFile = process.env.TENANTS_FILE || join(homedir(), '.koolbrand', 'postiz-oauth-tenants.json');
const auditFile = process.env.PROVISION_AUDIT_FILE || join(homedir(), '.koolbrand', 'logs', 'postiz-provisioner.jsonl');
if (!backendUrl || !secret || secret.length < 32) throw new Error('Faltan POSTIZ_BACKEND_URL o una clave del provisionador de 32+ caracteres.');
const backend = new URL(backendUrl);
if (backend.protocol !== 'https:' || backend.pathname !== '/' || backend.username || backend.password || backend.search || backend.hash) {
  throw new Error('POSTIZ_BACKEND_URL debe ser un origen HTTPS, sin ruta, credenciales, query ni fragmento.');
}

const timestamp = String(Date.now());
const nonce = randomBytes(24).toString('hex');
const body = { externalId, name };
const canonical = JSON.stringify([
  'POST',
  '/api/enterprise/managed-tenants',
  timestamp,
  nonce,
  externalId,
  name,
]);
const signature = createHmac('sha256', secret).update(canonical).digest('hex');
const response = await fetch(new URL('/api/enterprise/managed-tenants', backend.origin), {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'x-kb-timestamp': timestamp,
    'x-kb-nonce': nonce,
    'x-kb-signature': signature,
  },
  body: JSON.stringify(body),
  redirect: 'error',
  signal: AbortSignal.timeout(15000),
});
if (!response.ok) throw new Error(`Postiz rechazó el alta (${response.status}); reintentar con el mismo id de cliente es seguro.`);
const provisioned = await response.json();
if (provisioned.externalId !== externalId || !provisioned.organizationId ||
    !provisioned.name || !provisioned.apiKey) {
  throw new Error('Postiz devolvió una respuesta de alta incompleta.');
}

const parent = dirname(tenantsFile);
await mkdir(parent, { recursive: true, mode: 0o700 });
await chmod(parent, 0o700);
const lockDirectory = `${tenantsFile}.lock`;
try {
  await mkdir(lockDirectory, { mode: 0o700 });
} catch (error) {
  if (error.code === 'EEXIST') {
    throw new Error(`Ya hay otro provisionamiento actualizando el registro; si el proceso terminó inesperadamente, verifica el Mac mini y elimina ${lockDirectory} antes de reintentar.`);
  }
  throw error;
}
try {
let tenants = {};
try { tenants = JSON.parse(await readFile(tenantsFile, 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const previous = tenants[externalId];
if (previous?.organizationId && previous.organizationId !== provisioned.organizationId) {
  throw new Error('El id del cliente ya apunta a otra organización; no se sobrescribió el almacén.');
}
const providers = providerList.length ? providerList : (previous?.providers ? Object.keys(previous.providers) : []);
tenants[externalId] = {
  name: provisioned.name,
  organizationId: provisioned.organizationId,
  apiKey: provisioned.apiKey,
  providers: Object.fromEntries(providers.map(provider => [provider, oauthHosts[provider]])),
};
const timestampSlug = new Date().toISOString().replace(/[:.]/g, '-');
try {
  await access(tenantsFile, constants.F_OK);
  await copyFile(tenantsFile, `${tenantsFile}.bak-${timestampSlug}`);
  await chmod(`${tenantsFile}.bak-${timestampSlug}`, 0o600);
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const temporary = `${tenantsFile}.tmp-${process.pid}-${nonce}`;
await writeFile(temporary, `${JSON.stringify(tenants, null, 2)}\n`, { mode: 0o600, flag: 'wx' });
await chmod(temporary, 0o600);
await rename(temporary, tenantsFile);

await mkdir(dirname(auditFile), { recursive: true, mode: 0o700 });
await appendFile(auditFile, `${JSON.stringify({
  event: 'tenant_provisioned',
  actorDeclared: actor,
  externalId,
  organizationId: provisioned.organizationId,
  providers,
  at: new Date().toISOString(),
})}\n`, { mode: 0o600 });
await chmod(auditFile, 0o600);
console.log(JSON.stringify({
  ok: true,
  externalId,
  organizationId: provisioned.organizationId,
  name: provisioned.name,
  providers,
  secretFile: tenantsFile,
}));
} finally {
  await rm(lockDirectory, { recursive: true, force: true });
}
