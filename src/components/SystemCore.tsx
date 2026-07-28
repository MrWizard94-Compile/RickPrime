import { Check, CloudOff, Cpu, Database, LoaderCircle, RefreshCw, Save, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { formatBytes } from '../lib/format';
import type { OllamaStatus, RickPrimeSettings, SystemSnapshot, WorkspaceSummary } from '../types';

interface SystemCoreProps {
  system: SystemSnapshot | null;
  ollama: OllamaStatus | null;
  settings: RickPrimeSettings | null;
  workspace: WorkspaceSummary | null;
  refreshing: boolean;
  onRefresh(): void;
  onSave(settings: RickPrimeSettings): Promise<void>;
}

export function SystemCore({ system, ollama, settings, workspace, refreshing, onRefresh, onSave }: SystemCoreProps) {
  const [endpoint, setEndpoint] = useState(settings?.ollamaEndpoint ?? 'http://127.0.0.1:11434');
  const [model, setModel] = useState(settings?.selectedModel ?? 'gemma3:270m');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const discoveredModels = useMemo(() => ollama?.models.map((entry) => entry.name) ?? [], [ollama?.models]);
  const models = useMemo(() => discoveredModels.length ? discoveredModels : (settings?.selectedModel ? [settings.selectedModel] : []), [discoveredModels, settings?.selectedModel]);

  useEffect(() => {
    if (settings) {
      setEndpoint(settings.ollamaEndpoint);
      setModel(settings.selectedModel);
    }
  }, [settings]);

  useEffect(() => {
    if (ollama?.online && discoveredModels.length && !discoveredModels.includes(model)) {
      setModel(discoveredModels[0]);
    }
  }, [discoveredModels, model, ollama?.online]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await onSave({ ollamaEndpoint: endpoint, selectedModel: model });
      setMessage('Saved locally. Refresh the runtime scan to probe the endpoint.');
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'RickPrime could not save the local runtime settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="view systems-view" aria-label="System core">
      <header className="view-hero view-hero--compact">
        <div>
          <span className="eyebrow"><SlidersHorizontal aria-hidden="true" size={13} /> Runtime configuration // local persistence</span>
          <h1>System <em>core</em></h1>
          <p>Inspect the desktop host and configure the local Ollama relay. Settings are stored in RickPrime’s user-data folder, never in the source tree.</p>
        </div>
        <button className="button button--secondary" type="button" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw aria-hidden="true" size={16} className={refreshing ? 'spin' : undefined} /> {refreshing ? 'Scanning…' : 'Refresh signals'}
        </button>
      </header>

      <div className="systems-layout">
        <form className="panel runtime-form" onSubmit={submit}>
          <div className="panel__heading"><div><span className="section-label">Local AI relay</span><h2>Ollama endpoint</h2></div><Database aria-hidden="true" className="panel__icon" size={18} /></div>
          <label className="field-label">Loopback URL<input type="url" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} placeholder="http://127.0.0.1:11434" required /></label>
          <small className="field-help">Only <code>http://127.0.0.1</code>, <code>http://localhost</code>, or IPv6 loopback are accepted by the desktop bridge.</small>
          <label className="field-label">Default local model
            <select value={model} onChange={(event) => setModel(event.target.value)}>
              {models.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </select>
          </label>
          <button className="button button--primary" type="submit" disabled={saving}>{saving ? <LoaderCircle aria-hidden="true" size={16} className="spin" /> : <Save aria-hidden="true" size={16} />} {saving ? 'Saving…' : 'Save local settings'}</button>
          {message && <p className="settings-message"><Check aria-hidden="true" size={15} /> {message}</p>}
        </form>

        <div className="system-stat-stack">
          <article className="panel system-stat-card">
            <span className="section-label">Neural runtime</span>
            <div className="system-stat-card__value">{ollama?.online ? `${ollama.models.length} models` : 'Offline'}</div>
            <p>{ollama?.online ? `Connected to ${ollama.endpoint}` : ollama?.error ?? 'Waiting for the local endpoint scan.'}</p>
            {ollama?.online ? <Cpu aria-hidden="true" size={20} /> : <CloudOff aria-hidden="true" size={20} />}
          </article>
          <article className="panel system-stat-card">
            <span className="section-label">Host memory</span>
            <div className="system-stat-card__value">{system ? formatBytes(system.totalMemory - system.freeMemory) : '—'}</div>
            <p>{system ? `${formatBytes(system.freeMemory)} free of ${formatBytes(system.totalMemory)}` : 'Waiting for host telemetry.'}</p>
            <Cpu aria-hidden="true" size={20} />
          </article>
          <article className="panel system-stat-card">
            <span className="section-label">StudioOps state</span>
            <div className="system-stat-card__value">{workspace?.controlPlaneAvailable ? 'Linked' : 'No signal'}</div>
            <p>{workspace?.controlPlaneAvailable ? `${workspace.approvalFileCount} approval file${workspace.approvalFileCount === 1 ? '' : 's'} awaiting human handling.` : 'The protected runtime state is not available.'}</p>
            <ShieldCheck aria-hidden="true" size={20} />
          </article>
        </div>
      </div>

      <article className="panel safeguard-grid">
        <div><ShieldCheck aria-hidden="true" size={22} /><h2>Security posture</h2></div>
        <p>Context isolation, sandboxed renderer, allowlisted IPC operations, loopback-only model endpoints, and no credential fields.</p>
        <p>Project launchers are explicitly registered; only HellForge has a launcher. Sentinel folder handoffs require an intentional click and stay inside the detected WPAI root.</p>
        <p>For real unrestricted terminal work, use HellForge. For release actions, use StudioOps’ established human-approval workflow.</p>
      </article>
    </section>
  );
}
