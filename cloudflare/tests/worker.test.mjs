import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorker, testing } from '../worker.mjs';
import { createDB } from './sqlite-d1.mjs';
import { TEST_OWNER_EMAIL } from './test-config.mjs';

const ORIGIN = 'https://chengci.example.com';
const CLIENT = '1234567890-approvedweb.apps.googleusercontent.com';
const NOW = Date.parse('2026-10-06T00:00:00.000Z');
const DATE = new Date(NOW).toISOString();
const SUB = '112233445566778899000';
const KEY = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
const JWK = { ...await crypto.subtle.exportKey('jwk', KEY.publicKey), kid: 'test-key', use: 'sig', alg: 'RS256' };
const b64 = bytes => Buffer.from(bytes).toString('base64url');
async function jwt(nonce, overrides = {}, header = {}) {
  const protectedHeader = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT', kid: 'test-key', ...header }));
  const claims = b64(JSON.stringify({ iss: 'https://accounts.google.com', aud: CLIENT, sub: SUB, email: TEST_OWNER_EMAIL, email_verified: true, iat: NOW / 1000, exp: NOW / 1000 + 3600, nonce, ...overrides }));
  const input = protectedHeader + '.' + claims;
  return input + '.' + b64(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', KEY.privateKey, new TextEncoder().encode(input)));
}
function setup(options = {}) {
  const DB = createDB(); const calls = []; let time = NOW;
  const env = { DB, SYNC_ENABLED: 'true', APP_ORIGIN: ORIGIN, GOOGLE_CLIENT_ID: CLIENT, OWNER_EMAIL: TEST_OWNER_EMAIL, OWNER_SUB: SUB,
    ASSETS: { async fetch(request) { calls.push(request); return new Response('public shell', { headers: { 'Content-Type': 'text/html', 'Set-Cookie': 'should=never-leak', 'Access-Control-Allow-Origin': '*' } }); } }, ...options.env };
  const worker = createWorker({ now: () => time, fetch: options.fetch || (async url => { assert.equal(url, 'https://www.googleapis.com/oauth2/v3/certs'); return new Response(JSON.stringify({ keys: [JWK] }), { headers: { 'Cache-Control': 'public, max-age=3600' } }); }) });
  const request = (path, options) => worker.fetch(new Request(ORIGIN + path, options), env);
  return { env, DB, worker, request, calls, advance: ms => { time += ms; } };
}
const card = (id = 'personal-card', operationId = 'op-1', baseRevision = 0) => ({ kind: 'cards', id, operationId, baseRevision, deleted: false, updatedAt: DATE,
  data: { word: '澄', zhuyin: 'ㄔㄥˊ', meaning: '澄む', example: '', exampleZhuyin: '', note: '', pronunciationStatus: 'confirmed' } });
function setCookie(response, name) { const result = response.headers.getSetCookie().find(value => value.startsWith(name + '=')); return result?.split(';')[0]; }
async function begin(app, rememberDevice = 0) {
  const response = await app.request('/auth/login?rememberDevice=' + rememberDevice, { headers: { 'Sec-Fetch-Site': 'same-origin' } });
  assert.equal(response.status, 200); const html = await response.text();
  return { response, html, flowCookie: setCookie(response, testing.FLOW_COOKIE), state: /data-state="([^"]+)"/.exec(html)[1], nonce: /data-nonce="([^"]+)"/.exec(html)[1] };
}
async function callback(app, login, options = {}) {
  const credential = options.credential || await jwt(login.nonce, options.claims, options.jwtHeader);
  const body = new URLSearchParams({ credential, state: login.state, g_csrf_token: 'gis-csrf-generated-by-library', ...options.form });
  return app.request('/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: options.origin || 'https://accounts.google.com', Cookie: `${login.flowCookie}; g_csrf_token=gis-csrf-generated-by-library`, ...options.headers }, body });
}
async function authenticate(app, rememberDevice = 0) {
  const login = await begin(app, rememberDevice), response = await callback(app, login); assert.equal(response.status, 303);
  const cookie = setCookie(response, testing.SESSION_COOKIE);
  const sessionResponse = await app.request('/api/session', { headers: { Cookie: cookie } }); assert.equal(sessionResponse.status, 200);
  return { login, response, cookie, session: await sessionResponse.json() };
}
const mutation = (auth, value) => ({ method: 'POST', headers: { Cookie: auth.cookie, Origin: ORIGIN, 'Content-Type': 'application/json', 'X-CSRF-Token': auth.session.csrfToken }, body: JSON.stringify(value) });

// Configuration, public assets, headers, and perimeter.
test('default/missing/invalid configuration fails closed while shell remains public', async () => {
  for (const env of [{ SYNC_ENABLED: 'false' }, { OWNER_EMAIL: '' }, { OWNER_EMAIL: undefined }, { GOOGLE_CLIENT_ID: '' }, { APP_ORIGIN: 'http://chengci.example.com' }, { APP_ORIGIN: ORIGIN + '/path' }, { DB: undefined }]) {
    const app = setup({ env }); assert.equal((await (await app.request('/api/config')).json()).enabled, false);
    assert.equal((await app.request('/api/cards')).status, 503); assert.equal((await app.request('/auth/login')).status, 503);
    assert.equal((await app.request('/')).status, 200); app.DB.close();
  }
});
test('static forwarding strips credentials/query and refuses backend/source/private files', async () => {
  const app = setup(); const response = await app.request('/index.html?credential=do-not-forward', { headers: { Cookie: 'secret=token', Authorization: 'Bearer private' } });
  assert.equal(response.status, 200); assert.equal(app.calls[0].url, ORIGIN + '/index.html'); assert.equal(app.calls[0].headers.get('Cookie'), null); assert.equal(app.calls[0].headers.get('Authorization'), null);
  assert.equal(response.headers.get('Set-Cookie'), null); assert.equal(response.headers.get('Access-Control-Allow-Origin'), null); assert.match(response.headers.get('Cache-Control'), /^public/);
  for (const path of ['/cloudflare/worker.mjs', '/.git/config', '/.env', '/docs/PERSONAL_CARDS.md', '/tests/worker.test.mjs', '/js/.env', '/js/file.map']) assert.equal((await app.request(path)).status, 404, path);
  assert.equal((await app.request('/auth/unknown')).status, 404); app.DB.close();
});
test('all API responses/errors are no-store and expose no CORS grant', async () => {
  const app = setup();
  for (const path of ['/api/config', '/api/session', '/api/cards', '/api/not-real', '/auth/unknown']) {
    const response = await app.request(path); assert.match(response.headers.get('Cache-Control'), /no-store/); assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
  assert.equal((await app.request('/api/sync', { method: 'OPTIONS', headers: { Origin: 'https://evil.example' } })).status, 405); app.DB.close();
});

// Real RSA/WebCrypto authentication, including all required Google claim checks.
test('GIS login page uses redirect, one-time state/nonce, no auto-login or tokens in URLs', async () => {
  const app = setup(); const login = await begin(app);
  assert.match(login.html, /data-ux_mode="redirect"/); assert.match(login.html, /data-auto_prompt="false"/); assert.match(login.html, /data-auto_select="false"/);
  assert.match(login.response.headers.get('Set-Cookie'), /Secure; HttpOnly; SameSite=None; Max-Age=600/); assert.match(login.response.headers.get('Cache-Control'), /no-store/);
  assert.notEqual(login.state, login.nonce); assert.equal(login.response.headers.get('Location'), null);
  const rows = app.DB.sqlite.prepare('SELECT * FROM login_attempts').all(); assert.equal(rows.length, 1); assert.notEqual(rows[0].nonce_hash, login.nonce); assert.notEqual(rows[0].state_hash, login.state);
  assert.equal((await app.request('/auth/login', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403); app.DB.close();
});
test('shared-device session is HttpOnly Secure Lax, session-only and max 8h, with separate CSRF', async () => {
  const app = setup(); const auth = await authenticate(app);
  const sessionCookie = auth.response.headers.getSetCookie().find(value => value.startsWith(testing.SESSION_COOKIE));
  assert.match(sessionCookie, /Secure; HttpOnly; SameSite=Lax/); assert.doesNotMatch(sessionCookie, /Max-Age|Expires/); assert.equal(auth.response.headers.get('Location'), '/');
  assert.equal(auth.session.user.uid, SUB); assert.equal(auth.session.user.emailVerified, true); assert.equal(auth.session.persistent, false); assert.equal(auth.session.expiresAt, '2026-10-06T08:00:00.000Z');
  assert.equal(auth.session.csrfToken.length, 43); assert.notEqual(auth.session.csrfToken, auth.cookie.split('=')[1]);
  const row = app.DB.sqlite.prepare('SELECT * FROM sessions').get(); assert.notEqual(row.token_hash, auth.cookie.split('=')[1]);
  app.advance(8 * 60 * 60 * 1000); assert.equal((await app.request('/api/session', { headers: { Cookie: auth.cookie } })).status, 401); app.DB.close();
});
test('trusted login is an explicit opt-in bounded at 30 days', async () => {
  const app = setup(); const auth = await authenticate(app, 1);
  assert.match(auth.response.headers.getSetCookie().find(value => value.startsWith(testing.SESSION_COOKIE)), /Max-Age=2592000/);
  assert.equal(auth.session.persistent, true); app.advance(30 * 86400 * 1000); assert.equal((await app.request('/api/session', { headers: { Cookie: auth.cookie } })).status, 401); app.DB.close();
});
test('GIS double-submit mismatch, missing/duplicate state, wrong flow, and wrong origins reject login', async () => {
  const app = setup(); const login = await begin(app);
  for (const options of [{ form: { g_csrf_token: 'attacker' } }, { form: { state: testing.randomToken() } }, { headers: { Cookie: 'g_csrf_token=gis-csrf-generated-by-library' } }, { origin: 'https://evil.example' }]) assert.equal((await callback(app, login, options)).status, 403);
  const raw = new URLSearchParams({ credential: await jwt(login.nonce), state: login.state, g_csrf_token: 'gis-csrf-generated-by-library' }); raw.append('state', login.state);
  const response = await app.request('/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: login.flowCookie + '; g_csrf_token=gis-csrf-generated-by-library' }, body: raw }); assert.equal(response.status, 403);
  assert.equal(app.DB.sqlite.prepare('SELECT count(*) AS n FROM sessions').get().n, 0); app.DB.close();
});
test('expired and already-consumed login flows cannot be replayed, including concurrent callbacks', async () => {
  const app = setup(); const login = await begin(app); const credential = await jwt(login.nonce);
  const responses = await Promise.all([callback(app, login, { credential }), callback(app, login, { credential })]);
  assert.deepEqual(responses.map(response => response.status).sort(), [303, 403]); assert.equal(app.DB.sqlite.prepare('SELECT count(*) AS n FROM sessions').get().n, 1);
  const expired = await begin(app); app.advance(600000); assert.equal((await callback(app, expired)).status, 403); app.DB.close();
});
test('forged JWT signature, alg confusion, attacker JWKS pointers, audience, issuer, nonce, expiry and time claims reject', async () => {
  const app = setup(); const login = await begin(app);
  const cases = [
    { claims: { aud: 'other-client' } }, { claims: { aud: [CLIENT] } }, { claims: { azp: 'attacker' } }, { claims: { iss: 'https://evil.example' } },
    { claims: { nonce: 'different' } }, { claims: { exp: NOW / 1000 } }, { claims: { exp: '99999999999' } }, { claims: { iat: NOW / 1000 + 120 } },
    { claims: { nbf: NOW / 1000 + 120 } }, { claims: { sub: '' } }, { jwtHeader: { alg: 'HS256' } }, { jwtHeader: { alg: 'none' } },
    { jwtHeader: { jku: 'https://evil.example/jwks' } }, { jwtHeader: { crit: ['unexpected'] } }
  ];
  for (const options of cases) assert.equal((await callback(app, login, options)).status, 401, JSON.stringify(options));
  const token = await jwt(login.nonce); const [header, claims, signature] = token.split('.'); const changed = JSON.parse(Buffer.from(claims, 'base64url')); changed.email = 'attacker@gmail.com';
  assert.equal((await callback(app, login, { credential: [header, b64(JSON.stringify(changed)), signature].join('.') })).status, 401);
  assert.equal(app.DB.sqlite.prepare('SELECT count(*) AS n FROM sessions').get().n, 0); app.DB.close();
});
test('only the exact approved verified owner is admitted, with optional pinned sub', async () => {
  const app = setup(); const login = await begin(app);
  for (const claims of [{ email: 'attacker@example.test' }, { email: 'Owner@example.test' }, { email_verified: false }, { email_verified: 'true' }, { sub: 'different-subject' }]) assert.equal((await callback(app, login, { claims })).status, 403);
  app.env.OWNER_SUB = ''; assert.equal((await callback(app, login, { claims: { sub: 'explicit-email-owner' } })).status, 303);
  app.DB.close();
});
test('Google JWKS uses a workerd-supported redirect mode and verifies the signed owner', async () => {
  const requests = [];
  const app = setup({ fetch: async (url, init) => {
    requests.push({ url, init });
    // Unlike Node's fetch, workerd rejects this option before making a request.
    // https://github.com/cloudflare/workerd/blob/v1.20261006.1/src/workerd/api/http.c++
    if (!['follow', 'manual'].includes(init.redirect)) throw new TypeError('Invalid redirect value, must be one of "follow" or "manual"');
    return new Response(JSON.stringify({ keys: [JWK] }), { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } });
  try {
    const auth = await authenticate(app);
    assert.equal(auth.session.user.uid, SUB);
    assert.equal(auth.session.user.email, TEST_OWNER_EMAIL);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://www.googleapis.com/oauth2/v3/certs');
    assert.equal(requests[0].init.redirect, 'manual');
    assert.equal(requests[0].init.headers.Accept, 'application/json');
    assert.ok(requests[0].init.signal instanceof AbortSignal);
  } finally { app.DB.close(); }
});
for (const status of [301, 302, 303, 307, 308]) test(`Google JWKS rejects HTTP ${status} without following its Location`, async () => {
  const requests = [];
  const app = setup({ fetch: async (url, init) => {
    requests.push({ url, init });
    return new Response(JSON.stringify({ keys: [JWK] }), { status, headers: { Location: 'https://untrusted.example.test/keys' } });
  } });
  try {
    const login = await begin(app), response = await callback(app, login);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: 'identity_provider_unavailable' });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://www.googleapis.com/oauth2/v3/certs');
    assert.equal(requests[0].init.redirect, 'manual');
    assert.equal(app.DB.sqlite.prepare('SELECT count(*) AS n FROM sessions').get().n, 0);
    assert.equal(setCookie(response, testing.SESSION_COOKIE), undefined);
  } finally { app.DB.close(); }
});
test('Google JWKS fetch failure is safe and does not log or return tokens', async () => {
  const app = setup({ fetch: async () => { throw new Error('private-token-from-network'); } }); const login = await begin(app); const response = await callback(app, login);
  assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'identity_provider_unavailable' }); app.DB.close();
});
test('authenticated APIs reject cross-origin reads/writes, absent Origin and wrong CSRF', async () => {
  const app = setup(); const auth = await authenticate(app);
  assert.equal((await app.request('/api/cards', { headers: { Cookie: auth.cookie, Origin: 'https://evil.example' } })).status, 403);
  assert.equal((await app.request('/api/cards', { headers: { Cookie: auth.cookie, 'Sec-Fetch-Site': 'same-site' } })).status, 403);
  for (const changes of [{ Origin: 'https://evil.example' }, { Origin: '' }, { 'X-CSRF-Token': 'wrong' }]) {
    const request = mutation(auth, { operations: [card()] }); Object.assign(request.headers, changes); assert.equal((await app.request('/api/sync', request)).status, 403);
  }
  const duplicate = auth.cookie + '; ' + auth.cookie; assert.equal((await app.request('/api/session', { headers: { Cookie: duplicate } })).status, 401); app.DB.close();
});
test('logout revokes only current session, all-device logout revokes all sessions and unfinished flows', async () => {
  const app = setup(); const first = await authenticate(app); const second = await authenticate(app, 1);
  const response = await app.request('/api/logout', mutation(first, { allDevices: false })); assert.equal(response.status, 204); assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
  assert.equal((await app.request('/api/session', { headers: { Cookie: first.cookie } })).status, 401);
  assert.equal((await app.request('/api/session', { headers: { Cookie: second.cookie } })).status, 200);
  await begin(app); assert.equal((await app.request('/api/logout', mutation(second, { allDevices: true }))).status, 204);
  assert.equal(app.DB.sqlite.prepare('SELECT count(*) AS n FROM sessions').get().n, 0); assert.equal(app.DB.sqlite.prepare('SELECT count(*) AS n FROM login_attempts').get().n, 0); app.DB.close();
});
test('changing owner sub invalidates an existing session without accepting a first-user claim', async () => {
  const app = setup(); const auth = await authenticate(app); app.env.OWNER_SUB = 'new-explicitly-pinned-sub';
  assert.equal((await app.request('/api/session', { headers: { Cookie: auth.cookie } })).status, 401); app.DB.close();
});

// Real SQLite compare-and-set, receipts, tombstones, payload validation.
test('operation validation rejects extra/missing keys, invalid IDs, dates, types, overlong fields and progress', () => {
  const variants = [
    { ...card(), uid: 'not-accepted' }, { ...card(), id: '__proto__' }, { ...card(), id: 'constructor' }, { ...card(), operationId: 'a/b' },
    { ...card(), baseRevision: -1 }, { ...card(), baseRevision: Number.MAX_SAFE_INTEGER }, { ...card(), deleted: 'false' }, { ...card(), updatedAt: 'yesterday' },
    { ...card(), data: { ...card().data, word: 'a'.repeat(301) } }, { ...card(), data: { ...card().data, secret: 'extra' } },
    { ...card(), data: { ...card().data, word: '' } }, { ...card(), data: { ...card().data, pronunciationStatus: 'guessed' } },
    { ...card(), kind: 'progress', data: { result: 'read', attempts: -1, updatedAt: DATE } },
    { ...card(), kind: 'progress', data: { result: 'unknown', attempts: 1, updatedAt: DATE } }
  ];
  for (const variant of variants) assert.throws(() => testing.validateOperation(variant));
  assert.deepEqual(testing.validateOperation(card()), card());
});
test('create, revision update, tombstone, restore use monotonically increasing revisions', async () => {
  const db = createDB(); let operation = card();
  for (let revision = 1; revision <= 4; revision++) {
    operation = { ...operation, operationId: 'op-' + revision, baseRevision: revision - 1, deleted: revision === 3 };
    const result = await testing.applyOperation(db, operation, () => NOW); assert.equal(result.status, 'accepted'); assert.equal(result.document.revision, revision); assert.equal(result.document.deleted, revision === 3);
  }
  assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM documents').get().n, 1); assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM operation_receipts').get().n, 4); db.close();
});
test('two concurrent new cards with same ID accept one and return the winner as conflict', async () => {
  const db = createDB(); const results = await Promise.all([testing.applyOperation(db, card('same', 'op-a'), () => NOW), testing.applyOperation(db, card('same', 'op-b'), () => NOW)]);
  assert.deepEqual(results.map(result => result.status).sort(), ['accepted', 'conflict']); assert.equal(results[0].document.revision, 1); assert.deepEqual(results[0].document, results[1].document); db.close();
});
test('two concurrent edits at same revision preserve losing data as a returned conflict', async () => {
  const db = createDB(); await testing.applyOperation(db, card(), () => NOW);
  const a = card('personal-card', 'edit-a', 1), b = card('personal-card', 'edit-b', 1); a.data.note = 'first device'; b.data.note = 'second device';
  const results = await Promise.all([testing.applyOperation(db, a, () => NOW), testing.applyOperation(db, b, () => NOW)]);
  assert.deepEqual(results.map(result => result.status).sort(), ['accepted', 'conflict']); assert.equal(results[0].document.revision, 2); assert.deepEqual(results[0].document, results[1].document); assert.equal(b.data.note, 'second device'); db.close();
});
test('retry after uncertain acknowledgement is idempotent even after newer writes', async () => {
  const db = createDB(); const initial = card(); const accepted = await testing.applyOperation(db, initial, () => NOW);
  assert.deepEqual(await testing.applyOperation(db, initial, () => NOW), accepted);
  await testing.applyOperation(db, card('personal-card', 'op-2', 1), () => NOW);
  assert.deepEqual(await testing.applyOperation(db, initial, () => NOW), accepted);
  assert.equal(db.sqlite.prepare('SELECT revision FROM documents').get().revision, 2); db.close();
});
test('operation ID cannot be reused for a different payload or document', async () => {
  const db = createDB(); await testing.applyOperation(db, card(), () => NOW);
  const changed = card(); changed.data.note = 'overwrite with reused ID';
  await assert.rejects(testing.applyOperation(db, changed, () => NOW), error => error.code === 'operation_id_reused');
  await assert.rejects(testing.applyOperation(db, card('another-card'), () => NOW), error => error.code === 'operation_id_reused');
  assert.equal(db.sqlite.prepare('SELECT data_json FROM documents').get().data_json, JSON.stringify(card().data)); db.close();
});
test('stale tombstone or missing nonzero base never silently resurrects or inserts', async () => {
  const db = createDB(); await testing.applyOperation(db, card(), () => NOW);
  const deleted = { ...card('personal-card', 'delete', 1), deleted: true }; await testing.applyOperation(db, deleted, () => NOW);
  const stale = await testing.applyOperation(db, card('personal-card', 'stale', 1), () => NOW); assert.equal(stale.status, 'conflict'); assert.equal(stale.document.deleted, true);
  const missing = await testing.applyOperation(db, card('unknown', 'missing', 3), () => NOW); assert.equal(missing.status, 'conflict'); assert.equal(missing.document, null); db.close();
});
test('D1 batch rollback retains no partial record if receipt write fails', async () => {
  const db = createDB(); db.sqlite.exec("CREATE TRIGGER reject_receipt BEFORE INSERT ON operation_receipts BEGIN SELECT RAISE(ABORT, 'forced receipt failure'); END");
  await assert.rejects(testing.applyOperation(db, card(), () => NOW)); assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM documents').get().n, 0); db.close();
});
test('authenticated sync roundtrip and kind-specific listing preserve exact data and tombstones', async () => {
  const app = setup(); const auth = await authenticate(app); const progress = { ...card('practice-id', 'progress-op'), kind: 'progress', data: { result: 'read', attempts: 4, updatedAt: DATE } };
  const response = await app.request('/api/sync', mutation(auth, { operations: [card(), progress] })); assert.equal(response.status, 200); const body = await response.json(); assert.equal(body.results.length, 2); assert.ok(body.results.every(result => result.status === 'accepted'));
  const cards = await (await app.request('/api/cards', { headers: { Cookie: auth.cookie } })).json(); const records = await (await app.request('/api/progress', { headers: { Cookie: auth.cookie } })).json();
  assert.equal(cards.documents.length, 1); assert.equal(cards.cursor, null); assert.equal(records.documents.length, 1); assert.deepEqual(records.documents[0].data, progress.data);
  const deleted = { ...card('personal-card', 'deleted', 1), deleted: true }; assert.equal((await app.request('/api/sync', mutation(auth, { operations: [deleted] }))).status, 200);
  assert.equal((await (await app.request('/api/cards', { headers: { Cookie: auth.cookie } })).json()).documents[0].deleted, true); app.DB.close();
});
test('all operations are validated before any mutation; limits reject excessive requests', async () => {
  const app = setup(); const auth = await authenticate(app);
  for (const operations of [[], Array.from({ length: 11 }, (_, i) => card('card' + i, 'op' + i)), [card(), { ...card('bad', 'bad-op'), data: {} }], [card(), card('other')]]) assert.equal((await app.request('/api/sync', mutation(auth, { operations }))).status, 400);
  assert.equal(app.DB.sqlite.prepare('SELECT count(*) AS n FROM documents').get().n, 0);
  const oversized = mutation(auth, { operations: [card()] }); oversized.headers['Content-Length'] = '1048577'; assert.equal((await app.request('/api/sync', oversized)).status, 413);
  const wrongType = mutation(auth, { operations: [card()] }); wrongType.headers['Content-Type'] = 'text/plain'; assert.equal((await app.request('/api/sync', wrongType)).status, 415); app.DB.close();
});
test('document pagination is bounded, ordered, includes tombstones, and rejects invalid cursors', async () => {
  const app = setup(); const auth = await authenticate(app); const insert = app.DB.sqlite.prepare('INSERT INTO documents (kind, id, operation_id, revision, deleted, updated_at, data_json) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (let i = 0; i < 252; i++) insert.run('cards', 'id-' + String(i).padStart(4, '0'), 'op-' + i, 1, Number(i === 1), DATE, JSON.stringify(card().data));
  const first = await (await app.request('/api/cards', { headers: { Cookie: auth.cookie } })).json(); assert.equal(first.documents.length, 250); assert.equal(first.cursor, '250'); assert.equal(first.checkpoint, 252); assert.equal(first.documents[1].deleted, true);
  const second = await (await app.request('/api/cards?since=0&until=' + first.checkpoint + '&cursor=' + first.cursor, { headers: { Cookie: auth.cookie } })).json(); assert.equal(second.documents.length, 2); assert.equal(second.cursor, null);
  assert.equal((await app.request('/api/cards?cursor=..%2Fprivate', { headers: { Cookie: auth.cookie } })).status, 400); app.DB.close();
});
test('favorites and study accept only bounded safe vector maps and cannot tombstone', async () => {
  const app = setup(); const auth = await authenticate(app);
  const favorite = { ...card('word-favorite', 'fav-op'), kind: 'favorites', data: { adds: { 'actor-a': 1 }, removes: {} } };
  const study = { ...card('study-quiz-runs', 'study-op'), kind: 'study', data: { counts: { 'actor-a': 3 }, cleared: {}, adds: {}, removes: {} } };
  assert.equal((await app.request('/api/sync', mutation(auth, { operations: [favorite, study] }))).status, 200);
  for (const kind of ['favorites', 'study']) {
    const body = await (await app.request('/api/' + kind, { headers: { Cookie: auth.cookie } })).json();
    assert.equal(body.documents.length, 1); assert.equal(body.checkpoint, 2); assert.equal(body.documents[0].deleted, false);
  }
  const variants = [
    { ...favorite, deleted: true }, { ...favorite, data: { adds: [], removes: {} } },
    { ...favorite, data: { adds: { 'actor-a': 1000000001 }, removes: {} } },
    { ...favorite, data: { adds: { 'actor-a': -1 }, removes: {} } },
    { ...favorite, data: { adds: { 'actor-a': 0.5 }, removes: {} } },
    { ...favorite, data: { adds: { constructor: 1 }, removes: {} } },
    { ...favorite, data: JSON.parse('{"adds":{"__proto__":1},"removes":{}}') },
    { ...favorite, data: { adds: Object.fromEntries(Array.from({ length: 257 }, (_, i) => ['actor-' + i, 1])), removes: {} } },
    { ...study, data: { ...study.data, unrelated: {} } }
  ];
  for (const variant of variants) assert.throws(() => testing.validateOperation(variant)); app.DB.close();
});
test('vector map key order normalizes idempotently without losing actors', async () => {
  const db = createDB();
  const a = { ...card('vector-id', 'vector-op'), kind: 'favorites', data: { adds: { z: 2, a: 1 }, removes: {} } };
  const b = { ...a, data: { adds: { a: 1, z: 2 }, removes: {} } };
  assert.deepEqual(await testing.applyOperation(db, a, () => NOW), await testing.applyOperation(db, b, () => NOW)); db.close();
});
test('delta clock advances only accepted writes; routine since pulls return only changed rows', async () => {
  const app = setup(); const auth = await authenticate(app); const opts = { headers: { Cookie: auth.cookie } };
  await testing.applyOperation(app.DB, card('one', 'op-one'), () => NOW);
  await testing.applyOperation(app.DB, card('two', 'op-two'), () => NOW);
  const initial = await (await app.request('/api/cards?since=0', opts)).json(); assert.equal(initial.documents.length, 2); assert.equal(initial.checkpoint, 2);
  await testing.applyOperation(app.DB, card('one', 'op-one'), () => NOW); // exact retry
  await testing.applyOperation(app.DB, card('one', 'conflict', 0), () => NOW); // rejected base
  const unchanged = await (await app.request('/api/cards?since=2', opts)).json(); assert.deepEqual(unchanged, { epoch: 0, documents: [], cursor: null, checkpoint: 2 });
  await testing.applyOperation(app.DB, { ...card('two', 'op-two-deleted', 1), deleted: true }, () => NOW);
  const changed = await (await app.request('/api/cards?since=2', opts)).json(); assert.equal(changed.documents.length, 1); assert.equal(changed.documents[0].id, 'two'); assert.equal(changed.documents[0].deleted, true); assert.equal(changed.checkpoint, 3);
  assert.equal(app.DB.sqlite.prepare('SELECT value FROM sync_clock').get().value, 3); app.DB.close();
});
test('writes during bounded pagination are delivered next pull without skipping later revisions', async () => {
  const app = setup(); const auth = await authenticate(app); const opts = { headers: { Cookie: auth.cookie } };
  const insert = app.DB.sqlite.prepare('INSERT INTO documents (kind, id, operation_id, revision, deleted, updated_at, data_json) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (let i = 1; i <= 252; i++) insert.run('cards', 'id-' + i, 'op-' + i, 1, 0, DATE, JSON.stringify(card().data));
  const first = await (await app.request('/api/cards?since=0', opts)).json(); assert.equal(first.checkpoint, 252); assert.equal(first.cursor, '250');
  // This unread row moves above the captured checkpoint. Next cycle must find it.
  await testing.applyOperation(app.DB, card('id-251', 'updated-during-pagination', 1), () => NOW);
  await testing.applyOperation(app.DB, card('brand-new', 'new-during-pagination'), () => NOW);
  const second = await (await app.request('/api/cards?since=0&until=252&cursor=250', opts)).json(); assert.equal(second.checkpoint, 252); assert.deepEqual(second.documents.map(doc => doc.id), ['id-252']); assert.equal(second.cursor, null);
  const next = await (await app.request('/api/cards?since=252', opts)).json(); assert.equal(next.checkpoint, 254); assert.deepEqual(next.documents.map(doc => doc.id), ['id-251', 'brand-new']); app.DB.close();
});
test('invalid, future, duplicate, unbounded-page and backwards checkpoints fail safely', async () => {
  const app = setup(); const auth = await authenticate(app); const opts = { headers: { Cookie: auth.cookie } };
  await testing.applyOperation(app.DB, card(), () => NOW);
  for (const query of ['since=-1', 'since=1.5', 'since=01', 'since=9007199254740992', 'since=0&since=1', 'since=0&until=2', 'since=1&until=0', 'since=0&cursor=1', 'since=0&until=1&cursor=2', 'since=1&until=1&cursor=0', 'unknown=1']) assert.equal((await app.request('/api/cards?' + query, opts)).status, 400, query);
  const response = await app.request('/api/cards?since=2', opts); assert.equal(response.status, 409); assert.deepEqual(await response.json(), { error: 'checkpoint_ahead' }); app.DB.close();
});
test('a failed receipt transaction rolls back the change clock too', async () => {
  const db = createDB(); db.sqlite.exec("CREATE TRIGGER fail_receipt BEFORE INSERT ON operation_receipts BEGIN SELECT RAISE(ABORT, 'receipt failed'); END");
  await assert.rejects(testing.applyOperation(db, card(), () => NOW)); assert.equal(db.sqlite.prepare('SELECT value FROM sync_clock').get().value, 0); db.close();
});
test('server owner allowlist requires a strictly normalized email and has no embedded default', async () => {
  for (const owner of [undefined, null, '', ' ', 'Owner@example.test', ' owner@example.test', 'owner@example.test ', 'a..b@example.test', '.owner@example.test', 'owner.@example.test', 'owner@@example.test', 'owner@-example.test', 'owner@example-.test', 'owner@localhost', 'owner@example.test\n', '所有者@example.test', 'a'.repeat(65) + '@example.test']) {
    const app = setup({ env: { OWNER_EMAIL: owner } });
    assert.equal((await (await app.request('/api/config')).json()).enabled, false, String(owner));
    assert.equal((await app.request('/auth/login')).status, 503); app.DB.close();
  }
  const app = setup({ env: { OWNER_EMAIL: 'configured-owner@example.test' } });
  assert.equal((await (await app.request('/api/config')).json()).enabled, true);
  const login = await begin(app);
  assert.equal((await callback(app, login)).status, 403, 'test helper owner is not a production fallback');
  assert.equal((await callback(app, login, { claims: { email: 'configured-owner@example.test' } })).status, 303);
  assert.equal((await app.request('/api/config?OWNER_EMAIL=attacker@example.test')).status, 200);
  assert.equal(app.env.OWNER_EMAIL, 'configured-owner@example.test'); app.DB.close();
});
test('server allowlist changes invalidate old sessions and client owner hints cannot override it', async () => {
  const app = setup(); const auth = await authenticate(app);
  app.env.OWNER_EMAIL = 'new-owner@example.test';
  assert.equal((await app.request('/api/session', { headers: { Cookie: auth.cookie, 'X-Owner-Email': TEST_OWNER_EMAIL } })).status, 401);
  const login = await begin(app);
  assert.equal((await callback(app, login, { form: { ownerEmail: TEST_OWNER_EMAIL } })).status, 403);
  assert.equal((await callback(app, login, { claims: { email: 'new-owner@example.test' } })).status, 303); app.DB.close();
});
