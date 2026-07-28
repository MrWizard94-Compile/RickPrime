const SOFTWARE_TAGS = Object.freeze({
  studioops: ['approvals', 'studioops', 'release-gates', 'control-plane'],
  hellforge: ['pty', 'terminal', 'operator', 'council'],
  'wpai-explorer': ['knowledge', 'context', 'provenance', 'ollama', 'minecraft'],
  workstation: ['workstation', 'chat', 'configuration'],
  digichar: ['local-first', 'financial-data', 'characters'],
  'py-mason': ['python', 'tooling'],
  repoforge: ['repository', 'product'],
  'mixin-field-manual': ['mixin', 'reference', 'product'],
  apode: ['developer-tools'],
  'atoz-grabber': ['utility'],
  'github-code-crawler': ['code', 'crawler'],
  fuse: ['utility'],
  xtechbot: ['automation', 'developer-tools'],
  xlang: ['language', 'experiment'],
  'bundle-social': ['social', 'experiment'],
  'bitburner-scripts': ['automation', 'scripting'],
  'random-story-generator': ['creative', 'generation'],
  'hidout-hunter': ['research', 'utility'],
  yumnom: ['parked', 'product', 'director-decision'],
});

const RELATIONSHIPS = Object.freeze([
  ['software:studioops', 'research:janus', 'approval and orchestration boundary'],
  ['software:hellforge', 'research:janus', 'operator handoff'],
  ['software:wpai-explorer', 'research:smart-library', 'context and provenance lineage'],
  ['software:wpai-explorer', 'research:rel-codex-variant', 'knowledge-system lineage'],
  ['research:janus', 'research:smart-library', 'semantic-memory integration'],
  ['research:janus', 'research:asset-converter', 'asset-pipeline integration'],
  ['research:janus', 'research:rel-codex-variant', 'optional cognition integration'],
  ['research:recurrsive', 'research:topological-hydro', 'novel-architecture research family'],
  ['research:tsam', 'research:veriforge', 'deterministic verification context'],
]);
const CONNECTED_IDS = new Set(RELATIONSHIPS.flatMap(([source, target]) => [source, target]));

