export type ViewId = 'command' | 'atlas' | 'fleet' | 'knowledge' | 'research' | 'neural' | 'operations' | 'sentinel' | 'systems';

export type DivisionPhase = 'active' | 'support' | 'pre-work' | 'deferred' | 'review' | 'runtime' | 'archive';

export type EvidenceState = 'verified' | 'director-decision' | 'needs-verification' | 'research-synthesis';

export interface SystemSnapshot {
  hostname: string;
  platform: string;
  architecture: string;
  cpuCount: number;
  cpuModel: string;
  totalMemory: number;
  freeMemory: number;
  uptimeSeconds: number;
  electronVersion: string;
  nodeVersion: string;
  cpuUsagePercent: number | null;
  processMemoryBytes: number;
  activeNetworkInterfaceCount: number;
}

export interface WorkspaceSummary {
  controlPlaneAvailable: boolean;
  controlPlaneUpdatedAt: string | null;
  approvalFileCount: number;
  journalFileCount: number;
}

export interface DiscoveryEntry {
  id: string;
  relativePath: string;
  label: string;
  depth: number;
  classification: string;
  markers: string[];
  directDirectoryCount: number;
  directFileCount: number;
}

export interface DiscoverySummary {
  directoriesDetected: number;
  filesObserved: number;
  projectCandidates: number;
  protectedEntriesExcluded: number;
  ignoredDirectories: number;
  denseCollectionsSkipped: number;
  skippedSymlinks: number;
  unreadableDirectories: number;
  truncated: boolean;
  truncationReason: string | null;
  maxDepth: number;
  maxDirectories: number;
  maxEntries: number;
}

export interface DiscoveryChange {
  kind: 'directory' | 'file';
  relativePath: string;
}

export interface DiscoverySnapshot {
  schemaVersion: number;
  rootDirectory: string;
  scannedAt: string;
  available: boolean;
  entries: DiscoveryEntry[];
  projectCandidates: DiscoveryEntry[];
  summary: DiscoverySummary;
  watcher: {
    mode: 'native' | 'polling';
    active: boolean;
    eventsSinceScan: number;
    lastEventAt: string | null;
  };
  changes: {
    baselineState: 'initialized' | 'compared';
    addedCount: number;
    removedCount: number;
    added: DiscoveryChange[];
    removed: DiscoveryChange[];
  };
}

export interface StorageDiagnostics {
  available: boolean;
  totalBytes: number | null;
  freeBytes: number | null;
  usedBytes: number | null;
  error: string | null;
}

export interface DockerContainerDiagnostic {
  name: string;
  status: string;
  image: string;
}

export interface DockerDiagnostics {
  available: boolean;
  runningContainers: number;
  ollamaContainerDetected: boolean;
  containers: DockerContainerDiagnostic[];
  error: string | null;
}

export interface DiagnosticsSnapshot {
  capturedAt: string;
  system: SystemSnapshot;
  workspace: WorkspaceSummary;
  storage: StorageDiagnostics;
  docker: DockerDiagnostics;
  ollama: OllamaStatus;
  discovery: Omit<DiscoverySnapshot, 'entries' | 'projectCandidates' | 'rootDirectory' | 'schemaVersion'>;
}

export interface SourceDocumentStatus {
  label: string;
  relativePath: string;
  available: boolean;
  modifiedAt: string | null;
}

export interface DivisionStatus {
  id: string;
  label: string;
  category: string;
  directory: string;
  description: string;
  phase: DivisionPhase;
  phaseLabel: string;
  statusState: EvidenceState;
  statusLabel: string;
  statusNote: string;
  activationGate: string;
  operatingBoundary: string;
  exists: boolean;
  sourceDocuments: SourceDocumentStatus[];
  supplementalSignal: SourceDocumentStatus | null;
}

export interface CompanySnapshot {
  rootDirectory: string;
  authoritySources: SourceDocumentStatus[];
  divisions: DivisionStatus[];
  summary: {
    registeredDivisions: number;
    detectedDivisions: number;
    activeDivisions: number;
    sourceDocumentsAvailable: number;
    sourceDocumentsTotal: number;
    needsVerification: number;
    directorDecisions: number;
  };
}

export interface ProjectStatus {
  id: string;
  label: string;
  group: string;
  directory: string;
  description: string;
  launch: 'hellforge' | null;
  parked: boolean;
  exists: boolean;
  git: { branch: string | null; changedFiles: number } | null;
}

export type ResearchIntegrationMode = 'knowledge-source' | 'status-control' | 'source-map';

export interface ResearchProjectStatus {
  id: string;
  label: string;
  category: string;
  directory: string;
  description: string;
  phaseLabel: string;
  statusState: EvidenceState;
  statusLabel: string;
  statusNote: string;
  activationGate: string;
  operatingBoundary: string;
  integrationMode: ResearchIntegrationMode;
  tags: string[];
  capabilities: string[];
  exists: boolean;
  sourceDocuments: SourceDocumentStatus[];
}

export interface ResearchSnapshot {
  rootDirectory: string;
  projects: ResearchProjectStatus[];
  summary: {
    registeredProjects: number;
    detectedProjects: number;
    sourceDocumentsAvailable: number;
    sourceDocumentsTotal: number;
    needsVerification: number;
    researchSynthesis: number;
    statusControls: number;
  };
}

export interface OllamaModel {
  name: string;
  size: number | null;
  modifiedAt: string | null;
}

export interface OllamaStatus {
  online: boolean;
  endpoint: string;
  models: OllamaModel[];
  error: string | null;
}

export interface RickPrimeSettings {
  ollamaEndpoint: string;
  selectedModel: string;
}

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface CommandResult {
  commandId: string;
  label: string;
  exitCode: number;
  timedOut: boolean;
  stdout: string;
  stderr: string;
  ranAt: string;
}

export interface DesktopBridge {
  getSystemSnapshot(): Promise<SystemSnapshot>;
  getWorkspaceSummary(): Promise<WorkspaceSummary>;
  getDiagnosticsSnapshot(): Promise<DiagnosticsSnapshot>;
  getDiscoverySnapshot(): Promise<DiscoverySnapshot>;
  refreshDiscoverySnapshot(): Promise<DiscoverySnapshot>;
  getCompanySnapshot(): Promise<CompanySnapshot>;
  getProjects(): Promise<ProjectStatus[]>;
  getResearchSnapshot(): Promise<ResearchSnapshot>;
  getOllamaStatus(): Promise<OllamaStatus>;
  getSettings(): Promise<RickPrimeSettings>;
  saveSettings(settings: RickPrimeSettings): Promise<RickPrimeSettings>;
  chat(payload: { model: string; messages: Array<Pick<ChatMessage, 'role' | 'content'>> }): Promise<{ model: string; content: string }>;
  runCommand(commandId: string): Promise<CommandResult>;
  openDivision(divisionId: string): Promise<{ opened: boolean; error: string | null }>;
  openProject(projectId: string): Promise<{ opened: boolean; error: string | null }>;
  openResearchProject(projectId: string): Promise<{ opened: boolean; error: string | null }>;
  openDiscoveredEntry(entryId: string): Promise<{ opened: boolean; error: string | null }>;
  launchProject(projectId: string): Promise<{ launched: boolean; label: string }>;
}

declare global {
  interface Window {
    rickPrime?: DesktopBridge;
  }
}
