// D1's documented prepare/bind/batch interface over Node's real SQLite engine.
// This verifies SQL behavior, not Cloudflare's distributed service/runtime.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
export function createDB() {
  const sqlite = new DatabaseSync(':memory:');
  for (const name of readdirSync(new URL('../migrations/', import.meta.url)).filter(name => name.endsWith('.sql')).sort()) sqlite.exec(readFileSync(new URL('../migrations/' + name, import.meta.url), 'utf8'));
  function statement(sql, parameters = []) {
    return {
      bind(...values) { return statement(sql, values); },
      async first() { return sqlite.prepare(sql).get(...parameters) || null; },
      async all() { return { results: sqlite.prepare(sql).all(...parameters) }; },
      async run() { const result = sqlite.prepare(sql).run(...parameters); return { success: true, meta: { changes: Number(result.changes) } }; },
      execute() {
        const query = sqlite.prepare(sql);
        if (query.columns().length) return { success: true, results: query.all(...parameters) };
        const result = query.run(...parameters); return { success: true, results: [], meta: { changes: Number(result.changes) } };
      }
    };
  }
  return {
    prepare: statement,
    async batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try { const result = statements.map(item => item.execute()); sqlite.exec('COMMIT'); return result; }
      catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
    sqlite,
    close() { sqlite.close(); }
  };
}
