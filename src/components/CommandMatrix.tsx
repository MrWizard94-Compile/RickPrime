import { ArrowRight, Bot, CircuitBoard, FileCheck2, GitBranch, Radar, ScanSearch, ShieldCheck, Sparkles } from 'lucide-react';
import { formatBytes, formatTimestamp, formatUptime } from '../lib/format';
import type { CompanySnapshot, DiagnosticsSnapshot, DiscoverySnapshot, OllamaStatus, ProjectStatus, ResearchSnapshot, SystemSnapshot, ViewId, WorkspaceSummary } from '../types';

interface CommandMatrixProps {
  company: CompanySnapshot | null;
  discovery: DiscoverySnapshot | null;
  diagnostics: DiagnosticsSnapshot | null;
  ollama: OllamaStatus | null;
  projects: ProjectStatus[];
  research: ResearchSnapshot | null;
  system: SystemSnapshot | null;
  workspace: WorkspaceSummary | null;
  onNavigate(view: ViewId): void;
}

function Metric({ label, value, note, tone = 'cyan' }: { label: string; value: string; note: string; tone?: 'cyan' | 'lime' | 'violet' | 'amber' }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <span className="metric-card__label">{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
      <span className="metric-card__scan" aria-hidden="true" />
    </article>
  );
}

