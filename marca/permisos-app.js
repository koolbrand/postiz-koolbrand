// Permisos por usuario DENTRO de la app (15-oct-2026).
// Postiz no restringe por usuario: un miembro ve todos los canales de la organización. Adrián:
// «la app debe tener filtros por usuarios» sin volver a conectar cuentas. Este parche:
//   1) apunta en la organización de cada petición el email de quien la hace (kbEmail);
//   2) instala /app/kb-permisos.js, que lee /kb-permisos/permisos.json
//      {"app": {"email": {"clientes": [...], "integraciones": [ids]}}} (lo escribe
//      ~/.koolbrand/bin/postiz-permisos-sync.py en el Mac mini; volumen de solo lectura);
//   3) filtra canales, clientes, agenda (en la consulta a la base de datos) y estadísticas, y
//      rechaza publicar en canales ajenos. Quien no aparece en el fichero lo ve todo.
// Si una versión nueva de Postiz cambia el código, la construcción FALLA aquí (no se queda a medias).
const fs = require('fs');
const path = require('path');

const RAIZ = '/app/apps/backend/dist';
const BUSCAR = (nombre) => {
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (p.endsWith(nombre)) out.push(p);
    }
  };
  walk(RAIZ);
  if (!out.length) throw new Error(`permisos-app: no encuentro ${nombre}`);
  return out;
};
const cambiar = (fichero, viejo, nuevo, marca) => {
  let s = fs.readFileSync(fichero, 'utf8');
  if (s.includes(marca)) return;
  if (!s.includes(viejo)) throw new Error(`permisos-app: no encuentro el punto en ${fichero}:\n${viejo}`);
  s = s.replace(viejo, nuevo);
  fs.writeFileSync(fichero, s);
};

// 2) módulo de permisos
fs.writeFileSync('/app/kb-permisos.js', `
const fs = require('fs');
const RUTA = '/kb-permisos/permisos.json';
let cache = { t: 0, d: null };
function datos() {
  const ahora = Date.now();
  if (ahora - cache.t > 5000) {
    try { cache.d = JSON.parse(fs.readFileSync(RUTA, 'utf8')); } catch (e) { cache.d = null; }
    cache.t = ahora;
  }
  return cache.d;
}
function de(org) {
  const email = org && org.kbEmail;
  if (!email) return null;
  const d = datos();
  const p = d && d.app && d.app[email];
  if (!p) return null;
  return { clientes: (p.clientes || []).map((x) => String(x).toLowerCase()), integraciones: p.integraciones || [] };
}
module.exports = {
  de,
  canal(org, id) { const p = de(org); return !p || p.integraciones.includes(id); },
  cliente(org, nombre) { const p = de(org); return !p || p.clientes.includes(String(nombre || '').toLowerCase()); },
};
`);
const KB = "require('/app/kb-permisos.js')";

// 1) email de quien pide
for (const f of BUSCAR('services/auth/auth.middleware.js')) {
  cambiar(f, 'req.org = setOrg;',
    "req.org = setOrg; /* kb-permisos */ try { setOrg.kbEmail = String(user.email || '').toLowerCase(); } catch (e) {}",
    'kb-permisos');
}

// 3a) canales y clientes
for (const f of BUSCAR('api/routes/integrations.controller.js')) {
  cambiar(f, '(await this._integrationService.getIntegrationsList(org.id)).map(',
    `(await this._integrationService.getIntegrationsList(org.id)).filter((p) => /* kb-permisos */ ${KB}.canal(org, p.id)).map(`,
    'kb-permisos');
  cambiar(f, 'return this._integrationService.customers(org.id);',
    `return Promise.resolve(this._integrationService.customers(org.id)).then((cs) => (cs || []).filter((c) => /* kb-permisos-c */ ${KB}.cliente(org, c.name)));`,
    'kb-permisos-c');
}

// 3b) agenda y publicar
for (const f of BUSCAR('api/routes/posts.controller.js')) {
  cambiar(f, 'return this._postsService.getPostsMinified(org.id, query);',
    `{ const kb = /* kb-permisos-a */ ${KB}.de(org); if (kb) query = { ...query, kbIntegraciones: kb.integraciones }; }\n        return this._postsService.getPostsMinified(org.id, query);`,
    'kb-permisos-a');
  cambiar(f, 'return this._postsService.getPostsList(org.id, query);',
    `{ const kb = /* kb-permisos-l */ ${KB}.de(org); if (kb) query = { ...query, kbIntegraciones: kb.integraciones }; }\n        return this._postsService.getPostsList(org.id, query);`,
    'kb-permisos-l');
  cambiar(f, '    async createPost(org, rawBody) {',
    `    async createPost(org, rawBody) {\n        /* kb-permisos-p */ { const kb = ${KB}.de(org); if (kb && (rawBody?.posts || []).some((p) => !kb.integraciones.includes(p?.integration?.id))) { throw new common_1.HttpException("No tienes permiso para publicar en ese canal.", 403); } }`,
    'kb-permisos-p');
}

// 3c) la consulta de la agenda filtra por los canales permitidos
for (const f of BUSCAR('database/prisma/posts/posts.repository.js')) {
  let s = fs.readFileSync(f, 'utf8');
  if (!s.includes('kbIntegraciones')) {
    let n = 0;
    for (const metodo of ['    async getPosts(orgId, query) {', '    async getPostsList(orgId, query) {']) {
      const i = s.indexOf(metodo);
      if (i < 0) throw new Error(`permisos-app: no encuentro ${metodo.trim()}`);
      const j = s.indexOf('\n    async ', i + metodo.length);
      const trozo = s.slice(i, j < 0 ? undefined : j);
      const re = /(integration: \{\n(\s+)deletedAt: null,\n\s+organizationId: orgId,\n)/;
      if (!re.test(trozo)) throw new Error(`permisos-app: no encuentro el filtro de canal en ${metodo.trim()}`);
      const nuevo = trozo.replace(re, (m, a, sangria) => `${a}${sangria}...(query.kbIntegraciones ? { id: { in: query.kbIntegraciones } } : {}),\n`);
      s = s.slice(0, i) + nuevo + (j < 0 ? '' : s.slice(j));
      n++;
    }
    fs.writeFileSync(f, s);
  }
}

// 3d) estadísticas de un canal
for (const f of BUSCAR('api/routes/analytics.controller.js')) {
  cambiar(f, '    async getIntegration(org, integration, date) {',
    `    async getIntegration(org, integration, date) {\n        /* kb-permisos */ if (!${KB}.canal(org, integration)) { throw new (require("@nestjs/common").HttpException)("No tienes permiso en ese canal.", 403); }`,
    'kb-permisos');
}

console.log('permisos-app: filtros por usuario instalados');
