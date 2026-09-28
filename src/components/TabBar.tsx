import { BookOpen, LayoutGrid, Timer, Users } from 'lucide-react';

export type Tab = 'squad' | 'plan' | 'record' | 'guide';

const TABS = [
  { id: 'squad', label: 'Squad', Icon: Users },
  { id: 'plan', label: 'Plan', Icon: LayoutGrid },
  { id: 'record', label: 'Record', Icon: Timer },
  { id: 'guide', label: 'Guide', Icon: BookOpen },
] as const;

export const TabBar = ({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) => (
  <nav className="tabs" aria-label="Sections">
    {TABS.map(({ id, label, Icon }) => (
      <button key={id} aria-current={tab === id ? 'page' : undefined} onClick={() => onChange(id)}>
        <Icon size={24} strokeWidth={1.8} aria-hidden="true" />
        {label}
      </button>
    ))}
  </nav>
);
