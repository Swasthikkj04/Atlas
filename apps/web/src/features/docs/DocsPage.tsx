import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ChevronRight, 
  Menu, 
  X, 
  Share2, 
  Check 
} from 'lucide-react';

import { DocsHeader } from './components/DocsHeader';
import { DocsSidebar } from './components/DocsSidebar';
import { DocsToc } from './components/DocsToc';
import { DocsFeedback } from './components/DocsFeedback';
import { DocsPagination } from './components/DocsPagination';
import { SearchModal } from './components/SearchModal';
import { DOC_ARTICLES, FAQ_ITEMS } from './data/docsData';
import { useSeoMetadata } from '../../hooks/useSeoMetadata';
import { useTheme } from '../guest/hooks/useTheme';
import { NetworkBg } from '../auth/components/NetworkBg';

import { UnderstandingMethodologyArticle } from './articles/UnderstandingMethodologyArticle';
import { IngressTopologyArticle } from './articles/IngressTopologyArticle';
import { BehavioralFingerprintingArticle } from './articles/BehavioralFingerprintingArticle';
import { SeverityTaxonomyArticle } from './articles/SeverityTaxonomyArticle';
import { WorkspaceParityArticle } from './articles/WorkspaceParityArticle';
import { SecurityBoundariesArticle } from './articles/SecurityBoundariesArticle';

