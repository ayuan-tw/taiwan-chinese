const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const root = join(__dirname, '..');
const workflow = readFileSync(join(root, '.github/workflows/deploy-cloudflare-test.yml'), 'utf8');
const config = JSON.parse(readFileSync(join(root, 'cloudflare/wrangler.jsonc'), 'utf8'));

// These source-boundary checks do not claim that GitHub or Cloudflare has run.
test('deployment workflow is limited to an exact owner repository feature-branch push', () => {
  const triggers = workflow.split('\non:\n')[1].split('\npermissions:')[0];
  assert.equal(triggers.trim(), 'push:\n    branches:\n      - codex/chengci-6-10-offline-sync');
  assert.match(workflow, /if: github\.repository == 'ayuan-tw\/taiwan-chinese' && github\.event_name == 'push' && github\.ref == 'refs\/heads\/codex\/chengci-6-10-offline-sync'/);
});
test('deployment uses verified full action pins and exact tool versions with read-only GitHub permissions', () => {
  assert.match(workflow, /permissions:\n  contents: read\n/);
  assert.equal((workflow.match(/permissions:/g) || []).length, 1);
  const uses = [...workflow.matchAll(/uses: ([^\s]+)/g)].map(match => match[1]);
  assert.deepEqual(uses, [
    'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    'actions/setup-node@820762786026740c76f36085b0efc47a31fe5020',
    'cloudflare/wrangler-action@953926a2e2182532811c01a25e53647d93bf07c0'
  ]);
  assert.match(workflow, /node-version: '24\.19\.0'/);
  assert.match(workflow, /wranglerVersion: '4\.147\.0'/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /package-manager-cache: false/);
});
test('tests and public build run before the token-bearing deploy step without secret injection', () => {
  const deployStart = workflow.indexOf('      - name: Deploy the public test app');
  assert.ok(deployStart > workflow.indexOf('run: node --test tests/*.test.cjs cloudflare/tests/*.test.mjs'));
  assert.ok(deployStart > workflow.indexOf('run: node cloudflare/build-assets.mjs'));
  assert.doesNotMatch(workflow.slice(0, deployStart), /secrets\./);
  assert.equal((workflow.match(/secrets\./g) || []).length, 1);
  assert.match(workflow.slice(deployStart), /apiToken: \$\{\{ secrets\.CLOUDFLARE_API_TOKEN \}\}/);
  assert.match(workflow.slice(deployStart), /accountId: \$\{\{ vars\.CLOUDFLARE_ACCOUNT_ID \}\}/);
  assert.match(workflow, /command: deploy --config cloudflare\/wrangler\.jsonc --keep-vars\n/);
  assert.doesNotMatch(workflow, /d1 migrations|secret put|secrets bulk|preCommands:|postCommands:|continue-on-error:|always\(\)/);
});
test('Wrangler is installed and verified before credentials; deployment cannot run npm install scripts', () => {
  const installStart = workflow.indexOf('      - name: Install the pinned deployment tool without credentials');
  const guardStart = workflow.indexOf('      - name: Verify destination and current branch tip');
  const deployStart = workflow.indexOf('      - name: Deploy the public test app');
  assert.ok(installStart > 0 && installStart < guardStart && guardStart < deployStart);
  const install = workflow.slice(installStart, guardStart);
  assert.match(install, /npm install --no-save --package-lock=false --no-audit --no-fund wrangler@4\.147\.0/);
  assert.match(install, /npx --no-install wrangler --version/);
  assert.doesNotMatch(install, /secrets\.|CLOUDFLARE_API_TOKEN/);
  const deploy = workflow.slice(deployStart);
  assert.match(deploy, /npm_config_ignore_scripts: 'true'/);
  assert.match(deploy, /npm_config_offline: 'true'/);
});
test('serialized deployment checks account and remote tip so stale reruns cannot silently replace newer code', () => {
  assert.match(workflow, /group: chengci-cloudflare-test\n  cancel-in-progress: false/);
  assert.match(workflow, /\[\[ "\$TARGET_ACCOUNT_ID" != 'e7c5c29b203d1203dc9f326455a5254f' \]\]/);
  assert.match(workflow, /git ls-remote --exit-code https:\/\/github\.com\/ayuan-tw\/taiwan-chinese\.git refs\/heads\/codex\/chengci-6-10-offline-sync/);
  assert.match(workflow, /\[\[ "\$current_head" != "\$GITHUB_SHA" \]\]/);
  assert.equal((workflow.match(/exit 1/g) || []).length, 2);
});
test('test-route config retains disabled previews, private settings, existing D1 and public-only assets', () => {
  assert.equal(config.name, 'chengci-owner-sync');
  assert.equal(config.workers_dev, true);
  assert.equal(config.preview_urls, false);
  assert.equal(config.keep_vars, true);
  assert.equal(config.vars, undefined);
  assert.equal(config.assets.directory, './public');
  assert.equal(config.assets.run_worker_first, true);
  assert.equal(config.assets.binding, 'ASSETS');
  assert.equal(config.d1_databases.length, 1);
  assert.deepEqual(config.d1_databases[0], { binding: 'DB', database_name: 'chengci-personal', database_id: 'bce0a174-a115-44dd-a921-8a2d8daddf68', migrations_dir: 'migrations' });
  assert.match(readFileSync(join(root, 'sync-config.js'), 'utf8'), /enabled:\s*false/);
});
