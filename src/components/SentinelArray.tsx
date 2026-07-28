import { Activity, Box, Cpu, Database, FilePlus2, FolderMinus, FolderOpen, HardDrive, Network, Radar, RefreshCw, ScanSearch, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cx, formatBytes, formatTimestamp } from '../lib/format';
import type { DiagnosticsSnapshot, DiscoveryEntry, DiscoverySnapshot } from '../types';

interface SentinelArrayProps {
  discovery: DiscoverySnapshot | null;
  diagnostics: DiagnosticsSnapshot | null;
  refreshing: boolean;
  busyEntryId: string | null;
  onRefresh(): void;
  onOpen(entryId: string): void;
}

type DiscoveryMode = 'workspaces' | 'all';

function workspaceEntries(discovery: DiscoverySnapshot | null, mode: DiscoveryMode) {
  if (!discovery) return [];
  return mode === 'workspaces' ? discovery.projectCandidates : discovery.entries;
}

function storagePercent(diagnostics: DiagnosticsSnapshot | null) {
  const storage = diagnostics?.storage;
  if (!storage?.available || !storage.totalBytes || storage.usedBytes === null) return null;
  return Math.min(100, Math.max(0, Math.round((storage.usedBytes / storage.totalBytes) * 100)));
}

function changeLabel(discovery: DiscoverySnapshot | null) {
  if (!discovery) return 'Scanning';
  if (discovery.changes.baselineState === 'initialized') return 'Baseline';
  return `${discovery.changes.addedCount} + / ${discovery.changes.removedCount} −`;
}

function EntryRow({ entry, selected, onSelect }: { entry: DiscoveryEntry; selected: boolean; onSelect(): void }) {
  return (
    <button className={cx('sentinel-entry', selected && 'is-selected')} type="button" onClick={onSelect}>
      <span className="sentinel-entry__signal" aria-hidden="true" />
      <span className="sentinel-entry__copy">
        <strong>{entry.label}</strong>
        <small>{entry.relativePath}</small>
      </span>
      <span className="sentinel-entry__depth">L{entry.depth}</span>
    </button>
  );
}

