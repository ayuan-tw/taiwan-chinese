# 澄詞: same-origin Workers + D1 backend

Status: the feature-branch test app was deployed successfully at [the approved workers.dev origin](https://chengci-owner-sync.ayuannoa.workers.dev). The owner has created the D1 database and applied the initial schema. Version 6.10.1 contains the separately approved activation of owner-only Google login and sync; live authentication and cross-device acceptance still need verification. The generic example stays disabled with placeholders. The existing GitHub Pages app and main branch remain separate.

## Architecture and trust boundaries

- One HTTPS origin serves a public static app shell and an owner-only sync API. The static build copies only approved public files into `cloudflare/public`; it never serves the repository, docs, tests, server code, config credentials, or `.git`.
- Cloudflare Access/Zero Trust is not used. No client secret, API token, admin password, or service-account credential is needed in browser code.
- The server admits only the explicitly approved, Google-verified identity set in trusted server-side `OWNER_EMAIL`. The address must be a normalized lowercase ASCII email with a valid domain; missing or malformed configuration disables sync. No owner identity is embedded in source code or public examples. Optional `OWNER_SUB` pins the verified Google subject after an authorized provisioning check. There is no signup, first-user claim, or client-controlled owner setting.
- Personal documents live in D1 behind authenticated routes. They are never in public assets, Worker cache entries, URLs, or application logs.
- The client must keep shared/work devices memory-only by default. Trusted-device IndexedDB and persistent login are separate, explicit opt-ins. The backend cannot erase a downloaded file or local browser data; local cleanup remains a client responsibility.
- Public shell files can be cached by the service worker. Auth/API responses, including errors, are `no-store, private`. Auth expiry blocks only online sync; it must never disable learning, add/edit, or saving locally on an opted-in trusted device.

## Login and sessions

`GET /auth/login?rememberDevice=0` renders only the official GIS button with `data-ux_mode="redirect"`, no One Tap, and no auto-selection. The default value is `0`. Use `1` only following explicit trusted-device choice. The client must protect unsaved/memory-only data before a full-page redirect. Google documents redirect as required on iOS. [Browser support](https://developers.google.com/identity/gsi/web/guides/supported-browsers)

The login attempt uses independent random state, nonce, and a 10-minute one-time flow cookie. The flow cookie is first-party, `__Host-`, Secure, HttpOnly, Path=/, and SameSite=None to allow Google's top-level POST return; it confers no API access. Only its SHA-256 hash, plus hashes of state/nonce, are stored. GIS independently supplies `g_csrf_token` in cookie and POST body; the callback requires an exact match, the expected state, and the signed nonce. Duplicate/ambiguous sensitive fields/cookies are rejected. The flow is consumed atomically with session issuance to stop replay and concurrent callback reuse.

The verifier retrieves keys only from Google's fixed JWKS URL, uses manual redirect handling and rejects every non-2xx response (workerd does not implement the Fetch `redirect:"error"` mode), uses WebCrypto RSA/SHA-256, pins RS256, rejects token-directed key URLs/critical headers, and verifies signature, issuer, exact web client audience, optional authorized party, expiry, issued-at/not-before, nonce, verified email, and optional subject. Keys follow Google's max-age with a bounded refresh. Failures never fall back to unverified claims or `tokeninfo`. Google's documentation recommends a Google/general-purpose JWT library; this dependency-free, narrowly scoped verifier instead uses the native cryptographic API and has signed-token negative tests. It warrants independent review before production. [Google verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [GIS fields](https://developers.google.com/identity/gsi/web/reference/html-reference)

The authenticated cookie is first-party `__Host-chengci-session`, Secure, HttpOnly, Path=/, SameSite=Lax. A shared-device session has no Max-Age/Expires and an 8-hour server limit; browsers may restore session cookies, so explicit logout is important. Trusted login sets a 30-day Max-Age and matching fixed server expiry. Only a hash of the random 256-bit session token is stored in D1. The CSRF header token is domain-separated from the session token and returned only by authenticated `/api/session`.

Normal logout deletes the current app session. `allDevices:true` revokes all app sessions and unfinished login attempts. Neither signs the user out of Google nor revokes their separate Google consent. There are no Google refresh/access tokens to store or revoke. To end Google consent as well, the user can use their [Google account connections](https://myaccount.google.com/connections).

## API contract

All endpoints are on the app's exact HTTPS origin. No cross-origin CORS grants or arbitrary forwarding are available. Every mutation requires `Origin: APP_ORIGIN`, a valid cookie, and `X-CSRF-Token` from the current `/api/session`. Fetch Metadata, when available, also rejects cross-origin API access. Login's cross-site Google POST instead uses the dedicated protections above.

- `GET /api/config`: `{enabled, loginUrl:"/auth/login", reason?}`. This is public configuration readiness, not a live Google sign-in or D1 migration health check.
- `GET /api/session`: `{authenticated:true,user:{uid,sub,email,emailVerified:true},csrfToken,persistent,expiresAt}`. `uid` equals Google `sub`. Missing/expired/revoked sessions return 401.
- `GET /api/cards`, `/api/progress`, `/api/favorites`, and `/api/study`: `{documents:[...],cursor:null|"<sequence>",checkpoint:<number>}`. A first request uses `?since=N` (default 0), captures the global database clock H, and returns only newer records. Continuation requests must carry `?since=N&until=H&cursor=C`. Pages contain at most 250 latest records ordered by server change sequence, including tombstones. Advance a client checkpoint only after every page has applied successfully; ordinary polls then transfer only changes. Do not reset a checkpoint or infer deletion from an absent row.
- `POST /api/sync`: JSON `{operations:[...]}` (1–10 operations and maximum 1 MiB encoded request). Returns `{results:[{kind,id,operationId,status:"accepted"|"conflict",document}]}`. Each accepted operation and receipt are atomic. A request spanning many operations may partly complete before a later failure; retries are safe because operation IDs are idempotent. Do not generate replacement IDs merely because a network response was lost.
- `POST /api/logout`: empty body, `{}`, or JSON `{allDevices:false|true}`; returns 204 and expires app cookies. When already unauthorized, the client may clear its local login indicator but cannot claim server-side logout succeeded offline.

An incoming operation has exactly:

```json
{"kind":"cards","id":"personal-example","operationId":"op-example","baseRevision":0,"deleted":false,"updatedAt":"2026-10-06T00:00:00.000Z","data":{"word":"澄","zhuyin":"ㄔㄥˊ","meaning":"澄む","example":"","exampleZhuyin":"","note":"","pronunciationStatus":"confirmed"}}
```

A returned document has exactly `schemaVersion:1`, `id`, `operationId`, `revision`, `deleted`, `updatedAt`, and `data`. `kind` is carried by the endpoint/result envelope. Progress data is exactly `{result:"read"|"notyet",attempts:<integer 0..1e9>,updatedAt:<canonical ISO UTC>}`. Card data requires all shown keys, bounded strings, and pronunciationStatus `candidate|confirmed|missing`. IDs are 1–150 characters, start alphanumeric, and otherwise use alphanumerics, `_`, or `-`; reserved prototype names are rejected. Dates use `YYYY-MM-DDTHH:mm:ss.sssZ` and must be real dates. Unknown fields are rejected.

Favorites data is exactly `{adds:{actorId:count},removes:{actorId:count}}`; study data is exactly `{counts:{actorId:count},cleared:{actorId:count},adds:{actorId:count},removes:{actorId:count}}`. Each vector is a plain object with at most 256 safe actor IDs and integer values from 0 to 1e9. These kinds require `deleted:false`; removal/reset is represented by the vectors. The client performs component-wise max merge/rebase after a CAS conflict; the backend validates and conditionally writes the result, never silently replaces a concurrent record. Stable study/favorite IDs and the `study-quiz-runs` convention are client-owned.

The first accepted revision is 1. SQL compare-and-set admits changes only at their stated base revision. Tombstones remain as records; stale clients cannot resurrect them silently. A conflict returns the current server document. It can return `document:null` when a client references a nonzero revision missing from this database (for example, an incorrectly selected fresh backend); the client must preserve local data and surface this rather than silently overwrite/rebase it.

A SQLite clock advances atomically on accepted document insertion/revision changes. An idempotent retry or rejected CAS does not advance it. The `(kind, change_seq)` index supports bounded delta reads. If an unread record is edited during pagination and moves above H, the next poll after H retrieves that latest revision; this is eventual latest-state sync rather than a historical snapshot/event log. A future `since` returns 409 `checkpoint_ahead` so a mismatched fresh database cannot silently erase client state.

Idempotency receipts store the exact accepted snapshot and a normalized-request hash. A retry returns that snapshot even if newer edits exist; a subsequent pull finds those newer edits. Reusing an operation ID with different content returns 409 `operation_id_reused`. Receipts are not automatically pruned: an arbitrarily old offline client could still retry. D1's documented `batch` transaction rollback is relied on for atomicity. [D1 batch contract](https://developers.cloudflare.com/d1/worker-api/d1-database/)

Errors are JSON `{error:<stable-code>}` without credentials, data, stack traces, or underlying provider error bodies. Typical status codes: 400 malformed operation, 401 login required/bad credential, 403 owner/CSRF/origin failure, 409 reused operation ID, 413 oversized request, 415 unsupported content type, and 503 unconfigured/unavailable service. Local pending work must survive all failures.

The maximum batch is deliberately 10 operations: four statements per operation plus the session read stays under the documented 50-query Free invocation limit. Daily/CPU/storage limits still apply; quota errors preserve local pending work. [D1 limits](https://developers.cloudflare.com/d1/platform/limits/)

## Local verification (no provider resources)

Node 24 or later is required for the built-in SQLite test harness. No dependency installation or network access is needed:

```sh
node --check cloudflare/worker.mjs
node --test cloudflare/tests/*.test.mjs
node cloudflare/build-assets.mjs
```

The test harness uses real RSA signatures, WebCrypto and SQLite SQL/transactions with a minimal D1 API adapter; Google keys/responses are generated and mocked in memory. It is not a live Google, D1, Workers or Safari test. Generated assets are gitignored. The build also creates a flat `asset-revisions.json` map of `./relative/path` to lowercase SHA-256 hex (including `./` as an index alias), excluding itself and `service-worker.js`. The client service worker can byte-verify and reuse unchanged cached assets across versions; changed files still require download. `manifest.json` is included as a normal app asset. Rerun the asset build after every client change; never upload the repository root as the asset directory.

## Provisioning checklist (requires separate authorization)

1. Confirm the approved Cloudflare account, intended HTTPS origin, data-hosting choice, and any displayed agreements/costs. No payment card/Zero Trust assumption is made. Persistent-access grants/account creation and publication require their own approvals; this implementation does not authorize them.
2. In an approved Google Cloud project, configure a **Web application** OAuth client. Set the exact app origin as the authorized JavaScript origin and `https://<approved-host>/auth/google` as the exact redirect URI. Configure only sign-in (`openid`, email, profile), with the dedicated owner as an allowed test user when applicable. No Gmail/Drive scopes or client secret should enter this app. Google explains the [client/consent setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).
3. Create/choose the approved D1 database, then copy `wrangler.example.jsonc` to version-controlled `wrangler.jsonc` and fill only the confirmed Worker name and D1 ID. Set dashboard runtime `SYNC_ENABLED="false"` through setup, plus confirmed `APP_ORIGIN` and public `GOOGLE_CLIENT_ID`. The actual checked-in configuration now owns exactly three approved public variables: `APP_ORIGIN`, `GOOGLE_CLIENT_ID`, and `SYNC_ENABLED`. Later Git deploys intentionally apply those values. The disabled generic example does not include a `vars` block. Configure the approved owner address as a server-only `OWNER_EMAIL` secret in the Cloudflare dashboard, and optional `OWNER_SUB` there too. Keep both out of repository files, build artifacts, client config, and public deployment variables; there is no production fallback. Other credentials also stay outside the repository. The example uses top-level `keep_vars:true` to retain dashboard-managed runtime variables on later deployments. Do not add private owner variables to checked-in `vars`; explicitly listed values can still be changed by deployment configuration. Cloudflare documents dashboard-variable preservation and persistent encrypted secrets in its [Wrangler source-of-truth guidance](https://developers.cloudflare.com/workers/wrangler/configuration/#source-of-truth). Use a scoped approved deployment identity outside this repository; never paste API tokens or OAuth secrets into files/chat/public assets.
4. Apply `migrations/0001_initial.sql` to the approved database through official Cloudflare tooling. It creates the sessions, login-attempt, document, and receipt tables without importing user data. Existing data migration requires separate review, a backup, and the already-agreed client migration flow.
5. Build public assets. Configure only the approved hostname/route; the example disables `workers_dev` and preview URLs so accidental alternative origins cannot quietly become login destinations. If an approved workers.dev origin is chosen, enable it deliberately and use that exact origin in both systems. Keep `run_worker_first:true`: it prevents asset routing from bypassing auth/API handling. [Worker-first assets](https://developers.cloudflare.com/workers/static-assets/routing/worker-script/)
6. Deploy only after publication authorization. Run the live acceptance checklist below while sync stays disabled; enable sync only after exact owner and origin settings are confirmed. If `OWNER_SUB` is not yet known, exact verified owner email remains mandatory. Pin the confirmed subject through the approved configuration workflow, never by an arbitrary first visitor.
7. Record the deployed version, hostname, migration version, rollback method and backup process. Review provider quota/rate-limiting controls for public login attempts before broad exposure. The code bounds payloads and prunes expired sessions/flows but does not provision Cloudflare rate-limit rules or promise denial-of-service protection.

Suggested official CLI commands, **not executed here**, after those authorizations:

```sh
# Run from cloudflare/ with an authorized, installed official Wrangler.
wrangler d1 migrations apply chengci-personal --remote --config wrangler.jsonc
wrangler deploy --config wrangler.jsonc
```

## Required live acceptance checks (not yet run)

- Real Google exact-origin/redirect setup, consent/test-user eligibility, owner sign-in, another account rejected, wrong/missing state and CSRF rejected, and no JWT in URL/logs.
- Current iPhone Safari and Home Screen PWA redirect/return, browser cookie policies, leaving and returning during login, cancelled login, page refresh, Back/Forward, trusted and non-trusted sessions. GIS webviews are not supported; do not infer PWA behavior from a desktop unit test.
- Google SDK/CSP loading with actual browser reports, and public shell startup with third-party cookies blocked. No app feature should require Google while offline.
- Real D1 migration and Worker APIs, binding names, static asset routing, concurrent writes from two devices, uncertain-response retries, tombstone conflicts and all-device revocation.
- Offline shell after first load, expired-auth add/edit/learning, later login and sync, and unsynced data surviving interruption. Browser storage eviction and private browsing have platform limits; backups remain important.
- Shared/work-device reload must not reveal personal records from Cache Storage, IndexedDB, localStorage, browser history, or stale UI. A trusted personal device should retain the specifically opted-in local data.
- Confirm unauthenticated reads cannot retrieve any personal record and that `/cloudflare`, `/docs`, `/tests`, source/config credential paths, alternate origins and preview hosts do not bypass the perimeter.

A successful local test suite is not evidence that any of these live checks passed.

## GitHub Actions test deployment

The selected path is the official [Cloudflare Wrangler GitHub Action](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/), not Workers Builds. `.github/workflows/deploy-cloudflare-test.yml` runs only for pushes to `codex/chengci-6-10-offline-sync` in `ayuan-tw/taiwan-chinese`. There is no main, pull-request, tag, scheduled or manual-dispatch trigger. Publishing this workflow to that branch starts deployment, so its initial push requires explicit publication approval. Later pushes to the same branch also deploy; review changes accordingly. Moving the trigger to main requires a separate reviewed change and approval.

The owner enters the deployment token personally in the repository's Actions secret `CLOUDFLARE_API_TOKEN`. The non-secret account ID belongs in the Actions repository **variable** `CLOUDFLARE_ACCOUNT_ID`, not an identically named secret. Never include the token in a file, screenshot, chat, command, client bundle or job output. Only the pinned deployment action receives it; tests, asset building and the exact Wrangler installation run beforehand without it. In the credential-bearing step npm is offline and lifecycle scripts are disabled, so fallback installation cannot run install scripts with the token. The action does not create runtime Worker secrets or apply database migrations.

Official actions are pinned to reviewed commit SHAs: checkout v7.0.1, setup-node v7.0.0 and wrangler-action v4.1.3. Node 24.19.0 and Wrangler 4.147.0 are exact versions, verified from their upstream release tags. The job grants only `contents:read`, does not persist Git credentials or use dependency caches, and does not cancel an in-flight deployment. A final public branch-tip check rejects reruns of obsolete commits. Any test, build, account-ID or tip-check failure prevents deployment.

The actual `cloudflare/wrangler.jsonc` binds the confirmed `chengci-personal` database and enables the approved workers.dev test route; preview URLs stay disabled. Version 6.10.1 enables the frontend and the three approved public runtime variables. The backend still fails closed without a valid server-only owner secret, and all private APIs require an authenticated owner session. Retain `keep_vars:true` (also passed to deployment), Worker-first routing, approved public asset directory, and binding names `DB` and `ASSETS`. Only `APP_ORIGIN`, `GOOGLE_CLIENT_ID`, and `SYNC_ENABLED` are checked into `vars`; keep private owner settings as Cloudflare secrets. Other dashboard-managed variables remain preserved by `keep_vars`, while these three public values are intentionally code-managed. Do not deploy the repository root as static assets.

For local verification, run all tests and `node cloudflare/build-assets.mjs`. The deployment action then runs the equivalent of `wrangler deploy --config cloudflare/wrangler.jsonc --keep-vars` using its pinned version. Before any later manual deployment, confirm the destination and authorization again. A successful workflow is not evidence of real Google sign-in, cross-device sync, iPhone behavior or offline browser acceptance; those remain explicit live checks.

A separate `node cloudflare/build-pages.mjs` creates a Pages Advanced Mode directory with `_worker.js` and `_routes.json` if that route is selected later. Both use the same API and D1 schema. This packaging does not publish anything.

## Owner activation and optional subject pinning

The public OAuth client is used only for Google Identity Services sign-in; no Gmail, Drive, refresh-token, client-secret or admin credential flow is used. Google's [Testing exception](https://support.google.com/cloud/answer/15549945) applies to Sign in with Google without extra OAuth scopes: this request does not require a test-user entry or inherit the seven-day authorization expiry. Google account-specific restrictions can still apply.

The owner personally enters the approved email in the Worker secret `OWNER_EMAIL` before the activation deployment. Without `OWNER_SUB`, every login still requires a valid Google signature, issuer, exact audience, nonce, expiry, `email_verified:true`, and exact match to that configured email. There is no first-visitor ownership claim. After the owner successfully signs in, the D1 Console read `SELECT DISTINCT owner_sub FROM sessions;` reveals only the verified identity identifier, not usable authentication tokens. After confirming it, set `OWNER_SUB` as another private Worker secret through the authorized setup flow. Do not copy the full `/api/session` response into chat, because it includes a CSRF token. No subject is automatically adopted from an arbitrary login attempt.

## Unified word vocabulary (6.11.0)

Version 6.11.0 adds `migrations/0002_unified_vocabulary.sql`
and a reviewed one-shot owner bootstrap. The schema alone is additive and does
not reset data. The bootstrap privately archives every prior document before
resetting learning, seeds the existing 152 stable word IDs without overwriting
edits/tombstones, and fences stale clients with `X-Chengci-Epoch`. The new
`remembered` kind is separate from per-round progress. See
[`docs/UNIFIED_VOCABULARY_MIGRATION.md`](../docs/UNIFIED_VOCABULARY_MIGRATION.md)
for the exact protocol, recovery, rollout order and verification requirements.
Schema application, software deployment and the owner's explicit data bootstrap
are separate steps; publishing the app alone does not reset learning.
