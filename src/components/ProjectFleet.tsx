import { Archive, FolderOpen, GitBranch, Play, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { compactPath, cx } from '../lib/format';
import type { ProjectStatus } from '../types';

interface ProjectFleetProps {
  projects: ProjectStatus[];
  busyProjectId: string | null;
  onOpen(projectId: string): void;
  onLaunch(projectId: string): void;
}

export function ProjectFleet({ projects, busyProjectId, onOpen, onLaunch }: ProjectFleetProps) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((project) => [project.label, project.group, project.description].join(' ').toLowerCase().includes(needle));
  }, [projects, query]);
  const selected = filtered.find((project) => project.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const groups = useMemo(() => {
    return filtered.reduce<Record<string, ProjectStatus[]>>((accumulator, project) => {
      (accumulator[project.group] ??= []).push(project);
      return accumulator;
    }, {});
  }, [filtered]);

  return (
    <section className="view fleet-view" aria-label="Project fleet">
      <header className="view-hero view-hero--compact">
        <div>
          <span className="eyebrow"><GitBranch aria-hidden="true" size={13} /> Project registry // portfolio awareness</span>
          <h1>Project <em>fleet</em></h1>
          <p>Every registered WPAI software node is visible here. RickPrime reads folder and Git signals; each project keeps its own local rules and source of truth.</p>
        </div>
        <div className="fleet-view__count"><strong>{projects.filter((project) => project.exists).length}</strong><span>nodes online</span></div>
      </header>

      <div className="fleet-layout">
        <div className="panel project-directory">
          <label className="search-field">
            <Search aria-hidden="true" size={16} />
            <span className="sr-only">Filter projects</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter project lattice…" />
            {query && <button type="button" title="Clear filter" onClick={() => setQuery('')}><X aria-hidden="true" size={14} /></button>}
          </label>
          <div className="project-directory__scroll">
            {Object.entries(groups).map(([group, entries]) => (
              <div className="project-group" key={group}>
                <span className="section-label">{group}</span>
                {entries.map((project) => (
                  <button
                    className={cx('project-list-item', selected?.id === project.id && 'is-selected', project.parked && 'is-parked')}
                    key={project.id}
                    type="button"
                    onClick={() => setSelectedId(project.id)}
                  >
                    <span className={cx('project-list-item__dot', project.exists ? 'is-live' : 'is-offline')} aria-hidden="true" />
                    <span>{project.label}</span>
                    {project.parked && <Archive aria-label="Parked" size={13} />}
                    {project.git && project.git.changedFiles > 0 && <small>{project.git.changedFiles}</small>}
                  </button>
                ))}
              </div>
            ))}
            {!filtered.length && <p className="empty-state">No projects match this signal query.</p>}
          </div>
        </div>

        <article className="panel project-inspector">
          {selected ? (
            <>
              <div className="project-inspector__topline">
                <span className={cx('state-chip', selected.exists ? 'state-chip--ready' : 'state-chip--muted')}>{selected.exists ? 'DETECTED' : 'UNAVAILABLE'}</span>
                {selected.parked && <span className="state-chip state-chip--amber">PARKED</span>}
              </div>
              <div className="project-inspector__title">
                <div className="project-inspector__avatar">{selected.label.slice(0, 1)}</div>
                <div><span className="section-label">{selected.group}</span><h2>{selected.label}</h2></div>
              </div>
              <p>{selected.description}</p>
              <dl className="project-details">
                <div><dt>Path</dt><dd title={selected.directory}>{compactPath(selected.directory)}</dd></div>
                <div><dt>Source state</dt><dd>{selected.git ? `${selected.git.branch ?? 'detached'} · ${selected.git.changedFiles} changed` : 'No Git signal'}</dd></div>
                <div><dt>Launch relay</dt><dd>{selected.launch ? 'Registered desktop handoff' : selected.parked ? 'Intentionally disabled' : 'Open source folder'}</dd></div>
              </dl>
              <div className="project-inspector__actions">
                <button className="button button--secondary" type="button" disabled={!selected.exists || busyProjectId === selected.id} onClick={() => onOpen(selected.id)}>
                  <FolderOpen aria-hidden="true" size={16} /> Open folder
                </button>
                {selected.launch && (
                  <button className="button button--primary" type="button" disabled={!selected.exists || busyProjectId === selected.id} onClick={() => onLaunch(selected.id)}>
                    <Play aria-hidden="true" size={16} /> {busyProjectId === selected.id ? 'Launching…' : `Launch ${selected.label}`}
                  </button>
                )}
              </div>
              {selected.parked && <div className="notice notice--amber"><Archive aria-hidden="true" size={16} /> YumNom remains director-deferred and has no launch action in RickPrime.</div>}
            </>
          ) : (
            <p className="empty-state">Select a project node to inspect its integration vector.</p>
          )}
        </article>
      </div>
    </section>
  );
}
