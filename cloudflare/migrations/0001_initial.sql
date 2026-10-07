-- Single approved owner's database. D1 is accessible only through the Worker.
-- Session tokens, Google ID tokens, cookies, and credentials are never stored.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY NOT NULL,
  owner_sub TEXT NOT NULL,
  email TEXT NOT NULL,
  persistent INTEGER NOT NULL CHECK (persistent IN (0, 1)),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL CHECK (expires_at > created_at)
) STRICT;
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions (expires_at);
CREATE TABLE IF NOT EXISTS login_attempts (
  token_hash TEXT PRIMARY KEY NOT NULL,
  state_hash TEXT NOT NULL,
  nonce_hash TEXT NOT NULL,
  persistent INTEGER NOT NULL CHECK (persistent IN (0, 1)),
  expires_at INTEGER NOT NULL
) STRICT;
CREATE INDEX IF NOT EXISTS login_expiry ON login_attempts (expires_at);
CREATE TABLE IF NOT EXISTS sync_clock (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  value INTEGER NOT NULL CHECK (value >= 0 AND value <= 9007199254740991)
) STRICT;
INSERT OR IGNORE INTO sync_clock (singleton, value) VALUES (1, 0);
CREATE TABLE IF NOT EXISTS documents (
  kind TEXT NOT NULL CHECK (kind IN ('cards', 'progress', 'favorites', 'study')),
  id TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  deleted INTEGER NOT NULL CHECK (deleted IN (0, 1)),
  updated_at TEXT NOT NULL,
  data_json TEXT NOT NULL CHECK (json_valid(data_json)),
  change_seq INTEGER NOT NULL DEFAULT 0 CHECK (change_seq >= 0),
  PRIMARY KEY (kind, id)
) STRICT;
CREATE INDEX IF NOT EXISTS documents_delta ON documents (kind, change_seq);
-- The authoritative clock advances only for accepted creates/revision changes.
-- An idempotent retry or a rejected compare-and-set does not produce a delta.
CREATE TRIGGER IF NOT EXISTS documents_insert_sequence AFTER INSERT ON documents
BEGIN
  UPDATE sync_clock SET value = value + 1 WHERE singleton = 1;
  UPDATE documents SET change_seq = (SELECT value FROM sync_clock WHERE singleton = 1)
    WHERE kind = NEW.kind AND id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS documents_update_sequence AFTER UPDATE OF revision ON documents
WHEN NEW.revision != OLD.revision
BEGIN
  UPDATE sync_clock SET value = value + 1 WHERE singleton = 1;
  UPDATE documents SET change_seq = (SELECT value FROM sync_clock WHERE singleton = 1)
    WHERE kind = NEW.kind AND id = NEW.id;
END;
-- Keep receipts until a separately designed, explicitly approved maintenance
-- policy can prove that no offline client can retry an old operation ID.
CREATE TABLE IF NOT EXISTS operation_receipts (
  operation_id TEXT PRIMARY KEY NOT NULL,
  request_hash TEXT NOT NULL,
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  document_json TEXT NOT NULL CHECK (json_valid(document_json)),
  created_at INTEGER NOT NULL
) STRICT;
