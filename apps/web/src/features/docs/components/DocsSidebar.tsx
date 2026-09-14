import React from 'react';
import { ExternalLink } from 'lucide-react';

interface SidebarItem {
  id: string;
  slug: string;
  label: string;
  anchor?: string;
  badge?: string;
}

interface SidebarGroup {
  title: string;
  items: SidebarItem[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    title: 'Foundations',
    items: [
      {
        id: 'understanding-methodology',
        slug: 'understanding-methodology',
        label: 'Understanding Methodology',
      },
      {
        id: 'ingress-topology',
        slug: 'ingress-topology',
        label: '5-Hop Ingress Topology',
      },
      {
        id: 'behavioral-fingerprinting',
        slug: 'behavioral-fingerprinting',
        label: 'Infrastructure Categories',
      },
      {
        id: 'severity-taxonomy',
        slug: 'severity-taxonomy',
        label: 'Finding Taxonomy',
      },
      {
        id: 'workspace-parity',
        slug: 'workspace-parity',
        label: 'GX vs Workspace Parity',
      },
    ],
  },
  {
    title: 'Security & Boundaries',
    items: [
      {
        id: 'security-boundaries',
        slug: 'security-boundaries',
        label: 'SSRF & Network Boundaries',
      },
      {
        id: 'core-principles',
        slug: 'understanding-methodology',
        anchor: 'core-principles',
        label: 'Passive Discovery Invariants',
      },
    ],
  },
  {
    title: 'Specifications',
    items: [
      {
        id: 'gx-001',
        slug: 'understanding-methodology',
        anchor: 'contracts',
        label: 'GX-001 Product Contract',
        badge: 'FROZEN',
      },
      {
        id: 'gx-002',
        slug: 'understanding-methodology',
        anchor: 'contracts',
        label: 'GX-002 Information Contract',
        badge: 'FROZEN',
      },
      {
        id: 'gx-014',
        slug: 'understanding-methodology',
        anchor: 'contracts',
        label: 'GX-014 Header & Navigation',
        badge: 'FROZEN',
      },
    ],
  },
];

interface DocsSidebarProps {
  activeSlug: string;
  onSelectArticle: (slug: string, anchor?: string) => void;
  className?: string;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({
  activeSlug,
  onSelectArticle,
  className = '',
}) => {
  return (
    <aside
      aria-label="Documentation Sidebar Navigation"
      className={`w-60 xl:w-64 2xl:w-72 shrink-0 py-8 pr-6 2xl:pr-8 border-r border-border sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto ${className}`}
    >
      <nav className="space-y-6">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.title} className="space-y-1.5">
            <h3 className="px-2 text-[10px] font-mono font-medium tracking-wider uppercase text-muted-foreground/70">
              {group.title}
            </h3>

            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isSelected = activeSlug === item.slug && !item.anchor;

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectArticle(item.slug, item.anchor)}
                      className={`w-full group flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors text-left cursor-pointer ${
                        isSelected
                          ? 'bg-muted text-foreground font-medium border-l-2 border-primary pl-2'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border-l-2 border-transparent'
                      }`}
                    >
                      <span className="leading-snug">{item.label}</span>

                      {item.badge && (
                        <span className="font-mono text-[9px] px-1 py-0.5 rounded border border-border/80 text-muted-foreground/70 shrink-0 ml-2 uppercase tracking-wide">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Quiet Reference Links */}
        <div className="pt-4 border-t border-border/60 space-y-1">
          <h3 className="px-2 text-[10px] font-mono font-medium tracking-wider uppercase text-muted-foreground/70">
            Navigation
          </h3>

          <a
            href="/guest"
            className="group flex items-center justify-between px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <span>Guest Workspace</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover:text-foreground" />
          </a>

          <a
            href="/workspace/create"
            className="group flex items-center justify-between px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <span>Create Workspace</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground/50 group-hover:text-foreground" />
          </a>
        </div>
      </nav>
    </aside>
  );
};
