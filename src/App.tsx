import { ArrowUp, Command, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CommandMatrix } from './components/CommandMatrix';
import { CompanyAtlas } from './components/CompanyAtlas';
import { NeuralNexus } from './components/NeuralNexus';
import { OmniJump } from './components/OmniJump';
import { OperationsDeck } from './components/OperationsDeck';
import { ProjectFleet } from './components/ProjectFleet';
import { KnowledgeForge } from './components/KnowledgeForge';
import { ResearchNexus } from './components/ResearchNexus';
import { SentinelArray } from './components/SentinelArray';
import { SideRail } from './components/SideRail';
import { SystemCore } from './components/SystemCore';
import { bridge, isDesktopRuntime } from './lib/bridge';
import { cx } from './lib/format';
import type { ChatMessage, CommandResult, CompanySnapshot, DiagnosticsSnapshot, DiscoverySnapshot, OllamaStatus, ProjectStatus, ResearchSnapshot, RickPrimeSettings, SystemSnapshot, ViewId, WorkspaceSummary } from './types';

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('command');
  const [system, setSystem] = useState<SystemSnapshot | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [company, setCompany] = useState<CompanySnapshot | null>(null);
  const [projects, setProjects] = useState<ProjectStatus[]>([]);
  const [research, setResearch] = useState<ResearchSnapshot | null>(null);
  const [discovery, setDiscovery] = useState<DiscoverySnapshot | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsSnapshot | null>(null);
  const [ollama, setOllama] = useState<OllamaStatus | null>(null);
  const [settings, setSettings] = useState<RickPrimeSettings | null>(null);
  const [refreshing, setRefreshing] = useState(true);
  const [runningCommandId, setRunningCommandId] = useState<string | null>(null);
  const [commandHistory, setCommandHistory] = useState<CommandResult[]>([]);
  const [busyDivisionId, setBusyDivisionId] = useState<string | null>(null);
  const [busyProjectId, setBusyProjectId] = useState<string | null>(null);
  const [busyResearchProjectId, setBusyResearchProjectId] = useState<string | null>(null);
  const [busyDiscoveryEntryId, setBusyDiscoveryEntryId] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const stageScrollRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async (forceDiscovery = false) => {
    setRefreshing(true);
    try {
      const [nextSystem, nextWorkspace, nextCompany, nextProjects, nextResearch, nextDiscovery, nextDiagnostics, nextOllama, nextSettings] = await Promise.all([
        bridge.getSystemSnapshot(),
        bridge.getWorkspaceSummary(),
        bridge.getCompanySnapshot(),
        bridge.getProjects(),
        bridge.getResearchSnapshot(),
        forceDiscovery ? bridge.refreshDiscoverySnapshot() : bridge.getDiscoverySnapshot(),
        bridge.getDiagnosticsSnapshot(),
        bridge.getOllamaStatus(),
        bridge.getSettings(),
      ]);
      setSystem(nextSystem);
      setWorkspace(nextWorkspace);
      setCompany(nextCompany);
      setProjects(nextProjects);
      setResearch(nextResearch);
      setDiscovery(nextDiscovery);
      setDiagnostics(nextDiagnostics);
      setOllama(nextOllama);
      setSettings(nextSettings);
    } catch (caught) {
      setNotice({ tone: 'error', message: caught instanceof Error ? caught.message : 'RickPrime could not refresh the live workstation signals.' });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh(true);
    const interval = window.setInterval(() => void refresh(), 30000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.key === 'Escape') {
        setPaletteOpen(false);
        return;
      }
      const target = event.target;
      const editing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (editing || paletteOpen) return;
      const scrollElement = stageScrollRef.current;
      if (!scrollElement) return;
      const viewportStep = Math.max(220, Math.round(scrollElement.clientHeight * 0.82));
      if (event.key === 'Home') {
        event.preventDefault();
        scrollElement.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (event.key === 'End') {
        event.preventDefault();
        scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
      } else if (event.key === 'PageDown') {
        event.preventDefault();
        scrollElement.scrollBy({ top: viewportStep, behavior: 'smooth' });
      } else if (event.key === 'PageUp') {
        event.preventDefault();
        scrollElement.scrollBy({ top: -viewportStep, behavior: 'smooth' });
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paletteOpen]);

  useEffect(() => {
    stageScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeView]);

  const saveSettings = useCallback(async (nextSettings: RickPrimeSettings) => {
    const saved = await bridge.saveSettings(nextSettings);
    setSettings(saved);
    setNotice({ tone: 'success', message: 'Local RickPrime settings saved.' });
  }, []);

  const handleModelChange = useCallback(async (model: string) => {
    const current = settings ?? { ollamaEndpoint: 'http://127.0.0.1:11434', selectedModel: model };
    await saveSettings({ ...current, selectedModel: model });
  }, [saveSettings, settings]);

  const handleChat = useCallback(async (model: string, messages: Array<Pick<ChatMessage, 'role' | 'content'>>) => bridge.chat({ model, messages }), []);

  const runCommand = useCallback(async (commandId: string) => {
    setRunningCommandId(commandId);
    try {
      const result = await bridge.runCommand(commandId);
      setCommandHistory((history) => [result, ...history].slice(0, 12));
      setNotice({ tone: result.exitCode === 0 ? 'success' : 'error', message: `${result.label} completed with exit ${result.exitCode}.` });
    } catch (caught) {
      setNotice({ tone: 'error', message: caught instanceof Error ? caught.message : 'The requested control command failed.' });
    } finally {
      setRunningCommandId(null);
    }
  }, []);

  const openProject = useCallback(async (projectId: string) => {
    setBusyProjectId(projectId);
    try {
      const result = await bridge.openProject(projectId);
      setNotice({ tone: result.opened ? 'success' : 'error', message: result.opened ? 'Project folder opened in the system file explorer.' : result.error ?? 'The project folder could not be opened.' });
    } catch (caught) {
      setNotice({ tone: 'error', message: caught instanceof Error ? caught.message : 'The project folder could not be opened.' });
    } finally {
      setBusyProjectId(null);
    }
  }, []);

  const openDivision = useCallback(async (divisionId: string) => {
    setBusyDivisionId(divisionId);
    try {
      const result = await bridge.openDivision(divisionId);
      setNotice({ tone: result.opened ? 'success' : 'error', message: result.opened ? 'Registered WPAI root opened in the system file explorer.' : result.error ?? 'The registered WPAI root could not be opened.' });
    } catch (caught) {
      setNotice({ tone: 'error', message: caught instanceof Error ? caught.message : 'The registered WPAI root could not be opened.' });
    } finally {
      setBusyDivisionId(null);
    }
  }, []);

  const openResearchProject = useCallback(async (projectId: string) => {
    setBusyResearchProjectId(projectId);
    try {
      const result = await bridge.openResearchProject(projectId);
      setNotice({ tone: result.opened ? 'success' : 'error', message: result.opened ? 'AI Research root opened in the system file explorer.' : result.error ?? 'The research root could not be opened.' });
    } catch (caught) {
      setNotice({ tone: 'error', message: caught instanceof Error ? caught.message : 'The research root could not be opened.' });
    } finally {
      setBusyResearchProjectId(null);
    }
  }, []);

  const openDiscoveredEntry = useCallback(async (entryId: string) => {
    setBusyDiscoveryEntryId(entryId);
    try {
      const result = await bridge.openDiscoveredEntry(entryId);
      setNotice({ tone: result.opened ? 'success' : 'error', message: result.opened ? 'Detected WPAI folder opened in the system file explorer.' : result.error ?? 'The detected folder could not be opened.' });
    } catch (caught) {
      setNotice({ tone: 'error', message: caught instanceof Error ? caught.message : 'The detected folder could not be opened.' });
    } finally {
      setBusyDiscoveryEntryId(null);
    }
  }, []);

  const launchProject = useCallback(async (projectId: string) => {
    setBusyProjectId(projectId);
    try {
      const result = await bridge.launchProject(projectId);
      setNotice({ tone: result.launched ? 'success' : 'error', message: result.launched ? `${result.label} launch requested.` : 'The desktop handoff was not accepted.' });
    } catch (caught) {
      setNotice({ tone: 'error', message: caught instanceof Error ? caught.message : 'The desktop handoff failed.' });
    } finally {
      setBusyProjectId(null);
    }
  }, []);

  const view = (() => {
    switch (activeView) {
      case 'atlas': return <CompanyAtlas company={company} busyDivisionId={busyDivisionId} onNavigate={setActiveView} onOpen={(id) => void openDivision(id)} />;
      case 'fleet': return <ProjectFleet projects={projects} busyProjectId={busyProjectId} onOpen={(id) => void openProject(id)} onLaunch={(id) => void launchProject(id)} />;
      case 'knowledge': return <KnowledgeForge projects={projects} research={research?.projects ?? []} ollama={ollama} settings={settings} onAnalyze={handleChat} onOpenProject={(id) => void openProject(id)} onOpenResearch={(id) => void openResearchProject(id)} />;
      case 'research': return <ResearchNexus research={research} busyProjectId={busyResearchProjectId} runningCommandId={runningCommandId} onOpen={(id) => void openResearchProject(id)} onRunJanusStatus={() => void runCommand('janus-status')} />;
      case 'neural': return <NeuralNexus ollama={ollama} settings={settings} onChat={handleChat} onModelChange={handleModelChange} />;
      case 'operations': return <OperationsDeck history={commandHistory} runningCommandId={runningCommandId} workspace={workspace} onRun={(id) => void runCommand(id)} />;
      case 'sentinel': return <SentinelArray discovery={discovery} diagnostics={diagnostics} refreshing={refreshing} busyEntryId={busyDiscoveryEntryId} onRefresh={() => void refresh(true)} onOpen={(id) => void openDiscoveredEntry(id)} />;
      case 'systems': return <SystemCore system={system} ollama={ollama} settings={settings} workspace={workspace} refreshing={refreshing} onRefresh={() => void refresh(true)} onSave={saveSettings} />;
      case 'command':
      default: return <CommandMatrix company={company} discovery={discovery} diagnostics={diagnostics} ollama={ollama} projects={projects} research={research} system={system} workspace={workspace} onNavigate={setActiveView} />;
    }
  })();

  return (
    <div className="app-shell">
      <div className="app-shell__aurora" aria-hidden="true" />
      <SideRail activeView={activeView} onChange={setActiveView} />
      <main className="main-stage">
        <header className="top-bar">
          <div className="top-bar__status">
            <span className={cx('connection-state', ollama?.online && 'is-online')}><span aria-hidden="true" />{ollama?.online ? 'LOCAL NEURAL LINK' : 'LOCAL LINK OFFLINE'}</span>
            {!isDesktopRuntime && <span className="preview-badge"><TriangleAlert aria-hidden="true" size={13} /> BROWSER PREVIEW</span>}
          </div>
          <div className="top-bar__actions">
            <button className="omni-trigger" type="button" onClick={() => setPaletteOpen(true)}><Command aria-hidden="true" size={15} /><span>Omni-jump</span><kbd>Ctrl K</kbd></button>
            <button className="icon-action" type="button" onClick={() => stageScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })} title="Scroll workspace to top"><ArrowUp aria-hidden="true" size={17} /></button>
            <button className="icon-action" type="button" onClick={() => void refresh(true)} disabled={refreshing} title="Refresh local signals"><RefreshCw aria-hidden="true" size={17} className={refreshing ? 'spin' : undefined} /></button>
            <span className="security-state"><ShieldCheck aria-hidden="true" size={15} /> Guarded</span>
          </div>
        </header>
        <div className="main-stage__scroll" ref={stageScrollRef} tabIndex={-1} aria-label="RickPrime workspace content">{view}</div>
      </main>
      {notice && <div className={cx('toast', `toast--${notice.tone}`)} role="status"><span>{notice.tone === 'success' ? '✓' : '!'}</span>{notice.message}<button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)}>×</button></div>}
      {paletteOpen && <OmniJump divisions={company?.divisions ?? []} projects={projects} research={research?.projects ?? []} onClose={() => setPaletteOpen(false)} onNavigate={setActiveView} onOpenDivision={(id) => void openDivision(id)} onOpenProject={(id) => void openProject(id)} onOpenResearchProject={(id) => void openResearchProject(id)} />}
    </div>
  );
}
