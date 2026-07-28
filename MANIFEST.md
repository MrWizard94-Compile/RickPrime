# RickPrime Delivery Manifest

## Product files

| File or area | Purpose |
| --- | --- |
| package.json and package-lock.json | Pinned development, test, build, audit, and Windows packaging workflow |
| electron/registry.cjs | Fixed Company, Software, AI Research, and read-only command registries |
| electron/discovery.cjs | Tested WPAI-root metadata scanner, safe marker classifier, baseline diff contract, collection bounding, and directory-resolution guard |
| electron/main.cjs | Secure Electron main process, bounded snapshots, local Ollama transport, folder handoffs, commands, and the only desktop launcher |
| electron/preload.cjs | Named, context-isolated renderer bridge without generic IPC |
| electron/validation.cjs | Local endpoint, model-name, settings, and chat-payload validation |
| src/App.tsx | Workstation state, refresh, keyboard scrolling, top-level navigation, notices, and bridge orchestration |
| src/components/CompanyAtlas.tsx | WPAI company authority and evidence view |
| src/components/ProjectFleet.tsx | Software fleet, Git signals, and registered handoffs |
| src/components/KnowledgeForge.tsx | Native bounded context, provenance, topology, and local analysis view |
| src/components/ResearchNexus.tsx | Governed fourteen-node AI Research registry and Janus status entry point |
| src/components/NeuralNexus.tsx | Loopback-only local model chat and selection |
| src/components/OperationsDeck.tsx | Closed read-first command deck and output ledger |
| src/components/SentinelArray.tsx | WPAI-wide safe discovery, change monitoring, validated directory reachability, and systems diagnostics view |
| src/components/OmniJump.tsx and SideRail.tsx | Complete workstation navigation and fixed root handoffs |
| src/lib/knowledgeEngine.js and knowledgeEngine.d.ts | Tested deterministic bundle, provenance, relationship, and bounded-analysis contract |
| src/lib/bridge.ts | Typed Electron contract and a clearly labeled representative browser preview |
| src/types.ts | UI and IPC contracts for Company, Project, Research, discovery, diagnostics, and local AI state |
| src/index.css | Original sci-fi visual system, nested scroll behavior, responsive layout, and reduced-motion handling |
| test/validation.test.cjs | Local-only endpoint, fixed registry, Janus boundary, and WPAI Explorer merger invariants |
| test/knowledge-engine.test.cjs | Deterministic bounded Knowledge Forge behavior and analysis-guardrail tests |
| test/discovery.test.cjs | Metadata-only discovery, protected-entry exclusion, delta detection, dense-collection bounding, and path-containment tests |
| README.md | Setup, operation, local-AI, packaging, and control reference |
| ARCHITECTURE.md | Trust boundaries, native integrations, scrolling, failure recovery, and operational restrictions |
| INGESTION-REASSESSMENT.md | WPAI portfolio and integration reassessment |

## Integration status

RickPrime is the workstation consolidation layer. It does not copy or merge every source tree. It promotes the reusable Wpai Explorer context/provenance workflow into a native module, maps AI Research as explicit governed systems, and adds Sentinel Array for dynamic safe metadata discovery across WPAI while leaving each original repository, runtime owner, instruction set, and approval boundary intact.

The only user-triggered executable controls are the four listed read-first commands and the explicit HellForge desktop handoff. Sentinel Array uses a fixed read-only Docker status probe for diagnostics and can open only revalidated directories already detected under the fixed WPAI root. Knowledge Forge and Research Nexus never expose arbitrary command text, source execution, crawling, credential configuration, autonomous tasks, model pulls, publishing, spending, or ticket emission.

## Verification gate

Run from C:\WPAI\Software\RickPrime:

    npm run lint
    npm test
    npm run build
    npm audit --omit=dev
    npm run dist:win

Inspect and launch the generated executable at:

    dist-desktop/RickPrime-WPAI-Integrated/RickPrime-win32-x64/RickPrime.exe

Then confirm main-view scrolling, nested registry scrolling, keyboard navigation, Knowledge Forge, Research Nexus, Sentinel Array discovery/diagnostics/change baseline, local model status, and the read-only Janus status control in the packaged desktop app.
