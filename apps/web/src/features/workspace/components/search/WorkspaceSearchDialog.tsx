import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  X,
  Globe,
  AlertTriangle,
  GitCommit,
  FileText,
  Activity,
  ArrowRight,
  Loader2,
  Server,
  ShieldAlert,
  CornerDownLeft,
  type LucideIcon,
} from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { useSearch } from '../../../../hooks/queries/useSearch';
import {
  resolveSearchState,
  groupSearchResults,
  rankSearchResults,
  getNextSearchActiveIndex,
  resolveSearchDestination,
  SEARCH_UI_COPY,
} from '../../contracts/search.contract';
import type { WorkspaceSearchDialogProps } from './WorkspaceSearchDialog.types';
import type {
  SearchItemDto,
  SearchItemType,
  SearchQueryOptions,
} from '../../../../types/api/search.dto';

const TYPE_CONFIG: Record<
  SearchItemType,
  { label: string; icon: LucideIcon; badgeClass: string }
> = {
  DOMAIN: {
    label: 'Domain',
    icon: Globe,
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
  FINDING: {
    label: 'Finding',
    icon: AlertTriangle,
    badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  CHANGE: {
    label: 'Change',
    icon: GitCommit,
    badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  TIMELINE: {
    label: 'Change',
    icon: GitCommit,
    badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  },
  INFRASTRUCTURE: {
    label: 'Infrastructure',
    icon: Server,
    badgeClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  },
  BRIEF: {
    label: 'Brief',
    icon: FileText,
    badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  },
  INVESTIGATION: {
    label: 'Investigation',
    icon: ShieldAlert,
    badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  },
  ACTIVITY: {
    label: 'Activity',
    icon: Activity,
    badgeClass: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  },
};

const PRIMARY_FACET_TYPES: readonly { type: SearchItemType | 'ALL'; label: string }[] = [
  { type: 'ALL', label: 'All' },
  { type: 'DOMAIN', label: 'Domains' },
  { type: 'FINDING', label: 'Findings' },
  { type: 'CHANGE', label: 'Changes' },
  { type: 'INFRASTRUCTURE', label: 'Infrastructure' },
  { type: 'BRIEF', label: 'Intelligence' },
  { type: 'ACTIVITY', label: 'Activity' },
];

const SEVERITY_FACETS: readonly ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO')[] = [
  'CRITICAL',
  'HIGH',
  'MEDIUM',
  'LOW',
  'INFO',
];

const TIME_FACETS: readonly { key: '24h' | '7d' | '30d'; label: string }[] = [
  { key: '24h', label: 'Past 24h' },
  { key: '7d', label: 'Past 7d' },
  { key: '30d', label: 'Past 30d' },
];

/**
 * Production-Grade Nebula Workspace Search Dialog (WX-401 / WX-402 / WX-403 / WX-404).
 *
 * Fast, calm, precise, keyboard-first global discovery and faceting layer:
 * - ⌘K / Ctrl+K activation with automatic focus and focus restoration
 * - Contextual filtering across entity type, domain, finding severity, and time range
 * - 200ms debounced backend retrieval with stale response protection
 * - Progressive disclosure of contextual filters and authoritative counts
 * - Single 'Clear filters' action preserving query text
 * - Deterministic ranking and circular keyboard navigation (↑ / ↓ / Enter / Esc)
 */
export const WorkspaceSearchDialog: React.FC<WorkspaceSearchDialogProps> = ({
  isOpen,
  onClose,
  onSelectResult,
  domains,
  className = '',
}) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // Facet filter states (WX-404)
  const [selectedType, setSelectedType] = useState<SearchItemType | 'ALL'>('ALL');
  const [selectedDomainId, setSelectedDomainId] = useState<string | undefined>(undefined);
  const [selectedSeverity, setSelectedSeverity] = useState<
    'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | undefined
  >(undefined);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | undefined>(
    undefined
  );

  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const itemElementsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // 1. Debounce query input (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // 2. Focus management & state reset on open/close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    } else {
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
        previousFocusRef.current.focus();
      }
      setQuery('');
      setDebouncedQuery('');
      setActiveIndex(0);
      setSelectedType('ALL');
      setSelectedDomainId(undefined);
      setSelectedSeverity(undefined);
      setSelectedTimeRange(undefined);
    }
  }, [isOpen]);

  // 3. Map domain names to IDs for fast lookup
  const domainNameToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of domains) {
      map.set(d.domainName.toLowerCase(), d.id);
    }
    return map;
  }, [domains]);

  // 4. TanStack Query Hook with filters
  const searchOptions: SearchQueryOptions = useMemo(() => {
    return {
      type: selectedType !== 'ALL' ? selectedType : undefined,
      domainId: selectedDomainId,
      severity: selectedSeverity,
      timeRange: selectedTimeRange,
      enabled: isOpen && debouncedQuery.length > 0,
    };
  }, [isOpen, debouncedQuery, selectedType, selectedDomainId, selectedSeverity, selectedTimeRange]);

  const isDebouncing = isOpen && query.trim() !== debouncedQuery && query.trim().length > 0;
  const searchQuery = useSearch(debouncedQuery, searchOptions);

  // 5. Authoritative State Resolution
  const searchState = resolveSearchState({
    query: debouncedQuery,
    isLoading: searchQuery.isLoading || isDebouncing,
    isError: searchQuery.isError,
    data: searchQuery.data,
  });

  // 6. Group and Rank Search Results (Defensive Malformed Result Filter)
  const rawResults = useMemo(() => {
    const data = searchQuery.data?.data;
    if (!Array.isArray(data)) return [];
    return data.filter(
      (item): item is SearchItemDto =>
        Boolean(item && typeof item.id === 'string' && typeof item.type === 'string' && item.title)
    );
  }, [searchQuery.data]);

  const rankedResults = useMemo(() => {
    return rankSearchResults(rawResults, debouncedQuery);
  }, [rawResults, debouncedQuery]);

  const groupedResults = useMemo(() => {
    return groupSearchResults(rankedResults);
  }, [rankedResults]);

  // 7. Flatten items for unified linear keyboard traversal
  const flatItems = useMemo(() => {
    const items: SearchItemDto[] = [];
    for (const group of groupedResults) {
      for (const item of group.items) {
        items.push(item);
      }
    }
    return items;
  }, [groupedResults]);

  // Reset active index when query, filters, or results change, with safe index boundary clamping
  useEffect(() => {
    setActiveIndex((prev) => {
      if (flatItems.length === 0) return 0;
      if (prev >= flatItems.length) return 0;
      return prev;
    });
  }, [debouncedQuery, selectedType, selectedDomainId, selectedSeverity, selectedTimeRange, flatItems.length]);

  // Ensure active keyboard item scrolls into view
  useEffect(() => {
    if (flatItems.length > 0 && itemElementsRef.current[activeIndex]) {
      itemElementsRef.current[activeIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [activeIndex, flatItems.length]);

  // Check if any filters are active
  const hasActiveFilters =
    selectedType !== 'ALL' ||
    Boolean(selectedDomainId) ||
    Boolean(selectedSeverity) ||
    Boolean(selectedTimeRange);

  const handleClearFilters = () => {
    setSelectedType('ALL');
    setSelectedDomainId(undefined);
    setSelectedSeverity(undefined);
    setSelectedTimeRange(undefined);
  };

  // 8. Result selection handler
  const handleResultClick = useCallback(
    (item: SearchItemDto) => {
      let fallbackDomainId = domains.length > 0 ? domains[0]?.id : undefined;
      const matchedDomainId = domainNameToIdMap.get((item.domainName || '').toLowerCase());
      if (matchedDomainId) {
        fallbackDomainId = matchedDomainId;
      }
      if (item.type === 'DOMAIN' && !item.domainId) {
        fallbackDomainId = item.id;
      }

      const destination = resolveSearchDestination(item, fallbackDomainId);
      if (destination.targetDomainId) {
        onSelectResult(item, destination.targetDomainId);
        onClose();
      }
    },
    [domainNameToIdMap, domains, onSelectResult, onClose]
  );

  // 9. Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => getNextSearchActiveIndex(prev, flatItems.length, 'DOWN'));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => getNextSearchActiveIndex(prev, flatItems.length, 'UP'));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems.length > 0 && flatItems[activeIndex]) {
        handleResultClick(flatItems[activeIndex]!);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  let flatItemIndexCounter = 0;
  const facetCounts = searchQuery.data?.facets;
  const isIdle = searchState === 'IDLE';

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-14 sm:pt-20 px-4 bg-black/40 transition-opacity duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Workspace Infrastructure Search"
    >
      <div
        className={`w-full max-w-[720px] bg-white dark:bg-[#14171C] border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative z-10 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="h-14 sm:h-16 px-5 border-b border-border flex items-center gap-3.5 bg-[#FAFAFA] dark:bg-[#181C22]">
          <Icon icon={Search} size="default" className="text-muted-foreground/70 flex-shrink-0 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={searchState === 'READY'}
            aria-controls="workspace-search-results"
            aria-activedescendant={
              flatItems[activeIndex] ? `search-item-${flatItems[activeIndex]?.id}` : undefined
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={SEARCH_UI_COPY.SEARCH_PLACEHOLDER}
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/50 text-base sm:text-lg focus:outline-none font-sans leading-none"
            aria-label="Search query"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setDebouncedQuery('');
                inputRef.current?.focus();
              }}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md cursor-pointer transition-colors"
              aria-label="Clear query"
            >
              <Icon icon={X} size="small" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-white dark:bg-[#14171C] border border-border rounded">
            ESC
          </kbd>
        </div>

        {/* Primary Type Facets Segmented Control Bar (Only shown after query is entered) */}
        {!isIdle && (
          <div className="px-5 py-2.5 border-b border-border bg-white dark:bg-[#14171C] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {PRIMARY_FACET_TYPES.map((f) => {
              const isSelected = selectedType === f.type;
              const count =
                f.type === 'ALL'
                  ? searchQuery.data?.total
                  : facetCounts?.types?.[f.type];

              return (
                <button
                  key={f.type}
                  type="button"
                  onClick={() => setSelectedType(f.type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-primary/10 text-primary border border-primary/25 font-semibold'
                      : 'bg-[#F7F8FA] dark:bg-[#181C22] border border-border text-muted-foreground hover:text-foreground hover:bg-[#F0F2F5] dark:hover:bg-[#1E222A] font-normal'
                  }`}
                >
                  <span>{f.label}</span>
                  {typeof count === 'number' && count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-primary/20 text-primary font-semibold'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Contextual Secondary Filters (Only shown after query and when relevant) */}
        {!isIdle &&
          (selectedType === 'FINDING' ||
            selectedType === 'ALL' ||
            domains.length > 1) && (
            <div className="px-5 py-2 border-b border-border bg-[#FAFAFA] dark:bg-[#181C22] flex items-center flex-wrap gap-2 text-xs">
              {/* Domain Filter */}
              {domains.length > 1 && (
                <select
                  value={selectedDomainId || ''}
                  onChange={(e) => setSelectedDomainId(e.target.value || undefined)}
                  aria-label="Filter by Domain"
                  className="bg-white dark:bg-[#14171C] border border-border rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer font-mono"
                >
                  <option value="">All Domains</option>
                  {domains.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.domainName}
                    </option>
                  ))}
                </select>
              )}

              {/* Severity Filter (When Findings relevant) */}
              {(selectedType === 'FINDING' ||
                (facetCounts?.severities &&
                  Object.keys(facetCounts.severities).length > 0)) && (
                <select
                  value={selectedSeverity || ''}
                  onChange={(e) =>
                    setSelectedSeverity(
                      (e.target.value as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO') ||
                        undefined
                    )
                  }
                  aria-label="Filter by Severity"
                  className="bg-white dark:bg-[#14171C] border border-border rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer font-mono"
                >
                  <option value="">All Severities</option>
                  {SEVERITY_FACETS.map((sev) => (
                    <option key={sev} value={sev}>
                      {sev}
                    </option>
                  ))}
                </select>
              )}

              {/* Time Filter */}
              <select
                value={selectedTimeRange || ''}
                onChange={(e) =>
                  setSelectedTimeRange(
                    (e.target.value as '24h' | '7d' | '30d') || undefined
                  )
                }
                aria-label="Filter by Time"
                className="bg-white dark:bg-[#14171C] border border-border rounded-md px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer font-mono"
              >
                <option value="">Any Time</option>
                {TIME_FACETS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>

              {/* Active Filters Clear Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[11px] font-medium text-primary hover:underline ml-auto cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}

        {/* Results Body */}
        <div
          id="workspace-search-results"
          role="listbox"
          aria-label="Workspace search results"
          className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5 min-h-[220px] bg-white dark:bg-[#14171C]"
        >
          {/* Screen Reader Status Live Region */}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {searchState === 'LOADING' && SEARCH_UI_COPY.LOADING_LABEL}
            {searchState === 'NO_RESULTS' &&
              (hasActiveFilters
                ? 'No matching results for current filters.'
                : SEARCH_UI_COPY.NO_RESULTS_TITLE(debouncedQuery || query))}
            {searchState === 'READY' &&
              `${flatItems.length} search result${flatItems.length === 1 ? '' : 's'} available.`}
            {searchState === 'ERROR' && SEARCH_UI_COPY.ERROR_TITLE}
          </div>

          {/* State: IDLE */}
          {searchState === 'IDLE' && (
            <div className="py-14 text-center space-y-2.5">
              <div className="w-10 h-10 rounded-full bg-[#F7F8FA] dark:bg-[#181C22] border border-border flex items-center justify-center mx-auto mb-2 text-muted-foreground/50">
                <Icon icon={Search} size="default" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {SEARCH_UI_COPY.EMPTY_TITLE}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                {SEARCH_UI_COPY.EMPTY_DESCRIPTION}
              </p>
            </div>
          )}

          {/* State: LOADING */}
          {searchState === 'LOADING' && (
            <div className="py-14 flex flex-col items-center justify-center gap-3 text-center">
              <Icon icon={Loader2} size="default" className="animate-spin text-primary w-5 h-5" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-foreground">
                  {SEARCH_UI_COPY.LOADING_LABEL}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {SEARCH_UI_COPY.LOADING_DESCRIPTION}
                </p>
              </div>
            </div>
          )}

          {/* State: NO_RESULTS */}
          {searchState === 'NO_RESULTS' && (
            <div className="py-14 text-center space-y-3">
              <p className="text-sm font-medium text-foreground">
                {hasActiveFilters
                  ? `No matching ${
                      selectedType !== 'ALL'
                        ? selectedType.toLowerCase() + ' results'
                        : 'results'
                    }`
                  : SEARCH_UI_COPY.NO_RESULTS_TITLE(debouncedQuery || query)}
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                {hasActiveFilters
                  ? 'Try clearing active filters or broadening your search criteria.'
                  : SEARCH_UI_COPY.NO_RESULTS_DESCRIPTION}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-[#F7F8FA] dark:bg-[#181C22] hover:bg-muted text-foreground cursor-pointer transition-colors shadow-xs"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* State: ERROR */}
          {searchState === 'ERROR' && (
            <div className="py-14 text-center space-y-3">
              <p className="text-sm font-medium text-destructive">
                {SEARCH_UI_COPY.ERROR_TITLE}
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {SEARCH_UI_COPY.ERROR_DESCRIPTION}
              </p>
              <button
                type="button"
                onClick={() => searchQuery.refetch()}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg border border-border bg-[#F7F8FA] dark:bg-[#181C22] hover:bg-muted text-foreground cursor-pointer transition-colors shadow-xs"
              >
                Retry Search
              </button>
            </div>
          )}

          {/* State: READY (Grouped & Ranked Results) */}
          {searchState === 'READY' &&
            groupedResults.map((group) => {
              return (
                <div key={group.category} className="space-y-1.5">
                  <div className="flex items-center justify-between px-2 pb-1.5 border-b border-border">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-muted-foreground">
                      {group.label}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground/60 font-medium">
                      {group.items.length < 10 ? `0${group.items.length}` : group.items.length}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const itemGlobalIndex = flatItemIndexCounter++;
                      const isActive = itemGlobalIndex === activeIndex;
                      const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.DOMAIN;
                      const ItemIcon = config.icon;

                      return (
                        <button
                          key={`${item.type}-${item.id}`}
                          id={`search-item-${item.id}`}
                          role="option"
                          aria-selected={isActive}
                          ref={(el) => {
                            itemElementsRef.current[itemGlobalIndex] = el;
                          }}
                          type="button"
                          onClick={() => handleResultClick(item)}
                          onMouseEnter={() => setActiveIndex(itemGlobalIndex)}
                          className={`w-full py-3 px-3.5 rounded-xl text-left transition-colors flex items-start justify-between gap-3.5 group cursor-pointer ${
                            isActive
                              ? 'bg-[#F2F4F7] dark:bg-[#1E232B] border border-border ring-1 ring-border/50'
                              : 'bg-white dark:bg-[#14171C] hover:bg-[#F7F8FA] dark:hover:bg-[#181C22] border border-transparent hover:border-border/40'
                          }`}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${config.badgeClass}`}
                              >
                                <Icon icon={ItemIcon} size="small" className="w-3 h-3" />
                                {item.subtitle || config.label}
                              </span>
                              <span className="font-mono text-xs text-muted-foreground/70 truncate">
                                {item.domainName}
                              </span>
                            </div>

                            <p
                              className={`text-sm font-medium truncate transition-colors ${
                                isActive ? 'text-primary font-semibold' : 'text-foreground'
                              }`}
                            >
                              {item.title}
                            </p>

                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-2 flex-shrink-0">
                            {isActive && (
                              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground bg-white dark:bg-[#14171C] border border-border rounded">
                                <Icon icon={CornerDownLeft} size="small" className="w-2.5 h-2.5" />
                                <span>SELECT</span>
                              </kbd>
                            )}
                            <Icon
                              icon={ArrowRight}
                              size="small"
                              className={`transition-all ${
                                isActive
                                  ? 'text-primary translate-x-0.5'
                                  : 'text-muted-foreground/40 opacity-50 group-hover:opacity-100'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>

        {/* Footer Info & Keyboard Affordance */}
        <div className="px-5 py-3 bg-[#FAFAFA] dark:bg-[#181C22] border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            {searchState === 'READY' && searchQuery.data && (
              <span>
                {searchQuery.data.total} result{searchQuery.data.total === 1 ? '' : 's'} found
              </span>
            )}
            <span className={searchState === 'READY' ? 'hidden sm:inline text-muted-foreground/40' : ''}>
              {searchState === 'READY' ? '·' : ''} Authoritative discovery
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="text-foreground font-medium">↑ ↓</span>
              <span>Navigate</span>
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1">
              <span className="text-foreground font-medium">↵</span>
              <span>Select</span>
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span className="flex items-center gap-1">
              <span className="text-foreground font-medium">ESC</span>
              <span>Close</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

WorkspaceSearchDialog.displayName = 'WorkspaceSearchDialog';
