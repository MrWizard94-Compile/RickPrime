import { CheckCircle2, CircleAlert, LockKeyhole, Play, TerminalSquare } from 'lucide-react';
import { controlCommands } from '../data/controls';
import { cx, formatTimestamp } from '../lib/format';
import type { CommandResult, WorkspaceSummary } from '../types';

interface OperationsDeckProps {
  history: CommandResult[];
  runningCommandId: string | null;
  workspace: WorkspaceSummary | null;
  onRun(commandId: string): void;
}

export function OperationsDeck({ history, runningCommandId, workspace, onRun }: OperationsDeckProps) {
  return (
    <section className="view operations-view" aria-label="Operations deck">
      <header className="view-hero view-hero--compact">
        <div>
          <span className="eyebrow"><TerminalSquare aria-hidden="true" size={13} /> Guarded operations // explicit human control</span>
          <h1>Operations <em>deck</em></h1>
          <p>These are narrow, auditable handoffs to existing WPAI tooling. There is no arbitrary terminal input here—real PTYs remain the domain of HellForge.</p>
        </div>
        <div className="operations-lock"><LockKeyhole aria-hidden="true" size={18} /><span><strong>Allowlist enforced</strong><small>Four read-first actions</small></span></div>
      </header>

      <div className="command-grid">
        {controlCommands.map((command) => {
          const isRunning = runningCommandId === command.id;
          return (
            <article className={cx('command-card', `command-card--${command.accent}`)} key={command.id}>
              <span className="command-card__index">/{command.id}</span>
              <h2>{command.label}</h2>
              <p>{command.detail}</p>
              <button className="button button--primary" type="button" disabled={runningCommandId !== null} onClick={() => onRun(command.id)}>
                <Play aria-hidden="true" size={15} /> {isRunning ? 'Running…' : 'Run safely'}
              </button>
            </article>
          );
        })}
      </div>

      <div className="operations-layout">
        <article className="panel command-output">
          <div className="panel__heading">
            <div><span className="section-label">Execution ledger</span><h2>Command output</h2></div>
            <span className="state-chip state-chip--violet">{history.length} RUN{history.length === 1 ? '' : 'S'}</span>
          </div>
          <div className="command-output__scroll">
            {history.map((result) => {
              const succeeded = result.exitCode === 0 && !result.timedOut;
              const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
              return (
                <article className="command-result" key={`${result.commandId}-${result.ranAt}`}>
                  <div className="command-result__heading">
                    <span className={cx('result-icon', succeeded ? 'result-icon--success' : 'result-icon--error')}>
                      {succeeded ? <CheckCircle2 aria-hidden="true" size={16} /> : <CircleAlert aria-hidden="true" size={16} />}
                    </span>
                    <div><strong>{result.label}</strong><small>{formatTimestamp(result.ranAt)} · exit {result.exitCode}{result.timedOut ? ' · timed out' : ''}</small></div>
                  </div>
                  <pre>{output || '[The command completed without output.]'}</pre>
                </article>
              );
            })}
            {!history.length && <div className="empty-output"><TerminalSquare aria-hidden="true" size={22} /><p>Command results appear here after you deliberately run an allowlisted action.</p></div>}
          </div>
        </article>
        <aside className="operations-sidebar">
          <article className="panel policy-panel">
            <LockKeyhole aria-hidden="true" size={21} />
            <h2>Control policy</h2>
            <ul>
              <li>No arbitrary shell commands</li>
              <li>No automatic publishing or spending</li>
              <li>No ticket emission from this deck</li>
              <li>All command output is visible here</li>
            </ul>
          </article>
          <article className="panel ops-runtime">
            <span className="section-label">StudioOps runtime</span>
            <strong>{workspace?.controlPlaneAvailable ? 'Detected' : 'Not detected'}</strong>
            <p>{workspace?.controlPlaneAvailable ? `${workspace.approvalFileCount} approval file${workspace.approvalFileCount === 1 ? '' : 's'} · ${workspace.journalFileCount} HellForge journal${workspace.journalFileCount === 1 ? '' : 's'}` : 'The Workspace runtime directory is unavailable to the desktop bridge.'}</p>
          </article>
        </aside>
      </div>
    </section>
  );
}
