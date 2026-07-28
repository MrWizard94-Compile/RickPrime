# RickPrime Architecture

## Intent

RickPrime is WPAI's local-first workstation integration layer. It consolidates visibility, provenance, deterministic knowledge workflows, and carefully bounded handoffs without flattening the portfolio into one repository or weakening the existing ownership, approval, and runtime boundaries.

The current architecture makes two substantive integrations:

- The useful context-bundle, provenance, and local-Ollama workflow from WPAI Explorer is now a native Knowledge Forge view backed by RickPrime's real Software and AI Research registries. Explorer's mock Minecraft corpus, cloud-provider code, embedded server, and duplicate desktop launcher are not imported.
- AI Research is mapped as a fixed fourteen-node Research Nexus. It exposes root and source-document availability, evidence labels, activation gates, boundaries, and one verified read-only Janus status command. It never becomes a generic research runner, crawler, model-pull surface, task store, scheduler, or credential client.
- Sentinel Array is a separate, metadata-only WPAI discovery layer. It expands operational reach beyond the curated registries without treating every directory as an executable integration or exposing arbitrary source contents.

## Runtime boundary

    React renderer (sandboxed, no Node access)
                 |
                 v
    Context-isolated preload (named IPC methods only)
                 |
                 v
    Electron main process
       |            |             |              |
       v            v             v              v
    StudioOps   Local Ollama  Fixed registries  Sentinel discovery  Explicit folder/app handoffs
    read-only   loopback      source-linked     metadata-only       validated only
    commands    only

The renderer has no generic IPC invoke function and cannot submit filesystem paths, executable names, command arguments, endpoint URLs, source contents, secrets, or environment values. Each bridge operation is individually named and revalidated in the main process.

## Data surfaces

| Signal | Fixed source | Exposed data |
| --- | --- | --- |
| Host telemetry | Node operating-system API | CPU, memory, uptime, and runtime versions |
| Company Atlas | Fixed WPAI root registry | Registered-root presence, source-document availability/timestamps, phase, evidence state, gate, and ownership boundary |
| Project Fleet | Fixed Software registry | Folder presence, Git branch/change count, descriptive metadata, and user-clicked handoff |
| Research Nexus | Fixed AI Research registry | Root/source availability, evidence state, activation gate, operating boundary, tags, capabilities, and user-clicked handoff |
| Knowledge Forge | Project Fleet + Research Nexus metadata | Deterministic local matches, declared lineage edges, source availability, and bounded local-Ollama context |
| Sentinel Array | Fixed `C:\WPAI` root, safe directory metadata, local baseline | Relative paths, directory depth, marker names, counts, safe addition/removal deltas, and validated directory handoffs |
| Diagnostics | Node OS APIs, filesystem statistics, fixed Docker status probe, Ollama, Workspace summary | Host CPU/memory/process telemetry, storage reserve, Docker/Ollama availability, and monitor health |
| StudioOps runtime | Workspace control-plane roots | Folder presence, timestamp, approval-file count, and journal-file count only |
| Ollama | User-configured loopback endpoint | Installed model metadata and user-initiated local chat output |

No document body, approval content, journal content, task content, source code, secret, environment variable, credential filename, API key, web result, crawler data, remote-model setting, or database body is returned to the renderer.

## Sentinel Array and automatic discovery

Sentinel Array intentionally complements rather than replaces the fixed Company Atlas, Project Fleet, and Research Nexus. The fixed registries retain their evidence labels, governance boundaries, and known safe integrations. Sentinel handles the rest of the actual workspace as structural discovery.

- The scanner starts at the fixed WPAI root and traverses safe directories breadth-first. It records only metadata: relative directory paths, depth, direct safe-child counts, and marker names such as Git, Node, Python, Rust, JVM, Go, .NET, and authority documents.
- Hidden/runtime folders, credential-shaped names, secret-bearing file extensions, symlinks, dependency/vendor/build/cache outputs, and dense imported collections are excluded from recursion. Dense collection roots remain visible and can be opened manually, but their thousands of upstream children cannot flood the dashboard.
- The scanner has transparent depth, directory, entry, and collection caps. A cap is shown in the UI rather than silently claiming full coverage. On the current WPAI layout, the configured safe scan is intended to complete within the reported boundary.
- A metadata-only fingerprint baseline lives in RickPrime user data, never in the source checkout. Each fresh scan compares safe directory and marker-file entries to report additions/removals. A Windows native filesystem watcher triggers a debounced scan when possible; a 30-second bounded poll is the fallback.
- Dynamic folder opening accepts only a previously discovered entry identifier. The main process rescans or checks the current snapshot, resolves the directory under the fixed root, rejects traversal/symlinks/out-of-root paths, and only then delegates to the OS folder opener.

Sentinel does not read file content, infer the meaning or health of arbitrary files, display protected names, execute a discovered project, inspect all running processes, expose IP addresses, or grant a generic filesystem/terminal API to the renderer.

