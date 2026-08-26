import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { useTheme } from '../guest/hooks/useTheme';
import { LoadingState } from '../../components/states';
import { navigateTo } from '../../routes';
import { WorkspaceShell } from './components/shell';
import { WorkspaceNav } from './components/navigation';
import { WorkspaceHeader } from './components/header';
import { WorkspaceCanvas } from './components/canvas';
import { FirstRunDomainSetup } from './components/first-run';
import { ReturningWorkspaceEntry } from './components/returning';
import { DomainEntryDialog, DeleteDomainDialog, DomainDeletedToast } from './components/domain-dialog';
import { WorkspaceFooter } from './components/footer';
import { CurrentIntelligence } from './components/intelligence';
import { PrimaryStory, SecondaryStories } from './components/story';
import {
  FindingInvestigation,
  ChangeInvestigation,
  ObservationEvidenceSurface,
} from './components/investigation';
import { InfrastructureOverview } from './components/overview';
import { ChangesTimeline, HistoricalComparisonSurface } from './components/changes';
import { InfrastructureTimeline } from './components/timeline';
import { SnapshotHistory } from './components/snapshots';
import { HistoricalContext } from './components/historical-context';
import { DomainIdentity } from './components/identity';
import { WorkspaceIntelligenceLanding } from './components/multi-domain';
import { useDomains, useDeleteDomain } from '../../hooks/queries/useDomains';
import { useWorkspaceUnderstandingConvergence } from '../../hooks/queries/useUnderstanding';
import { resolveWorkspaceContext } from './contracts/context-resolution.contract';
import { getStoredGuestClaimContext } from './contracts/guest-continuity.contract';
import {
  resolveInvestigationTarget,
  buildInvestigationLink,
  type InvestigationContext,
  type InvestigationSourceType,
} from './contracts/investigation.contract';
import { WorkspaceSearchDialog } from './components/search/WorkspaceSearchDialog';
import { resolveSearchDestination } from './contracts/search.contract';
import type { DomainDto } from '../../types/api';

export type WorkspaceContextView =
  | 'overview'
  | 'findings'
  | 'changes'
  | 'infrastructure'
  | 'memory';

/**
 * Authoritative Workspace Page (WX-902).
 *
 * Implements the canonical Infrastructure Intelligence navigation shell:
 * - Left Product Navigation Sidebar: Overview, Findings, Changes, Infrastructure, Memory, Settings.
 * - Global Header Domain Context Switcher with instant switching, search, and recency.
 * - URL & browser history synchronization with preserved active domain context.
 * - Unmistakable single-domain context governing all surfaces without data mixture.
 */
