'use strict';

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { execFile, spawn } = require('node:child_process');
const fsSync = require('node:fs');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  DISCOVERY_SCHEMA_VERSION,
  compareInventory,
  resolveDiscoveredDirectory,
  scanWorkspace,
} = require('./discovery.cjs');
const {
  getCommandDefinitions,
  getCompanyAuthoritySources,
  getDivisionDefinitions,
  getProjectDefinitions,
  getResearchDefinitions,
} = require('./registry.cjs');
const {
  normalizeChatPayload,
  normalizeOllamaEndpoint,
  normalizeSettings,
} = require('./validation.cjs');

const DEFAULT_SETTINGS = Object.freeze({
  ollamaEndpoint: 'http://127.0.0.1:11434',
  selectedModel: 'gemma3:270m',
});

const WPAI_ROOT = process.env.RICKPRIME_WPAI_ROOT || (process.platform === 'win32' ? 'C:\\WPAI' : path.resolve(app.getAppPath(), '..', '..'));
const SOFTWARE_ROOT = path.join(WPAI_ROOT, 'Software');
const WORKSPACE_ROOT = path.join(WPAI_ROOT, 'Workspace');
const PROJECTS = getProjectDefinitions(WPAI_ROOT);
const RESEARCH_PROJECTS = getResearchDefinitions(WPAI_ROOT);
const DIVISIONS = getDivisionDefinitions(WPAI_ROOT);
const COMPANY_AUTHORITY_SOURCES = getCompanyAuthoritySources(WPAI_ROOT);
const COMMANDS = getCommandDefinitions(WPAI_ROOT);

let mainWindow = null;
let discoverySnapshot = null;
let discoveryRefreshPromise = null;
let discoveryWatcher = null;
let discoveryWatcherMode = 'polling';
let discoveryWatchEventsSinceScan = 0;
let discoveryLastWatchEventAt = null;
let discoveryRefreshTimer = null;
let previousCpuSample = null;

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'rickprime-settings.json');
}