export const DocsPage: React.FC = () => {
  const { theme } = useTheme();
  const dark = theme === 'dark';

  // Determine active document from initial window URL pathname
  const initialSlug = useMemo(() => {
    if (typeof window === 'undefined') return 'understanding-methodology';
    const match = window.location.pathname.match(/\/docs\/(.+)$/);
    if (match && match[1]) {
      const found = DOC_ARTICLES.find((a) => a.slug === match[1]);
      if (found) return found.slug;
    }
    return 'understanding-methodology';
  }, []);

  const [activeSlug, setActiveSlug] = useState<string>(initialSlug);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [copiedShare, setCopiedShare] = useState<boolean>(false);

  // Sync route selection
  const handleSelectArticle = useCallback((slug: string, anchor?: string) => {
    setActiveSlug(slug);
    const targetUrl = slug === 'understanding-methodology' ? '/docs' : `/docs/${slug}`;
    const fullUrl = anchor ? `${targetUrl}#${anchor}` : targetUrl;
    window.history.pushState(null, '', fullUrl);

    if (anchor) {
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setMobileSidebarOpen(false);
  }, []);

  // Keyboard shortcut listener for ⌘K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to popstate
  useEffect(() => {
    const handlePopState = () => {
      const match = window.location.pathname.match(/\/docs\/(.+)$/);
      if (match && match[1]) {
        const found = DOC_ARTICLES.find((a) => a.slug === match[1]);
        if (found) setActiveSlug(found.slug);
      } else {
        setActiveSlug('understanding-methodology');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const currentArticle = useMemo(() => {
    return DOC_ARTICLES.find((a) => a.slug === activeSlug) || DOC_ARTICLES[0];
  }, [activeSlug]);

  const currentIdx = DOC_ARTICLES.findIndex((a) => a.slug === activeSlug);
  const prevArticle = currentIdx > 0 ? DOC_ARTICLES[currentIdx - 1] : undefined;
  const nextArticle = currentIdx < DOC_ARTICLES.length - 1 ? DOC_ARTICLES[currentIdx + 1] : undefined;

  // Build dynamic SEO JSON-LD structured data
  const structuredData = useMemo(() => {
    const canonical = `https://argonion.com/docs/${currentArticle.slug === 'understanding-methodology' ? 'understanding-methodology' : currentArticle.slug}`;

    return [
      {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        '@id': `${canonical}#article`,
        isPartOf: {
          '@type': 'WebPage',
          '@id': canonical,
        },
        headline: currentArticle.title,
        description: currentArticle.description,
        inLanguage: 'en',
        author: {
          '@type': 'Organization',
          name: 'Argonion Engineering',
          url: 'https://argonion.com',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Argonion',
          url: 'https://argonion.com',
          logo: 'https://argonion.com/argonion-mark.svg',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://argonion.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Documentation',
            item: 'https://argonion.com/docs',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: currentArticle.shortTitle,
            item: canonical,
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ];
  }, [currentArticle]);

  useSeoMetadata({
    title: currentArticle.title,
    description: currentArticle.description,
    canonicalUrl: `https://argonion.com/docs/${currentArticle.slug === 'understanding-methodology' ? 'understanding-methodology' : currentArticle.slug}`,
    robots: 'index, follow',
    keywords: [
      'Infrastructure Intelligence',
      'Passive Discovery',
      'Ingress Topology',
      'Security Posture',
      'DNSSEC',
      'TLS 1.3',
      'Nebula Architecture',
    ],
    structuredData,
  });

  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const renderActiveArticle = () => {
    switch (activeSlug) {
      case 'ingress-topology':
        return <IngressTopologyArticle />;
      case 'behavioral-fingerprinting':
        return <BehavioralFingerprintingArticle />;
      case 'severity-taxonomy':
        return <SeverityTaxonomyArticle />;
      case 'workspace-parity':
        return <WorkspaceParityArticle />;
      case 'security-boundaries':
        return <SecurityBoundariesArticle />;
      case 'understanding-methodology':
      default:
        return <UnderstandingMethodologyArticle />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col selection:bg-primary/20 selection:text-foreground">
      <NetworkBg dark={dark} />

      {/* Primary Header */}
      <DocsHeader onSearchClick={() => setIsSearchOpen(true)} />

      {/* Mobile Navigation Sub-bar */}
      <div className="lg:hidden sticky top-14 z-30 flex items-center justify-between px-4 py-2 bg-background/95 backdrop-blur-xs border-b border-border">
        <button
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground px-2.5 py-1 rounded-md border border-border bg-muted/30"
          aria-label="Toggle documentation navigation"
        >
          {mobileSidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
          <span>Topics Menu</span>
        </button>

        <span className="text-xs font-mono text-foreground truncate max-w-[200px]">
          {currentArticle.shortTitle}
        </span>
      </div>

      {/* Main Documentation Shell */}
      <div className="flex w-full flex-1 px-4 sm:px-6 lg:px-8 2xl:px-12">
        {/* Left Sidebar (Desktop) */}
        <DocsSidebar
          activeSlug={activeSlug}
          onSelectArticle={handleSelectArticle}
          className="hidden lg:block"
        />

        {/* Mobile Slide-out Drawer */}
        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <div
              className="fixed inset-0 bg-background/80 backdrop-blur-xs"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-card border-r border-border p-5 shadow-lg overflow-y-auto">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                  Documentation
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <DocsSidebar
                activeSlug={activeSlug}
                onSelectArticle={handleSelectArticle}
                className="w-full border-r-0 pr-0 py-0"
              />
            </div>
          </div>
        )}

        {/* Central Article Content Area */}
        <main
          id="main-content"
          role="main"
          className="min-w-0 flex-1 py-8 lg:py-10 px-0 sm:px-4 lg:px-8 xl:px-10 2xl:px-14"
        >
          <div className="w-full space-y-8 max-w-5xl 2xl:max-w-6xl">
            {/* Top Breadcrumbs & Share Row */}
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground pb-2">
              <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 flex-wrap">
                <a href="/" className="hover:text-foreground transition-colors">Argonion</a>
                <ChevronRight className="w-3 h-3 opacity-40" />
                <button
                  type="button"
                  onClick={() => handleSelectArticle('understanding-methodology')}
                  className="hover:text-foreground hover:underline cursor-pointer"
                >
                  Docs
                </button>
                <ChevronRight className="w-3 h-3 opacity-40" />
                <span className="text-foreground font-medium">{currentArticle.shortTitle}</span>
              </nav>

              <button
                type="button"
                onClick={handleShareClick}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted border border-border transition-colors cursor-pointer"
                aria-label="Copy documentation link"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3 h-3" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>

            {/* Active Article Component */}
            {renderActiveArticle()}

            {/* Article Feedback & Pagination */}
            <DocsFeedback />
            <DocsPagination
              prevArticle={prevArticle}
              nextArticle={nextArticle}
              onSelectArticle={handleSelectArticle}
            />
          </div>
        </main>

        {/* Right Table of Contents (Desktop) */}
        <DocsToc className="hidden xl:block" />
      </div>

      {/* Interactive Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSelectArticle}
      />
    </div>
  );
};

export default DocsPage;

