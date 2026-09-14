import React from 'react';
import {
  Shield,
  Activity,
  Users,
  KeyRound,
  FileText,
  LogOut,
  Lock,
  Globe,
} from 'lucide-react';

export type AdminTab = 'overview' | 'users' | 'visitors' | 'sessions' | 'security' | 'audit';

interface AdminConsoleShellProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminConsoleShell: React.FC<AdminConsoleShellProps> = ({
  currentTab,
  onSelectTab,
  onLogout,
  children,
}) => {
  const tabs: Array<{ id: AdminTab; label: string; number: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', number: '01', icon: <Activity className="w-4 h-4" /> },
    { id: 'users', label: 'Users', number: '02', icon: <Users className="w-4 h-4" /> },
    { id: 'visitors', label: 'Visitors & Traffic', number: '03', icon: <Globe className="w-4 h-4" /> },
    { id: 'sessions', label: 'Sessions', number: '04', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'security', label: 'Security', number: '05', icon: <Shield className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit', number: '06', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-base,#0B0F17)] text-[var(--color-text-primary,#E2E8F0)] flex flex-col font-sans">
      {/* Top Operational Bar */}
      <header className="h-14 border-b border-[var(--color-border-hairline,rgba(255,255,255,0.08))] px-6 flex items-center justify-between bg-[var(--color-bg-surface,#111726)]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[var(--color-accent-dim,rgba(59,130,246,0.12))] border border-[var(--color-accent-border,rgba(59,130,246,0.3))] text-xs font-mono font-medium tracking-wide text-[var(--color-accent,#60A5FA)]">
            <Lock className="w-3.5 h-3.5" />
            <span>NEBULA CONTROL PLANE</span>
          </div>
          <span className="text-xs text-[var(--color-text-muted,#64748B)]">/</span>
          <span className="text-xs font-mono text-[var(--color-text-secondary,#94A3B8)]">admin.corp.internal</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Owner Admin (AAL3 Passkey)</span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium text-[var(--color-text-secondary,#94A3B8)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors border border-transparent hover:border-rose-500/20"
            title="Terminate Admin Session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container with Sidebar Navigation */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* Navigation Sidebar */}
        <aside className="w-56 shrink-0" aria-label="Admin Navigation">
          <nav className="space-y-1 sticky top-24">
            <div className="px-3 pb-2 text-[10px] font-mono font-semibold uppercase tracking-wider text-[var(--color-text-muted,#64748B)]">
              Operational Plane
            </div>
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[var(--color-bg-elevated,#1E293B)] text-[var(--color-text-primary,#FFFFFF)] shadow-sm border border-[var(--color-border-hairline,rgba(255,255,255,0.1))]'
                      : 'text-[var(--color-text-secondary,#94A3B8)] hover:bg-[var(--color-bg-surface,#111726)] hover:text-[var(--color-text-primary,#FFFFFF)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {tab.icon}
                    <span>{tab.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--color-text-muted,#64748B)]">{tab.number}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content View Surface */}
        <main className="flex-1 min-w-0" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};
