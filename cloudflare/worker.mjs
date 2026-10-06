/* Same-origin, single-owner sync. No secrets or authenticated data in static assets. */
const SESSION_COOKIE = '__Host-chengci-session';
const FLOW_COOKIE = '__Host-chengci-login';
const JWKS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const LOGIN_TTL = 600;
const SESSION_TTL = 8 * 60 * 60;
const TRUSTED_TTL = 30 * 24 * 60 * 60;
const PAGE_SIZE = 250;
const MAX_BODY = 1024 * 1024;
// 10 operations x 4 SQL statements + session lookup stays below D1 Free's
// documented 50-query invocation limit. Never assume a paid account.
const MAX_OPERATIONS = 10;
const KINDS = ['cards', 'progress', 'favorites', 'study'];
const FIELDS = { word: 300, zhuyin: 1000, meaning: 4000, example: 8000, exampleZhuyin: 16000, note: 8000 };
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,149}$/;
const SECRET = /^[A-Za-z0-9_-]{43}$/;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}
const fail = (status, code) => { throw new HttpError(status, code); };
const seconds = now => Math.floor(now() / 1000);
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function exactKeys(value, keys) {
  if (!plain(value) || Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) fail(400, 'invalid_shape');
}
function validId(value) { return typeof value === 'string' && ID.test(value) && !['constructor', 'prototype'].includes(value); }
function validDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
function base64url(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function fromBase64url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1) fail(401, 'invalid_credential');
  try { return Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4)), ch => ch.charCodeAt(0)); }
  catch { fail(401, 'invalid_credential'); }
}
async function sha256(value) { return base64url(await crypto.subtle.digest('SHA-256', encoder.encode(value))); }
function randomToken() { return base64url(crypto.getRandomValues(new Uint8Array(32))); }
function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let result = 0; for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}
function readCookie(request, name) {
  const values = (request.headers.get('Cookie') || '').split(';').map(part => part.trim()).filter(part => part.startsWith(name + '=')).map(part => part.slice(name.length + 1));
  // Reject ambiguous cookie shadowing rather than silently choosing one.
  if (values.length !== 1) return null;
  return values[0];
}
function cookie(name, value, options = {}) {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=${options.sameSite || 'Lax'}${options.maxAge === undefined ? '' : `; Max-Age=${options.maxAge}`}`;
}
function headers(extra = {}) {
  return new Headers({ 'Cache-Control': 'no-store, private', 'Pragma': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', 'Cross-Origin-Resource-Policy': 'same-origin', ...extra });
}
function json(value, status = 200, extra = {}) {
  return new Response(JSON.stringify(value), { status, headers: headers({ 'Content-Type': 'application/json; charset=utf-8', ...extra }) });
}
function empty(status = 204) { return new Response(null, { status, headers: headers() }); }
// The allowlist comes only from trusted Worker environment configuration.
// Reject unnormalized/ambiguous addresses instead of silently transforming them.
// There is deliberately no built-in owner and no browser-supplied fallback.
function validOwnerEmail(value) {
  if (typeof value !== 'string' || value.length > 254 || value !== value.trim() || value !== value.toLowerCase()) return false;
  const parts = value.split('@');
  return parts.length === 2 && /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?$/.test(parts[0]) && !parts[0].includes('..') &&
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(parts[1]);
}
function config(env) {
  let origin;
  try { const url = new URL(env.APP_ORIGIN); if (url.protocol === 'https:' && url.origin === env.APP_ORIGIN && !url.username && !url.password) origin = url.origin; } catch {}
  const enabled = env.SYNC_ENABLED === 'true' && validOwnerEmail(env.OWNER_EMAIL) &&
    typeof env.GOOGLE_CLIENT_ID === 'string' && /^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(env.GOOGLE_CLIENT_ID) &&
    (!env.OWNER_SUB || /^[A-Za-z0-9_-]{1,255}$/.test(env.OWNER_SUB)) && !!origin && !!env.DB;
  return { enabled, origin, ownerEmail: validOwnerEmail(env.OWNER_EMAIL) ? env.OWNER_EMAIL : null, ownerSub: env.OWNER_SUB || null, clientId: env.GOOGLE_CLIENT_ID };
}
function ensureOrigin(request, cfg, mutation = false) {
  if (new URL(request.url).origin !== cfg.origin) fail(403, 'wrong_origin');
  const origin = request.headers.get('Origin');
  if ((origin && origin !== cfg.origin) || (mutation && origin !== cfg.origin)) fail(403, 'wrong_origin');
  const site = request.headers.get('Sec-Fetch-Site');
  if (site && !['same-origin', 'none'].includes(site)) fail(403, 'cross_origin_request');
}
async function boundedText(request, max = MAX_BODY) {
  const length = request.headers.get('Content-Length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > max)) fail(413, 'body_too_large');
  if (!request.body) return '';
  const reader = request.body.getReader(); let total = 0; const chunks = [];
  for (;;) { const { value, done } = await reader.read(); if (done) break; total += value.byteLength; if (total > max) { await reader.cancel(); fail(413, 'body_too_large'); } chunks.push(value); }
  const bytes = new Uint8Array(total); let at = 0; for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length; }
  try { return decoder.decode(bytes); } catch { fail(400, 'invalid_encoding'); }
}
async function readJSON(request) {
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) fail(415, 'json_required');
  try { return JSON.parse(await boundedText(request)); } catch (error) { if (error instanceof HttpError) throw error; fail(400, 'invalid_json'); }
}
function validateOperation(value) {
  exactKeys(value, ['kind', 'id', 'operationId', 'baseRevision', 'deleted', 'updatedAt', 'data']);
  const { kind, id, operationId, baseRevision, deleted, updatedAt, data } = value;
  if (!KINDS.includes(kind) || !validId(id) || !validId(operationId) || !Number.isSafeInteger(baseRevision) || baseRevision < 0 || baseRevision >= Number.MAX_SAFE_INTEGER || typeof deleted !== 'boolean' || !validDate(updatedAt)) fail(400, 'invalid_operation');
  let normalized;
  if (kind === 'cards') {
    exactKeys(data, [...Object.keys(FIELDS), 'pronunciationStatus']); normalized = {};
    for (const [field, limit] of Object.entries(FIELDS)) { if (typeof data[field] !== 'string' || data[field].length > limit) fail(400, 'invalid_card'); normalized[field] = data[field].trim(); }
    if ((!deleted && !normalized.word) || !['candidate', 'confirmed', 'missing'].includes(data.pronunciationStatus)) fail(400, 'invalid_card');
    normalized.pronunciationStatus = data.pronunciationStatus;
  } else if (kind === 'progress') {
    exactKeys(data, ['result', 'attempts', 'updatedAt']);
    if (!['read', 'notyet'].includes(data.result) || !Number.isSafeInteger(data.attempts) || data.attempts < 0 || data.attempts > 1000000000 || !validDate(data.updatedAt)) fail(400, 'invalid_progress');
    normalized = { result: data.result, attempts: data.attempts, updatedAt: data.updatedAt };
  } else {
    const fields = kind === 'favorites' ? ['adds', 'removes'] : ['counts', 'cleared', 'adds', 'removes'];
    exactKeys(data, fields);
    if (deleted) fail(400, 'invalid_vector_record');
    normalized = {};
    for (const field of fields) {
      const vector = data[field];
      if (!plain(vector) || Object.keys(vector).length > 256) fail(400, 'invalid_vector_record');
      normalized[field] = {};
      for (const actor of Object.keys(vector).sort()) {
        if (!validId(actor) || !Number.isSafeInteger(vector[actor]) || vector[actor] < 0 || vector[actor] > 1000000000) fail(400, 'invalid_vector_record');
        normalized[field][actor] = vector[actor];
      }
    }
  }
  return { kind, id, operationId, baseRevision, deleted, updatedAt, data: normalized };
}
function documentFromRow(row) {
  if (!row) return null;
  return { schemaVersion: 1, id: row.id, operationId: row.operation_id, revision: row.revision, deleted: row.deleted === 1, updatedAt: row.updated_at, data: JSON.parse(row.data_json) };
}

// Each compare-and-set plus immutable idempotency receipt is one D1 transaction.
// No read-then-write race, last-write-wins, or hard deletion of user records.
async function applyOperation(db, operation, now) {
  const op = validateOperation(operation);
  const requestHash = await sha256(JSON.stringify(op));
  const revision = op.baseRevision + 1;
  const batch = await db.batch([
    db.prepare(`INSERT INTO documents (kind, id, operation_id, revision, deleted, updated_at, data_json)
      SELECT ?, ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM operation_receipts WHERE operation_id = ?)
        AND (? = 0 OR EXISTS (SELECT 1 FROM documents WHERE kind = ? AND id = ? AND revision = ?))
      ON CONFLICT(kind, id) DO UPDATE SET operation_id = excluded.operation_id, revision = excluded.revision,
        deleted = excluded.deleted, updated_at = excluded.updated_at, data_json = excluded.data_json
      WHERE documents.revision = ?`).bind(op.kind, op.id, op.operationId, revision, Number(op.deleted), op.updatedAt, JSON.stringify(op.data), op.operationId, op.baseRevision, op.kind, op.id, op.baseRevision, op.baseRevision),
    db.prepare(`INSERT INTO operation_receipts (operation_id, request_hash, kind, id, document_json, created_at)
      SELECT ?, ?, kind, id, json_object('schemaVersion', 1, 'id', id, 'operationId', operation_id,
        'revision', revision, 'deleted', json(CASE WHEN deleted = 1 THEN 'true' ELSE 'false' END),
        'updatedAt', updated_at, 'data', json(data_json)), ?
      FROM documents WHERE kind = ? AND id = ? AND operation_id = ? AND revision = ?
      ON CONFLICT(operation_id) DO NOTHING`).bind(op.operationId, requestHash, seconds(now), op.kind, op.id, op.operationId, revision),
    db.prepare('SELECT request_hash, document_json FROM operation_receipts WHERE operation_id = ?').bind(op.operationId),
    db.prepare('SELECT * FROM documents WHERE kind = ? AND id = ?').bind(op.kind, op.id)
  ]);
  const receipt = batch[2].results?.[0];
  if (receipt && !equal(receipt.request_hash, requestHash)) fail(409, 'operation_id_reused');
  const document = receipt ? JSON.parse(receipt.document_json) : documentFromRow(batch[3].results?.[0]);
  return { kind: op.kind, id: op.id, operationId: op.operationId, status: receipt ? 'accepted' : 'conflict', document };
}

function createVerifier(fetcher, now) {
  let cached = null, pending = null, lastUnknownRefresh = 0;
  async function keys(force) {
    const current = now();
    if (!force && cached && cached.until > current) return cached.keys;
    if (pending) return pending;
    pending = (async () => {
      const response = await fetcher(JWKS_URL, { redirect: 'error', headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) fail(503, 'identity_provider_unavailable');
      const body = await response.json();
      if (!plain(body) || !Array.isArray(body.keys) || body.keys.length < 1 || body.keys.length > 20) fail(503, 'identity_provider_unavailable');
      const ttl = Math.min(86400, Math.max(0, Number(/(?:^|,)\s*max-age=(\d+)/i.exec(response.headers.get('Cache-Control') || '')?.[1] || 300)));
      cached = { keys: body.keys, until: current + ttl * 1000 }; return body.keys;
    })();
    try { return await pending; } catch (error) { if (error instanceof HttpError) throw error; fail(503, 'identity_provider_unavailable'); } finally { pending = null; }
  }
  return async function verify(credential, cfg, expectedNonceHash) {
    if (typeof credential !== 'string' || credential.length > 16384) fail(401, 'invalid_credential');
    const parts = credential.split('.'); if (parts.length !== 3) fail(401, 'invalid_credential');
    let header, claims;
    try { header = JSON.parse(decoder.decode(fromBase64url(parts[0]))); claims = JSON.parse(decoder.decode(fromBase64url(parts[1]))); } catch { fail(401, 'invalid_credential'); }
    if (!plain(header) || header.alg !== 'RS256' || typeof header.kid !== 'string' || header.kid.length > 200 || header.crit !== undefined || header.jku !== undefined || header.jwk !== undefined || header.x5u !== undefined || (header.typ !== undefined && header.typ !== 'JWT')) fail(401, 'invalid_credential');
    let candidates = await keys(false);
    let key = candidates.find(candidate => candidate.kid === header.kid);
    if (!key && now() - lastUnknownRefresh > 60000) { lastUnknownRefresh = now(); candidates = await keys(true); key = candidates.find(candidate => candidate.kid === header.kid); }
    if (!key || key.kty !== 'RSA' || (key.alg && key.alg !== 'RS256') || (key.use && key.use !== 'sig')) fail(401, 'invalid_credential');
    let valid = false;
    try { const imported = await crypto.subtle.importKey('jwk', key, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']); valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', imported, fromBase64url(parts[2]), encoder.encode(parts[0] + '.' + parts[1])); } catch { fail(401, 'invalid_credential'); }
    const time = seconds(now);
    if (!valid || !plain(claims) || !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) || claims.aud !== cfg.clientId || (claims.azp !== undefined && claims.azp !== cfg.clientId) || !Number.isSafeInteger(claims.exp) || claims.exp <= time || !Number.isSafeInteger(claims.iat) || claims.iat > time + 60 || claims.iat < time - 7200 || claims.exp <= claims.iat || (claims.nbf !== undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf > time + 60)) || typeof claims.sub !== 'string' || !/^[A-Za-z0-9_-]{1,255}$/.test(claims.sub) || typeof claims.nonce !== 'string' || !equal(await sha256(claims.nonce), expectedNonceHash)) fail(401, 'invalid_credential');
    if (claims.email !== cfg.ownerEmail || claims.email_verified !== true || (cfg.ownerSub && claims.sub !== cfg.ownerSub)) fail(403, 'owner_only');
    return { sub: claims.sub, email: claims.email };
  };
}

async function getSession(request, db, cfg, now) {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || !SECRET.test(token)) fail(401, 'login_required');
  const hash = await sha256(token);
  const session = await db.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at > ?').bind(hash, seconds(now)).first();
  if (!session || session.email !== cfg.ownerEmail || (cfg.ownerSub && session.owner_sub !== cfg.ownerSub)) fail(401, 'login_required');
  // The CSRF value is derived from the unguessable session token, but uses a
  // separate domain; D1 never stores a usable session token or CSRF token.
  return { ...session, tokenHash: hash, csrfToken: await sha256('chengci-api-csrf-v1:' + token) };
}
function requireCsrf(request, session) {
  if (!equal(request.headers.get('X-CSRF-Token'), session.csrfToken)) fail(403, 'invalid_csrf');
}
function escapeHTML(value) { return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]); }
async function loginPage(request, env, cfg, now) {
  const url = new URL(request.url);
  if (url.origin !== cfg.origin) fail(403, 'wrong_origin');
  const fetchSite = request.headers.get('Sec-Fetch-Site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) fail(403, 'cross_origin_request');
  const persistent = url.searchParams.get('rememberDevice') === '1';
  if ([...url.searchParams.keys()].some(key => key !== 'rememberDevice') || (url.searchParams.has('rememberDevice') && !['0', '1'].includes(url.searchParams.get('rememberDevice')))) fail(400, 'invalid_login_options');
  const flow = randomToken(), state = randomToken(), nonce = randomToken(), time = seconds(now);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM login_attempts WHERE expires_at <= ?').bind(time),
    env.DB.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(time),
    env.DB.prepare('INSERT INTO login_attempts (token_hash, state_hash, nonce_hash, persistent, expires_at) VALUES (?, ?, ?, ?, ?)').bind(await sha256(flow), await sha256(state), await sha256(nonce), Number(persistent), time + LOGIN_TTL)
  ]);
  const responseHeaders = headers({
    'Content-Type': 'text/html; charset=utf-8',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'none'; script-src https://accounts.google.com/gsi/client; frame-src https://accounts.google.com/gsi/; connect-src https://accounts.google.com/gsi/; style-src https://accounts.google.com/gsi/style; img-src https://*.googleusercontent.com https://www.gstatic.com; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://accounts.google.com"
  });
  // Cross-site top-level POST redirect from Google needs this short-lived,
  // one-time first-party flow cookie. It grants no API access. Session is Lax.
  responseHeaders.append('Set-Cookie', cookie(FLOW_COOKIE, flow, { sameSite: 'None', maxAge: LOGIN_TTL }));
  return new Response(`<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>澄詞にログイン</title><h1>澄詞にログイン</h1><p>個人カードの同期は、指定されたGoogleアカウントで利用できます。</p><p>${persistent ? 'この端末では30日間ログインを維持します。共有の端末では使用しないでください。' : 'このブラウザーのセッション中のみログインします（最長8時間）。共有端末では使い終わったらログアウトしてください。'}</p><div id="g_id_onload" data-client_id="${escapeHTML(cfg.clientId)}" data-login_uri="${escapeHTML(cfg.origin)}/auth/google" data-ux_mode="redirect" data-auto_prompt="false" data-auto_select="false" data-nonce="${escapeHTML(nonce)}"></div><div class="g_id_signin" data-type="standard" data-theme="outline" data-size="large" data-state="${escapeHTML(state)}"></div><script src="https://accounts.google.com/gsi/client" async></script><p>ログインを中止しても、オフライン学習は続けられます。</p><p><a href="/">澄詞に戻る</a></p></html>`, { headers: responseHeaders });
}
async function googleCallback(request, env, cfg, now, verify) {
  if (new URL(request.url).origin !== cfg.origin) fail(403, 'wrong_origin');
  const origin = request.headers.get('Origin');
  // A GIS redirect is a top-level cross-site POST. Missing/opaque Origin is
  // handled by the required double-submit, one-time state, and signed nonce.
  if (origin && ![cfg.origin, 'https://accounts.google.com', 'null'].includes(origin)) fail(403, 'wrong_origin');
  if (!/^application\/x-www-form-urlencoded(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) fail(415, 'form_required');
  const form = new URLSearchParams(await boundedText(request, 24576));
  for (const key of ['credential', 'g_csrf_token', 'state']) if (form.getAll(key).length !== 1) fail(403, 'invalid_login_request');
  const csrf = readCookie(request, 'g_csrf_token');
  if (!csrf || csrf.length > 1024 || !equal(csrf, form.get('g_csrf_token'))) fail(403, 'invalid_csrf');
  const flow = readCookie(request, FLOW_COOKIE), state = form.get('state');
  if (!flow || !SECRET.test(flow) || !SECRET.test(state)) fail(403, 'invalid_login_state');
  const hash = await sha256(flow), stateHash = await sha256(state), time = seconds(now);
  const attempt = await env.DB.prepare('SELECT * FROM login_attempts WHERE token_hash = ? AND state_hash = ? AND expires_at > ?').bind(hash, stateHash, time).first();
  if (!attempt) fail(403, 'login_expired');
  const principal = await verify(form.get('credential'), cfg, attempt.nonce_hash);
  const token = randomToken(), tokenHash = await sha256(token), ttl = attempt.persistent ? TRUSTED_TTL : SESSION_TTL;
  const oldToken = readCookie(request, SESSION_COOKIE);
  const oldHash = oldToken && SECRET.test(oldToken) ? await sha256(oldToken) : '';
  const result = await env.DB.batch([
    env.DB.prepare(`INSERT INTO sessions (token_hash, owner_sub, email, persistent, created_at, expires_at)
      SELECT ?, ?, ?, persistent, ?, ? FROM login_attempts WHERE token_hash = ? AND state_hash = ? AND expires_at > ?`).bind(tokenHash, principal.sub, principal.email, time, time + ttl, hash, stateHash, time),
    env.DB.prepare('DELETE FROM login_attempts WHERE token_hash = ? AND state_hash = ?').bind(hash, stateHash),
    env.DB.prepare('DELETE FROM sessions WHERE token_hash = ? AND EXISTS (SELECT 1 FROM sessions WHERE token_hash = ?)').bind(oldHash, tokenHash),
    env.DB.prepare('SELECT token_hash FROM sessions WHERE token_hash = ?').bind(tokenHash)
  ]);
  if (!result[3].results?.length) fail(403, 'login_expired');
  const responseHeaders = headers({ Location: '/' });
  responseHeaders.append('Set-Cookie', cookie(SESSION_COOKIE, token, attempt.persistent ? { maxAge: ttl } : {}));
  responseHeaders.append('Set-Cookie', cookie(FLOW_COOKIE, '', { sameSite: 'None', maxAge: 0 }));
  return new Response(null, { status: 303, headers: responseHeaders });
}
const ROOT_ASSETS = new Set(['/', '/index.html', '/manifest.json', '/service-worker.js', '/version.json', '/asset-revisions.json', '/CHANGELOG.md', '/sync-config.js']);
function isPublicAsset(path) {
  return ROOT_ASSETS.has(path) || /^\/(?:js\/[a-z0-9-]+\.js|css\/[a-z0-9-]+\.css|data\/[a-z0-9-]+\.(?:js|json)|assets\/[a-z0-9-]+\.(?:svg|png|webp|jpg|ico))$/.test(path);
}
async function staticAsset(request, env) {
  const url = new URL(request.url);
  if (!['GET', 'HEAD'].includes(request.method)) return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET, HEAD' });
  if (!isPublicAsset(url.pathname) || !env.ASSETS) return json({ error: 'not_found' }, 404);
  // Never forward credentials to the static-asset binding or cache a query token.
  url.search = ''; const forwarded = new Request(url, { method: request.method });
  const response = await env.ASSETS.fetch(forwarded);
  const resultHeaders = new Headers(response.headers);
  resultHeaders.delete('Set-Cookie'); resultHeaders.delete('Access-Control-Allow-Origin');
  resultHeaders.set('Cache-Control', 'public, max-age=0, must-revalidate');
  resultHeaders.set('X-Content-Type-Options', 'nosniff'); resultHeaders.set('Referrer-Policy', 'no-referrer');
  resultHeaders.set('X-Frame-Options', 'DENY'); resultHeaders.set('Cross-Origin-Resource-Policy', 'same-origin');
  if (url.pathname === '/service-worker.js') resultHeaders.set('Service-Worker-Allowed', '/');
  return new Response(response.body, { status: response.status, headers: resultHeaders });
}

export function createWorker(options = {}) {
  const now = options.now || Date.now;
  const verify = createVerifier(options.fetch || globalThis.fetch, now);
  return {
    async fetch(request, env) {
      const path = new URL(request.url).pathname;
      if (!(path === '/api' || path.startsWith('/api/') || path === '/auth' || path.startsWith('/auth/'))) return staticAsset(request, env);
      try {
        const cfg = config(env);
        if (path === '/api/config' && request.method === 'GET') return json({ enabled: cfg.enabled, loginUrl: '/auth/login', ...(!cfg.enabled ? { reason: 'not_configured' } : {}) });
        if (!cfg.enabled) fail(503, 'sync_disabled');
        if (path === '/auth/login' && request.method === 'GET') return await loginPage(request, env, cfg, now);
        if (path === '/auth/google' && request.method === 'POST') return await googleCallback(request, env, cfg, now, verify);
        const allowed = { '/api/session': 'GET', '/api/cards': 'GET', '/api/progress': 'GET', '/api/favorites': 'GET', '/api/study': 'GET', '/api/sync': 'POST', '/api/logout': 'POST' }[path];
        if (!allowed) fail(404, 'not_found');
        if (request.method !== allowed) return json({ error: 'method_not_allowed' }, 405, { Allow: allowed });
        ensureOrigin(request, cfg, allowed === 'POST');
        const session = await getSession(request, env.DB, cfg, now);
        if (allowed === 'POST') requireCsrf(request, session);
        if (path === '/api/session') return json({ authenticated: true, user: { uid: session.owner_sub, sub: session.owner_sub, email: session.email, emailVerified: true }, csrfToken: session.csrfToken, persistent: !!session.persistent, expiresAt: new Date(session.expires_at * 1000).toISOString() });
        if (path === '/api/logout') {
          let allDevices = false;
          if (request.body) { const input = await readJSON(request); if (plain(input) && Object.keys(input).length === 0) allDevices = false; else { exactKeys(input, ['allDevices']); if (typeof input.allDevices !== 'boolean') fail(400, 'invalid_logout'); allDevices = input.allDevices; } }
          if (allDevices) await env.DB.batch([env.DB.prepare('DELETE FROM sessions'), env.DB.prepare('DELETE FROM login_attempts')]);
          else await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(session.tokenHash).run();
          const response = empty(); response.headers.append('Set-Cookie', cookie(SESSION_COOKIE, '', { maxAge: 0 })); response.headers.append('Set-Cookie', cookie(FLOW_COOKIE, '', { sameSite: 'None', maxAge: 0 })); return response;
        }
        if (KINDS.some(kind => path === '/api/' + kind)) {
          const url = new URL(request.url);
          if ([...url.searchParams.keys()].some(key => !['since', 'until', 'cursor'].includes(key) || url.searchParams.getAll(key).length !== 1)) fail(400, 'invalid_checkpoint');
          function sequence(key, fallback) {
            if (!url.searchParams.has(key)) return fallback;
            const value = url.searchParams.get(key);
            if (!/^(?:0|[1-9][0-9]{0,15})$/.test(value) || !Number.isSafeInteger(Number(value))) fail(400, 'invalid_checkpoint');
            return Number(value);
          }
          const clock = (await env.DB.prepare('SELECT value FROM sync_clock WHERE singleton = 1').first()).value;
          const since = sequence('since', 0), until = sequence('until', clock), cursor = sequence('cursor', since);
          if (since > clock) fail(409, 'checkpoint_ahead');
          if (until > clock || until < since || cursor < since || cursor > until || (url.searchParams.has('cursor') && !url.searchParams.has('until'))) fail(400, 'invalid_checkpoint');
          const rows = (await env.DB.prepare('SELECT * FROM documents WHERE kind = ? AND change_seq > ? AND change_seq <= ? ORDER BY change_seq LIMIT ?').bind(path.slice('/api/'.length), Math.max(since, cursor), until, PAGE_SIZE + 1).all()).results;
          return json({ documents: rows.slice(0, PAGE_SIZE).map(documentFromRow), cursor: rows.length > PAGE_SIZE ? String(rows[PAGE_SIZE - 1].change_seq) : null, checkpoint: until });
        }
        const input = await readJSON(request); exactKeys(input, ['operations']);
        if (!Array.isArray(input.operations) || input.operations.length < 1 || input.operations.length > MAX_OPERATIONS) fail(400, 'invalid_operations');
        const operations = input.operations.map(validateOperation);
        if (new Set(operations.map(op => op.operationId)).size !== operations.length) fail(400, 'duplicate_operation');
        const results = []; for (const operation of operations) results.push(await applyOperation(env.DB, operation, now));
        return json({ results });
      } catch (error) {
        // Never log JWTs, cookies, personal records, or exception bodies.
        return json({ error: error instanceof HttpError ? error.code : 'service_unavailable' }, error instanceof HttpError ? error.status : 503);
      }
    }
  };
}
export default createWorker();
export const testing = { validateOperation, applyOperation, config, createVerifier, sha256, randomToken, cookie, readCookie, isPublicAsset, getSession, SESSION_COOKIE, FLOW_COOKIE, validOwnerEmail };
