'use strict';

const path = require('node:path');
const { pathToFileURL } = require('node:url');
const test = require('node:test');
const assert = require('node:assert/strict');

const engineUrl = pathToFileURL(path.join(__dirname, '..', 'src', 'lib', 'knowledgeEngine.js')).href;

const projects = [
  {
    id: 'wpai-explorer',
    label: 'WPAI Explorer',
    group: 'Knowledge systems',
    directory: 'C:\\\\WPAI\\\\Software\\\\wpai-explorer',
    description: 'Local context and provenance workflow.',
    launch: null,
    parked: false,
    exists: true,
    git: null,
  },
  {
    id: 'studioops',
    label: 'StudioOps',
    group: 'Control plane',
    directory: 'C:\\\\WPAI\\\\Software\\\\StudioOps',
    description: 'Approval and release safeguards.',
    launch: null,
    parked: false,
    exists: true,
    git: null,
  },
];

const research = [
  {
    id: 'janus',
    label: 'JanusPrime',
    category: 'Research orchestration',
    directory: 'C:\\\\WPAI\\\\AI-Research\\\\Janus',
    description: 'Canonical research orchestration integration.',
    phaseLabel: 'Governed orchestration / status only',
    statusState: 'needs-verification',
    statusLabel: 'READ-ONLY STATUS AVAILABLE',
    statusNote: 'Only status is exposed.',
    activationGate: 'Human approval required.',
    operatingBoundary: 'No task creation.',
    integrationMode: 'status-control',
    tags: ['janus', 'orchestration', 'memory'],
    capabilities: ['Read-only status probe'],
    exists: true,
    sourceDocuments: [{ label: 'Janus overview', relativePath: 'AI-Research/Janus/README.md', available: true, modifiedAt: '2026-07-25T00:00:00.000Z' }],
  },
  {
    id: 'smart-library',
    label: 'Smart Library',
    category: 'Knowledge systems',
    directory: 'C:\\\\WPAI\\\\AI-Research\\\\Smart Library',
    description: 'Semantic memory and provenance workspace.',
    phaseLabel: 'Knowledge-system source / local review',
    statusState: 'needs-verification',
    statusLabel: 'LINEAGE MAPPED; RUNTIME NOT EMBEDDED',
    statusNote: 'No memory service is embedded.',
    activationGate: 'Local review required.',
    operatingBoundary: 'Independent operation.',
    integrationMode: 'knowledge-source',
    tags: ['knowledge', 'memory', 'semantic', 'provenance'],
    capabilities: ['Knowledge Forge lineage'],
    exists: true,
    sourceDocuments: [{ label: 'Research architecture', relativePath: 'AI-Research/AUTONOMOUS-AI-ARCHITECTURE.md', available: true, modifiedAt: '2026-07-25T00:00:00.000Z' }],
  },
];

test('builds deterministic, source-bounded context bundles from registered nodes', async () => {
  const { buildKnowledgeAnalysisMessages, buildKnowledgeBundle } = await import(engineUrl);
  const first = buildKnowledgeBundle('janus memory provenance', projects, research);
  const second = buildKnowledgeBundle('janus memory provenance', projects, research);

  assert.deepEqual(first, second);
  assert.equal(first.summary.corpusSize, 4);
  assert.ok(first.entities.some((entity) => entity.id === 'research:janus'));
  assert.ok(first.entities.some((entity) => entity.id === 'research:smart-library'));
  assert.ok(first.entities.some((entity) => entity.id === 'software:wpai-explorer'));
  assert.ok(first.edges.some((edge) => edge.label === 'semantic-memory integration'));
  assert.equal(first.prunedScopes.length, 3);
  assert.match(first.prunedScopes.join(' '), /No source-document bodies/i);
  assert.equal(first.entities.every((entity) => entity.provenance.every((source) => !('content' in source))), true);

  const overview = buildKnowledgeBundle('', projects, research);
  assert.ok(overview.edges.length > 0, 'overview prioritizes declared integration lineage');

  const messages = buildKnowledgeAnalysisMessages(first);
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, 'system');
  assert.match(messages[0].content, /never recommend autonomous execution/i);
  assert.match(messages[1].content, /registered metadata and source availability/i);
});
