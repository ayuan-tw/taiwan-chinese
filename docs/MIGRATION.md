# Optional host migration backup

## Status and scope

This repository contains a **locally prepared** migration helper. Preparing or testing these files does **not** mean an export was made from the actual old `github.io` app, that a new Cloudflare app was deployed, or that any device's data has moved.

The host can change while the app keeps its offline learning features. Browser storage does not move with a deployment: the old GitHub Pages origin and the new Cloudflare origin have separate localStorage, IndexedDB, service workers and offline caches. A newly deployed page cannot read the old origin's records.

Old study history may be reset under the current product direction. This backup is therefore optional; preserving or importing old history is not a release prerequisite. Favorites are the default migration selection. Going forward, cross-device favorites and study records use the app's separate shared-record system. This migration file is not a synchronization protocol.

## Safe sequence on each device

1. Keep the old app installed and its browser/site data intact. Do not uninstall, clear site data, or reset its storage to make the new app appear.
2. If transferring favorites is wanted, open the **old GitHub Pages origin in the browser or installed app that actually has those favorites**. A different browser, profile or installed-app storage context may show different records even on the same physical device.
3. Run the migration export UI on that old origin and save its JSON file. By default it includes only favorites. Old history and safe reading preferences can be selected separately. Pasted free-reading text must have its own explicit opt-in; it can contain private text.
4. Inspect the exported file's source origin and item counts. Give files a device-specific filename when collecting histories from multiple devices. A filename is only a label, not a mechanism for locating that device's storage.
5. Open the new Cloudflare origin, inspect the file and select what to import. Preserve a separate current backup before merging into a destination that already has important records. Import defaults to favorites only, even when a file contains more.
6. Apply/reload the imported state only by an explicit UI action, after saving or deliberately discarding open drafts. The migration API itself never navigates or reloads. The running legacy app retains in-memory values until it is deliberately rehydrated or reloaded; continuing to learn before applying may overwrite imported localStorage with those older values.
7. Verify the favorites and any selected histories on the new origin. Check the new app opens and learning works in airplane/offline mode after its first successful online load and cache preparation. Cross-device updates can only travel when the app is online; learning and local changes should remain available offline.
8. Keep the old app and backup until verification succeeds. For four devices, check all four actual browser/app contexts; an export from one is not evidence about the others.

If the actual old deployment does not yet have this helper, a later authorized release can add `js/legacy-migration.js` and the migration UI there without changing the bundled dictionary. Hosting this script only on the new origin cannot export the old origin. No deployment or storage deletion is performed by this module.

## File format

`format` is `chengci-history-migration`, `schemaVersion` is `1`.

- `exportedAt`: export time.
- `source.origin`: exact HTTP(S) origin; URL paths, queries, fragments, account identifiers and tokens are not collected. `unknown` is used when origin information is unavailable.
- `legacy`: allowlisted learning fields only.
- `preferences`: optional allowlisted reading settings.
- `freeText.freeSpeakText`: optional pasted free-reading text, never included by default.

There is no raw localStorage dump. Cookies, authentication state, API keys, provider setup, security settings, update preferences, persistence permissions, active tab and dictionary caches are outside this format. Unknown fields and unsupported format versions are rejected before storage writes.

Personal cards and their live CRDT favorite/study records use the separate `chengci-personal-cards` backup. Use that dedicated path for modern shared state so removal tombstones and vector counters are retained. This legacy format must not flatten modern shared records into a replacement for their native backup.

## Selection and merge rules

| Category | Keys | Export/import default | Merge |
| --- | --- | --- | --- |
| Favorites | `favorites` | Included | Unique union, existing order first |
| Weak items | `weakWords`, `weakCards`, `weakIdioms` | Off; `includeHistory: true` | Unique union |
| Mistake counts | `mistakeCounts`, `patternMistakeCounts`, `idiomMistakeCounts` | Off; `includeHistory: true` | Maximum per item |
| Quiz counter | `quizRuns` | Off; `includeHistory: true` | Maximum; use `quizCount` only if local `quizRuns` is missing or empty |
| Study filter | `chengciStudyScope` | Off; `includeHistory: true` | Fill only if destination has no saved filter |
| Recall history | `chengciRecallV1.history` | Off; `includeHistory: true` | Maximum attempts; newest dated result; equal-time disagreement keeps `notyet` |
| Reading settings | `audioPrefs`, `freeSpeakPrefs`, `audioQuizMode` | Off; `includePreferences: true` | Fill only absent destination keys |
| Pasted free text | `freeSpeakText` | Off; `includeFreeText: true` | Fill only absent destination text; never replace an existing draft |

