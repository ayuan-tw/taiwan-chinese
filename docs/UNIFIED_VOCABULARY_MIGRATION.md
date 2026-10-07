# Unified word vocabulary: migration and recovery

## Scope and rollout

Version 6.11.0 separates software publication from the owner's data migration.
The additive schema must exist before deployment; publishing the Worker/client
does not bootstrap or reset the account. The owner explicitly starts the
reviewed migration in the app. Verify the current deployment and account epoch
separately before acting; a local test pass is not proof of a live migration.

All **words** (152 bundled seed entries plus existing personal entries) move to
one owner-authorized Cloudflare D1 authority. Each trusted device retains an
offline copy and an outbox. Patterns, idioms and habitual phrases keep their
existing bundled sources; this change does not add personal pattern/phrase
editors. The word-management list remains searchable and editable, including
remembered words. The recall-learning pool excludes remembered words, and
unchecking the box adds a word back. Remembered state is separate from an
individual round's “read/not yet” answer.

## Data preservation

- Existing stable IDs are preserved. The seed generator evaluates the same
  `data/words.js` and `js/data-model.js` public data as the app; its checked-in
  output is verified against all 152 IDs during tests.
- Bootstrap inserts seed cards only where that ID is absent. Existing lexical
  edits, personal cards, deleted-card tombstones and operation receipts remain.
- Existing seeded-ID cards receive only missing `category`, `tags` and `confuse`
  metadata. Lexical text and any existing metadata win. Such a change advances
  the revision, so a pending older edit must use normal visible conflict
  handling rather than silently overwriting the cloud version.
- Before resetting learning records, the same D1 transaction copies every old
  document, including tombstones and all learning kinds, into a private,
  immutable migration archive. A count invariant aborts the complete
  transaction if the archive is incomplete. Quota/query/SQL failure rolls back
  the seed, archive, reset, clock and epoch together.
- The legacy device database is retained as a recovery source. The new client
  uses isolated epoch-aware state so an already-open old tab cannot write old
  learning back into the new outbox. Device-only lexical edits and conflicts
  must survive adoption. Session-only mode must not silently create a durable
  private-data copy.

## One authority after bootstrap

`data/words.js` is a first-run/offline fallback and migration seed. After a
complete canonical cloud pull, the active word inventory uses the synced store,
including deleted entries as tombstones. A partial first pull must not replace
a working offline inventory. Absence from a delta page never means deletion.

Editing the bundled source in a later app build does **not** reinsert a deleted
word or overwrite an owner's edits. The bootstrap version is one-shot. Future
bulk word additions need an explicit reviewed import into the canonical store.
The generated seed is never accepted from a browser request.

## Schema migration versus data migration

`cloudflare/migrations/0002_unified_vocabulary.sql` is additive. It creates:

- `vocabulary_state`: migration version and sync epoch
- `vocabulary_backups` / `vocabulary_backup_documents`: private migration archive
- `remembered_documents`: independent OR-set state, with the existing global
  delta clock and idempotency receipts
- `retired_learning_operations`: pre-reset receipt IDs that cannot replay

Applying the schema alone does not seed words or reset study/favorite data. It
must be applied to the exact approved D1 database before publishing the new
Worker. The deployment workflow intentionally does not apply remote migrations.

The data migration is the authenticated, CSRF-protected
`POST /api/vocabulary/bootstrap` request with exactly `{ "version": 1 }`. The
first accepted request archives the old state, seeds words, resets
progress/favorites/study/remembered, and advances epoch 0 to 1 in one D1 batch.
Repeated or concurrent requests are no-ops after the first completed bootstrap.
The app exposes an explicit one-time “単語を統一する” control after owner login,
with the reset and backup explained before confirmation. Merely reading the
session does not bootstrap or reset the server. Approval of a future deployment
must cover this reviewed behavior, not just new UI files. Devices joining an
already migrated account archive their own old learning before adopting its
new epoch.

## Protocol

- `GET /api/config` advertises `vocabularyVersion: 1`. It remains a configuration
  endpoint, not proof of schema readiness or a completed migration.
