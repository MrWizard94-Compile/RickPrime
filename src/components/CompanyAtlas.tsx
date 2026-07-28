import { ArrowRight, FileCheck2, FolderOpen, Radar, Search, ShieldCheck, TriangleAlert, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { compactPath, cx, formatTimestamp } from '../lib/format';
import type { CompanySnapshot, DivisionStatus, EvidenceState, ViewId } from '../types';

interface CompanyAtlasProps {
  company: CompanySnapshot | null;
  busyDivisionId: string | null;
  onNavigate(view: ViewId): void;
  onOpen(divisionId: string): void;
}

function evidenceClass(statusState: EvidenceState) {
  switch (statusState) {
    case 'verified': return 'state-chip--ready';
    case 'director-decision': return 'state-chip--violet';
    case 'needs-verification': return 'state-chip--amber';
    case 'research-synthesis': return 'state-chip--muted';
  }
}

function evidenceShortLabel(statusState: EvidenceState) {
  switch (statusState) {
    case 'verified': return 'SOURCE VERIFIED';
    case 'director-decision': return 'DIRECTOR DECISION';
    case 'needs-verification': return 'VERIFY CURRENT STATE';
    case 'research-synthesis': return 'RESEARCH SYNTHESIS';
  }
}

function groupDivisions(divisions: DivisionStatus[]) {
  return divisions.reduce<Record<string, DivisionStatus[]>>((groups, division) => {
    (groups[division.category] ??= []).push(division);
    return groups;
  }, {});
}

export function CompanyAtlas({ company, busyDivisionId, onNavigate, onOpen }: CompanyAtlasProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const divisions = company?.divisions ?? [];
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return divisions;
    return divisions.filter((division) => [
      division.label,
      division.category,
      division.description,
      division.phaseLabel,
      division.statusLabel,
    ].join(' ').toLowerCase().includes(needle));
  }, [divisions, query]);
  const selected = filtered.find((division) => division.id === selectedId) ?? filtered[0] ?? null;
  const groups = useMemo(() => groupDivisions(filtered), [filtered]);

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  return (
    <section className="view atlas-view" aria-label="WPAI company atlas">
      <header className="view-hero view-hero--compact">
        <div>
          <span className="eyebrow"><Radar aria-hidden="true" size={13} /> WPAI portfolio atlas // authority-aware integration</span>
          <h1>Company <em>atlas</em></h1>
          <p>RickPrime ingests WPAI as a governed portfolio: active lanes, supporting systems, deferred research, and archive boundaries remain distinct while their verified signals and handoffs converge here.</p>
        </div>
        <div className="atlas-view__count" aria-label="Company integration coverage">
          <strong>{company?.summary.detectedDivisions ?? 0}/{company?.summary.registeredDivisions ?? 0}</strong>
          <span>registered nodes detected</span>
        </div>
      </header>

      <div className="atlas-metric-grid" aria-label="Company integration metrics">
        <article className="atlas-metric atlas-metric--cyan"><span>Portfolio reach</span><strong>{company ? `${company.summary.detectedDivisions}/${company.summary.registeredDivisions}` : 'Scanning'}</strong><small>fixed WPAI divisions detected</small></article>
        <article className="atlas-metric atlas-metric--lime"><span>Active lanes</span><strong>{company?.summary.activeDivisions ?? '—'}</strong><small>active divisions with local roots</small></article>
        <article className="atlas-metric atlas-metric--violet"><span>Authority sources</span><strong>{company ? `${company.summary.sourceDocumentsAvailable}/${company.summary.sourceDocumentsTotal}` : '—'}</strong><small>division source files available</small></article>
        <article className="atlas-metric atlas-metric--amber"><span>Verification queue</span><strong>{company?.summary.needsVerification ?? '—'}</strong><small>dated or scope-sensitive records</small></article>
      </div>

      <div className="atlas-layout">
        <aside className="panel atlas-directory">
          <label className="search-field">
            <Search aria-hidden="true" size={16} />
            <span className="sr-only">Filter WPAI divisions</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter company lattice…" />
            {query && <button type="button" title="Clear filter" onClick={() => setQuery('')}><X aria-hidden="true" size={14} /></button>}
          </label>
          <div className="atlas-directory__scroll">
            {Object.entries(groups).map(([category, entries]) => (
              <div className="atlas-group" key={category}>
                <span className="section-label">{category}</span>
                {entries.map((division) => (
                  <button
                    className={cx('atlas-list-item', selected?.id === division.id && 'is-selected', !division.exists && 'is-unavailable')}
                    key={division.id}
                    type="button"
                    onClick={() => setSelectedId(division.id)}
                  >
                    <span className={cx('atlas-list-item__dot', division.exists ? 'is-live' : 'is-offline')} aria-hidden="true" />
                    <span>{division.label}</span>
                    <small>{division.phase}</small>
                  </button>
                ))}
              </div>
            ))}
            {!filtered.length && <p className="empty-state">No registered division matches this signal query.</p>}
          </div>
        </aside>

        <article className="panel atlas-inspector">
          {selected ? (
            <>
              <div className="atlas-inspector__topline">
                <span className={cx('state-chip', selected.exists ? 'state-chip--ready' : 'state-chip--muted')}>{selected.exists ? 'ROOT DETECTED' : 'ROOT UNAVAILABLE'}</span>
                <span className={cx('state-chip', evidenceClass(selected.statusState))}>{evidenceShortLabel(selected.statusState)}</span>
              </div>
              <div className="atlas-inspector__title">
                <div className="atlas-inspector__avatar" aria-hidden="true">{selected.label.slice(0, 1)}</div>
                <div><span className="section-label">{selected.category}</span><h2>{selected.label}</h2></div>
              </div>
              <p>{selected.description}</p>

              <dl className="atlas-details">
                <div><dt>Operating phase</dt><dd>{selected.phaseLabel}</dd></div>
                <div><dt>Atlas status</dt><dd>{selected.statusLabel}</dd></div>
                <div><dt>Registered root</dt><dd title={selected.directory}>{compactPath(selected.directory)}</dd></div>
              </dl>

              <div className="atlas-brief-grid">
                <section>
                  <span className="section-label"><TriangleAlert aria-hidden="true" size={12} /> Evidence note</span>
                  <p>{selected.statusNote}</p>
                </section>
                <section>
                  <span className="section-label"><ShieldCheck aria-hidden="true" size={12} /> Activation gate</span>
                  <p>{selected.activationGate}</p>
                </section>
                <section>
                  <span className="section-label"><FileCheck2 aria-hidden="true" size={12} /> Ownership boundary</span>
                  <p>{selected.operatingBoundary}</p>
                </section>
              </div>

              <section className="atlas-sources" aria-label={`${selected.label} authority sources`}>
                <div className="atlas-sources__heading"><span className="section-label">Source backbone</span><strong>{selected.sourceDocuments.filter((document) => document.available).length}/{selected.sourceDocuments.length} files detected</strong></div>
                <div className="atlas-source-list">
                  {selected.sourceDocuments.map((document) => (
                    <div className="atlas-source-row" key={document.relativePath}>
                      <span className={cx('atlas-source-row__dot', document.available ? 'is-live' : 'is-offline')} aria-hidden="true" />
                      <div><strong>{document.label}</strong><code>{document.relativePath}</code></div>
                      <small>{document.available ? formatTimestamp(document.modifiedAt) : 'missing'}</small>
                    </div>
                  ))}
                  {selected.supplementalSignal && (
                    <div className="atlas-source-row atlas-source-row--supplemental">
                      <span className={cx('atlas-source-row__dot', selected.supplementalSignal.available ? 'is-live' : 'is-offline')} aria-hidden="true" />
                      <div><strong>{selected.supplementalSignal.label}</strong><code>{selected.supplementalSignal.relativePath}</code></div>
                      <small>{selected.supplementalSignal.available ? 'detected' : 'unavailable'}</small>
                    </div>
                  )}
                </div>
              </section>

              <div className="atlas-inspector__actions">
                <button className="button button--secondary" type="button" disabled={!selected.exists || busyDivisionId === selected.id} onClick={() => onOpen(selected.id)}>
                  <FolderOpen aria-hidden="true" size={16} /> {busyDivisionId === selected.id ? 'Opening…' : 'Open registered root'}
                </button>
                {selected.id === 'software' && <button className="button button--primary" type="button" onClick={() => onNavigate('fleet')}><ArrowRight aria-hidden="true" size={16} /> Open project fleet</button>}
                {selected.id === 'ai-research' && <button className="button button--primary" type="button" onClick={() => onNavigate('research')}><ArrowRight aria-hidden="true" size={16} /> Open Research Nexus</button>}
              </div>
            </>
          ) : (
            <p className="empty-state">Select a company node to inspect its authority, activation gate, and safe handoff.</p>
          )}
        </article>
      </div>

      <article className="panel atlas-authority">
        <div>
          <span className="section-label">Root authority backbone</span>
          <h2>What governs this map</h2>
          <p>These roots define portfolio direction and engineering constraints. RickPrime records presence and timestamps only; it does not interpret a dated plan as a current external state.</p>
        </div>
        <div className="atlas-authority__sources">
          {(company?.authoritySources ?? []).map((document) => (
            <div key={document.relativePath}><span className={cx('atlas-source-row__dot', document.available ? 'is-live' : 'is-offline')} aria-hidden="true" /><strong>{document.label}</strong><small>{document.available ? formatTimestamp(document.modifiedAt) : 'missing'}</small></div>
          ))}
        </div>
      </article>
    </section>
  );
}