The old `quizCount` key is never deleted or overwritten. Recall queues, current card, session totals and session filters are not exported; any destination session fields remain untouched.

Counters use maximum rather than addition because separate backups can contain the same practice events. This avoids inflating counts on repeated imports but cannot reconstruct an exact sum of independently practiced events. Old favorite/weak-item sets have no deletion timestamps; a union can restore an item previously removed on another device. Import is an explicit restore action, not a conflict-free live sync.

Repeated import of the same file is idempotent: it adds no duplicates or counter increments. Preferences already on the destination win. Repeated export creates a fresh export timestamp; it does not establish that the underlying history represents independent events.

## Public API and UI integration

The browser global is `window.ChengciLegacyMigration`. It does not need the new card store or an active backend. CommonJS exports expose `createMigration` for tests.

```js
const backup = await ChengciLegacyMigration.exportBackup({
  includeHistory: false,
  includePreferences: false,
  includeFreeText: false
});

const preview = ChengciLegacyMigration.inspectBackup(fileText);
// Render preview through textContent, never HTML interpolation.

const result = await ChengciLegacyMigration.importBackup(fileText, {
  includeHistory: false,
  includePreferences: false,
  includeFreeText: false
});
// Show result.changedKeys / result.skippedKeys and an explicit Apply action.
// No automatic reload, navigation, clearing of drafts or cloud upload.
```

`inspectBackup` fully validates without writing and returns counts, source origin, selected-field presence, optional preference key names and free-text character count. It does not return or render the pasted text.

A successful changed import dispatches `chengci:migration-imported` with `{ changedKeys, requiresApply: true }`. The event contains no pasted text and does not authorize a reload or synchronization operation. The host UI may show an Apply/reload prompt. Do not seed shared favorites from stale global variables on this event. Explicitly apply/rehydrate legacy state first and use the shared-record bridge's documented legacy seeding API, respecting its provenance and conservative count-merge rules.

The return object contains `summary`, `changedKeys`, `skippedKeys`, `reloadRequired`, `freeTextSkipped`, `sharedSnapshot`, and `backupId`. `sharedSnapshot` contains only the selected original favorite/weak-item/count fields from this file, never unrelated destination data or free text. `backupId` is a local SHA-256 fingerprint of canonical source origin and selected contents; export timestamps and set ordering do not change it. After explicit Apply, the host may call `await ChengciStudySync.seedLegacy(result.sharedSnapshot, result.backupId)`. The bridge uses a fixed historical baseline actor and component maxima, so overlapping old backups do not double-count and reimporting an old favorite does not undo a later shared removal. Modern live changes use the native shared-record model instead. A no-op repeated import does not dispatch another event. This helper has no UI-element IDs; the owning screen binds the functions and its own explicit choices.

## Failure behavior and validation

All input is validated before storage mutation. Source-read failure, malformed saved data, unsupported versions, wrong scalar types, negative/fractional/oversized counts, oversized collections, accessor objects and prototype-poisoning keys reject the operation. HTML-looking strings remain inert data. Consumers must still use text-safe DOM rendering.

Import serializes calls made through this instance. It snapshots affected destination keys and checks for intervening changes before writing. If a quota or storage write fails, it restores every attempted key, removing keys newly created by that failed import. Unrelated keys and the old origin remain untouched. A rollback never overwrites a value changed by another tab after the write; such a conflict is explicitly reported as an incomplete rollback.

LocalStorage has no cross-tab multi-key transactions. Close other active learning tabs during migration. A storage backend that refuses rollback, or concurrent changes that make safe rollback impossible, produce `ROLLBACK_FAILED` and `failedRollbackKeys`, rather than a false success. Keep the source app and JSON file and avoid resuming learning on the partially changed destination until it is checked. On an ordinary recoverable failure the error is `IMPORT_FAILED`, and retrying is safe after the storage problem is resolved.

## Local verification

```sh
node --check js/legacy-migration.js
node --test tests/legacy-migration.test.cjs
```

The tests exercise the old-origin/no-card-store path, default versus explicit selections, set/count merge, repeat imports, old counter fallback, recall-history merge, malformed data, prototype poisoning, inert HTML strings, read failures, quota rollback/retry, explicit rollback failure, preservation of unrelated keys, and absence of automatic navigation/network activity. These are local module tests; actual exports, installed-app browser behavior, offline caching and the host UI must be verified separately on the real device origins.
