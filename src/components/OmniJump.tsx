import { Command, FolderOpen, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { navigation } from '../data/controls';
import type { DivisionStatus, ProjectStatus, ResearchProjectStatus, ViewId } from '../types';

interface OmniJumpProps {
  divisions: DivisionStatus[];
  projects: ProjectStatus[];
  research: ResearchProjectStatus[];
  onClose(): void;
  onNavigate(view: ViewId): void;
  onOpenDivision(divisionId: string): void;
  onOpenProject(projectId: string): void;
  onOpenResearchProject(projectId: string): void;
}

export function OmniJump({ divisions, projects, research, onClose, onNavigate, onOpenDivision, onOpenProject, onOpenResearchProject }: OmniJumpProps) {
  const [query, setQuery] = useState('');
  const needle = query.toLowerCase().trim();
  const views = useMemo(() => navigation.filter((entry) => !needle || `${entry.label} ${entry.hint}`.toLowerCase().includes(needle)), [needle]);
  const divisionMatches = useMemo(() => divisions.filter((division) => !needle || `${division.label} ${division.category} ${division.phase}`.toLowerCase().includes(needle)).slice(0, 6), [divisions, needle]);
  const matches = useMemo(() => projects.filter((project) => !needle || `${project.label} ${project.group}`.toLowerCase().includes(needle)).slice(0, 6), [needle, projects]);

  const researchMatches = useMemo(() => research.filter((project) => !needle || [project.label, project.category, project.tags.join(' ')].join(' ').toLowerCase().includes(needle)).slice(0, 6), [needle, research]);

  return (
    <div className="omni-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="omni-jump" role="dialog" aria-modal="true" aria-label="RickPrime omni-jump" onMouseDown={(event) => event.stopPropagation()}>
        <div className="omni-jump__search"><Search aria-hidden="true" size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jump to a system or open a project…" /><button type="button" onClick={onClose} aria-label="Close omni-jump"><X aria-hidden="true" size={18} /></button></div>
        <div className="omni-jump__section"><span className="section-label"><Command aria-hidden="true" size={12} /> Workstation views</span>{views.map((view) => <button key={view.id} type="button" onClick={() => { onNavigate(view.id); onClose(); }}><span>{view.label}</span><small>{view.hint}</small></button>)}</div>
        <div className="omni-jump__section"><span className="section-label"><FolderOpen aria-hidden="true" size={12} /> WPAI division roots</span>{divisionMatches.map((division) => <button key={division.id} type="button" disabled={!division.exists} onClick={() => { onOpenDivision(division.id); onClose(); }}><span>{division.label}</span><small>{division.phaseLabel}</small></button>)}{!divisionMatches.length && <p className="empty-state">No WPAI division nodes match.</p>}</div>
        <div className="omni-jump__section"><span className="section-label"><FolderOpen aria-hidden="true" size={12} /> AI Research roots</span>{researchMatches.map((project) => <button key={project.id} type="button" disabled={!project.exists} onClick={() => { onOpenResearchProject(project.id); onClose(); }}><span>{project.label}</span><small>{project.phaseLabel}</small></button>)}{!researchMatches.length && <p className="empty-state">No AI Research nodes match.</p>}</div>
        <div className="omni-jump__section"><span className="section-label"><FolderOpen aria-hidden="true" size={12} /> Project folders</span>{matches.map((project) => <button key={project.id} type="button" disabled={!project.exists} onClick={() => { onOpenProject(project.id); onClose(); }}><span>{project.label}</span><small>{project.group}{project.parked ? ' · parked' : ''}</small></button>)}{!matches.length && <p className="empty-state">No project nodes match.</p>}</div>
        <footer><kbd>Ctrl</kbd><kbd>K</kbd> to open · <kbd>Esc</kbd> to close</footer>
      </section>
    </div>
  );
}
