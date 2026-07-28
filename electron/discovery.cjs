'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const DISCOVERY_SCHEMA_VERSION = 2;

/**
 * Discovery is intentionally metadata-only. RickPrime needs a broad view of
 * WPAI without turning the renderer into a document reader, a secret index,
 * or an arbitrary filesystem browser. These limits keep generated trees from
 * making a workstation refresh unpredictable.
 */
const DEFAULT_DISCOVERY_LIMITS = Object.freeze({
  maxDepth: 24,
  maxDirectories: 12000,
  maxEntries: 100000,
  maxProjectCandidates: 500,
  maxCollectionChildren: 96,
});

const IGNORED_DIRECTORY_NAMES = new Set([
  '.git', '.next', '.nuxt', '.cache', '.turbo', '.venv', '.pytest_cache',
  '.mypy_cache', '.gradle', '.idea', '.vscode', 'node_modules',
  'bower_components', 'vendor', 'dist', 'dist-desktop', 'build', 'out',
  'target', 'coverage', '__pycache__', 'bin', 'obj', 'pods', 'deriveddata',
]);

const PROTECTED_FILE_EXTENSIONS = new Set([
  '.pem', '.key', '.pfx', '.p12', '.kdbx', '.jks', '.keystore', '.crt', '.cer',
]);

const PROJECT_MARKERS = Object.freeze([
  { names: ['.git'], label: 'Git repository' },
  { names: ['package.json'], label: 'Node workspace' },
  { names: ['pyproject.toml', 'requirements.txt', 'setup.py'], label: 'Python workspace' },
  { names: ['cargo.toml'], label: 'Rust workspace' },
  { names: ['pom.xml', 'build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts'], label: 'JVM workspace' },
  { names: ['*.sln', '*.csproj'], label: '.NET workspace' },
  { names: ['go.mod'], label: 'Go workspace' },
  { names: ['readme.md', 'agents.md', 'claude.md', 'spec.md', 'architecture.md'], label: 'Documented workspace' },
]);

function normalizeLimits(limits = {}) {
  const normalized = {};
  for (const [key, fallback] of Object.entries(DEFAULT_DISCOVERY_LIMITS)) {
    const value = Number(limits[key]);
    normalized[key] = Number.isInteger(value) && value > 0 ? Math.min(value, fallback * 4) : fallback;
  }
  return normalized;
}

function toRelativePath(value) {
  return value === '' ? '.' : value.split(path.sep).join('/');
}

