import type {
  CommandResult,
  CompanySnapshot,
  DesktopBridge,
  DiagnosticsSnapshot,
  DiscoverySnapshot,
  DivisionPhase,
  EvidenceState,
  OllamaStatus,
  ProjectStatus,
  ResearchSnapshot,
  RickPrimeSettings,
  SystemSnapshot,
  WorkspaceSummary,
} from '../types';

const previewSettings: RickPrimeSettings = {
  ollamaEndpoint: 'http://127.0.0.1:11434',
  selectedModel: 'gemma3:270m',
};

const previewProjects: ProjectStatus[] = [
  {
    id: 'studioops',
    label: 'StudioOps',
    group: 'Control plane',
    directory: 'C:\\WPAI\\Software\\StudioOps',
    description: 'Approvals, studio status, and release safeguards.',
    launch: null,
    parked: false,
    exists: true,
    git: { branch: 'main', changedFiles: 0 },
  },
  {
    id: 'hellforge',
    label: 'HellForge',
    group: 'Control plane',
    directory: 'C:\\WPAI\\Software\\HellForge',
    description: 'Real PTYs, command deck, and council-bus operations.',
    launch: 'hellforge',
    parked: false,
    exists: true,
    git: { branch: 'main', changedFiles: 0 },
  },
  {
    id: 'wpai-explorer',
    label: 'WPAI Explorer',
    group: 'Knowledge systems',
    directory: 'C:\\WPAI\\Software\\wpai-explorer',
    description: 'Original knowledge explorer; its local context-bundle workflow is now native in RickPrime Knowledge Forge.',
    launch: null,
    parked: false,
    exists: true,
    git: { branch: 'main', changedFiles: 1 },
  },
  {
    id: 'workstation',
    label: 'Workstation',
    group: 'Knowledge systems',
    directory: 'C:\\WPAI\\Software\\Workstation',
    description: 'The original browser workstation and creative shell.',
    launch: null,
    parked: false,
    exists: true,
    git: null,
  },
  {
    id: 'yumnom',
    label: 'YumNom',
    group: 'Parked',
    directory: 'C:\\WPAI\\Software\\YumNom',
    description: 'Director-deferred product. RickPrime deliberately does not launch it.',
    launch: null,
    parked: true,
    exists: true,
    git: { branch: 'main', changedFiles: 0 },
  },
];

const previewSystem: SystemSnapshot = {
  hostname: 'preview-node',
  platform: 'Windows preview',
  architecture: 'x64',
  cpuCount: 8,
  cpuModel: 'RickPrime browser preview',
  totalMemory: 48 * 1024 ** 3,
  freeMemory: 31 * 1024 ** 3,
  uptimeSeconds: 126540,
  electronVersion: 'preview',
  nodeVersion: 'preview',
  cpuUsagePercent: 18.4,
  processMemoryBytes: 286 * 1024 ** 2,
  activeNetworkInterfaceCount: 1,
};

const previewWorkspace: WorkspaceSummary = {
  controlPlaneAvailable: true,
  controlPlaneUpdatedAt: new Date().toISOString(),
  approvalFileCount: 0,
  journalFileCount: 0,
};

const previewDiscovery: DiscoverySnapshot = {
  schemaVersion: 2,
  rootDirectory: 'C:\\WPAI',
  scannedAt: new Date().toISOString(),
  available: true,
  entries: [
    { id: 'directory:.', relativePath: '.', label: 'WPAI', depth: 0, classification: 'WPAI root', markers: ['Git repository', 'Documented workspace'], directDirectoryCount: 13, directFileCount: 4 },
    { id: 'directory:Software', relativePath: 'Software', label: 'Software', depth: 1, classification: 'Company area', markers: ['Documented workspace'], directDirectoryCount: 20, directFileCount: 1 },
    { id: 'directory:Software/RickPrime', relativePath: 'Software/RickPrime', label: 'RickPrime', depth: 2, classification: 'Detected workspace', markers: ['Git repository', 'Node workspace', 'Documented workspace'], directDirectoryCount: 4, directFileCount: 8 },
    { id: 'directory:AI-Research', relativePath: 'AI-Research', label: 'AI-Research', depth: 1, classification: 'Company area', markers: ['Documented workspace'], directDirectoryCount: 14, directFileCount: 2 },
  ],
  projectCandidates: [],
  summary: {
    directoriesDetected: 246,
    filesObserved: 1820,
    projectCandidates: 64,
    protectedEntriesExcluded: 8,
    ignoredDirectories: 20,
    denseCollectionsSkipped: 3,
    skippedSymlinks: 0,
    unreadableDirectories: 0,
    truncated: false,
    truncationReason: null,
    maxDepth: 24,
    maxDirectories: 12000,
    maxEntries: 100000,
  },
  watcher: { mode: 'polling', active: false, eventsSinceScan: 0, lastEventAt: null },
  changes: { baselineState: 'initialized', addedCount: 0, removedCount: 0, added: [], removed: [] },
};

