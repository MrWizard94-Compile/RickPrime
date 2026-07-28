import { Activity, Brain, CircuitBoard, Command, Database, FolderKanban, Gauge, Radar, Settings, Terminal } from 'lucide-react';
import { navigation } from '../data/controls';
import { cx } from '../lib/format';
import type { ViewId } from '../types';

const icons = {
  command: Gauge,
  atlas: Radar,
  fleet: FolderKanban,
  knowledge: Database,
  research: CircuitBoard,
  neural: Brain,
  operations: Terminal,
  sentinel: Activity,
  systems: Settings,
} satisfies Record<ViewId, typeof Gauge>;

interface SideRailProps {
  activeView: ViewId;
  onChange(view: ViewId): void;
}

export function SideRail({ activeView, onChange }: SideRailProps) {
  return (
    <aside className="side-rail" aria-label="RickPrime navigation">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <span className="brand-mark__core" />
          <span className="brand-mark__ring brand-mark__ring--one" />
          <span className="brand-mark__ring brand-mark__ring--two" />
        </div>
        <div className="brand-copy">
          <span className="eyebrow">WPAI // multiverse node</span>
          <strong>RICK<span>PRIME</span></strong>
        </div>
      </div>

      <nav className="navigation-list">
        <span className="section-label">Systems</span>
        {navigation.map((item) => {
          const Icon = icons[item.id];
          const selected = item.id === activeView;
          return (
            <button
              className={cx('navigation-item', selected && 'is-active')}
              key={item.id}
              onClick={() => onChange(item.id)}
              type="button"
              aria-current={selected ? 'page' : undefined}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
              <span className="navigation-item__copy">
                <span>{item.label}</span>
                <small>{item.hint}</small>
              </span>
              {selected && <span className="navigation-item__signal" aria-hidden="true" />}
            </button>
          );
        })}
      </nav>

      <div className="side-rail__footer">
        <div className="signal-line">
          <Activity aria-hidden="true" size={14} />
          <span>Local-first control link</span>
        </div>
        <div className="signal-line signal-line--subtle">
          <Command aria-hidden="true" size={13} />
          <span>Ctrl + K // omni-jump</span>
        </div>
      </div>
    </aside>
  );
}