export const WorkspacePage: React.FC = () => {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { theme, setMode } = useTheme();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('domainId') || null;
  });
  const [isAddDomainOpen, setIsAddDomainOpen] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<DomainDto | null>(null);
  const [deletedDomainNotification, setDeletedDomainNotification] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Keyboard Shortcut (Cmd+K / Ctrl+K) for Cross-Workspace Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Active Contextual Surface View ('overview' | 'findings' | 'changes' | 'infrastructure' | 'memory')
  const [activeView, setActiveView] = useState<WorkspaceContextView>(() => {
    if (typeof window === 'undefined') return 'overview';
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (path === '/workspace/findings' || viewParam === 'findings') return 'findings';
    if (path === '/workspace/changes' || path === '/workspace/changes/compare' || viewParam === 'changes') return 'changes';
    if (path === '/workspace/infrastructure' || viewParam === 'infrastructure' || viewParam === 'overview') return 'infrastructure';
    if (path === '/workspace/memory' || viewParam === 'memory') return 'memory';
    return 'overview';
  });

  // Deep Investigation Context
  const [investigationContext, setInvestigationContext] = useState<InvestigationContext | null>(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const sourceType = params.get('sourceType') as InvestigationSourceType | null;
    const sourceId = params.get('sourceId');
    const domainId = params.get('domainId');
    const baseSnapshotId = params.get('baseSnapshotId');
    const targetSnapshotId = params.get('targetSnapshotId');

    if (path === '/workspace/changes/compare' || sourceType === 'historical_comparison') {
      return {
        domainId: domainId || '',
        sourceType: 'historical_comparison',
        sourceId: targetSnapshotId || sourceId || '',
        baseSnapshotId: baseSnapshotId || undefined,
        returnPath: '/workspace/changes',
      };
    }

    if (sourceType && sourceId) {
      return {
        domainId: domainId || '',
        sourceType,
        sourceId,
        baseSnapshotId: baseSnapshotId || undefined,
        returnPath: params.get('returnPath') || '/workspace',
      };
    }
    return null;
  });

  // Listen for browser Back/Forward (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      const sourceType = params.get('sourceType') as InvestigationSourceType | null;
      const sourceId = params.get('sourceId');
      const domainId = params.get('domainId');
      const baseSnapshotId = params.get('baseSnapshotId');
      const targetSnapshotId = params.get('targetSnapshotId');

      setSelectedDomainId(domainId || null);

      if (path === '/workspace/changes/compare' || sourceType === 'historical_comparison') {
        setActiveView('changes');
        setInvestigationContext({
          domainId: domainId || '',
          sourceType: 'historical_comparison',
          sourceId: targetSnapshotId || sourceId || '',
          baseSnapshotId: baseSnapshotId || undefined,
          returnPath: '/workspace/changes',
        });
      } else if (sourceType && sourceId) {
        setInvestigationContext({
          domainId: domainId || '',
          sourceType,
          sourceId,
          baseSnapshotId: baseSnapshotId || undefined,
          returnPath: params.get('returnPath') || '/workspace',
        });
      } else {
        setInvestigationContext(null);
        if (path === '/workspace/memory' || params.get('view') === 'memory') {
          setActiveView('memory');
        } else if (path === '/workspace/findings' || params.get('view') === 'findings') {
          setActiveView('findings');
        } else if (path === '/workspace/changes' || params.get('view') === 'changes') {
          setActiveView('changes');
        } else if (path === '/workspace/infrastructure' || params.get('view') === 'infrastructure' || params.get('view') === 'overview') {
          setActiveView('infrastructure');
        } else {
          setActiveView('overview');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const domainsQuery = useDomains();
  const deleteDomainMutation = useDeleteDomain();
  const guestClaimContext = getStoredGuestClaimContext();

  const userDomains = domainsQuery.data || [];
  const hasDomains = userDomains.length > 0;

  const isMultiDomainLanding =
    !selectedDomainId &&
    hasDomains &&
    !investigationContext &&
    activeView === 'overview';

  const contextResolution = resolveWorkspaceContext({
    user,
    domains: userDomains,
    guestClaimContext,
    requestedDomainId: selectedDomainId,
  });

  const activeDomain = isMultiDomainLanding ? null : (contextResolution.activeDomain || (selectedDomainId ? userDomains.find((d) => d.id === selectedDomainId) : null) || null);

  // Single Authoritative Workspace Understanding Synchronization Coordinator (WX-912)
  useWorkspaceUnderstandingConvergence({
    domainId: activeDomain?.id,
  });

  const handleSelectDomain = (newDomainId: string) => {
    if (!newDomainId) {
      setSelectedDomainId(null);
      setInvestigationContext(null);
      setIsNavOpen(false);
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ domainId: null, view: 'overview' }, '', '/workspace');
      }
      return;
    }

    setSelectedDomainId(newDomainId);
    setInvestigationContext(null);
    setIsNavOpen(false);
    if (typeof window !== 'undefined' && window.history) {
      let path = '/workspace';
      if (activeView === 'findings') path = '/workspace/findings';
      else if (activeView === 'changes') path = '/workspace/changes';
      else if (activeView === 'infrastructure') path = '/workspace/infrastructure';
      else if (activeView === 'memory') path = '/workspace/memory';

      const url = `${path}?domainId=${encodeURIComponent(newDomainId)}`;
      window.history.pushState({ domainId: newDomainId, view: activeView }, '', url);
    }
  };

  const navigateToView = (view: WorkspaceContextView, domainIdOverride?: string) => {
    setActiveView(view);
    setInvestigationContext(null);
    const resolvedDomainId = domainIdOverride || selectedDomainId || (view !== 'overview' ? (contextResolution.activeDomain?.id || userDomains[0]?.id) : null);
    if (resolvedDomainId) {
      setSelectedDomainId(resolvedDomainId);
    }
    if (typeof window !== 'undefined' && window.history) {
      const queryStr = resolvedDomainId ? `?domainId=${encodeURIComponent(resolvedDomainId)}` : '';
      let path = '/workspace';
      if (view === 'findings') path = '/workspace/findings';
      else if (view === 'changes') path = '/workspace/changes';
      else if (view === 'infrastructure') path = '/workspace/infrastructure';
      else if (view === 'memory') path = '/workspace/memory';

      window.history.pushState({ view, domainId: resolvedDomainId }, '', `${path}${queryStr}`);
    }
  };

  const navigateToInvestigation = (context: InvestigationContext | null) => {
    setInvestigationContext(context);
    if (typeof window !== 'undefined' && window.history) {
      if (context) {
        if (context.sourceType === 'historical_comparison') {
          const baseParam = context.baseSnapshotId ? `&baseSnapshotId=${encodeURIComponent(context.baseSnapshotId)}` : '';
          const targetParam = context.sourceId ? `&targetSnapshotId=${encodeURIComponent(context.sourceId)}` : '';
          const url = `/workspace/changes/compare?domainId=${encodeURIComponent(context.domainId)}${baseParam}${targetParam}`;
          window.history.pushState({ investigation: context }, '', url);
        } else {
          const url = buildInvestigationLink(
            context.domainId,
            context.sourceType,
            context.sourceId,
            context.returnPath || '/workspace',
            context.baseSnapshotId
          );
          window.history.pushState({ investigation: context }, '', url);
        }
      } else {
        const domainParam = selectedDomainId || activeDomain?.id;
        const queryStr = domainParam ? `?domainId=${encodeURIComponent(domainParam)}` : '';
        let path = '/workspace';
        if (activeView === 'findings') path = '/workspace/findings';
        else if (activeView === 'changes') path = '/workspace/changes';
        else if (activeView === 'infrastructure') path = '/workspace/infrastructure';
        else if (activeView === 'memory') path = '/workspace/memory';

        window.history.pushState({}, '', `${path}${queryStr}`);
      }
    }
  };

  const navigateToReturnPath = (returnPath?: string) => {
    if (returnPath && returnPath !== '/workspace') {
      if (returnPath === '/workspace/memory' || returnPath.includes('view=memory')) {
        setActiveView('memory');
        navigateToInvestigation(null);
        return;
      }
      if (returnPath === '/workspace/findings' || returnPath.includes('view=findings')) {
        setActiveView('findings');
        navigateToInvestigation(null);
        return;
      }
      if (returnPath === '/workspace/changes' || returnPath.includes('view=changes')) {
        setActiveView('changes');
        navigateToInvestigation(null);
        return;
      }
      if (returnPath === '/workspace/infrastructure' || returnPath.includes('view=infrastructure') || returnPath.includes('view=overview')) {
        setActiveView('infrastructure');
        navigateToInvestigation(null);
        return;
      }
      const queryStr = returnPath.includes('?') ? returnPath.split('?')[1] : '';
      const params = new URLSearchParams(queryStr);
      const prevType = params.get('sourceType') as InvestigationSourceType | null;
      const prevId = params.get('sourceId');
      const prevDomainId = params.get('domainId');
      const prevReturnPath = params.get('returnPath');
      if (prevType && prevId) {
        navigateToInvestigation({
          domainId: prevDomainId || activeDomain?.id || '',
          sourceType: prevType,
          sourceId: prevId,
          returnPath: prevReturnPath || '/workspace',
        });
        return;
      }
    }
    setActiveView('overview');
    navigateToInvestigation(null);
  };

  const investigationResolution = investigationContext && activeDomain
    ? resolveInvestigationTarget({
        context: {
          ...investigationContext,
          domainId: investigationContext.domainId || activeDomain.id,
        },
        activeDomainId: activeDomain.id,
        userDomains: contextResolution.availableDomains,
      })
    : null;

  // Handle Domain Deletion (WX-812)
  const handleDeleteDomain = async () => {
    if (!domainToDelete) return;
    const targetId = domainToDelete.id;
    const targetDomainName = domainToDelete.domainName;
    try {
      await deleteDomainMutation.mutateAsync(targetId);
      setDeletedDomainNotification(targetDomainName);
    } catch (err) {
      console.warn('Domain deletion warning (may already be removed):', err);
      setDeletedDomainNotification(targetDomainName);
    } finally {
      setDomainToDelete(null);

      // Handle active domain deletion fallback & URL synchronization
      const remainingDomains = (domainsQuery.data || []).filter((d) => d.id !== targetId);
      if (selectedDomainId === targetId || activeDomain?.id === targetId) {
        if (remainingDomains.length > 0) {
          setSelectedDomainId(remainingDomains[0].id);
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState(
              { domainId: remainingDomains[0].id, view: 'overview' },
              '',
              `/workspace?domainId=${encodeURIComponent(remainingDomains[0].id)}`
            );
          }
        } else {
          setSelectedDomainId(null);
          if (typeof window !== 'undefined' && window.history) {
            window.history.replaceState({}, '', '/workspace');
          }
        }
      }
      setInvestigationContext(null);
      setActiveView('overview');
    }
  };

  // 1. Loading state handled cleanly with Phase 0 LoadingState primitive
  if (isAuthLoading || (isAuthenticated && domainsQuery.isLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <LoadingState
          label="Opening Nebula Workspace..."
          description="Verifying authenticated infrastructure context"
        />
      </div>
    );
  }

  // 2. Unauthenticated ejections handled by ProtectedRoute
  if (!isAuthenticated) {
    return null;
  }

  const dark = theme === 'dark';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/workspace';

  const handleLogout = async () => {
    await logout();
    navigateTo('/');
  };

  const toggleTheme = () => {
    setMode(dark ? 'light' : 'dark');
  };

  const headerSubSection = investigationResolution?.isValid
    ? investigationResolution.sourceType === 'snapshot'
      ? 'Snapshot History'
      : investigationResolution.sourceType === 'historical_context'
        ? 'Historical Context'
        : 'Investigation'
    : activeView === 'memory'
      ? 'Memory'
      : activeView === 'findings'
        ? 'Findings'
        : activeView === 'changes'
          ? 'Changes'
          : activeView === 'infrastructure'
            ? 'Infrastructure'
            : null;

  return (
    <WorkspaceShell
      isNavOpen={isNavOpen}
      onNavClose={() => setIsNavOpen(false)}
      navigation={
        <WorkspaceNav
          currentPath={pathname}
          user={user}
          activeView={activeView}
          onSelectView={navigateToView}
          onItemClick={() => setIsNavOpen(false)}
        />
      }
      header={
        <WorkspaceHeader
          domain={isMultiDomainLanding ? null : (activeDomain?.domainName || null)}
          domains={userDomains}
          activeDomainId={isMultiDomainLanding ? null : (activeDomain?.id || null)}
          onSelectDomain={handleSelectDomain}
          onAddDomain={() => setIsAddDomainOpen(true)}
          onDeleteDomain={(domain) => setDomainToDelete(domain)}
          sectionName="Workspace"
          subSection={isMultiDomainLanding ? null : headerSubSection}
          isNavOpen={isNavOpen}
          onToggleNav={() => setIsNavOpen(!isNavOpen)}
          user={user}
          onLogout={handleLogout}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenSearch={() => setIsSearchOpen(true)}
        />
      }
    >
      <div className="relative min-h-[calc(100vh-4.5rem)] w-full flex-1 flex flex-col">
        <WorkspaceCanvas mode="workspace" className="flex-1 flex flex-col justify-between">
          {/* A. Zero-Domain First-Run Experience (WX-203 / WX-210-F) */}
          {contextResolution.requiresFirstRunSetup || userDomains.length === 0 ? (
            <FirstRunDomainSetup
              onDomainEstablished={(created) => {
                setSelectedDomainId(created.id);
                domainsQuery.refetch();
              }}
            />
          ) : isMultiDomainLanding ? (
            /* WX-1025: Workspace Intelligence Landing & Multi-Domain Brief */
            <WorkspaceIntelligenceLanding
              domains={userDomains}
              onSelectDomain={handleSelectDomain}
              onAddDomain={() => setIsAddDomainOpen(true)}
              onInvestigateChange={(domainId, changeId) => {
                setSelectedDomainId(domainId);
                navigateToInvestigation({
                  domainId,
                  sourceType: 'change',
                  sourceId: changeId,
                  returnPath: '/workspace',
                });
              }}
              onViewDomainChanges={(domainId) => {
                navigateToView('changes', domainId);
              }}
              onViewInfrastructureMemory={(domainId) => {
                const targetId = domainId || userDomains[0]?.id;
                if (targetId) {
                  navigateToView('memory', targetId);
                }
              }}
            />
          ) : !activeDomain ? (
            <FirstRunDomainSetup
              onDomainEstablished={(created) => {
                setSelectedDomainId(created.id);
                domainsQuery.refetch();
              }}
            />
          ) : investigationResolution?.isValid ? (
            /* B. Deep Investigation View (WX-302 / WX-303) */
            investigationResolution.sourceType === 'change' ? (
              <ChangeInvestigation
                domainId={activeDomain.id}
                domainName={activeDomain.domainName}
                changeId={investigationResolution.sourceId}
                onReturn={() => navigateToReturnPath(investigationResolution.returnPath)}
                onViewFinding={(findingId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'finding',
                    sourceId: findingId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'change', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
                onViewEvidence={(changeId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'evidence',
                    sourceId: changeId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'change', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
                onViewPreviousSnapshot={(snapshotId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'snapshot',
                    sourceId: snapshotId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'change', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
                onViewCurrentSnapshot={(snapshotId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'snapshot',
                    sourceId: snapshotId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'change', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
                onViewHistoricalContext={() => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'historical_context',
                    sourceId: activeDomain.id,
                    returnPath: buildInvestigationLink(activeDomain.id, 'change', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
              />
            ) : investigationResolution.sourceType === 'snapshot' ? (
              <SnapshotHistory
                domainId={activeDomain.id}
                domainName={activeDomain.domainName}
                snapshotId={investigationResolution.sourceId}
                onReturn={() => navigateToReturnPath(investigationResolution.returnPath)}
                onSelectSnapshot={(newSnapshotId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'snapshot',
                    sourceId: newSnapshotId,
                    returnPath: investigationResolution.returnPath,
                  });
                }}
                onViewEvidence={(findingOrEvidenceId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'evidence',
                    sourceId: findingOrEvidenceId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'snapshot', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
                onViewRelatedChange={(changeId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'change',
                    sourceId: changeId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'snapshot', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
                onViewRelatedFinding={(findingId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'finding',
                    sourceId: findingId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'snapshot', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
                onViewHistoricalContext={() => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'historical_context',
                    sourceId: activeDomain.id,
                    returnPath: buildInvestigationLink(activeDomain.id, 'snapshot', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
              />
            ) : investigationResolution.sourceType === 'historical_context' ? (
              <HistoricalContext
                domainId={activeDomain.id}
                domainName={activeDomain.domainName}
                onReturn={() => navigateToReturnPath(investigationResolution.returnPath)}
                onViewSnapshot={(snapshotId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'snapshot',
                    sourceId: snapshotId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'historical_context', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
                onInvestigateChange={(changeId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'change',
                    sourceId: changeId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'historical_context', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
                onViewEvidence={(evidenceId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'evidence',
                    sourceId: evidenceId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'historical_context', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
              />
            ) : investigationResolution.sourceType === 'historical_comparison' ? (
              <HistoricalComparisonSurface
                domainId={activeDomain.id}
                domainName={activeDomain.domainName}
                baseSnapshotId={investigationContext?.baseSnapshotId || null}
                targetSnapshotId={investigationResolution.sourceId}
                onReturn={() => navigateToReturnPath(investigationResolution.returnPath)}
                onSelectSnapshots={(newBaseId, newTargetId) => {
                  if (typeof window !== 'undefined' && window.history) {
                    const url = `/workspace/changes/compare?domainId=${encodeURIComponent(activeDomain.id)}&baseSnapshotId=${encodeURIComponent(newBaseId)}&targetSnapshotId=${encodeURIComponent(newTargetId)}`;
                    window.history.replaceState(
                      { investigation: { ...investigationContext, sourceId: newTargetId, baseSnapshotId: newBaseId } },
                      '',
                      url
                    );
                  }
                }}
                onInvestigateChange={(changeId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'change',
                    sourceId: changeId,
                    returnPath: `/workspace/changes/compare?domainId=${encodeURIComponent(activeDomain.id)}&baseSnapshotId=${encodeURIComponent(investigationContext?.baseSnapshotId || '')}&targetSnapshotId=${encodeURIComponent(investigationResolution.sourceId)}`,
                  });
                }}
                onViewEvidence={(evidenceId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'evidence',
                    sourceId: evidenceId,
                    returnPath: `/workspace/changes/compare?domainId=${encodeURIComponent(activeDomain.id)}&baseSnapshotId=${encodeURIComponent(investigationContext?.baseSnapshotId || '')}&targetSnapshotId=${encodeURIComponent(investigationResolution.sourceId)}`,
                  });
                }}
              />
            ) : investigationResolution.sourceType === 'evidence' ? (
              <ObservationEvidenceSurface
                domainId={activeDomain.id}
                domainName={activeDomain.domainName}
                findingId={investigationResolution.sourceId}
                onReturn={() => navigateToReturnPath(investigationResolution.returnPath)}
                onViewSnapshot={(snapshotId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'snapshot',
                    sourceId: snapshotId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'evidence', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
              />
            ) : (
              <FindingInvestigation
                domainId={activeDomain.id}
                domainName={activeDomain.domainName}
                findingId={investigationResolution.sourceId}
                onReturn={() => navigateToReturnPath(investigationResolution.returnPath)}
                onViewSnapshot={(snapshotId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'snapshot',
                    sourceId: snapshotId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'finding', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
                onViewEvidence={() => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'evidence',
                    sourceId: investigationResolution.sourceId,
                    returnPath: buildInvestigationLink(activeDomain.id, 'finding', investigationResolution.sourceId, investigationResolution.returnPath),
                  });
                }}
              />
            )
          ) : activeView === 'findings' ? (
            /* C. Infrastructure Findings Experience (What requires investigation?) */
            <div className="w-full space-y-8" data-testid="infrastructure-findings-surface">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#EEEEEB] dark:border-border-divider">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl font-display font-medium text-foreground">
                      Infrastructure Findings
                    </h2>
                    <span
                      className="font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border border-[#B9E5D6] text-[#178A68] bg-[#EAF7F2]"
                      data-testid="findings-source-badge"
                    >
                      CURRENT VERIFIED STATE
                    </span>
                  </div>
                  <p className="text-xs text-[#5F625F] dark:text-muted-foreground pt-1">
                    Authoritative findings and security observations from current verified understanding for {activeDomain.domainName}
                  </p>
                </div>
                <DomainIdentity
                  domain={activeDomain.domainName}
                  size="compact"
                />
              </div>

              <div className="space-y-6">
                <PrimaryStory
                  domainId={activeDomain.id}
                  domainName={activeDomain.domainName}
                  onInvestigate={(findingId) => {
                    navigateToInvestigation({
                      domainId: activeDomain.id,
                      sourceType: 'finding',
                      sourceId: findingId,
                      returnPath: '/workspace/findings',
                    });
                  }}
                  onViewEvidence={(lineage) => {
                    navigateToInvestigation({
                      domainId: activeDomain.id,
                      sourceType: 'evidence',
                      sourceId: lineage.observationKey,
                      returnPath: '/workspace/findings',
                    });
                  }}
                />
                <SecondaryStories
                  domainId={activeDomain.id}
                  domainName={activeDomain.domainName}
                  onInvestigate={(findingId) => {
                    navigateToInvestigation({
                      domainId: activeDomain.id,
                      sourceType: 'finding',
                      sourceId: findingId,
                      returnPath: '/workspace/findings',
                    });
                  }}
                  onViewEvidence={(lineage) => {
                    navigateToInvestigation({
                      domainId: activeDomain.id,
                      sourceType: 'evidence',
                      sourceId: lineage.observationKey,
                      returnPath: '/workspace/findings',
                    });
                  }}
                />
              </div>
            </div>
          ) : activeView === 'changes' ? (
            /* D. Infrastructure Changes Experience (What changed?) */
            <div className="w-full space-y-8" data-testid="infrastructure-changes-surface">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-hairline">
                <div>
                  <h2 className="text-xl font-display font-medium text-foreground">
                    Infrastructure Changes
                  </h2>
                  <p className="text-xs text-muted-foreground pt-0.5">
                    Meaningful differences detected between verified understandings for {activeDomain.domainName}
                  </p>
                </div>
                <DomainIdentity
                  domain={activeDomain.domainName}
                  size="compact"
                />
              </div>

              <ChangesTimeline
                domainId={activeDomain.id}
                domainName={activeDomain.domainName}
                domains={userDomains}
                onSelectDomain={handleSelectDomain}
                onInvestigateChange={(changeId, targetDomainId) => {
                  const targetDomain = targetDomainId || activeDomain.id;
                  navigateToInvestigation({
                    domainId: targetDomain,
                    sourceType: 'change',
                    sourceId: changeId,
                    returnPath: '/workspace/changes',
                  });
                }}
                onViewSnapshot={(snapshotId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'snapshot',
                    sourceId: snapshotId,
                    returnPath: '/workspace/changes',
                  });
                }}
                onViewEvidence={(evidenceId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'evidence',
                    sourceId: evidenceId,
                    returnPath: '/workspace/changes',
                  });
                }}
                onViewInfrastructure={() => navigateToView('infrastructure')}
                onCompareSnapshots={(baseSnapshotId, targetSnapshotId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'historical_comparison',
                    sourceId: targetSnapshotId,
                    baseSnapshotId: baseSnapshotId,
                    returnPath: '/workspace/changes',
                  });
                }}
              />
            </div>
          ) : activeView === 'infrastructure' ? (
            /* E. Contextual Infrastructure Overview Surface (What exists?) */
            <div className="w-full space-y-8" data-testid="infrastructure-overview-surface">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-hairline">
                <div>
                  <h2 className="text-xl font-display font-medium text-foreground">
                    Infrastructure Overview
                  </h2>
                  <p className="text-xs text-muted-foreground pt-0.5">
                    Observed perimeter topology, DNS, HTTP, and TLS certificates for {activeDomain.domainName}
                  </p>
                </div>
                <DomainIdentity
                  domain={activeDomain.domainName}
                  size="compact"
                />
              </div>

              <InfrastructureOverview
                domainId={activeDomain.id}
                domainName={activeDomain.domainName}
                onViewSnapshot={(snapshotId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'snapshot',
                    sourceId: snapshotId,
                    returnPath: '/workspace/infrastructure',
                  });
                }}
                onViewFinding={(findingId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'finding',
                    sourceId: findingId,
                    returnPath: '/workspace/infrastructure',
                  });
                }}
                onViewAllFindings={() => navigateToView('findings')}
              />
            </div>
          ) : activeView === 'memory' ? (
            /* F. Contextual Infrastructure Memory Surface (How has it evolved?) */
            <div className="w-full space-y-8" data-testid="infrastructure-memory-surface">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-hairline">
                <div>
                  <h2 className="text-xl font-display font-medium text-foreground">
                    Infrastructure Memory
                  </h2>
                  <p className="text-xs text-muted-foreground pt-0.5">
                    Historical context and snapshot lineage for {activeDomain.domainName}
                  </p>
                </div>
                <DomainIdentity
                  domain={activeDomain.domainName}
                  size="compact"
                />
              </div>

              <InfrastructureTimeline
                domainId={activeDomain.id}
                domainName={activeDomain.domainName}
                onInvestigateChange={(changeId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'change',
                    sourceId: changeId,
                    returnPath: '/workspace/memory',
                  });
                }}
                onViewSnapshot={(snapshotId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'snapshot',
                    sourceId: snapshotId,
                    returnPath: '/workspace/memory',
                  });
                }}
                onViewEvidence={(evidenceId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'evidence',
                    sourceId: evidenceId,
                    returnPath: '/workspace/memory',
                  });
                }}
                onViewHistoricalContext={() => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'historical_context',
                    sourceId: activeDomain.id,
                    returnPath: '/workspace/memory',
                  });
                }}
              />
            </div>
          ) : (
            /* G. Primary Workspace: Overview Experience (What is happening right now?) */
            <ReturningWorkspaceEntry
              activeDomain={activeDomain}
              availableDomains={contextResolution.availableDomains}
              onSelectDomain={handleSelectDomain}
              onViewMemory={() => navigateToView('memory')}
              onViewOverview={() => navigateToView('infrastructure')}
            >
              <CurrentIntelligence
                domainId={activeDomain.id}
                domainName={activeDomain.domainName}
                onInvestigate={(findingId) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'finding',
                    sourceId: findingId,
                    returnPath: '/workspace',
                  });
                }}
                onViewEvidence={(lineage) => {
                  navigateToInvestigation({
                    domainId: activeDomain.id,
                    sourceType: 'evidence',
                    sourceId: lineage.observationKey,
                    returnPath: '/workspace',
                  });
                }}
                onViewOverview={() => navigateToView('infrastructure')}
                onViewMemory={() => navigateToView('memory')}
              />
            </ReturningWorkspaceEntry>
          )}

          {/* Modal Domain Entry Dialog for Additional Domains */}
          {isAddDomainOpen && (
            <DomainEntryDialog
              isFirstDomain={false}
              isModal={true}
              isDismissable={true}
              onClose={() => setIsAddDomainOpen(false)}
              onDomainEstablished={(created) => {
                setSelectedDomainId(created.id);
                setIsAddDomainOpen(false);
                domainsQuery.refetch();
              }}
            />
          )}

          {/* Controlled Delete Domain Confirmation Dialog */}
          <DeleteDomainDialog
            isOpen={Boolean(domainToDelete)}
            domain={domainToDelete}
            isDeleting={deleteDomainMutation.isPending}
            onConfirm={handleDeleteDomain}
            onCancel={() => setDomainToDelete(null)}
          />

          {/* Cross-Workspace Global Search Dialog (WX-604) */}
          <WorkspaceSearchDialog
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            domains={domainsQuery.data || []}
            activeDomainId={activeDomain?.id}
            onSelectResult={(item, targetDomainId) => {
              setSelectedDomainId(targetDomainId);
              const destination = resolveSearchDestination(item, targetDomainId);
              const target = destination.navigationTarget;
              if (target.resourceType && target.resourceId) {
                navigateToInvestigation({
                  domainId: target.domainId,
                  sourceType: target.resourceType as InvestigationSourceType,
                  sourceId: target.resourceId,
                  returnPath: target.returnPath || '/workspace',
                });
              } else if (target.experience) {
                const exp: WorkspaceContextView =
                  target.experience === 'current'
                    ? 'overview'
                    : target.experience === 'memory'
                    ? 'memory'
                    : 'infrastructure';
                navigateToView(exp, target.domainId);
              } else {
                setActiveView('overview');
                setInvestigationContext(null);
              }
            }}
          />

          {/* Bottom Toast Notification on Successful Domain Deletion (WX-812) */}
          <DomainDeletedToast
            domainName={deletedDomainNotification}
            onClose={() => setDeletedDomainNotification(null)}
          />

          {/* F. Frozen Workspace Signature Footer (WX-210-F) */}
          <WorkspaceFooter />
        </WorkspaceCanvas>
      </div>
    </WorkspaceShell>
  );
};

WorkspacePage.displayName = 'WorkspacePage';
export default WorkspacePage;