function getDevServerUrl() {
  const argument = process.argv.find((value) => value.startsWith('--dev-server-url='));
  if (!argument) {
    return null;
  }

  try {
    const value = argument.slice('--dev-server-url='.length);
    const parsed = new URL(value);
    const localHost = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost' || parsed.hostname === '[::1]';
    return localHost && (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : null;
  } catch {
    return null;
  }
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function safeModifiedAt(target) {
  try {
    const stats = await fs.stat(target);
    return stats.mtime.toISOString();
  } catch {
    return null;
  }
}

function getDiscoveryBaselinePath() {
  return path.join(app.getPath('userData'), 'rickprime-discovery-baseline.json');
}

async function readDiscoveryBaseline() {
  try {
    const raw = await fs.readFile(getDiscoveryBaselinePath(), 'utf8');
    const parsed = JSON.parse(raw);
    if (
      parsed
      && parsed.schemaVersion === DISCOVERY_SCHEMA_VERSION
      && Array.isArray(parsed.fingerprints)
      && parsed.fingerprints.length <= 160000
      && parsed.fingerprints.every((fingerprint) => typeof fingerprint === 'string' && fingerprint.length <= 1024)
    ) {
      return parsed;
    }
  } catch {
    // A missing or malformed prior inventory simply establishes a new baseline.
  }
  return null;
}

async function saveDiscoveryBaseline(snapshot) {
  const target = getDiscoveryBaselinePath();
  const baseline = {
    schemaVersion: DISCOVERY_SCHEMA_VERSION,
    rootDirectory: snapshot.rootDirectory,
    scannedAt: snapshot.scannedAt,
    fingerprints: snapshot.fingerprints,
  };
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(baseline)}\n`, 'utf8');
  await fs.rename(temporary, target);
}

function publicDiscoverySnapshot(snapshot, changes) {
  const { fingerprints, ...publicSnapshot } = snapshot;
  return {
    ...publicSnapshot,
    watcher: {
      mode: discoveryWatcherMode,
      active: discoveryWatcherMode === 'native',
      eventsSinceScan: discoveryWatchEventsSinceScan,
      lastEventAt: discoveryLastWatchEventAt,
    },
    changes,
  };
}

async function refreshDiscoverySnapshot() {
  if (discoveryRefreshPromise) {
    return discoveryRefreshPromise;
  }

  discoveryRefreshPromise = (async () => {
    const snapshot = await scanWorkspace(WPAI_ROOT);
    const previous = await readDiscoveryBaseline();
    const changes = compareInventory(previous, snapshot);
    const publicSnapshot = publicDiscoverySnapshot(snapshot, changes);
    await saveDiscoveryBaseline(snapshot);
    discoverySnapshot = publicSnapshot;
    discoveryWatchEventsSinceScan = 0;
    return publicSnapshot;
  })();

  try {
    return await discoveryRefreshPromise;
  } finally {
    discoveryRefreshPromise = null;
  }
}

async function getDiscoverySnapshot() {
  if (discoverySnapshot && discoveryWatcherMode === 'native') {
    return discoverySnapshot;
  }
  if (discoverySnapshot) {
    const scannedAt = Date.parse(discoverySnapshot.scannedAt);
    if (Number.isFinite(scannedAt) && Date.now() - scannedAt < 25000) {
      return discoverySnapshot;
    }
  }
  return refreshDiscoverySnapshot();
}

function scheduleDiscoveryRefresh() {
  if (discoveryRefreshTimer) {
    clearTimeout(discoveryRefreshTimer);
  }
  discoveryRefreshTimer = setTimeout(() => {
    discoveryRefreshTimer = null;
    void refreshDiscoverySnapshot().catch(() => {
      // The regular renderer poll remains a recovery path if a watch refresh fails.
    });
  }, 700);
}

function startDiscoveryWatcher() {
  if (discoveryWatcher || discoveryWatcherMode === 'native') return;
  try {
    discoveryWatcher = fsSync.watch(WPAI_ROOT, { recursive: process.platform === 'win32' }, () => {
      discoveryWatchEventsSinceScan += 1;
      discoveryLastWatchEventAt = new Date().toISOString();
      scheduleDiscoveryRefresh();
    });
    discoveryWatcherMode = 'native';
    discoveryWatcher.on('error', () => {
      discoveryWatcher?.close();
      discoveryWatcher = null;
      discoveryWatcherMode = 'polling';
    });
  } catch {
    discoveryWatcher = null;
    discoveryWatcherMode = 'polling';
  }
}

function stopDiscoveryWatcher() {
  if (discoveryRefreshTimer) {
    clearTimeout(discoveryRefreshTimer);
    discoveryRefreshTimer = null;
  }
  discoveryWatcher?.close();
  discoveryWatcher = null;
  discoveryWatcherMode = 'polling';
}

function execute(executable, args, options = {}) {
  const timeoutMs = options.timeoutMs ?? 10000;
  return new Promise((resolve) => {
    let settled = false;
    const child = execFile(
      executable,
      args,
      {
        cwd: options.cwd,
        windowsHide: true,
        shell: false,
        timeout: timeoutMs,
        maxBuffer: 512 * 1024,
      },
      (error, stdout, stderr) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve({
          exitCode: typeof error?.code === 'number' ? error.code : error ? 1 : 0,
          stdout: String(stdout ?? ''),
          stderr: String(stderr ?? ''),
          timedOut: error?.killed === true,
        });
      },
    );

    child.once('error', (error) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve({ exitCode: 1, stdout: '', stderr: error.message, timedOut: false });
    });
  });
}

async function inspectProject(project) {
  const exists = await pathExists(project.directory);
  if (!exists) {
    return { ...project, exists: false, git: null };
  }

  const result = await execute('git', ['status', '--short', '--branch'], { cwd: project.directory, timeoutMs: 5000 });
  if (result.exitCode !== 0) {
    return { ...project, exists: true, git: null };
  }

  const lines = result.stdout.split(/\r?\n/).filter(Boolean);
  const branchLine = lines.find((line) => line.startsWith('## '));
  const branch = branchLine ? branchLine.slice(3).split('...')[0] : null;
  const changedFiles = lines.filter((line) => !line.startsWith('## ')).length;

  return {
    ...project,
    exists: true,
    git: { branch, changedFiles },
  };
}

async function getProjects() {
  return Promise.all(PROJECTS.map(inspectProject));
}

async function inspectSource(sourceDefinition) {
  const [available, modifiedAt] = await Promise.all([
    pathExists(sourceDefinition.path),
    safeModifiedAt(sourceDefinition.path),
  ]);
  return {
    label: sourceDefinition.label,
    relativePath: sourceDefinition.relativePath,
    available,
    modifiedAt,
  };
}

async function inspectResearchProject(researchProject) {
  const [exists, sourceDocuments] = await Promise.all([
    pathExists(researchProject.directory),
    Promise.all(researchProject.sourceDocuments.map(inspectSource)),
  ]);

  return {
    ...researchProject,
    exists,
    sourceDocuments,
  };
}

async function getResearchSnapshot() {
  const projects = await Promise.all(RESEARCH_PROJECTS.map(inspectResearchProject));
  const sourceDocuments = projects.flatMap((project) => project.sourceDocuments);
  return {
    rootDirectory: path.join(WPAI_ROOT, 'AI-Research'),
    projects,
    summary: {
      registeredProjects: projects.length,
      detectedProjects: projects.filter((project) => project.exists).length,
      sourceDocumentsAvailable: sourceDocuments.filter((document) => document.available).length,
      sourceDocumentsTotal: sourceDocuments.length,
      needsVerification: projects.filter((project) => project.statusState === 'needs-verification').length,
      researchSynthesis: projects.filter((project) => project.statusState === 'research-synthesis').length,
      statusControls: projects.filter((project) => project.integrationMode === 'status-control').length,
    },
  };
}

async function inspectDivision(division) {
  const [exists, sourceDocuments, supplementalSignal] = await Promise.all([
    pathExists(division.directory),
    Promise.all(division.sourceDocuments.map(inspectSource)),
    division.supplementalSignal ? inspectSource(division.supplementalSignal) : Promise.resolve(null),
  ]);

  return {
    id: division.id,
    label: division.label,
    category: division.category,
    directory: division.directory,
    description: division.description,
    phase: division.phase,
    phaseLabel: division.phaseLabel,
    statusState: division.statusState,
    statusLabel: division.statusLabel,
    statusNote: division.statusNote,
    activationGate: division.activationGate,
    operatingBoundary: division.operatingBoundary,
    exists,
    sourceDocuments,
    supplementalSignal,
  };
}

async function getCompanySnapshot() {
  const [divisions, authoritySources] = await Promise.all([
    Promise.all(DIVISIONS.map(inspectDivision)),
    Promise.all(COMPANY_AUTHORITY_SOURCES.map(inspectSource)),
  ]);
  const sourceDocuments = divisions.flatMap((division) => division.sourceDocuments);

  return {
    rootDirectory: WPAI_ROOT,
    authoritySources,
    divisions,
    summary: {
      registeredDivisions: divisions.length,
      detectedDivisions: divisions.filter((division) => division.exists).length,
      activeDivisions: divisions.filter((division) => division.exists && division.phase === 'active').length,
      sourceDocumentsAvailable: sourceDocuments.filter((document) => document.available).length,
      sourceDocumentsTotal: sourceDocuments.length,
      needsVerification: divisions.filter((division) => division.statusState === 'needs-verification').length,
      directorDecisions: divisions.filter((division) => division.statusState === 'director-decision').length,
    },
  };
}

async function readSettings() {
  try {
    const raw = await fs.readFile(getSettingsPath(), 'utf8');
    return normalizeSettings(JSON.parse(raw), DEFAULT_SETTINGS);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function saveSettings(value) {
  const settings = normalizeSettings(value, DEFAULT_SETTINGS);
  const target = getSettingsPath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  await fs.rename(temporary, target);
  return settings;
}

async function fetchJson(url, options = {}, timeoutMs = 7000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const body = await response.text();
    let data = null;
    try {
      data = body ? JSON.parse(body) : null;
    } catch {
      throw new Error('The local Ollama runtime returned malformed JSON.');
    }
    if (!response.ok) {
      const detail = data && typeof data.error === 'string' ? data.error : `HTTP ${response.status}`;
      throw new Error(`Ollama request failed: ${detail}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

async function getOllamaStatus() {
  const settings = await readSettings();
  try {
    const response = await fetchJson(`${settings.ollamaEndpoint}/api/tags`);
    const models = Array.isArray(response?.models)
      ? response.models
          .filter((model) => model && typeof model.name === 'string')
          .map((model) => ({
            name: model.name,
            size: typeof model.size === 'number' ? model.size : null,
            modifiedAt: typeof model.modified_at === 'string' ? model.modified_at : null,
          }))
      : [];
    return { online: true, endpoint: settings.ollamaEndpoint, models, error: null };
  } catch (error) {
    return {
      online: false,
      endpoint: settings.ollamaEndpoint,
      models: [],
      error: error instanceof Error ? error.message : 'The local Ollama runtime is unavailable.',
    };
  }
}

async function getWorkspaceSummary() {
  const wpaiState = path.join(WORKSPACE_ROOT, '.wpai');
  const approvalsDirectory = path.join(wpaiState, 'approvals');
  const journalDirectory = path.join(WORKSPACE_ROOT, '.hellforge', 'journals');

  const countFiles = async (directory) => {
    try {
      return (await fs.readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile()).length;
    } catch {
      return 0;
    }
  };

  return {
    controlPlaneAvailable: await pathExists(wpaiState),
    controlPlaneUpdatedAt: await safeModifiedAt(path.join(wpaiState, 'BLACKBOARD.json')),
    approvalFileCount: await countFiles(approvalsDirectory),
    journalFileCount: await countFiles(journalDirectory),
  };
}

function asSafeNumber(value) {
  if (typeof value === 'bigint') {
    return value > BigInt(Number.MAX_SAFE_INTEGER) ? Number.MAX_SAFE_INTEGER : Number(value);
  }
  return Number.isFinite(value) ? value : 0;
}

function getCpuUsagePercent() {
  const current = os.cpus().reduce((total, cpu) => {
    const times = cpu.times;
    return {
      idle: total.idle + times.idle,
      total: total.total + times.user + times.nice + times.sys + times.idle + times.irq,
    };
  }, { idle: 0, total: 0 });

  const previous = previousCpuSample;
  previousCpuSample = current;
  if (!previous || current.total <= previous.total) return null;

  const totalDelta = current.total - previous.total;
  const idleDelta = current.idle - previous.idle;
  return Math.max(0, Math.min(100, Math.round((1 - (idleDelta / totalDelta)) * 1000) / 10));
}

async function getStorageDiagnostics() {
  try {
    const stats = await fs.statfs(WPAI_ROOT);
    const blockSize = asSafeNumber(stats.bsize);
    const totalBytes = asSafeNumber(stats.blocks) * blockSize;
    const freeBytes = asSafeNumber(stats.bavail) * blockSize;
    return {
      available: totalBytes > 0,
      totalBytes,
      freeBytes,
      usedBytes: Math.max(0, totalBytes - freeBytes),
      error: totalBytes > 0 ? null : 'Storage statistics were not supplied by this host.',
    };
  } catch {
    return {
      available: false,
      totalBytes: null,
      freeBytes: null,
      usedBytes: null,
      error: 'Storage statistics are unavailable on this host.',
    };
  }
}

async function getDockerDiagnostics() {
  const result = await execute('docker', ['ps', '--format', '{{.Names}}\t{{.Status}}\t{{.Image}}'], { timeoutMs: 7000 });
  if (result.exitCode !== 0 || result.timedOut) {
    return {
      available: false,
      runningContainers: 0,
      ollamaContainerDetected: false,
      containers: [],
      error: 'Docker status is unavailable or did not respond in time.',
    };
  }

  const containers = result.stdout
    .split(/\r?\n/)
    .filter(Boolean)
    .slice(0, 40)
    .map((line) => {
      const [name = 'unnamed', status = 'unknown', image = 'unknown'] = line.split('\t');
      return {
        name: name.slice(0, 120),
        status: status.slice(0, 180),
        image: image.slice(0, 180),
      };
    });

  return {
    available: true,
    runningContainers: containers.length,
    ollamaContainerDetected: containers.some((container) => /ollama/i.test(`${container.name} ${container.image}`)),
    containers,
    error: null,
  };
}

async function getSystemSnapshot() {
  const cpus = os.cpus();
  const interfaces = Object.values(os.networkInterfaces()).flat().filter(Boolean);
  const processMemory = process.memoryUsage();
  return {
    hostname: os.hostname(),
    platform: `${os.platform()} ${os.release()}`,
    architecture: os.arch(),
    cpuCount: cpus.length,
    cpuModel: cpus[0]?.model ?? 'Unknown CPU',
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptimeSeconds: os.uptime(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    cpuUsagePercent: getCpuUsagePercent(),
    processMemoryBytes: processMemory.rss,
    activeNetworkInterfaceCount: interfaces.filter((entry) => !entry.internal).length,
  };
}

async function getDiagnosticsSnapshot() {
  const [system, workspace, storage, docker, ollama, discovery] = await Promise.all([
    getSystemSnapshot(),
    getWorkspaceSummary(),
    getStorageDiagnostics(),
    getDockerDiagnostics(),
    getOllamaStatus(),
    getDiscoverySnapshot(),
  ]);

  return {
    capturedAt: new Date().toISOString(),
    system,
    workspace,
    storage,
    docker,
    ollama,
    discovery: {
      available: discovery.available,
      scannedAt: discovery.scannedAt,
      watcher: discovery.watcher,
      summary: discovery.summary,
      changes: discovery.changes,
    },
  };
}

function resolveProject(projectId) {
  return PROJECTS.find((project) => project.id === projectId) ?? null;
}

function resolveResearchProject(projectId) {
  return RESEARCH_PROJECTS.find((project) => project.id === projectId) ?? null;
}

function resolveDivision(divisionId) {
  return DIVISIONS.find((division) => division.id === divisionId) ?? null;
}

function trimCommandOutput(value) {
  const maxLength = 48000;
  return value.length > maxLength ? `${value.slice(0, maxLength)}\n\n[Output truncated by RickPrime]` : value;
}

async function runControlCommand(commandId) {
  const command = COMMANDS[commandId];
  if (!command) {
    throw new Error('Unknown RickPrime command. Only the listed safe commands can run.');
  }
  if (!(await pathExists(command.cwd))) {
    throw new Error(`The required project directory is unavailable: ${command.cwd}`);
  }

  const result = await execute(command.executable, command.args, command);
  return {
    commandId: command.id,
    label: command.label,
    exitCode: result.exitCode,
    timedOut: result.timedOut,
    stdout: trimCommandOutput(result.stdout),
    stderr: trimCommandOutput(result.stderr),
    ranAt: new Date().toISOString(),
  };
}

async function openDiscoveredEntry(entryId) {
  if (typeof entryId !== 'string' || entryId.length === 0 || entryId.length > 768) {
    throw new Error('Invalid discovery entry request.');
  }

  const snapshot = await getDiscoverySnapshot();
  const entry = snapshot.entries.find((candidate) => candidate.id === entryId);
  const requestedPath = resolveDiscoveredDirectory(WPAI_ROOT, entry);
  if (!requestedPath) {
    throw new Error('That discovery entry is unavailable or outside the WPAI workspace boundary.');
  }

  let stats;
  let physicalPath;
  try {
    stats = await fs.lstat(requestedPath);
    physicalPath = await fs.realpath(requestedPath);
  } catch {
    throw new Error('That discovery entry is no longer available. Refresh the array and try again.');
  }
  if (!stats.isDirectory() || stats.isSymbolicLink() || !isWithinRoot(WPAI_ROOT, physicalPath)) {
    throw new Error('That discovery entry does not satisfy the RickPrime workspace safety boundary.');
  }

  const errorMessage = await shell.openPath(physicalPath);
  return { opened: errorMessage.length === 0, error: errorMessage || null };
}

function launchDetached(executable, args, cwd) {
  const child = spawn(executable, args, {
    cwd,
    detached: true,
    windowsHide: true,
    stdio: 'ignore',
    shell: false,
  });
  child.unref();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1580,
    height: 960,
    minWidth: 1120,
    minHeight: 720,
    show: false,
    backgroundColor: '#080b14',
    title: 'RickPrime // WPAI Workstation',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const devUrl = getDevServerUrl();
    if (url !== devUrl && !url.startsWith('file:')) {
      event.preventDefault();
    }
  });

  const devServerUrl = getDevServerUrl();
  if (devServerUrl) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }
}

