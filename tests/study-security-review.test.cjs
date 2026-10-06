const test = require('node:test');
const assert = require('node:assert/strict');
const { webcrypto } = require('node:crypto');
const { createStore, memoryAdapter } = require('../js/card-store.js');
const { createStudySync } = require('../js/study-sync.js');

test('deployment opt-in remains active when backend config resolved disabled before study bridge starts', async () => {
  const env = { crypto: webcrypto, CHENGCI_SYNC_CONFIG: { enabled: true, provider: 'cloudflare' },
    ChengciCloudSync: { getState: () => ({ configured: false, status: 'disabled' }) } };
  const store = createStore({ env, adapter: memoryAdapter(), broadcast: false });
  await store.ready;
  let state = { quizRuns: 0 }, save, legacyWrites = 0;
  const app = { read: () => state, write: next => { state = next; }, localRender() {}, render() {},
    installSave(wrap) { save = wrap(() => { legacyWrites++; }); } };
  const bridge = createStudySync({ env, store, app, model: { allItems: [] } });
  await bridge.ready;
  state.quizRuns++;
  save();
  await bridge.retry();
  assert.equal(legacyWrites, 0, 'temporary disabled backend must not enable legacy persistent writes');
  assert.equal(bridge.getState().enabled, true);
  assert.equal(Object.values(store.getShared('study', 'study-quiz-runs').counts).reduce((a,b)=>a+b,0), 1);
});
