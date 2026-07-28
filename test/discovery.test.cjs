'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  compareInventory,
  resolveDiscoveredDirectory,
  scanWorkspace,
} = require('../electron/discovery.cjs');

async function withWorkspace(run) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'rickprime-discovery-'));
  try {
    await run(root);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
}

test('discovers safe workspace metadata without exposing source bodies or protected entries', async () => {
  await withWorkspace(async (root) => {
    await fs.mkdir(path.join(root, 'Software', 'RickPrime', '.git'), { recursive: true });
    await fs.mkdir(path.join(root, 'Software', 'RickPrime', 'node_modules', 'oversized'), { recursive: true });
    await fs.mkdir(path.join(root, 'Music', 'Releases'), { recursive: true });
    await fs.writeFile(path.join(root, 'Software', 'RickPrime', 'package.json'), '{"name":"rickprime"}');
    await fs.writeFile(path.join(root, 'Software', 'RickPrime', 'README.md'), 'TOP_SECRET_SOURCE_BODY');
    await fs.writeFile(path.join(root, '.env'), 'PRIVATE_VALUE');
    await fs.writeFile(path.join(root, 'private-key.pem'), 'PRIVATE_VALUE');
    await fs.writeFile(path.join(root, 'Music', 'Releases', 'catalog.txt'), 'safe metadata only');

    const snapshot = await scanWorkspace(root);
    const serialized = JSON.stringify(snapshot);
    const project = snapshot.entries.find((entry) => entry.relativePath === 'Software/RickPrime');

    assert.equal(snapshot.available, true);
    assert.ok(project);
    assert.deepEqual(project.markers.sort(), ['Documented workspace', 'Git repository', 'Node workspace']);
    assert.equal(snapshot.fingerprints.some((entry) => entry.includes('.env')), false);
    assert.equal(snapshot.fingerprints.some((entry) => entry.includes('private-key.pem')), false);
    assert.equal(snapshot.fingerprints.some((entry) => entry.includes('node_modules')), false);
    assert.equal(serialized.includes('TOP_SECRET_SOURCE_BODY'), false);
    assert.equal(serialized.includes('PRIVATE_VALUE'), false);
    assert.ok(snapshot.summary.protectedEntriesExcluded >= 2);
  });
});

test('detects added safe entries against a persisted inventory baseline', async () => {
  await withWorkspace(async (root) => {
    await fs.mkdir(path.join(root, 'Software', 'Existing'), { recursive: true });
    const baseline = await scanWorkspace(root);

    await fs.mkdir(path.join(root, 'Tools', 'NewTool'), { recursive: true });
    await fs.writeFile(path.join(root, 'Tools', 'NewTool', 'README.md'), 'New tool authority');
    const current = await scanWorkspace(root);
    const change = compareInventory(baseline, current);

    assert.equal(change.baselineState, 'compared');
    assert.ok(change.addedCount >= 3);
    assert.ok(change.added.some((entry) => entry.relativePath === 'Tools/NewTool'));
    assert.ok(change.added.some((entry) => entry.relativePath === 'Tools/NewTool/README.md'));
  });
});

test('keeps dense imported collections reachable at their root without flooding the workspace monitor', async () => {
  await withWorkspace(async (root) => {
    const collection = path.join(root, 'AI-Research', 'AssetConverter', 'sources');
    await Promise.all(Array.from({ length: 97 }, (_, index) => fs.mkdir(path.join(collection, `upstream-${index}`), { recursive: true })));

    const snapshot = await scanWorkspace(root);

    assert.equal(snapshot.summary.denseCollectionsSkipped, 1);
    assert.ok(snapshot.entries.some((entry) => entry.relativePath === 'AI-Research/AssetConverter/sources'));
    assert.equal(snapshot.entries.some((entry) => entry.relativePath === 'AI-Research/AssetConverter/sources/upstream-0'), false);
  });
});

test('allows only discovered directories that resolve inside the WPAI root', async () => {
  await withWorkspace(async (root) => {
    const target = path.join(root, 'Software');
    await fs.mkdir(target, { recursive: true });

    assert.equal(resolveDiscoveredDirectory(root, { relativePath: 'Software' }), target);
    assert.equal(resolveDiscoveredDirectory(root, { relativePath: '../outside' }), null);
    assert.equal(resolveDiscoveredDirectory(root, { relativePath: '' }), null);
  });
});
