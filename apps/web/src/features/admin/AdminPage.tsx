import React, { useState, useEffect } from 'react';
import { AdminConsoleShell, type AdminTab } from './components/AdminConsoleShell';
import { AdminOverviewView } from './components/AdminOverviewView';
import { AdminUsersView } from './components/AdminUsersView';
import { AdminVisitorsView } from './components/AdminVisitorsView';
import { AdminSessionsView } from './components/AdminSessionsView';
import { AdminSecurityView } from './components/AdminSecurityView';
import { AdminAuditView } from './components/AdminAuditView';
import { AdminLoginPage } from './components/AdminLoginPage';
import { adminApi, type AdminOverviewMetricsDto } from './api/admin-api';

const getTabFromPath = (path: string): AdminTab => {
  if (path.startsWith('/admin/users')) return 'users';
  if (path.startsWith('/admin/visitors') || path.startsWith('/admin/traffic')) return 'visitors';
  if (path.startsWith('/admin/sessions')) return 'sessions';
  if (path.startsWith('/admin/security')) return 'security';
  if (path.startsWith('/admin/audit')) return 'audit';
  return 'overview';
};

const getPathFromTab = (tab: AdminTab): string => {
  if (tab === 'overview') return '/admin';
  return `/admin/${tab}`;
};

export const AdminPage: React.FC = () => {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('admin_access_token') || localStorage.getItem('admin_access_token');
  });

  const [currentTab, setCurrentTab] = useState<AdminTab>(() => {
    return typeof window !== 'undefined' ? getTabFromPath(window.location.pathname) : 'overview';
  });

  const [overviewData, setOverviewData] = useState<AdminOverviewMetricsDto | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const isExplicitLoginPage =
    typeof window !== 'undefined' && window.location.pathname === '/admin/login';

  useEffect(() => {
    if (authToken && !isExplicitLoginPage && currentTab === 'overview') {
      setOverviewLoading(true);
      adminApi
        .getOverview()
        .then((data) => setOverviewData(data))
        .catch((err) => {
          console.error(err);
          // If token expired or unauthorized, bounce to login
          if (err?.message?.includes('401') || err?.message?.includes('403') || err?.message?.includes('Failed to load')) {
            handleLogout();
          }
        })
        .finally(() => setOverviewLoading(false));
    }
  }, [currentTab, authToken, isExplicitLoginPage]);

  const handleSelectTab = (tab: AdminTab) => {
    setCurrentTab(tab);
    const targetPath = getPathFromTab(tab);
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleLoginSuccess = (token: string) => {
    setAuthToken(token);
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/admin/login') {
        window.history.pushState({}, '', '/admin');
      }
    }
    setCurrentTab('overview');
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_access_token');
      setAuthToken(null);
      if (window.location.pathname !== '/admin/login') {
        window.history.pushState({}, '', '/admin/login');
      }
    }
  };

  // If no auth token or explicitly at /admin/login, render the dedicated WebAuthn login experience
  if (!authToken || isExplicitLoginPage) {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <AdminConsoleShell
      currentTab={currentTab}
      onSelectTab={handleSelectTab}
      onLogout={handleLogout}
    >
      {currentTab === 'overview' && (
        <AdminOverviewView data={overviewData} loading={overviewLoading} />
      )}
      {currentTab === 'users' && <AdminUsersView />}
      {currentTab === 'visitors' && <AdminVisitorsView />}
      {currentTab === 'sessions' && <AdminSessionsView />}
      {currentTab === 'security' && <AdminSecurityView />}
      {currentTab === 'audit' && <AdminAuditView />}
    </AdminConsoleShell>
  );
};

export default AdminPage;