export function SentinelArray({ discovery, diagnostics, refreshing, busyEntryId, onRefresh, onOpen }: SentinelArrayProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<DiscoveryMode>('workspaces');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const entries = workspaceEntries(discovery, mode);
  const matchedEntries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) => [entry.label, entry.relativePath, entry.classification, ...entry.markers].join(' ').toLowerCase().includes(needle));
  }, [entries, query]);
  const filtered = useMemo(() => {
    const limit = mode === 'all' && query.trim().length === 0 ? 600 : 1200;
    return matchedEntries.slice(0, limit);
  }, [matchedEntries, mode, query]);
  const selected = filtered.find((entry) => entry.id === selectedId) ?? filtered[0] ?? null;
  const diskUse = storagePercent(diagnostics);
  const memoryUsed = diagnostics ? diagnostics.system.totalMemory - diagnostics.system.freeMemory : null;

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  return (
    <section className="view sentinel-view" aria-label="WPAI discovery and diagnostics">
      <header className="view-hero view-hero--compact">
        <div>
          <span className="eyebrow"><Radar aria-hidden="true" size={13} /> sentinel array // WPAI-wide metadata discovery</span>
          <h1>Sentinel <em>array</em></h1>
          <p>RickPrime monitors the WPAI root as a live local topology: safe directory metadata, project markers, runtime signals, storage, and change deltas. It never reads document bodies, hidden runtime state, credentials, or generated dependency trees.</p>
        </div>
        <button className="button button--secondary" type="button" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw aria-hidden="true" size={16} className={refreshing ? 'spin' : undefined} /> {refreshing ? 'Scanning…' : 'Refresh array'}
        </button>
      </header>

      <div className="sentinel-metrics" aria-label="Workspace monitoring metrics">
        <article className="sentinel-metric sentinel-metric--cyan"><span>Safe topology</span><strong>{discovery ? discovery.summary.directoriesDetected.toLocaleString() : '—'}</strong><small>{discovery ? `${discovery.summary.filesObserved.toLocaleString()} safe file entries observed` : 'directory scan pending'}</small></article>
        <article className="sentinel-metric sentinel-metric--lime"><span>Workspace roots</span><strong>{discovery?.summary.projectCandidates ?? '—'}</strong><small>Git, runtime, build, or authority markers</small></article>
        <article className="sentinel-metric sentinel-metric--violet"><span>Change delta</span><strong>{changeLabel(discovery)}</strong><small>{discovery?.changes.baselineState === 'initialized' ? 'local baseline established' : 'safe entries since the prior scan'}</small></article>
        <article className="sentinel-metric sentinel-metric--amber"><span>Storage reserve</span><strong>{diagnostics?.storage.available ? formatBytes(diagnostics.storage.freeBytes) : '—'}</strong><small>{diskUse === null ? diagnostics?.storage.error ?? 'storage scan pending' : `${diskUse}% used on the WPAI volume`}</small></article>
      </div>

      <div className="sentinel-layout">
        <aside className="panel sentinel-directory">
          <div className="sentinel-directory__toolbar">
            <label className="search-field">
              <ScanSearch aria-hidden="true" size={16} />
              <span className="sr-only">Filter detected WPAI directories</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a WPAI directory…" />
            </label>
            <div className="sentinel-mode" aria-label="Discovery scope">
              <button className={cx(mode === 'workspaces' && 'is-active')} type="button" onClick={() => setMode('workspaces')}>Workspaces</button>
              <button className={cx(mode === 'all' && 'is-active')} type="button" onClick={() => setMode('all')}>All folders</button>
            </div>
          </div>
          <div className="sentinel-directory__scroll">
            {filtered.map((entry) => <EntryRow key={entry.id} entry={entry} selected={entry.id === selected?.id} onSelect={() => setSelectedId(entry.id)} />)}
            {filtered.length < matchedEntries.length && <p className="sentinel-directory__limit">Showing {filtered.length.toLocaleString()} of {matchedEntries.length.toLocaleString()} safe directories. Refine the query to reach the rest.</p>}
            {!filtered.length && <p className="empty-state">No safe discovered directory matches this query.</p>}
          </div>
          <div className="sentinel-directory__footnote"><ShieldCheck aria-hidden="true" size={14} /> {discovery?.watcher.active ? 'Native filesystem watcher armed.' : 'Polling is active; native watcher unavailable.'}</div>
        </aside>

        <article className="panel sentinel-inspector">
          {selected ? (
            <>
              <div className="sentinel-inspector__topline">
                <span className="state-chip state-chip--ready">DETECTED</span>
                <span className="state-chip state-chip--violet">{selected.classification.toUpperCase()}</span>
              </div>
              <div className="sentinel-inspector__title">
                <span className="sentinel-inspector__glyph" aria-hidden="true"><Box size={22} /></span>
                <div><span className="section-label">WPAI DIRECTORY // LEVEL {selected.depth}</span><h2>{selected.label}</h2></div>
              </div>
              <p>RickPrime recognized this directory from its local position and safe marker names. The scan reports structure only; no file content is transferred into the renderer.</p>
              <dl className="sentinel-details">
                <div><dt>Relative location</dt><dd title={selected.relativePath}>{selected.relativePath === '.' ? 'WPAI root' : selected.relativePath}</dd></div>
                <div><dt>Direct children</dt><dd>{selected.directDirectoryCount} folders · {selected.directFileCount} safe files</dd></div>
                <div><dt>Marker signals</dt><dd>{selected.markers.length ? selected.markers.length : 'None'}</dd></div>
              </dl>
              <div className="sentinel-marker-grid">
                {selected.markers.length ? selected.markers.map((marker) => <span key={marker} className="sentinel-marker">{marker}</span>) : <span className="sentinel-marker sentinel-marker--muted">Structural directory only</span>}
              </div>
              <div className="sentinel-inspector__actions">
                <button className="button button--primary" type="button" disabled={busyEntryId === selected.id} onClick={() => onOpen(selected.id)}>
                  <FolderOpen aria-hidden="true" size={16} /> {busyEntryId === selected.id ? 'Opening…' : 'Open detected folder'}
                </button>
                <span className="sentinel-boundary"><ShieldCheck aria-hidden="true" size={14} /> Fixed-root, directory-only handoff</span>
              </div>
            </>
          ) : <p className="empty-state">Choose a discovered directory to inspect its safe structural metadata.</p>}
        </article>
      </div>

      <div className="sentinel-diagnostic-grid">
        <article className="panel diagnostic-card">
          <div className="panel__heading"><div><span className="section-label">Host telemetry</span><h2>Compute envelope</h2></div><Cpu aria-hidden="true" className="panel__icon" size={18} /></div>
          <dl className="diagnostic-list">
            <div><dt>CPU load</dt><dd>{diagnostics?.system.cpuUsagePercent === null || diagnostics?.system.cpuUsagePercent === undefined ? 'Sampling' : `${diagnostics.system.cpuUsagePercent}%`}</dd></div>
            <div><dt>Memory</dt><dd>{diagnostics ? `${formatBytes(memoryUsed)} / ${formatBytes(diagnostics.system.totalMemory)}` : 'Scanning'}</dd></div>
            <div><dt>RickPrime RSS</dt><dd>{diagnostics ? formatBytes(diagnostics.system.processMemoryBytes) : 'Scanning'}</dd></div>
            <div><dt>Network interfaces</dt><dd>{diagnostics ? diagnostics.system.activeNetworkInterfaceCount : 'Scanning'}</dd></div>
          </dl>
        </article>

        <article className="panel diagnostic-card">
          <div className="panel__heading"><div><span className="section-label">Local runtimes</span><h2>Docker + Ollama</h2></div><Database aria-hidden="true" className="panel__icon" size={18} /></div>
          <dl className="diagnostic-list">
            <div><dt>Ollama relay</dt><dd className={diagnostics?.ollama.online ? 'is-positive' : 'is-warning'}>{diagnostics?.ollama.online ? `${diagnostics.ollama.models.length} models` : 'Offline'}</dd></div>
            <div><dt>Docker daemon</dt><dd className={diagnostics?.docker.available ? 'is-positive' : 'is-warning'}>{diagnostics?.docker.available ? `${diagnostics.docker.runningContainers} running` : 'Unavailable'}</dd></div>
            <div><dt>Ollama container</dt><dd>{diagnostics?.docker.ollamaContainerDetected ? 'Detected' : 'Not reported'}</dd></div>
            <div><dt>Runtime boundary</dt><dd>Loopback only</dd></div>
          </dl>
        </article>

        <article className="panel diagnostic-card">
          <div className="panel__heading"><div><span className="section-label">Inventory safety</span><h2>Coverage guardrails</h2></div><ShieldCheck aria-hidden="true" className="panel__icon" size={18} /></div>
          <dl className="diagnostic-list">
            <div><dt>Watcher mode</dt><dd>{discovery?.watcher.active ? 'Native watcher' : '30 s polling'}</dd></div>
            <div><dt>Protected entries</dt><dd>{discovery?.summary.protectedEntriesExcluded ?? '—'} excluded</dd></div>
            <div><dt>Generated folders</dt><dd>{discovery?.summary.ignoredDirectories ?? '—'} skipped</dd></div>
            <div><dt>Dense collections</dt><dd>{discovery?.summary.denseCollectionsSkipped ?? '—'} bounded</dd></div>
            <div><dt>Scan boundary</dt><dd>{discovery ? `L${discovery.summary.maxDepth} / ${discovery.summary.maxDirectories.toLocaleString()} dirs` : 'Scanning'}</dd></div>
          </dl>
        </article>

        <article className="panel diagnostic-card diagnostic-card--changes">
          <div className="panel__heading"><div><span className="section-label">Change monitor</span><h2>Recent safe topology changes</h2></div><Activity aria-hidden="true" className="panel__icon" size={18} /></div>
          {discovery?.changes.baselineState === 'initialized' ? <p className="diagnostic-empty">Baseline created locally. Future scans compare safe directory and file entries without reading their contents.</p> : (
            <div className="change-columns">
              <section><span><FilePlus2 aria-hidden="true" size={14} /> {discovery?.changes.addedCount ?? 0} added</span>{(discovery?.changes.added ?? []).slice(0, 4).map((entry) => <code key={`${entry.kind}:${entry.relativePath}`}>{entry.relativePath}</code>) || null}</section>
              <section><span><FolderMinus aria-hidden="true" size={14} /> {discovery?.changes.removedCount ?? 0} removed</span>{(discovery?.changes.removed ?? []).slice(0, 4).map((entry) => <code key={`${entry.kind}:${entry.relativePath}`}>{entry.relativePath}</code>) || null}</section>
            </div>
          )}
          <small>Last scan {formatTimestamp(discovery?.scannedAt ?? null)} · {discovery?.summary.truncated ? discovery.summary.truncationReason : 'full safe scan'}.</small>
        </article>
      </div>

      <article className="panel sentinel-policy">
        <div><Network aria-hidden="true" size={22} /><h2>WPAI reach without blind authority</h2></div>
        <p>The Sentinel Array can reach every discovered, non-sensitive directory through a validated folder handoff. It does not expose arbitrary command execution, hidden workspace metadata, credential filenames, document content, symlink targets, or external network controls.</p>
        {discovery?.summary.truncated && <p className="sentinel-policy__warning"><TriangleAlert aria-hidden="true" size={15} /> {discovery.summary.truncationReason}</p>}
      </article>
    </section>
  );
}
