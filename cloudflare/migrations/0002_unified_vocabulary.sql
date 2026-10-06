-- Additive schema only: applying this file does not reset or seed any user data.
-- The authenticated, explicitly reviewed bootstrap request performs the data
-- migration in one D1 batch, archiving every existing document first.
CREATE TABLE IF NOT EXISTS vocabulary_state (
  singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
  version INTEGER NOT NULL DEFAULT 0 CHECK (version IN (0, 1)),
  epoch INTEGER NOT NULL DEFAULT 0 CHECK (epoch >= 0),
  migrated_at TEXT,
  backup_id TEXT
) STRICT;
INSERT OR IGNORE INTO vocabulary_state (singleton, version, epoch) VALUES (1, 0, 0);

CREATE TABLE IF NOT EXISTS vocabulary_backups (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  previous_epoch INTEGER NOT NULL,
  document_count INTEGER NOT NULL
) STRICT;
CREATE TABLE IF NOT EXISTS vocabulary_backup_documents (
  backup_id TEXT NOT NULL REFERENCES vocabulary_backups(id),
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  deleted INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  data_json TEXT NOT NULL CHECK (json_valid(data_json)),
  change_seq INTEGER NOT NULL,
  PRIMARY KEY (backup_id, kind, id)
) STRICT;

-- Keep the original documents table and its CHECK constraint untouched. This
-- fifth kind shares its clock/receipts/API but has a separate additive table.
CREATE TABLE IF NOT EXISTS remembered_documents (
  kind TEXT NOT NULL CHECK (kind = 'remembered'),
  id TEXT NOT NULL,
  operation_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  deleted INTEGER NOT NULL CHECK (deleted = 0),
  updated_at TEXT NOT NULL,
  data_json TEXT NOT NULL CHECK (json_valid(data_json)),
  change_seq INTEGER NOT NULL DEFAULT 0 CHECK (change_seq >= 0),
  PRIMARY KEY (kind, id)
) STRICT;
CREATE INDEX IF NOT EXISTS remembered_delta ON remembered_documents (kind, change_seq);
CREATE TRIGGER IF NOT EXISTS remembered_insert_sequence AFTER INSERT ON remembered_documents
BEGIN
  UPDATE sync_clock SET value = value + 1 WHERE singleton = 1;
  UPDATE remembered_documents SET change_seq = (SELECT value FROM sync_clock WHERE singleton = 1)
    WHERE kind = NEW.kind AND id = NEW.id;
END;
CREATE TRIGGER IF NOT EXISTS remembered_update_sequence AFTER UPDATE OF revision ON remembered_documents
WHEN NEW.revision != OLD.revision
BEGIN
  UPDATE sync_clock SET value = value + 1 WHERE singleton = 1;
  UPDATE remembered_documents SET change_seq = (SELECT value FROM sync_clock WHERE singleton = 1)
    WHERE kind = NEW.kind AND id = NEW.id;
END;

-- Receipts remain immutable. A retired pre-reset learning receipt must never
-- return its old value as an accepted write in the new epoch.
CREATE TABLE IF NOT EXISTS retired_learning_operations (
  operation_id TEXT PRIMARY KEY NOT NULL
) STRICT;
