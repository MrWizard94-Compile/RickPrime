import type { ChatRole, EvidenceState, ProjectStatus, ResearchProjectStatus } from '../types';

export interface KnowledgeProvenance {
  label: string;
  relativePath: string;
  available: boolean;
  modifiedAt: string | null;
}

export interface KnowledgeEntity {
  id: string;
  kind: 'software' | 'research';
  label: string;
  category: string;
  description: string;
  phaseLabel: string;
  statusState: EvidenceState;
  statusLabel: string;
  tags: string[];
  capabilities: string[];
  directory: string;
  exists: boolean;
  provenance: KnowledgeProvenance[];
  vector: { x: number; y: number };
  score?: number;
}

export interface KnowledgeEdge {
  source: string;
  target: string;
  label: string;
}

export interface KnowledgeBundle {
  query: string;
  resolvedFacets: {
    terms: string[];
    domains: Array<KnowledgeEntity['kind']>;
  };
  prunedScopes: string[];
  entities: KnowledgeEntity[];
  edges: KnowledgeEdge[];
  summary: {
    corpusSize: number;
    matchedEntities: number;
    connectedEdges: number;
    sourceDocumentsAvailable: number;
    sourceDocumentsTotal: number;
  };
}

export function buildKnowledgeEntities(projects: ProjectStatus[], research: ResearchProjectStatus[]): KnowledgeEntity[];
export function buildKnowledgeBundle(query: string, projects: ProjectStatus[], research: ResearchProjectStatus[]): KnowledgeBundle;
export function buildKnowledgeAnalysisMessages(bundle: KnowledgeBundle): Array<{ role: ChatRole; content: string }>;