function words(value) {
  return String(value ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function pointFor(id, index) {
  let value = 2166136261;
  for (const character of id) {
    value ^= character.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  const x = 11 + Math.abs(value % 74);
  const y = 14 + Math.abs(Math.imul(value ^ index, 1103515245) % 68);
  return { x, y };
}

function projectEntity(project, index) {
  const tags = unique([
    ...(SOFTWARE_TAGS[project.id] ?? []),
    ...words(project.group),
    ...words(project.description),
  ]);
  const statusState = project.parked ? 'director-decision' : project.exists ? 'verified' : 'needs-verification';
  return {
    id: 'software:' + project.id,
    kind: 'software',
    label: project.label,
    category: project.group,
    description: project.description,
    phaseLabel: project.parked ? 'Parked / director decision' : project.group,
    statusState,
    statusLabel: project.parked ? 'PARKED BY DIRECTOR DECISION' : project.exists ? 'REGISTERED ROOT DETECTED' : 'REGISTERED ROOT UNAVAILABLE',
    tags,
    capabilities: project.launch ? ['Registered desktop handoff', 'Folder handoff'] : ['Folder handoff', 'Registry provenance'],
    directory: project.directory,
    exists: project.exists,
    provenance: [{
      label: 'RickPrime Software registry',
      relativePath: 'Software/' + project.label,
      available: project.exists,
      modifiedAt: null,
    }],
    vector: pointFor('software:' + project.id, index),
  };
}

function researchEntity(project, index) {
  return {
    id: 'research:' + project.id,
    kind: 'research',
    label: project.label,
    category: project.category,
    description: project.description,
    phaseLabel: project.phaseLabel,
    statusState: project.statusState,
    statusLabel: project.statusLabel,
    tags: unique([...project.tags, ...words(project.category)]),
    capabilities: project.capabilities,
    directory: project.directory,
    exists: project.exists,
    provenance: project.sourceDocuments.map((document) => ({
      label: document.label,
      relativePath: document.relativePath,
      available: document.available,
      modifiedAt: document.modifiedAt,
    })),
    vector: pointFor('research:' + project.id, index),
  };
}

function searchScore(entity, tokens) {
  if (tokens.length === 0) {
    return (entity.exists ? 0.72 : 0.38) + (CONNECTED_IDS.has(entity.id) ? 0.22 : 0);
  }
  const label = entity.label.toLowerCase();
  const exactLabel = tokens.filter((token) => label.includes(token)).length;
  const searchable = [
    entity.label,
    entity.category,
    entity.description,
    entity.phaseLabel,
    entity.statusLabel,
    ...entity.tags,
    ...entity.capabilities,
    ...entity.provenance.map((source) => source.label + ' ' + source.relativePath),
  ].join(' ').toLowerCase();
  const total = tokens.filter((token) => searchable.includes(token)).length;
  if (total === 0) {
    return 0;
  }
  return Math.min(1, (total / tokens.length) * 0.7 + (exactLabel / tokens.length) * 0.3);
}

function sortEntities(entities, tokens) {
  return entities
    .map((entity) => ({ ...entity, score: searchScore(entity, tokens) }))
    .filter((entity) => entity.score > 0)
    .sort((left, right) => right.score - left.score || Number(right.exists) - Number(left.exists) || left.label.localeCompare(right.label));
}

export function buildKnowledgeEntities(projects, research) {
  return [
    ...projects.map(projectEntity),
    ...research.map((project, index) => researchEntity(project, index + projects.length)),
  ];
}

export function buildKnowledgeBundle(query, projects, research) {
  const normalizedQuery = String(query ?? '').trim();
  const tokens = unique(words(normalizedQuery));
  const allEntities = buildKnowledgeEntities(projects, research);
  const matches = sortEntities(allEntities, tokens).slice(0, 12);
  const matchIds = new Set(matches.map((entity) => entity.id));
  const edges = RELATIONSHIPS
    .filter(([source, target]) => matchIds.has(source) && matchIds.has(target))
    .map(([source, target, label]) => ({ source, target, label }));
  const sourceDocuments = matches.flatMap((entity) => entity.provenance);

  return {
    query: normalizedQuery,
    resolvedFacets: {
      terms: tokens,
      domains: unique(matches.map((entity) => entity.kind)),
    },
    prunedScopes: [
      'No source-document bodies are read into the renderer.',
      'No project code, shell, crawler, task runner, or model pull is executed.',
      'Local Ollama analysis receives only this bounded context bundle.',
    ],
    entities: matches,
    edges,
    summary: {
      corpusSize: allEntities.length,
      matchedEntities: matches.length,
      connectedEdges: edges.length,
      sourceDocumentsAvailable: sourceDocuments.filter((source) => source.available).length,
      sourceDocumentsTotal: sourceDocuments.length,
    },
  };
}

export function buildKnowledgeAnalysisMessages(bundle) {
  const context = {
    query: bundle.query || 'portfolio overview',
    guardrails: 'Use only registered metadata and source availability. Do not infer a source document body, current commercial state, external status, research result, task completion, or permission to act.',
    matchedEntities: bundle.entities.map((entity) => ({
      label: entity.label,
      domain: entity.kind,
      category: entity.category,
      phase: entity.phaseLabel,
      evidence: entity.statusLabel,
      available: entity.exists,
      tags: entity.tags.slice(0, 8),
      provenance: entity.provenance.map((source) => ({
        label: source.label,
        path: source.relativePath,
        available: source.available,
      })),
    })),
    relationships: bundle.edges,
  };
  return [
    {
      role: 'system',
      content: 'You are RickPrime Knowledge Forge, a local portfolio analyst. Be concise, distinguish evidence from inference, identify verification gaps, and never recommend autonomous execution or external actions.',
    },
    {
      role: 'user',
      content: 'Analyze this bounded local context bundle and return: (1) the likely integration path, (2) evidence limits, and (3) the safest next human review.\\n\\n' + JSON.stringify(context, null, 2),
    },
  ];
}