function isWithinRoot(rootDirectory, candidatePath) {
  const root = path.resolve(rootDirectory);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isProtectedName(name) {
  const lower = name.toLowerCase();
  if (name.startsWith('.')) return true;
  if (lower === 'id_rsa' || lower === 'id_dsa' || lower === 'id_ecdsa' || lower === 'id_ed25519') return true;
  if (lower === '.env' || lower.startsWith('.env.')) return true;
  if (PROTECTED_FILE_EXTENSIONS.has(path.extname(lower))) return true;
  return /(?:^|[._-])(secret|secrets|credential|credentials|password|token|api[-_]?key|private[-_]?key)(?:[._-]|$)/i.test(lower);
}

function shouldSkipDirectory(name) {
  return name.startsWith('.') || IGNORED_DIRECTORY_NAMES.has(name.toLowerCase()) || isProtectedName(name);
}

function hasMarkerName(markerName, childNames) {
  if (markerName.startsWith('*.')) {
    return [...childNames].some((name) => name.endsWith(markerName.slice(1)));
  }
  return childNames.has(markerName);
}

function collectMarkers(childNames) {
  return PROJECT_MARKERS
    .filter((marker) => marker.names.some((name) => hasMarkerName(name, childNames)))
    .map((marker) => marker.label);
}

function shouldFingerprintFile(name, parentDepth) {
  const lower = name.toLowerCase();
  if (parentDepth <= 1) return true;
  if (PROJECT_MARKERS.some((marker) => marker.names.some((markerName) => markerName === lower || (markerName.startsWith('*.') && lower.endsWith(markerName.slice(1)))))) {
    return true;
  }
  return false;
}

function entryId(relativePath) {
  return `directory:${relativePath}`;
}

function classifyDirectory(depth, markers) {
  if (depth === 0) return 'WPAI root';
  if (depth === 1) return 'Company area';
  if (markers.some((marker) => marker !== 'Documented workspace')) return 'Detected workspace';
  if (markers.includes('Documented workspace')) return 'Documented folder';
  return 'Directory';
}

function newScanResult(rootDirectory, limits) {
  return {
    schemaVersion: DISCOVERY_SCHEMA_VERSION,
    rootDirectory,
    scannedAt: new Date().toISOString(),
    available: false,
    entries: [],
    projectCandidates: [],
    fingerprints: [],
    hardLimitReached: false,
    summary: {
      directoriesDetected: 0,
      filesObserved: 0,
      projectCandidates: 0,
      protectedEntriesExcluded: 0,
      ignoredDirectories: 0,
      denseCollectionsSkipped: 0,
      skippedSymlinks: 0,
      unreadableDirectories: 0,
      truncated: false,
      truncationReason: null,
      maxDepth: limits.maxDepth,
      maxDirectories: limits.maxDirectories,
      maxEntries: limits.maxEntries,
    },
  };
}

function markTruncated(result, reason, hardLimit = false) {
  if (!result.summary.truncated || hardLimit) {
    result.summary.truncated = true;
    result.summary.truncationReason = reason;
  }
  if (hardLimit) result.hardLimitReached = true;
}

function recordFingerprint(result, kind, relativePath, limits) {
  if (result.fingerprints.length >= limits.maxEntries) {
    markTruncated(result, `Inventory cap reached at ${limits.maxEntries.toLocaleString()} safe entries.`, true);
    return false;
  }
  result.fingerprints.push(`${kind}:${relativePath}`);
  return true;
}

async function scanWorkspace(rootDirectory, options = {}) {
  const limits = normalizeLimits(options.limits);
  const initialRoot = path.resolve(rootDirectory);
  const result = newScanResult(initialRoot, limits);

  let workspaceRoot;
  try {
    workspaceRoot = await fs.realpath(initialRoot);
  } catch {
    delete result.hardLimitReached;
    return result;
  }

  result.rootDirectory = workspaceRoot;
  result.available = true;
  const pending = [{ absolutePath: workspaceRoot, relativePath: '.', depth: 0 }];

  for (let cursor = 0; cursor < pending.length; cursor += 1) {
    if (result.summary.directoriesDetected >= limits.maxDirectories) {
      markTruncated(result, `Directory cap reached at ${limits.maxDirectories.toLocaleString()} directories.`, true);
      break;
    }
    if (result.hardLimitReached) break;

    const current = pending[cursor];
    let children;
    try {
      children = await fs.readdir(current.absolutePath, { withFileTypes: true });
    } catch {
      result.summary.unreadableDirectories += 1;
      continue;
    }

    const childNames = new Set(children.map((child) => child.name.toLowerCase()));
    const markers = collectMarkers(childNames);
    const visibleDirectories = [];
    let visibleFileCount = 0;

    for (const child of children) {
      if (child.isSymbolicLink()) {
        result.summary.skippedSymlinks += 1;
        continue;
      }

      const childRelative = current.relativePath === '.'
        ? toRelativePath(child.name)
        : `${current.relativePath}/${toRelativePath(child.name)}`;

      if (child.isDirectory()) {
        if (shouldSkipDirectory(child.name)) {
          if (isProtectedName(child.name)) result.summary.protectedEntriesExcluded += 1;
          else result.summary.ignoredDirectories += 1;
          continue;
        }
        visibleDirectories.push({
          absolutePath: path.join(current.absolutePath, child.name),
          relativePath: childRelative,
          depth: current.depth + 1,
        });
        continue;
      }

      if (child.isFile()) {
        if (isProtectedName(child.name)) {
          result.summary.protectedEntriesExcluded += 1;
          continue;
        }
        visibleFileCount += 1;
        result.summary.filesObserved += 1;
        if (shouldFingerprintFile(child.name, current.depth) && !recordFingerprint(result, 'file', childRelative, limits)) break;
      }
    }

    if (result.hardLimitReached) break;
    if (!recordFingerprint(result, 'directory', current.relativePath, limits)) break;

    const entry = {
      id: entryId(current.relativePath),
      relativePath: current.relativePath,
      label: current.relativePath === '.' ? path.basename(workspaceRoot) : path.basename(current.absolutePath),
      depth: current.depth,
      classification: classifyDirectory(current.depth, markers),
      markers,
      directDirectoryCount: visibleDirectories.length,
      directFileCount: visibleFileCount,
    };
    result.entries.push(entry);
    result.summary.directoriesDetected += 1;

    if (markers.length > 0 && current.depth <= 4 && result.projectCandidates.length < limits.maxProjectCandidates) {
      result.projectCandidates.push(entry);
    }

    if (current.depth >= 2 && visibleDirectories.length > limits.maxCollectionChildren) {
      result.summary.denseCollectionsSkipped += 1;
      continue;
    }

    if (current.depth >= limits.maxDepth) {
      if (visibleDirectories.length > 0) markTruncated(result, `Depth cap reached at ${limits.maxDepth} levels.`);
      continue;
    }

    for (const directory of visibleDirectories) {
      pending.push(directory);
    }
  }

  result.projectCandidates.sort((left, right) => left.depth - right.depth || left.relativePath.localeCompare(right.relativePath));
  result.summary.projectCandidates = result.projectCandidates.length;
  result.fingerprints.sort();
  delete result.hardLimitReached;
  return result;
}

function fingerprintToChange(fingerprint) {
  const separator = fingerprint.indexOf(':');
  return {
    kind: fingerprint.slice(0, separator),
    relativePath: fingerprint.slice(separator + 1),
  };
}

function compareInventory(previous, current, sampleLimit = 48) {
  if (!previous || previous.schemaVersion !== DISCOVERY_SCHEMA_VERSION || !Array.isArray(previous.fingerprints)) {
    return {
      baselineState: 'initialized',
      addedCount: 0,
      removedCount: 0,
      added: [],
      removed: [],
    };
  }

  const prior = new Set(previous.fingerprints);
  const next = new Set(current.fingerprints);
  const added = current.fingerprints.filter((fingerprint) => !prior.has(fingerprint));
  const removed = previous.fingerprints.filter((fingerprint) => !next.has(fingerprint));

  return {
    baselineState: 'compared',
    addedCount: added.length,
    removedCount: removed.length,
    added: added.slice(0, sampleLimit).map(fingerprintToChange),
    removed: removed.slice(0, sampleLimit).map(fingerprintToChange),
  };
}

function resolveDiscoveredDirectory(rootDirectory, discoveryEntry) {
  if (!discoveryEntry || typeof discoveryEntry.relativePath !== 'string') return null;
  if (discoveryEntry.relativePath !== '.' && discoveryEntry.relativePath.trim() === '') return null;
  const candidate = discoveryEntry.relativePath === '.'
    ? path.resolve(rootDirectory)
    : path.resolve(rootDirectory, discoveryEntry.relativePath);
  return isWithinRoot(rootDirectory, candidate) ? candidate : null;
}

module.exports = {
  DEFAULT_DISCOVERY_LIMITS,
  DISCOVERY_SCHEMA_VERSION,
  compareInventory,
  entryId,
  isProtectedName,
  isWithinRoot,
  resolveDiscoveredDirectory,
  scanWorkspace,
};