function previewSource(label: string, relativePath: string) {
  return {
    label,
    relativePath,
    available: true,
    modifiedAt: new Date().toISOString(),
  };
}

function previewDivision(
  id: string,
  label: string,
  category: string,
  directory: string,
  description: string,
  phase: DivisionPhase,
  phaseLabel: string,
  statusState: EvidenceState,
  statusLabel: string,
) : CompanySnapshot['divisions'][number] {
  return {
    id,
    label,
    category,
    directory,
    description,
    phase,
    phaseLabel,
    statusState,
    statusLabel,
    statusNote: 'Browser preview uses a representative portfolio record. Launch the desktop app for bounded live file-presence and source-availability signals.',
    activationGate: 'Review the applicable WPAI source documents before changing operating state.',
    operatingBoundary: 'Browser preview cannot open folders, execute controls, or read local portfolio state.',
    exists: true,
    sourceDocuments: [previewSource(`${label} authority`, 'WPAI-CONTEXT.md')],
    supplementalSignal: id === 'gaming' ? previewSource('Astral Sorcery port worktree', 'Gaming/Minecraft/Mods-1.20.1-Forge/Astral_Sorcery_Port') : null,
  };
}

const previewCompany: CompanySnapshot = {
  rootDirectory: 'C:\\WPAI',
  authoritySources: [
    previewSource('WPAI operating context', 'WPAI-CONTEXT.md'),
    previewSource('Portfolio activation roadmap', 'WPAI-ROADMAP.md'),
    previewSource('Revenue sequencing plan', 'REVENUE-PLAN.md'),
    previewSource('Empire production constitution', 'SOULv2.0.0.md'),
  ],
  divisions: [
    previewDivision('music', 'Music', 'Revenue engine', 'C:\\WPAI\\Music', 'Portfolio funding engine and release-story anchor.', 'active', 'Active funding engine', 'needs-verification', 'RECONCILE RELEASE SIGNALS'),
    previewDivision('software', 'Software', 'Products and internal systems', 'C:\\WPAI\\Software', 'Internal controls, products, and developer systems.', 'active', 'Active internal and product lane', 'needs-verification', 'VERIFY COMMERCIAL SNAPSHOTS'),
    previewDivision('gaming', 'Gaming', 'Audience and game development', 'C:\\WPAI\\Gaming', 'Minecraft modding and original game work.', 'active', 'Active external project lane', 'needs-verification', 'VERIFY PUBLIC RELEASE STATE'),
    previewDivision('graphics', 'Graphics', 'Shared creative service', 'C:\\WPAI\\Graphics', 'Shared art and visual-identity service.', 'support', 'Support lane / conditional activation', 'director-decision', 'ACTIVATION GATE RECORDED'),
    previewDivision('brand', 'Brand', 'Shared operating standard', 'C:\\WPAI\\Brand', 'Portfolio-wide disclosure and tone standard.', 'support', 'Active shared standard', 'verified', 'SOURCE STANDARD DETECTED'),
    previewDivision('games', 'Games / Cinderforge', 'Original game incubation', 'C:\\WPAI\\Games', 'Rhythm-action roguelite concept and vertical-slice gate.', 'review', 'Concept review / vertical-slice gate', 'research-synthesis', 'DIRECTOR GREEN-LIGHT REQUIRED'),
    previewDivision('ai-research', 'AI Research', 'Long-horizon research', 'C:\\WPAI\\AI-Research', 'Measured efficiency and architecture research lane.', 'pre-work', 'Pre-work / funding-gated flagship', 'director-decision', 'FUNDING GATE RECORDED'),
    previewDivision('quantum', 'Quantum', 'Long-horizon research', 'C:\\WPAI\\Quantum', 'Deferred quantum-computation exploration.', 'deferred', 'Deferred / last activation', 'director-decision', 'SEQUENCING GATE RECORDED'),
    previewDivision('llm-lab', 'LLM Lab', 'Local AI infrastructure', 'C:\\WPAI\\llm', 'Offline-first models and benchmark workspace.', 'runtime', 'Supporting local-AI infrastructure', 'verified', 'LOCAL LAB ARTIFACTS DETECTED'),
    previewDivision('workspace', 'Workspace Runtime', 'Control-plane infrastructure', 'C:\\WPAI\\Workspace', 'StudioOps and HellForge local runtime state.', 'runtime', 'Runtime-only infrastructure', 'verified', 'RUNTIME BOUNDARY DETECTED'),
    previewDivision('tools', 'Tools', 'Shared utilities', 'C:\\WPAI\\Tools', 'Shared utilities outside product ownership.', 'support', 'Supporting utilities', 'verified', 'UTILITY ROOT DETECTED'),
    previewDivision('archives', 'Archives', 'Historical records', 'C:\\WPAI\\Archives', 'Retained historical material.', 'archive', 'Archive / non-operational', 'verified', 'ARCHIVE ROOT DETECTED'),
    previewDivision('grok-workspace', 'Grok Workspace', 'Collaboration workspace', 'C:\\WPAI\\grok-workspace', 'Separate collaboration workspace.', 'support', 'Scoped collaboration workspace', 'needs-verification', 'SCOPE REQUIRES LOCAL REVIEW'),
  ],
  summary: {
    registeredDivisions: 13,
    detectedDivisions: 13,
    activeDivisions: 3,
    sourceDocumentsAvailable: 13,
    sourceDocumentsTotal: 13,
    needsVerification: 4,
    directorDecisions: 3,
  },
};

