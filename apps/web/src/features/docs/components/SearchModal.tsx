import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, CornerDownLeft, Hash } from 'lucide-react';
import { DOCS_SEARCH_INDEX, type SearchResultItem } from '../data/docsData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (slug: string, anchor?: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return DOCS_SEARCH_INDEX.slice(0, 8);
    }
    const q = query.toLowerCase().trim();
    return DOCS_SEARCH_INDEX.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
      const matchSnippet = item.snippet.toLowerCase().includes(q);
      return matchTitle || matchCategory || matchKeywords || matchSnippet;
    }).slice(0, 10);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredResults.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredResults.length - 1
        );
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          const item = filteredResults[selectedIndex];
          onSelectResult(item.slug, item.anchor);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex, onClose, onSelectResult]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-background/80 backdrop-blur-xs transition-opacity"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-lg overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3 border-b border-border bg-muted/20">
          <Search className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search methodology, pipeline stages, protocols, taxonomy..."
            className="w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden font-sans"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-muted-foreground hover:text-foreground rounded"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-border/40">
          {filteredResults.length > 0 ? (
            filteredResults.map((item: SearchResultItem, idx: number) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectResult(item.slug, item.anchor);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left p-3 rounded-md transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                    isSelected ? 'bg-muted text-foreground' : 'text-foreground/80 hover:bg-muted/40'
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        {item.category}
                      </span>
                      {item.anchor && (
                        <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/50">
                          <Hash className="w-3 h-3" />
                          <span>{item.anchor}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-foreground">
                      {item.title}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.snippet}
                    </p>
                  </div>

                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-2" />
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No matching documentation results for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1 py-0.5 rounded border border-border bg-background">↑</kbd> <kbd className="px-1 py-0.5 rounded border border-border bg-background">↓</kbd> navigate</span>
            <span><kbd className="px-1 py-0.5 rounded border border-border bg-background">↵</kbd> select</span>
          </div>
          <span>Nebula Search</span>
        </div>
      </div>
    </div>
  );
};
