import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { ChevronDown, Plus, Search, Check, Trash2 } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { DomainFavicon } from '../identity';
import type { DomainDto } from '../../../../types/api';

export interface DomainContextSwitcherProps {
  readonly domains?: readonly DomainDto[];
  readonly activeDomainId?: string | null;
  readonly onSelectDomain?: (domainId: string) => void;
  readonly onAddDomain?: () => void;
  readonly onDeleteDomain?: (domain: DomainDto) => void;
  readonly className?: string;
}

/**
 * Authoritative Domain Context Switcher (WX-902).
 *
 * Implements the canonical global domain context selector:
 * - Persistent presence in the global header
 * - Unmistakable active domain indication with health/active status
 * - Fast domain search & switching (<100ms)
 * - Accessible listbox semantics with full keyboard navigation (Arrows, Enter, Escape)
 * - Strictly context-focused without becoming a duplicate navigation drawer
 */
export const DomainContextSwitcher: React.FC<DomainContextSwitcherProps> = ({
  domains = [],
  activeDomainId,
  onSelectDomain,
  onAddDomain,
  onDeleteDomain,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const activeDomain = domains.find((d) => d.id === activeDomainId) || null;
  const domainCount = domains.length;
  const canAddDomain = domainCount < 4;

  const filteredDomains = domains.filter((d) =>
    d.domainName.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
        setFocusedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      return () => document.removeEventListener('mousedown', handleOutsideClick);
    }
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      if (searchInputRef.current && domainCount > 2) {
        searchInputRef.current.focus();
      }
    }
  }, [isOpen, domainCount]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next) {
        setSearchQuery('');
        setFocusedIndex(-1);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (domainId: string) => {
      onSelectDomain?.(domainId);
      setIsOpen(false);
      setSearchQuery('');
      setFocusedIndex(-1);
      triggerRef.current?.focus();
    },
    [onSelectDomain]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery('');
      setFocusedIndex(-1);
      triggerRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % (filteredDomains.length || 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev <= 0 ? filteredDomains.length - 1 : prev - 1
      );
      return;
    }

    if (e.key === 'Enter' && focusedIndex >= 0 && focusedIndex < filteredDomains.length) {
      e.preventDefault();
      handleSelect(filteredDomains[focusedIndex].id);
      return;
    }
  };

  if (domainCount === 0) {
    return null;
  }

  const isAllDomainsActive = !activeDomainId;

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        data-testid="domain-context-switcher-trigger"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={`Active domain context: ${activeDomain?.domainName || 'All Monitored Domains'}`}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[#E7E7E3] dark:border-border bg-[#FFFFFF] dark:bg-card hover:bg-[#FCFCFA] hover:border-[#DADAD5] text-xs font-mono text-foreground transition-all duration-150 cursor-pointer focus-ring shadow-[0_1px_2px_rgba(16,24,20,0.035)] select-none"
      >
        {activeDomain ? (
          <DomainFavicon domain={activeDomain.domainName} size="compact" />
        ) : (
          <span className="w-4 h-4 rounded bg-[#EAF7F2] border border-[#B9E5D6] text-[#178A68] flex items-center justify-center text-[10px] font-bold">
            {domainCount}
          </span>
        )}
        <span className="font-medium tracking-tight truncate max-w-[140px] sm:max-w-[200px]">
          {activeDomain?.domainName || 'All Monitored Domains'}
        </span>
        <Icon
          icon={ChevronDown}
          size="small"
          className={`text-[#5F625F] dark:text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Configured infrastructure domains"
          className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 sm:w-80 bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-xl shadow-[0_8px_24px_rgba(16,24,20,0.08)] z-50 p-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          {/* Search Box (when > 2 domains) */}
          {domainCount > 2 && (
            <div className="relative px-1 pt-1">
              <Icon
                icon={Search}
                size="small"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5F625F] pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search domains..."
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border rounded-lg text-foreground placeholder:text-[#5F625F]/60 focus:outline-none focus:ring-1 focus:ring-[#3568C8]/40 focus:border-[#3568C8] transition-all"
              />
            </div>
          )}

          {/* All Domains Overview Option */}
          <div className="px-1">
            <div
              role="option"
              aria-selected={isAllDomainsActive}
              onClick={() => handleSelect('')}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                isAllDomainsActive
                  ? 'bg-[#FAFAF8] dark:bg-surface-secondary text-foreground border border-[#E7E7E3] dark:border-border font-medium'
                  : 'text-[#5F625F] dark:text-muted-foreground hover:text-foreground hover:bg-[#F4F4F1] dark:hover:bg-surface-metadata'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="w-5 h-5 rounded bg-[#EAF7F2] border border-[#B9E5D6] text-[#178A68] flex items-center justify-center text-[10px] font-bold shrink-0">
                  {domainCount}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono font-medium tracking-tight truncate text-foreground">
                    All Monitored Domains
                  </p>
                  <p className="text-[10px] text-[#5F625F] dark:text-muted-foreground tracking-normal">
                    Workspace Intelligence Overview
                  </p>
                </div>
              </div>
              {isAllDomainsActive && (
                <Icon icon={Check} size="small" className="text-[#178A68] mr-1 shrink-0" />
              )}
            </div>
          </div>

          {/* Domain List */}
          <div className="max-h-56 overflow-y-auto space-y-1 py-1 border-t border-[#EEEEEB] dark:border-border-divider" tabIndex={-1}>
            {filteredDomains.length === 0 ? (
              <p className="px-3 py-3 text-xs text-[#5F625F] dark:text-muted-foreground text-center">
                No matching domains found.
              </p>
            ) : (
              filteredDomains.map((d, index) => {
                const isActive = d.id === activeDomainId;
                const isFocused = index === focusedIndex;

                return (
                  <div
                    key={d.id}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(d.id)}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-[#FAFAF8] dark:bg-surface-secondary text-foreground border border-[#E7E7E3] dark:border-border font-medium'
                        : isFocused
                        ? 'bg-[#F4F4F1] dark:bg-surface-metadata text-foreground'
                        : 'text-[#5F625F] dark:text-muted-foreground hover:text-foreground hover:bg-[#F4F4F1] dark:hover:bg-surface-metadata'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <DomainFavicon domain={d.domainName} size="compact" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-mono font-medium tracking-tight truncate text-foreground">
                          {d.domainName}
                        </p>
                        <p className="text-[10px] text-[#5F625F] dark:text-muted-foreground tracking-normal">
                          {d.status === 'ACTIVE' ? 'Active · Continuous understanding' : d.status}
                        </p>
                      </div>
                    </div>

                    {/* Active Checkmark or Delete Action */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isActive && (
                        <Icon icon={Check} size="small" className="text-[#178A68] mr-1" />
                      )}
                      {onDeleteDomain && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteDomain(d);
                            setIsOpen(false);
                          }}
                          aria-label={`Delete domain ${d.domainName}`}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#FDEBEC] text-[#5F625F] hover:text-[#A93442] transition-all cursor-pointer"
                          title="Delete domain"
                        >
                          <Icon icon={Trash2} size="small" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Separator & Add Domain Action */}
          <div className="pt-1 border-t border-[#EEEEEB] dark:border-border-divider">
            {canAddDomain ? (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddDomain?.();
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-[#5F625F] dark:text-muted-foreground hover:text-foreground hover:bg-[#F4F4F1] dark:hover:bg-surface-metadata transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Icon icon={Plus} size="small" className="text-[#3568C8]" />
                  <span>Add domain</span>
                </div>
                <span className="font-mono text-[10px] text-[#5F625F] dark:text-muted-foreground">
                  {domainCount} / 4
                </span>
              </button>
            ) : (
              <div className="flex items-center justify-between px-2.5 py-1.5 text-[10px] font-mono text-[#5F625F] dark:text-muted-foreground">
                <span>Domain limit reached</span>
                <span>4 / 4</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

DomainContextSwitcher.displayName = 'DomainContextSwitcher';