function previewResearchProject(
  id: string,
  label: string,
  category: string,
  description: string,
  statusState: EvidenceState = 'needs-verification',
  integrationMode: ResearchSnapshot['projects'][number]['integrationMode'] = 'source-map',
): ResearchSnapshot['projects'][number] {
  return {
    id,
    label,
    category,
    directory: 'C:\\WPAI\\AI-Research\\' + label,
    description,
    phaseLabel: integrationMode === 'status-control' ? 'Governed orchestration / status only' : 'Research workspace / local review',
    statusState,
    statusLabel: integrationMode === 'status-control' ? 'READ-ONLY STATUS AVAILABLE' : 'LOCAL SCOPE REQUIRES REVIEW',
    statusNote: 'Browser preview uses a representative research record. Launch the desktop app for fixed-root and source-availability signals.',
    activationGate: 'Use the owning project instructions and the applicable human-approval path before activation.',
    operatingBoundary: 'Browser preview cannot run research, configure providers, or open local folders.',
    integrationMode,
    tags: [category.toLowerCase(), 'research', 'preview'],
    capabilities: integrationMode === 'status-control' ? ['Read-only status probe', 'Source provenance'] : ['Source mapping', 'Folder handoff'],
    exists: true,
    sourceDocuments: [previewSource(label + ' authority', 'AI-Research/README.md')],
  };
}

