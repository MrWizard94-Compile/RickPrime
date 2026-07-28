import { CircuitBoard, FileCheck2, FolderOpen, LockKeyhole, Radar, Search, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { compactPath, cx, formatTimestamp } from '../lib/format';
import type { EvidenceState, ResearchProjectStatus, ResearchSnapshot } from '../types';

interface ResearchNexusProps {
  research: ResearchSnapshot | null;
  busyProjectId: string | null;
  runningCommandId: string | null;
  onOpen(projectId: string): void;
  onRunJanusStatus(): void;
}

function evidenceClass(statusState: EvidenceState) {
  switch (statusState) {
    case 'verified': return 'state-chip--ready';
    case 'director-decision': return 'state-chip--violet';
    case 'needs-verification': return 'state-chip--amber';
    case 'research-synthesis': return 'state-chip--muted';
  }
}

function evidenceLabel(statusState: EvidenceState) {
  switch (statusState) {
    case 'verified': return 'SOURCE VERIFIED';
    case 'director-decision': return 'DIRECTOR DECISION';
    case 'needs-verification': return 'VERIFY CURRENT STATE';
    case 'research-synthesis': return 'RESEARCH SYNTHESIS';
  }
}

function integrationLabel(mode: ResearchProjectStatus['integrationMode']) {
  switch (mode) {
    case 'status-control': return 'READ-ONLY STATUS CONTROL';
    case 'knowledge-source': return 'KNOWLEDGE FORGE SOURCE';
    case 'source-map': return 'SOURCE MAP ONLY';
  }
}

export function ResearchNexus({ research, busyProjectId, runningCommandId, onOpen, onRunJanusStatus }: ResearchNexusProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const projects = research?.projects ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((project) => [
      project.label,
      project.category,
      project.description,
      project.phaseLabel,
      project.statusLabel,
      project.tags.join(' '),
    ].join(' ').toLowerCase().includes(needle));
  }, [projects, query]);
  const selected = filtered.find((project) => project.id === selectedId) ?? filtered[0] ?? null;
  const groups = useMemo(() => filtered.reduce<Record<string, ResearchProjectStatus[]>>((result, project) => {
    (result[project.category] ??= []).push(project);
    return result;
  }, {}), [filtered]);

  useEffect(() => {
    if (!filtered.some((project) => project.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
  }, [filtered, selectedId]);

  return (
    <section className="view research-view" aria-label="AI Research Nexus">
      <header className="view-hero view-hero--compact">
        <div>
          <span className="eyebrow"><CircuitBoard aria-hidden="true" size={13} /> AI Research Nexus // evidence and governance</span>
          <h1>Research <em>nexus</em></h1>
          <p>AI Research is fully visible as a governed portfolio of distinct research systems. RickPrime can surface source availability, lineage, and one documented status probe; it does not become a research runner, crawler, scheduler, task store, or model-control plane.</p>
        </div>
        <div className="research-view__seal">
          <LockKeyhole aria-hidden="true" size={21} />
          <span><strong>Funding-gated</strong><small>human approval remains primary</small></span>
        </div>
      </header>

      <div className="research-metric-grid">
        <article className="atlas-metric atlas-metric--cyan"><span>Research roots</span><strong>{research ? research.summary.detectedProjects + '/' + research.summary.registeredProjects : '—'}</strong><small>registered nodes detected</small></article>
        <article className="atlas-metric atlas-metric--lime"><span>Evidence files</span><strong>{research ? research.summary.sourceDocumentsAvailable + '/' + research.summary.sourceDocumentsTotal : '—'}</strong><small>source files available</small></article>
        <article className="atlas-metric atlas-metric--violet"><span>Research synthesis</span><strong>{research?.summary.researchSynthesis ?? '—'}</strong><small>claims needing measurement context</small></article>
        <article className="atlas-metric atlas-metric--amber"><span>Status relays</span><strong>{research?.summary.statusControls ?? '—'}</strong><small>bounded read-only controls</small></article>
      </div>

      <div className="research-layout">
        <aside className="panel research-directory">
          <label className="search-field">
            <Search aria-hidden="true" size={16} />
            <span className="sr-only">Filter AI Research projects</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter research lattice…"/>
            {query && <button type="button" title="Clear filter" onClick={() => setQuery('')}><X aria-hidden="true" size={14} /></button>}
          </label>
          <div className="research-directory__scroll">
            {Object.entries(groups).map(([category, entries]) => (
              <div className="research-group" key={category}>
                <span className="section-label">{category}</span>
                {entries.map((project) => (
                  <button
                    className={cx('research-list-item', selected?.id === project.id && 'is-selected', !project.exists && 'is-unavailable')}
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedId(project.id)}
                  >
                    <span className={cx('research-list-item__dot', project.exists ? 'is-live' : 'is-offline')} aria-hidden="true" />
                    <span>{project.label}</span>
                    <small>{project.integrationMode === 'status-control' ? 'status' : project.integrationMode === 'knowledge-source' ? 'forge' : 'map'}</small>
                  </button>
                ))}
              </div>
            ))}
            {!filtered.length && <p className="empty-state">No registered research projects match this query.</p>}
          </div>
        </aside>

        <article className="panel research-inspector">
          {selected ? (
            <>
              <div className="research-inspector__topline">
                <span className={cx('state-chip', selected.exists ? 'state-chip--ready' : 'state-chip--muted')}>{selected.exists ? 'ROOT DETECTED' : 'ROOT UNAVAILABLE'}</span>
                <span className={cx('state-chip', evidenceClass(selected.statusState))}>{evidenceLabel(selected.statusState)}</span>
              </div>
              <div className="research-inspector__title">
                <div className="research-inspector__avatar" aria-hidden="true">{selected.label.slice(0, 1)}</div>
                <div><span className="section-label">{selected.category}</span><h2>{selected.label}</h2></div>
              </div>
              <p>{selected.description}</p>
              <dl className="research-details">
                <div><dt>Research position</dt><dd>{selected.phaseLabel}</dd></div>
                <div><dt>Integration posture</dt><dd>{integrationLabel(selected.integrationMode)}</dd></div>
                <div><dt>Registered root</dt><dd title={selected.directory}>{compactPath(selected.directory)}</dd></div>
              </dl>
              <div className="research-brief-grid">
                <section><span className="section-label"><TriangleAlert aria-hidden="true" size={12} /> Evidence note</span><p>{selected.statusNote}</p></section>
                <section><span className="section-label"><ShieldCheck aria-hidden="true" size={12} /> Activation gate</span><p>{selected.activationGate}</p></section>
                <section><span className="section-label"><LockKeyhole aria-hidden="true" size={12} /> Operating boundary</span><p>{selected.operatingBoundary}</p></section>
              </div>
              <div className="research-tag-list">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <section className="research-capabilities">
                <span className="section-label">Exposed capabilities</span>
                <ul>{selected.capabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul>
              </section>
              <section className="atlas-sources" aria-label={selected.label + ' evidence sources'}>
                <div className="atlas-sources__heading"><span className="section-label">Source backbone</span><strong>{selected.sourceDocuments.filter((document) => document.available).length}/{selected.sourceDocuments.length} files detected</strong></div>
                <div className="atlas-source-list">
                  {selected.sourceDocuments.map((document) => (
                    <div className="atlas-source-row" key={document.relativePath}>
                      <span className={cx('atlas-source-row__dot', document.available ? 'is-live' : 'is-offline')} aria-hidden="true" />
                      <div><strong>{document.label}</strong><code>{document.relativePath}</code></div>
                      <small>{document.available ? formatTimestamp(document.modifiedAt) : 'missing'}</small>
                    </div>
                  ))}
                </div>
              </section>
              <div className="research-inspector__actions">
                <button className="button button--secondary" type="button" disabled={!selected.exists || busyProjectId === selected.id} onClick={() => onOpen(selected.id)}>
                  <FolderOpen aria-hidden="true" size={16} /> {busyProjectId === selected.id ? 'Opening…' : 'Open registered root'}
                </button>
                {selected.integrationMode === 'knowledge-source' && <span className="state-chip state-chip--violet"><Radar aria-hidden="true" size={13} /> KNOWLEDGE FORGE LINKED</span>}
                {selected.id === 'janus' && <button className="button button--primary" type="button" disabled={runningCommandId !== null} onClick={onRunJanusStatus}>
                  <FileCheck2 aria-hidden="true" size={16} /> {runningCommandId === 'janus-status' ? 'Reading status…' : 'Read Janus status'}
                </button>}
              </div>
              {selected.id === 'janus' && <div className="notice notice--violet"><LockKeyhole aria-hidden="true" size={16} /> This calls only the documented Janus status probe. Task creation, loops, repair, seeds, spending, and research activation remain unavailable.</div>}
            </>
          ) : <p className="empty-state">Select a research node to inspect its evidence, gate, and bounded integration.</p>}
        </article>
      </div>
    </section>
  );
}