function registerIpcHandlers() {
  ipcMain.handle('rickprime:get-system-snapshot', getSystemSnapshot);
  ipcMain.handle('rickprime:get-workspace-summary', getWorkspaceSummary);
  ipcMain.handle('rickprime:get-diagnostics-snapshot', getDiagnosticsSnapshot);
  ipcMain.handle('rickprime:get-discovery-snapshot', getDiscoverySnapshot);
  ipcMain.handle('rickprime:refresh-discovery-snapshot', refreshDiscoverySnapshot);
  ipcMain.handle('rickprime:get-company-snapshot', getCompanySnapshot);
  ipcMain.handle('rickprime:get-projects', getProjects);
  ipcMain.handle('rickprime:get-research-snapshot', getResearchSnapshot);
  ipcMain.handle('rickprime:get-ollama-status', getOllamaStatus);
  ipcMain.handle('rickprime:get-settings', readSettings);
  ipcMain.handle('rickprime:save-settings', (_event, settings) => saveSettings(settings));
  ipcMain.handle('rickprime:run-command', (_event, commandId) => runControlCommand(commandId));
  ipcMain.handle('rickprime:open-project', async (_event, projectId) => {
    const project = resolveProject(projectId);
    if (!project || !(await pathExists(project.directory))) {
      throw new Error('That project is unavailable on this workstation.');
    }
    const errorMessage = await shell.openPath(project.directory);
    return { opened: errorMessage.length === 0, error: errorMessage || null };
  });
  ipcMain.handle('rickprime:open-division', async (_event, divisionId) => {
    const division = resolveDivision(divisionId);
    if (!division || !(await pathExists(division.directory))) {
      throw new Error('That registered WPAI division is unavailable on this workstation.');
    }
    const errorMessage = await shell.openPath(division.directory);
    return { opened: errorMessage.length === 0, error: errorMessage || null };
  });
  ipcMain.handle('rickprime:open-research-project', async (_event, projectId) => {
    const project = resolveResearchProject(projectId);
    if (!project || !(await pathExists(project.directory))) {
      throw new Error('That registered AI Research project is unavailable on this workstation.');
    }
    const errorMessage = await shell.openPath(project.directory);
    return { opened: errorMessage.length === 0, error: errorMessage || null };
  });
  ipcMain.handle('rickprime:open-discovered-entry', async (_event, entryId) => openDiscoveredEntry(entryId));
  ipcMain.handle('rickprime:launch-project', async (_event, projectId) => {
    const project = resolveProject(projectId);
    if (!project || !project.launch || !(await pathExists(project.directory))) {
      throw new Error('That project does not have a registered RickPrime launcher.');
    }
    if (project.launch === 'hellforge') {
      launchDetached(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['start'], project.directory);
      return { launched: true, label: project.label };
    }
    throw new Error('The registered launcher is invalid.');
  });
  ipcMain.handle('rickprime:chat', async (_event, payload) => {
    const chat = normalizeChatPayload(payload);
    if (!chat) {
      throw new Error('Invalid chat request. Choose a local model and provide concise messages.');
    }
    const settings = await readSettings();
    const response = await fetchJson(
      `${settings.ollamaEndpoint}/api/chat`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ model: chat.model, messages: chat.messages, stream: false, options: { num_predict: 768 } }),
      },
      90000,
    );
    const content = response?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('The local model returned an empty response.');
    }
    return { model: typeof response.model === 'string' ? response.model : chat.model, content: content.trim() };
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.wpaistudio.rickprime');
  registerIpcHandlers();
  startDiscoveryWatcher();
  void refreshDiscoverySnapshot().catch(() => {
    // The renderer's interval will retry a failed initial inventory scan.
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', stopDiscoveryWatcher);