const previewResearch: ResearchSnapshot = {
  rootDirectory: 'C:\\WPAI\\AI-Research',
  projects: [
    previewResearchProject('asset-converter', 'AssetConverter / Omni32', 'Asset research', 'Sparse asset conversion research.', 'needs-verification'),
    previewResearchProject('automation-lab', 'AutomationLab', 'Automation research', 'Automation research workspace.', 'needs-verification'),
    previewResearchProject('claude-playground', 'Claude Playground', 'Model experimentation', 'Model experiment workspace.', 'needs-verification'),
    previewResearchProject('deep-research-engine', 'Deep Research Engine', 'Research systems', 'Research-engine workspace.', 'needs-verification'),
    previewResearchProject('grok-playground', 'Grok Playground', 'Model experimentation', 'Resource-constrained research playground.', 'research-synthesis'),
    previewResearchProject('janus', 'JanusPrime', 'Research orchestration', 'Canonical research orchestration integration.', 'needs-verification', 'status-control'),
    previewResearchProject('operation-pinky', 'Operation Pinky and the Brain', 'Autonomy research', 'Autonomy research workspace.', 'needs-verification'),
    previewResearchProject('recurrsive', 'Recurrsive', 'Novel architectures', 'Recursive-computation research.', 'research-synthesis', 'knowledge-source'),
    previewResearchProject('rel-codex-variant', 'REL Codex Variant', 'Cognition research', 'Optional cognition integration.', 'needs-verification'),
    previewResearchProject('research-crawler', 'Research Crawler', 'Research systems', 'Crawler-oriented research workspace.', 'needs-verification'),
    previewResearchProject('smart-library', 'Smart Library', 'Knowledge systems', 'Semantic-memory research workspace.', 'needs-verification', 'knowledge-source'),
    previewResearchProject('topological-hydro', 'Topological Hydro-Computational Engine', 'Novel architectures', 'Novel-computing research concept.', 'research-synthesis', 'knowledge-source'),
    previewResearchProject('tsam', 'TSAM', 'Novel architectures', 'Deterministic cognitive rewrite engine.', 'needs-verification', 'knowledge-source'),
    previewResearchProject('veriforge', 'VeriForge', 'Verification research', 'Experimental verification research MVP.', 'research-synthesis', 'knowledge-source'),
  ],
  summary: {
    registeredProjects: 14,
    detectedProjects: 14,
    sourceDocumentsAvailable: 14,
    sourceDocumentsTotal: 14,
    needsVerification: 9,
    researchSynthesis: 4,
    statusControls: 1,
  },
};

const previewOllama: OllamaStatus = {
  online: false,
  endpoint: previewSettings.ollamaEndpoint,
  models: [],
  error: 'Browser preview mode cannot inspect the local Ollama runtime.',
};

const previewDiagnostics: DiagnosticsSnapshot = {
  capturedAt: new Date().toISOString(),
  system: previewSystem,
  workspace: previewWorkspace,
  storage: {
    available: true,
    totalBytes: 2 * 1024 ** 4,
    freeBytes: 840 * 1024 ** 3,
    usedBytes: 1208 * 1024 ** 3,
    error: null,
  },
  docker: {
    available: false,
    runningContainers: 0,
    ollamaContainerDetected: false,
    containers: [],
    error: 'Browser preview mode cannot inspect Docker.',
  },
  ollama: previewOllama,
  discovery: {
    scannedAt: previewDiscovery.scannedAt,
    available: true,
    summary: previewDiscovery.summary,
    watcher: previewDiscovery.watcher,
    changes: previewDiscovery.changes,
  },
};

function previewCommand(commandId: string): CommandResult {
  return {
    commandId,
    label: 'Preview command',
    exitCode: 0,
    timedOut: false,
    stdout: 'RickPrime is running in browser preview mode. Launch the desktop app to execute allowlisted local commands.',
    stderr: '',
    ranAt: new Date().toISOString(),
  };
}

const browserPreviewBridge: DesktopBridge = {
  getSystemSnapshot: async () => previewSystem,
  getWorkspaceSummary: async () => previewWorkspace,
  getDiagnosticsSnapshot: async () => previewDiagnostics,
  getDiscoverySnapshot: async () => previewDiscovery,
  refreshDiscoverySnapshot: async () => previewDiscovery,
  getCompanySnapshot: async () => previewCompany,
  getProjects: async () => previewProjects,
  getResearchSnapshot: async () => previewResearch,
  getOllamaStatus: async () => previewOllama,
  getSettings: async () => previewSettings,
  saveSettings: async (settings) => ({ ...previewSettings, ...settings }),
  chat: async () => ({
    model: 'preview',
    content: 'This is a browser preview. RickPrime sends AI requests only through its local Electron bridge to a Docker-hosted Ollama runtime.',
  }),
  runCommand: async (commandId) => previewCommand(commandId),
  openDivision: async () => ({ opened: false, error: 'Division folders are available in the RickPrime desktop app.' }),
  openProject: async () => ({ opened: false, error: 'Project opening is available in the RickPrime desktop app.' }),
  openResearchProject: async () => ({ opened: false, error: 'AI Research project opening is available in the RickPrime desktop app.' }),
  openDiscoveredEntry: async () => ({ opened: false, error: 'Discovery handoff is available in the RickPrime desktop app.' }),
  launchProject: async () => ({ launched: false, label: 'Preview mode' }),
};

export const bridge: DesktopBridge = window.rickPrime ?? browserPreviewBridge;
export const isDesktopRuntime = window.rickPrime !== undefined;
