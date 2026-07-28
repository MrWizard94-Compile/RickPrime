import type { ViewId } from '../types';

export const navigation: Array<{ id: ViewId; label: string; hint: string }> = [
  { id: 'command', label: 'Command matrix', hint: 'Studio overview' },
  { id: 'atlas', label: 'Company atlas', hint: 'Portfolio integration' },
  { id: 'fleet', label: 'Project fleet', hint: 'Portfolio registry' },
  { id: 'knowledge', label: 'Knowledge forge', hint: 'Context and provenance' },
  { id: 'research', label: 'Research nexus', hint: 'Governed AI research' },
  { id: 'neural', label: 'Neural nexus', hint: 'Local AI interface' },
  { id: 'operations', label: 'Operations deck', hint: 'Safe control commands' },
  { id: 'sentinel', label: 'Sentinel array', hint: 'Discovery + diagnostics' },
  { id: 'systems', label: 'System core', hint: 'Runtime settings' },
];

export const controlCommands = [
  {
    id: 'studio-status',
    label: 'Read studio status',
    detail: 'Runs the existing StudioOps status command. No state is changed.',
    accent: 'cyan',
  },
  {
    id: 'music-check',
    label: 'Validate music packages',
    detail: 'Checks release packages without emitting tickets or publishing.',
    accent: 'lime',
  },
  {
    id: 'software-git-pulse',
    label: 'Read software git pulse',
    detail: 'Reads the Software directory status without modifying its worktree.',
    accent: 'violet',
  },
  {
    id: 'janus-status',
    label: 'Read Janus status',
    detail: 'Runs Janus’s documented status probe without creating tasks, loops, or research work.',
    accent: 'amber',
  },
] as const;
