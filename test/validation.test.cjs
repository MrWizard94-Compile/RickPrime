'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  normalizeChatPayload,
  normalizeOllamaEndpoint,
  normalizeSettings,
} = require('../electron/validation.cjs');
const {
  getCommandDefinitions,
  getCompanyAuthoritySources,
  getDivisionDefinitions,
  getProjectDefinitions,
  getResearchDefinitions,
} = require('../electron/registry.cjs');

const defaults = { ollamaEndpoint: 'http://127.0.0.1:11434', selectedModel: 'gemma3:270m' };

test('accepts only a local Ollama endpoint', () => {
  assert.equal(normalizeOllamaEndpoint('http://localhost:11434/'), 'http://localhost:11434');
  assert.equal(normalizeOllamaEndpoint('http://127.0.0.1:11434'), 'http://127.0.0.1:11434');
  assert.equal(normalizeOllamaEndpoint('https://api.example.com'), null);
  assert.equal(normalizeOllamaEndpoint('http://127.0.0.1:11434/api/tags'), null);
  assert.equal(normalizeOllamaEndpoint('file:///C:/WPAI'), null);
});

test('falls back to safe local settings when persisted values are invalid', () => {
  assert.deepEqual(
    normalizeSettings({ ollamaEndpoint: 'https://remote.example', selectedModel: '../unsafe' }, defaults),
    defaults,
  );
});

test('caps and validates local model chat payloads', () => {
  const normalized = normalizeChatPayload({
    model: 'qwen2.5-coder:0.5b',
    messages: [
      { role: 'system', content: 'Keep the answer local.' },
      { role: 'user', content: 'Summarize this project.' },
    ],
  });
  assert.deepEqual(normalized, {
    model: 'qwen2.5-coder:0.5b',
    messages: [
      { role: 'system', content: 'Keep the answer local.' },
      { role: 'user', content: 'Summarize this project.' },
    ],
  });
  assert.equal(normalizeChatPayload({ model: 'bad/model', messages: [] }), null);
  assert.equal(normalizeChatPayload({ model: 'gemma3:270m', messages: [{ role: 'tool', content: 'nope' }] }), null);
});

test('keeps the WPAI company atlas fixed, source-linked, and non-executable', () => {
  const root = 'C:\\WPAI';
  const divisions = getDivisionDefinitions(root);
  const ids = divisions.map((division) => division.id);

  assert.deepEqual(ids, [
    'music',
    'software',
    'gaming',
    'graphics',
    'brand',
    'games',
    'ai-research',
    'quantum',
    'llm-lab',
    'workspace',
    'tools',
    'archives',
    'grok-workspace',
  ]);
  assert.equal(divisions.some((division) => 'launch' in division || 'command' in division), false);

  for (const division of divisions) {
    assert.equal(division.directory.startsWith(root), true, `${division.id} stays under WPAI`);
    assert.ok(division.sourceDocuments.length > 0, `${division.id} has a source backbone`);
    assert.ok(['verified', 'director-decision', 'needs-verification', 'research-synthesis'].includes(division.statusState));
    for (const document of division.sourceDocuments) {
      assert.equal(document.relativePath.includes('..'), false, `${division.id} source is not a traversal path`);
      assert.equal(document.path.startsWith(root), true, `${division.id} source stays under WPAI`);
    }
  }

  const authoritySources = getCompanyAuthoritySources(root);
  assert.deepEqual(authoritySources.map((document) => document.relativePath), [
    'WPAI-CONTEXT.md',
    'WPAI-ROADMAP.md',
    'REVENUE-PLAN.md',
    'SOULv2.0.0.md',
  ]);
});

test('maps AI Research through fixed evidence records and keeps Janus status read-only', () => {
  const root = 'C:\\WPAI';
  const projects = getResearchDefinitions(root);
  assert.deepEqual(projects.map((project) => project.id), [
    'asset-converter',
    'automation-lab',
    'claude-playground',
    'deep-research-engine',
    'grok-playground',
    'janus',
    'operation-pinky',
    'recurrsive',
    'rel-codex-variant',
    'research-crawler',
    'smart-library',
    'topological-hydro',
    'tsam',
    'veriforge',
  ]);
  for (const project of projects) {
    assert.equal(project.directory.startsWith(root), true, project.id + ' stays under WPAI');
    assert.ok(project.sourceDocuments.length > 0, project.id + ' has source evidence');
    assert.equal('executable' in project || 'args' in project || 'command' in project, false, project.id + ' is not an execution definition');
    for (const document of project.sourceDocuments) {
      assert.equal(document.relativePath.includes('..'), false, project.id + ' source is not a traversal path');
      assert.equal(document.path.startsWith(root), true, project.id + ' source stays under WPAI');
    }
  }

  const commands = getCommandDefinitions(root);
  assert.deepEqual(Object.keys(commands).sort(), ['janus-status', 'music-check', 'software-git-pulse', 'studio-status']);
  assert.deepEqual(commands['janus-status'].args.slice(-1), ['status']);
  assert.equal(commands['janus-status'].cwd, 'C:\\WPAI\\AI-Research\\Janus');
  assert.equal(commands['janus-status'].args.some((argument) => ['run', 'loop', 'seed', 'repair', 'task'].includes(argument)), false);

  const explorer = getProjectDefinitions(root).find((project) => project.id === 'wpai-explorer');
  assert.ok(explorer);
  assert.equal(explorer.launch, null);
  assert.match(explorer.description, /Knowledge Forge/i);
});