- `GET /api/session` includes `vocabulary: { version, epoch, ready, backupId,
  migratedAt }` for the authenticated owner.
- Bootstrap returns `{ vocabulary: ... }` with the same shape.
- Every kind read and sync write sends `X-Chengci-Epoch` with the exact decimal
  epoch. A missing header is compatible only with epoch 0 before bootstrap.
- Every successful delta response includes `epoch`, `documents`, `cursor` and
  `checkpoint`. Sync replies include `epoch` and `results`. A client must check
  the epoch before applying any returned data.
- `409 vocabulary_epoch_changed` fences old tabs and stale/offline clients.
  The write epoch predicate is inside the SQL compare-and-set, so a request
  checked before bootstrap cannot race the reset and write afterward.
- Pre-reset learning operation receipts are retained but retired. Replaying
  one in epoch 1 returns `409 retired_learning_operation`, never an accepted
  old learning snapshot. Card receipts remain usable so lost acknowledgements
  for lexical edits can recover safely.
- `remembered` data is `{ adds: { actorId: count }, removes: { actorId: count } }`,
  like favorites. An observed removal is reversible; an unseen concurrent add
  is retained until the next explicit removal. No device-clock last-write-wins
  rule is introduced.
- Cards support optional bounded `category`, `tags`, `confuse` fields. Legacy
  lexical payloads remain readable. Unknown fields still fail closed.

Receipts are inserted only if the preceding CAS actually changed a row. Merely
matching an existing seed/bootstrap operation ID cannot falsely acknowledge a
different request.

## Recovery and rollout review

1. Finish local aggregate tests and review the client upgrade, first-pull and
   offline cases. A Node/SQLite pass is not a live D1, Safari or Google test.
2. Review the exact branch diff, target database and planned release, including
   the bootstrap reset and private backups. Do not push this auto-deploy branch
   merely to share a review draft.
3. With publication/migration authorization, apply only the additive schema to
   the approved D1 database. Confirm its version before publishing the Worker.
4. Publish matching Worker/client assets, with an updated app/service-worker
   version, and verify the exact deployed commit and CI result.
5. On owner login, verify canonical word count and existing personal edits, then
   test search/edit, remembered/unremembered, offline mode, cross-device changes,
   conflict retention, and reopening an old tab.
6. Keep the archive and legacy local database. Do not purge them as cleanup.

The owner-authenticated `GET /api/vocabulary/backup[?cursor=N]` exports the
immutable pre-reset archive in pages of at most 250 documents. Each page returns
`backup: { id, createdAt, previousEpoch, documentCount }`, a `documents` array
with each document's kind and original versioned data, and a next `cursor` or
null. Responses are private/no-store and require the same owner session; there
is no public backup URL. The app's backup export/recovery presentation must make
these retained records understandable without exposing authentication values.

Do not roll back to an old Worker that lacks epoch enforcement after bootstrap:
it could accept stale learning writes again. If a client release must be
reverted, retain the new backend fence or disable sync while recovering. Any
restoration of archived learning is a separate deliberate action; don't replay
retired receipts or silently merge old epoch data into new learning. Restoring
lexical data must use current revisions and preserve subsequent changes.

## Verification and platform limits

Local checks:

```sh
node cloudflare/generate-vocabulary-seed.mjs --check
node --test tests/*.test.cjs cloudflare/tests/*.test.mjs
node cloudflare/build-assets.mjs
node cloudflare/build-pages.mjs
node --check cloudflare/worker.mjs
git diff --check
```

The seed uses a single JSON value per binding, below D1's 2 MB value limit and
100-parameter-per-query limit. Ordinary sync still uses at most 10 operations
per request (four statements each), under the Free tier's 50-query invocation
limit. Bootstrap uses nine statements plus authentication. D1's batch atomicity
is relied on; no separate partial reset is allowed. A large archive that exceeds
quota or query duration must fail safely, leaving old state intact.

References: [D1 limits](https://developers.cloudflare.com/d1/platform/limits/),
[D1 database/batch contract](https://developers.cloudflare.com/d1/worker-api/d1-database/).
