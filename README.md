# RickPrime

RickPrime is WPAI's local-first, desktop-first multiverse workstation. Its original neon laboratory visual system is inspired by high-energy science-fiction interfaces without using television characters, logos, screenshots, audio, or other protected show assets.

It is a real integration layer over the WPAI workstation ecosystem, not a destructive repository merger. Each project keeps its repository, instructions, runtime ownership, and approval process while RickPrime promotes reusable safe workflows into its native shell.

## What is integrated

- Company Atlas: source-linked company roots, operating phase, evidence label, activation gate, boundary, and fixed folder handoff.
- Project Fleet: the registered Software portfolio with detected folders, Git pulse, source handoff, and visible parked state.
- Knowledge Forge: native deterministic context bundles, provenance, declared relationship topology, and local Ollama analysis adapted from the useful WPAI Explorer workflow. It uses RickPrime's real Software and AI Research metadata, not Explorer's mock Minecraft corpus. The original Explorer folder remains a source/fallback record rather than a duplicate launcher.
- Research Nexus: fourteen AI Research systems with root/source availability, evidence state, gates, ownership boundaries, Knowledge Forge lineage, and a restricted Janus status control.
- Neural Nexus: loopback-only local Ollama model discovery, model selection, and chat.
- Operations Deck: four fixed read-first controls: StudioOps status, StudioOps music validation without ticket emission, Software Git status, and Janus status.
- Sentinel Array: live WPAI-wide directory discovery and change monitoring. It recognizes safe project markers across the actual workspace, persists a local metadata baseline, watches for safe additions/removals, exposes host/storage/Docker/Ollama diagnostics, and opens only validated discovered directories.
- HellForge: the sole explicit application launcher, retained for its mature PTY and operator workflow.

## Safety model

- Electron uses context isolation, sandboxing, disabled Node integration, and a narrow named bridge.
- The renderer cannot submit paths, shell commands, executable names, command arguments, secrets, or remote endpoint URLs.
- Ollama is constrained to localhost or loopback addresses. There are no cloud-model, API-key, remote crawler, or provider configuration controls.
- Knowledge Forge sends only its bounded metadata bundle to local Ollama. It never sends source-document bodies, workspace contents, task contents, credentials, or source code.
- Research Nexus does not run experiments, crawl websites, pull models, create tasks, repair Janus, schedule agents, publish, spend, commit, deploy, or bypass approvals.
- Janus status is a fixed documented command with a fixed workspace root, timeout, output cap, and no user-editable arguments.
- Company, Software, and AI Research folder handoffs are explicit clicks against fixed main-process registries.
- Sentinel discovery is metadata-only: it records safe names, paths relative to WPAI, directory depth, marker names, and counts. It never reads document bodies, hidden runtime state, credential filenames, symlink targets, or generated dependency/build trees.
- Dynamic folder handoffs are revalidated against the current scan, resolved under the fixed WPAI root, checked as non-symlink directories, and then opened through the operating system. They cannot accept an arbitrary renderer path.

## Requirements

- Windows 10 or 11
- Node.js 22.12 or newer
- WPAI rooted at C:\WPAI, or a complete relocated workspace supplied through the documented root override
- Docker-hosted Ollama on the host for local AI functions, normally at http://127.0.0.1:11434

## Development

From C:\WPAI\Software\RickPrime:

    npm install
    npm run desktop

The Vite UI binds only to 127.0.0.1:5178 and Electron opens it with the same secure preload bridge used by the packaged application.

## Local AI

RickPrime discovers actually installed models through the local Ollama tags endpoint. If the saved preference is unavailable, Neural Nexus safely uses the first detected model for that session without changing the persisted setting.

The current low-resource WPAI Explorer model profile remains useful for the local workstation:

| Model | Suggested role |
| --- | --- |
| gemma3:270m | General local analyst and concise studio chat |
| qwen2.5-coder:0.5b | Code, YAML, and modding-oriented prompts |
| smollm2:135m | Lightweight diagnostics and short tasks |

The live model list in Neural Nexus is authoritative.

## Navigation and scrolling

- Ctrl+K opens Omni-jump for views and fixed source-folder handoffs.
- Knowledge Forge and Research Nexus are first-class workstation views, not external browser pages.
- Desktop views use a stable primary scrollbar plus contained nested scroll areas for dense registries, provenance, model lists, analysis, and command output.
- Home, End, Page Up, and Page Down move the workspace when focus is not in an editable control or Omni-jump.
- The top bar provides an explicit return-to-top action.
- Sentinel Array keeps the native watcher armed when Windows supports it and falls back to a bounded 30-second scan. Its "All folders" search can reach every safe discovered directory without rendering the whole tree at once.

## Verification

Run:

    npm run lint
    npm test
    npm run build
    npm audit --omit=dev

Expected results are a clean TypeScript check, passing security/registry/Knowledge Forge/discovery tests, a Vite production build, and no production dependency vulnerabilities.

## Package a Windows executable

Run:

    npm run dist:win

Electron Packager produces the fresh integrated artifact at:

    dist-desktop/RickPrime-WPAI-Integrated/RickPrime-win32-x64/RickPrime.exe

This is an unpacked Windows application folder. Keep the folder intact when moving it because the executable depends on the adjacent Electron runtime files. The Integrated output intentionally avoids overwriting the older Atlas artifact while it may be running.

## Deliberate boundaries

RickPrime does not implement a second PTY, a second approval system, a second research task store, a generic terminal, or arbitrary project launch paths. Sentinel Array provides a deliberately constrained directory handoff for safe workspace reachability; it is not a generic filesystem browser. HellForge owns real terminals, StudioOps owns approval/release state, Janus owns research orchestration, and each project owns its source and external commitments.

For detailed source boundaries, Research Nexus classification, scrolling behavior, failure recovery, and package architecture, read ARCHITECTURE.md and INGESTION-REASSESSMENT.md.