export function CommandMatrix({ company, discovery, diagnostics, ollama, projects, research, system, workspace, onNavigate }: CommandMatrixProps) {
  const onlineProjects = projects.filter((project) => project.exists && !project.parked);
  const changedFiles = onlineProjects.reduce((total, project) => total + (project.git?.changedFiles ?? 0), 0);
  const memoryUsed = system ? system.totalMemory - system.freeMemory : null;
  const companySummary = company?.summary;

  return (
    <section className="view command-matrix" aria-label="Command matrix">
      <header className="view-hero">
        <div>
          <span className="eyebrow"><Radar aria-hidden="true" size={13} /> Core telemetry // live local signal</span>
          <h1>Command <em>matrix</em></h1>
          <p>A dense, local-first control surface for the WPAI studio fleet. RickPrime reads live signals and leaves consequential actions in human hands.</p>
        </div>
        <div className="hero-orbital" aria-hidden="true">
          <span className="hero-orbital__sun" />
          <span className="hero-orbital__ring hero-orbital__ring--outer" />
          <span className="hero-orbital__ring hero-orbital__ring--inner" />
          <span className="hero-orbital__satellite" />
        </div>
      </header>

      <div className="metric-grid">
        <Metric label="WPAI reach" value={discovery ? discovery.summary.directoriesDetected.toLocaleString() : 'Scanning'} note={discovery ? `${discovery.summary.projectCandidates} detected workspace roots` : 'safe metadata scan pending'} tone="cyan" />
        <Metric label="Local neural link" value={ollama?.online ? `${ollama.models.length} models` : 'offline'} note={ollama?.online ? ollama.endpoint : 'Docker Ollama is not responding'} tone={ollama?.online ? 'lime' : 'amber'} />
        <Metric label="Git turbulence" value={`${changedFiles} files`} note="uncommitted files across detected repos" tone="violet" />
        <Metric label="Control-plane queue" value={`${workspace?.approvalFileCount ?? 0} approvals`} note={workspace?.controlPlaneAvailable ? 'StudioOps runtime detected' : 'runtime state unavailable'} tone="amber" />
      </div>

      <div className="matrix-grid">
        <article className="panel panel--wide matrix-status">
          <div className="panel__heading">
            <div>
              <span className="section-label">Vector status</span>
              <h2>Integration lattice</h2>
            </div>
            <button className="quiet-action" type="button" onClick={() => onNavigate('atlas')}>
              Company atlas <ArrowRight aria-hidden="true" size={15} />
            </button>
          </div>
          <div className="integration-list">
            <div className="integration-row">
              <span className="integration-row__glyph integration-row__glyph--cyan"><Radar aria-hidden="true" size={17} /></span>
              <div>
                <strong>WPAI authority atlas</strong>
                <span>{companySummary ? `${companySummary.detectedDivisions}/${companySummary.registeredDivisions} registered roots detected; ${companySummary.sourceDocumentsAvailable}/${companySummary.sourceDocumentsTotal} division sources are locally available.` : 'Scanning the fixed WPAI portfolio registry.'}</span>
              </div>
              <button className="state-chip state-chip--button" type="button" onClick={() => onNavigate('atlas')}>
                OPEN ATLAS
              </button>
            </div>
            <div className="integration-row">
              <span className="integration-row__glyph integration-row__glyph--cyan"><ShieldCheck aria-hidden="true" size={17} /></span>
              <div>
                <strong>StudioOps control plane</strong>
                <span>{workspace?.controlPlaneAvailable ? 'Detected — commands remain allowlisted and read-first.' : 'Runtime folder not currently detectable.'}</span>
              </div>
              <span className={`state-chip ${workspace?.controlPlaneAvailable ? 'state-chip--ready' : 'state-chip--muted'}`}>
                {workspace?.controlPlaneAvailable ? 'LINKED' : 'NO SIGNAL'}
              </span>
            </div>
            <div className="integration-row">
              <span className="integration-row__glyph integration-row__glyph--lime"><Bot aria-hidden="true" size={17} /></span>
              <div>
                <strong>Docker Ollama neural link</strong>
                <span>{ollama?.online ? `${ollama.models.length} local model${ollama.models.length === 1 ? '' : 's'} discovered at ${ollama.endpoint}.` : 'Awaiting a local runtime at the configured endpoint.'}</span>
              </div>
              <button className="state-chip state-chip--button" type="button" onClick={() => onNavigate('neural')}>
                {ollama?.online ? 'OPEN NEXUS' : 'DIAGNOSE'}
              </button>
            </div>
            <div className="integration-row">
              <span className="integration-row__glyph integration-row__glyph--violet"><CircuitBoard aria-hidden="true" size={17} /></span>
              <div>
                <strong>Knowledge Forge and Research Nexus</strong>
                <span>{research ? research.summary.detectedProjects + '/' + research.summary.registeredProjects + ' AI Research roots are mapped; Janus is limited to its documented read-only status probe.' : 'Loading source-aware research and context integration signals.'}</span>
              </div>
              <button className="state-chip state-chip--button" type="button" onClick={() => onNavigate('knowledge')}>OPEN FORGE</button>
            </div>
            <div className="integration-row">
              <span className="integration-row__glyph integration-row__glyph--cyan"><ScanSearch aria-hidden="true" size={17} /></span>
              <div>
                <strong>WPAI Sentinel Array</strong>
                <span>{discovery ? `${discovery.summary.directoriesDetected.toLocaleString()} safe directories and ${discovery.summary.filesObserved.toLocaleString()} safe file entries observed; ${discovery.watcher.active ? 'native watcher armed' : '30-second polling active'}.` : 'Starting the bounded WPAI topology scan.'}</span>
              </div>
              <button className="state-chip state-chip--button" type="button" onClick={() => onNavigate('sentinel')}>OPEN ARRAY</button>
            </div>
            <div className="integration-row">
              <span className="integration-row__glyph integration-row__glyph--amber"><FileCheck2 aria-hidden="true" size={17} /></span>
              <div>
                <strong>Human approval boundary</strong>
                <span>Publishing, ticket emission, spending, and arbitrary command execution stay outside this control surface.</span>
              </div>
              <span className="state-chip state-chip--amber">HITL</span>
            </div>
          </div>
        </article>

        <article className="panel resource-panel">
          <div className="panel__heading">
            <div>
              <span className="section-label">Host vector</span>
              <h2>{system?.hostname ?? 'Scanning node'}</h2>
            </div>
            <Sparkles aria-hidden="true" className="panel__icon" size={18} />
          </div>
          <dl className="resource-list">
            <div><dt>Memory envelope</dt><dd>{system ? `${formatBytes(memoryUsed)} / ${formatBytes(system.totalMemory)}` : 'Scanning'}</dd></div>
            <div><dt>Compute lattice</dt><dd>{system ? `${system.cpuCount} logical cores` : 'Scanning'}</dd></div>
            <div><dt>Node uptime</dt><dd>{system ? formatUptime(system.uptimeSeconds) : 'Scanning'}</dd></div>
            <div><dt>Runtime datum</dt><dd>{system ? `Electron ${system.electronVersion}` : 'Scanning'}</dd></div>
            <div><dt>Storage reserve</dt><dd>{diagnostics?.storage.available ? formatBytes(diagnostics.storage.freeBytes) : 'Scanning'}</dd></div>
          </dl>
          <p className="panel__footnote">{system?.cpuModel ?? 'System telemetry will appear after the desktop bridge responds.'}</p>
        </article>
      </div>

      <div className="matrix-grid matrix-grid--lower">
        <article className="panel fleet-pulse">
          <div className="panel__heading">
            <div>
              <span className="section-label">Fleet pulse</span>
              <h2>Active project vectors</h2>
            </div>
            <GitBranch aria-hidden="true" className="panel__icon" size={18} />
          </div>
          <div className="fleet-pulse__rows">
            {onlineProjects.slice(0, 6).map((project) => (
              <div className="fleet-pulse__row" key={project.id}>
                <span className="live-dot" aria-hidden="true" />
                <strong>{project.label}</strong>
                <span>{project.git?.branch ?? 'folder-only'}</span>
                <span className={project.git && project.git.changedFiles > 0 ? 'changes changes--active' : 'changes'}>
                  {project.git ? `${project.git.changedFiles} Δ` : '—'}
                </span>
              </div>
            ))}
            {!onlineProjects.length && <p className="empty-state">No registered project folders are currently visible.</p>}
          </div>
        </article>

        <article className="panel runtime-log">
          <div className="panel__heading">
            <div>
              <span className="section-label">Runtime ledger</span>
              <h2>Trace markers</h2>
            </div>
          </div>
          <ul className="trace-list">
            <li><span className="trace-list__time">NOW</span><span>RickPrime desktop bridge initialized with context isolation.</span></li>
            <li><span className="trace-list__time">LOCAL</span><span>Ollama endpoint is constrained to loopback addresses.</span></li>
            <li><span className="trace-list__time">ATLAS</span><span>{companySummary ? `${companySummary.needsVerification} portfolio record${companySummary.needsVerification === 1 ? '' : 's'} require current-state verification.` : 'Portfolio authority sources are loading.'}</span></li>
            <li><span className="trace-list__time">RESEARCH</span><span>{research ? research.summary.needsVerification + ' AI Research node' + (research.summary.needsVerification === 1 ? '' : 's') + ' remain explicitly verification-gated.' : 'Research evidence sources are loading.'}</span></li>
            <li><span className="trace-list__time">STATE</span><span>Control plane last changed {formatTimestamp(workspace?.controlPlaneUpdatedAt ?? null)}.</span></li>
          </ul>
        </article>
      </div>
    </section>
  );
}