## Native Knowledge Forge

Knowledge Forge carries forward the portion of WPAI Explorer that is appropriate for the workstation:

- deterministic query tokenization and bounded context bundles;
- provenance records that identify the registry or available source document behind each node;
- declared relationship topology for known integration lineage;
- local Ollama analysis of only the generated bundle;
- safe user-clicked handoff to a fixed Software or AI Research root.

It does not claim a live vector index, semantic corpus size, graph database, external search result, source-document interpretation, or current external business/research state. Its graph positions are deterministic visual anchors; relationship labels are declared governance/integration connections rather than inferred executable flows.

## Research Nexus

The fixed registry covers AssetConverter/Omni32, AutomationLab, Claude Playground, Deep Research Engine, Grok Playground, JanusPrime, Operation Pinky and the Brain, Recurrsive, REL Codex Variant, Research Crawler, Smart Library, Topological Hydro-Computational Engine, TSAM, and VeriForge.

Each entry records:

- source availability, not source contents;
- whether a claim is source-verified, a director decision, a current-state verification requirement, or a research synthesis;
- an activation gate and operating boundary;
- an integration mode: source map only, Knowledge Forge source, or a narrowly scoped status control.

JanusPrime is the only Research Nexus operation. Its documented status wrapper runs in the Janus workspace root and reports local dependency/task counts. It cannot create tasks, seed work, repair state, launch loops, run research, publish, spend, or alter any other research node.

## Allowed operations

The Operations Deck has a closed command registry:

1. StudioOps status.
2. StudioOps music-package validation without ticket emission.
3. Software Git status.
4. Janus status from the Janus workspace root.

The main process uses direct executable invocation with a disabled shell, fixed arguments, a working-directory allowlist, timeouts, and capped output. The UI never accepts terminal text or command arguments.

HellForge is the sole registered desktop application launch handoff because it owns the mature PTY/terminal security model. The former WPAI Explorer launcher is intentionally removed in favor of the native Knowledge Forge. Every other user action opens only a fixed registered source folder. YumNom remains parked and has no launch route.

Sentinel can additionally open a detected safe directory, but it cannot launch it, pass it to a command, or open a user-supplied arbitrary path. Docker diagnostics use one fixed read-only `docker ps` probe; container details are not an execution interface.

## Scrolling and interaction

Desktop RickPrime uses a dedicated, focusable workspace scroll region with stable scrollbar gutters, smooth scroll behavior, and contained overscroll. Long navigation, project, research, provenance, command-output, model, and analysis regions have their own contained scroll areas.

When no input, select, editable control, or Omni-jump dialog owns focus:

- Home returns the workspace to the top.
- End moves to the workspace bottom.
- Page Up and Page Down move by a viewport step.
- The top bar includes an explicit return-to-top control.

On narrow screens, the application intentionally defers to normal document scrolling while preserving horizontal navigation scrolling.

## Failure and recovery

| Condition | User-facing behavior | Recovery |
| --- | --- | --- |
| Ollama is absent or stopped | Neural Nexus and Knowledge Forge analysis show the local link offline | Start the approved Docker-hosted local Ollama stack, then refresh |
| A project or research root is unavailable | The node is marked unavailable and its handoff is disabled | Restore the registered WPAI layout or use the documented workspace-root override for a relocated complete workspace |
| A source document is unavailable | The individual provenance row is marked missing | Restore or reconcile the owning source; do not treat its absence as a runtime result |
| Janus status reports unavailable dependencies | The visible command result reports its own status without remediation | Diagnose through Janus/HellForge under the owning workflow; RickPrime intentionally has no repair/task controls |
| Native filesystem watcher is unavailable | Sentinel declares polling mode | The renderer performs the bounded metadata refresh at the normal interval; no watcher installation or privilege change is attempted |
| Discovery reaches a depth, directory, entry, or dense-collection boundary | Sentinel shows the exact boundary and retains the reachable collection root | Refine scope through the opened folder or adjust the application policy in a reviewed source change; do not hide the cap |
| Storage or Docker telemetry is unavailable | Diagnostics shows an unavailable signal with no raw command error | Restore the host service or use the owning operator workflow; RickPrime does not attempt repair |
| A dated source conflicts with another source | Atlas, Nexus, or Forge retains verification/research labels | Verify current state in the owning workflow before publication, funding, release, or claim changes |
| A safe command fails or times out | Exit state and bounded output appear in Operations Deck | Diagnose in HellForge or the owning project; do not broaden the allowlist as a workaround |

## Build and distribution

Vite builds the frontend into dist. Electron Packager creates the unpacked Windows application in dist-desktop/RickPrime-WPAI-Integrated/RickPrime-win32-x64. The executable must remain beside its adjacent Electron runtime files. Runtime settings remain in Electron user data, not in the repository.
