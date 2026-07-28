import { Bot, Brain, FileCheck2, FolderOpen, Network, Search, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { buildKnowledgeAnalysisMessages, buildKnowledgeBundle } from '../lib/knowledgeEngine.js';
import { cx, formatTimestamp } from '../lib/format';
import type { ChatMessage, OllamaStatus, ProjectStatus, ResearchProjectStatus, RickPrimeSettings } from '../types';

interface KnowledgeForgeProps {
  projects: ProjectStatus[];
  research: ResearchProjectStatus[];
  ollama: OllamaStatus | null;
  settings: RickPrimeSettings | null;
  onAnalyze(model: string, messages: Array<Pick<ChatMessage, 'role' | 'content'>>): Promise<{ model: string; content: string }>;
  onOpenProject(projectId: string): void;
  onOpenResearch(projectId: string): void;
}

function evidenceClass(state: 'verified' | 'director-decision' | 'needs-verification' | 'research-synthesis') {
  switch (state) {
    case 'verified': return 'state-chip--ready';
    case 'director-decision': return 'state-chip--violet';
    case 'needs-verification': return 'state-chip--amber';
    case 'research-synthesis': return 'state-chip--muted';
  }
}

export function KnowledgeForge({ projects, research, ollama, settings, onAnalyze, onOpenProject, onOpenResearch }: KnowledgeForgeProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ model: string; content: string } | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const bundle = useMemo(() => buildKnowledgeBundle(query, projects, research), [projects, query, research]);
  const selected = bundle.entities.find((entity) => entity.id === selectedId) ?? bundle.entities[0] ?? null;
  const selectedConnections = selected
    ? bundle.edges.filter((edge) => edge.source === selected.id || edge.target === selected.id)
    : [];
  const selectedModel = ollama?.online
    ? ollama.models.some((model) => model.name === settings?.selectedModel)
      ? settings?.selectedModel ?? null
      : ollama.models[0]?.name ?? null
    : null;

  useEffect(() => {
    if (!bundle.entities.some((entity) => entity.id === selectedId)) {
      setSelectedId(bundle.entities[0]?.id ?? null);
    }
  }, [bundle.entities, selectedId]);

  async function analyzeBundle() {
    if (!selectedModel) return;
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await onAnalyze(selectedModel, buildKnowledgeAnalysisMessages(bundle));
      setAnalysis(response);
    } catch (caught) {
      setAnalysisError(caught instanceof Error ? caught.message : 'The local analyst could not process this context bundle.');
    } finally {
      setAnalyzing(false);
    }
  }

  function openSelectedSource() {
    if (!selected) return;
    if (selected.kind === 'software') {
      onOpenProject(selected.id.slice('software:'.length));
      return;
    }
    onOpenResearch(selected.id.slice('research:'.length));
  }

  return (
    <section className="view knowledge-view" aria-label="Knowledge Forge">
      <header className="view-hero view-hero--compact">
        <div>
          <span className="eyebrow"><Network aria-hidden="true" size={13} /> Knowledge Forge // native context and provenance</span>
          <h1>Knowledge <em>forge</em></h1>
          <p>WPAI Explorer’s useful deterministic context-bundle pattern now lives here against RickPrime’s real Software and AI Research registries. This is not a mock corpus, vector-count claim, or external search service.</p>
        </div>
        <div className="knowledge-view__seal" aria-label="Local only">
          <Brain aria-hidden="true" size={22} />
          <span><strong>Local registry</strong><small>bounded evidence only</small></span>
        </div>
      </header>

      <div className="knowledge-metric-grid">
        <article className="atlas-metric atlas-metric--cyan"><span>Registry corpus</span><strong>{bundle.summary.corpusSize}</strong><small>Software and AI Research nodes</small></article>
        <article className="atlas-metric atlas-metric--lime"><span>Context bundle</span><strong>{bundle.summary.matchedEntities}</strong><small>deterministic matches in scope</small></article>
        <article className="atlas-metric atlas-metric--violet"><span>Topology links</span><strong>{bundle.summary.connectedEdges}</strong><small>declared integration relationships</small></article>
        <article className="atlas-metric atlas-metric--amber"><span>Evidence files</span><strong>{bundle.summary.sourceDocumentsAvailable}/{bundle.summary.sourceDocumentsTotal}</strong><small>source availability in this bundle</small></article>
      </div>

      <div className="knowledge-layout">
        <aside className="panel knowledge-directory">
          <label className="search-field">
            <Search aria-hidden="true" size={16} />
            <span className="sr-only">Search the local knowledge registry</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search capability, provenance, or research…"/>
            {query && <button type="button" title="Clear Knowledge Forge search" onClick={() => setQuery('')}><X aria-hidden="true" size={14} /></button>}
          </label>
          <div className="knowledge-directory__scope">
            <span><ShieldCheck aria-hidden="true" size={13} /> Registry metadata only</span>
            <small>{bundle.resolvedFacets.terms.length ? bundle.resolvedFacets.terms.join(' · ') : 'All local nodes'}</small>
          </div>
          <div className="knowledge-directory__scroll">
            {bundle.entities.map((entity) => (
              <button
                className={cx('knowledge-result', selected?.id === entity.id && 'is-selected', !entity.exists && 'is-unavailable')}
                key={entity.id}
                type="button"
                onClick={() => setSelectedId(entity.id)}
              >
                <span className={cx('knowledge-result__dot', entity.kind === 'research' ? 'is-research' : 'is-software')} aria-hidden="true" />
                <span className="knowledge-result__copy"><strong>{entity.label}</strong><small>{entity.kind} · {entity.category}</small></span>
                <small>{Math.round((entity.score ?? 0) * 100)}%</small>
              </button>
            ))}
            {!bundle.entities.length && <p className="empty-state">No registered knowledge nodes match this query.</p>}
          </div>
          <div className="knowledge-directory__guardrail">
            <FileCheck2 aria-hidden="true" size={14} />
            <span>{bundle.prunedScopes[0]}</span>
          </div>
        </aside>

        <div className="knowledge-main">
          <article className="panel knowledge-topology">
            <div className="panel__heading">
              <div><span className="section-label">Relationship topology</span><h2>Registered integration lattice</h2></div>
              <span className="state-chip state-chip--violet">{bundle.edges.length} LINK{bundle.edges.length === 1 ? '' : 'S'}</span>
            </div>
            <div className="knowledge-topology__canvas" aria-label="Deterministic relationship map">
              {bundle.entities.map((entity) => (
                <button
                  className={cx('knowledge-topology__node', entity.kind === 'research' ? 'is-research' : 'is-software', selected?.id === entity.id && 'is-selected')}
                  key={entity.id}
                  type="button"
                  style={{ left: entity.vector.x + '%', top: entity.vector.y + '%' }}
                  onClick={() => setSelectedId(entity.id)}
                  title={entity.label}
                >
                  <span>{entity.label.slice(0, 2).toUpperCase()}</span>
                </button>
              ))}
              {!bundle.entities.length && <p className="empty-state">Refine the search to create a bounded topology.</p>}
            </div>
            <p className="knowledge-topology__note">Node positions are deterministic visual anchors. Links are declared integration lineage, not an inferred vector index or executable workflow.</p>
          </article>

          <article className="panel knowledge-inspector">
            {selected ? (
              <>
                <div className="knowledge-inspector__header">
                  <div>
                    <span className="section-label">{selected.kind === 'research' ? 'AI Research node' : 'Software node'}</span>
                    <h2>{selected.label}</h2>
                  </div>
                  <span className={cx('state-chip', evidenceClass(selected.statusState))}>{selected.statusLabel}</span>
                </div>
                <p>{selected.description}</p>
                <div className="knowledge-tag-list">{selected.tags.slice(0, 10).map((tag) => <span key={tag}>{tag}</span>)}</div>
                <div className="knowledge-inspector__columns">
                  <section>
                    <span className="section-label">Registered capabilities</span>
                    <ul>{selected.capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
                  </section>
                  <section>
                    <span className="section-label">Connected declared links</span>
                    {selectedConnections.length ? <ul>{selectedConnections.map((edge) => <li key={edge.source + edge.target}>{edge.label}</li>)}</ul> : <p className="empty-state">No in-bundle declared links.</p>}
                  </section>
                </div>
                <section className="knowledge-provenance">
                  <div><span className="section-label">Provenance</span><strong>{selected.provenance.filter((source) => source.available).length}/{selected.provenance.length} available</strong></div>
                  {selected.provenance.map((source) => (
                    <div className="knowledge-provenance__row" key={source.label + source.relativePath}>
                      <span className={cx('atlas-source-row__dot', source.available ? 'is-live' : 'is-offline')} aria-hidden="true" />
                      <span><strong>{source.label}</strong><code>{source.relativePath}</code></span>
                      <small>{source.available ? formatTimestamp(source.modifiedAt) : 'missing'}</small>
                    </div>
                  ))}
                </section>
                <button className="button button--secondary" type="button" disabled={!selected.exists} onClick={openSelectedSource}>
                  <FolderOpen aria-hidden="true" size={16} /> Open registered source
                </button>
              </>
            ) : <p className="empty-state">Select a source-aware node to inspect its bounded context.</p>}
          </article>
        </div>
      </div>

      <article className="panel knowledge-analysis">
        <div className="panel__heading">
          <div><span className="section-label">Local analysis relay</span><h2>Ask the installed Ollama model about this bundle</h2></div>
          <span className={cx('state-chip', selectedModel ? 'state-chip--ready' : 'state-chip--muted')}>{selectedModel ? selectedModel : 'LOCAL LINK OFFLINE'}</span>
        </div>
        <p>Only the currently matched metadata, declared relationships, and source availability are sent to the loopback-only Ollama bridge. Source contents, credentials, and execution controls are excluded.</p>
        <div className="knowledge-analysis__actions">
          <button className="button button--primary" type="button" disabled={!selectedModel || analyzing || !bundle.entities.length} onClick={() => void analyzeBundle()}>
            <Bot aria-hidden="true" size={16} /> {analyzing ? 'Analyzing locally…' : 'Analyze context bundle'}
          </button>
          <span><Sparkles aria-hidden="true" size={14} /> Evidence-aware; no autonomous action</span>
        </div>
        {analysisError && <p className="inline-error">{analysisError}</p>}
        {analysis && <div className="knowledge-analysis__result"><strong>{analysis.model}</strong><pre>{analysis.content}</pre></div>}
      </article>
    </section>
  );
}
