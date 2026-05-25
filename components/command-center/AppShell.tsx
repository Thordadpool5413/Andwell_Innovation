import type { ReactNode } from 'react';
import { Menu, PanelLeftClose, RefreshCcw } from 'lucide-react';
import { Button } from './ui';
import { commandCenterTabs } from './tabs';
import type { TabId } from './model';

export function AppShell({
  activeTab,
  mobileOpen,
  onClose,
  onChange,
  onOpen,
  onRefresh,
  children
}: {
  activeTab: TabId;
  mobileOpen: boolean;
  onClose: () => void;
  onChange: (tab: TabId) => void;
  onOpen: () => void;
  onRefresh: () => void;
  children: ReactNode;
}) {
  const active = commandCenterTabs.find((tab) => tab.id === activeTab) || commandCenterTabs[0];

  return (
    <div className="cc-app">
      <Sidebar
        activeTab={activeTab}
        mobileOpen={mobileOpen}
        onClose={onClose}
        onChange={onChange}
      />
      <main className="cc-main">
        {activeTab === 'dashboard' ? (
          <button type="button" className="cc-dashboard-mobile-menu" onClick={onOpen} aria-label="Open navigation">
            <Menu size={20} />
          </button>
        ) : null}
        {activeTab !== 'dashboard' ? (
          <header className="cc-topbar">
            <button type="button" className="cc-mobile-menu" onClick={onOpen} aria-label="Open navigation">
              <Menu size={20} />
            </button>
            <div>
              <p className="cc-topline">Andwell Innovation</p>
              <h1>{active.label}</h1>
              <span>{active.help}</span>
            </div>
            <div className="cc-topbar-actions">
              <Button variant="ghost" onClick={onRefresh}>
                <RefreshCcw size={16} /> Refresh
              </Button>
            </div>
          </header>
        ) : null}
        {children}
      </main>
    </div>
  );
}

function Sidebar({
  activeTab,
  mobileOpen,
  onChange,
  onClose
}: {
  activeTab: TabId;
  mobileOpen: boolean;
  onChange: (tab: TabId) => void;
  onClose: () => void;
}) {
  return (
    <>
      <aside className={`cc-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="cc-sidebar-head">
          <div>
            <strong>Andwell</strong>
            <span>Innovation Command Center</span>
          </div>
          <button type="button" className="cc-sidebar-close" onClick={onClose} aria-label="Close navigation">
            <PanelLeftClose size={18} />
          </button>
        </div>
        <nav className="cc-nav" aria-label="Command center navigation">
          {commandCenterTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} type="button" className={`cc-nav-item ${activeTab === tab.id ? 'active' : ''}`} onClick={() => onChange(tab.id)}>
                <Icon size={18} />
                <span>
                  <strong>{tab.label}</strong>
                  <small>{tab.help}</small>
                </span>
              </button>
            );
          })}
        </nav>
      </aside>
      {mobileOpen ? <button className="cc-scrim" type="button" onClick={onClose} aria-label="Close navigation" /> : null}
    </>
  );
}
