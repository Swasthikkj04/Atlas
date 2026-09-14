import React, { useEffect, useState } from 'react';

export interface TocItem {
  id: string;
  num: string;
  label: string;
  level: number;
}

const TOC_ITEMS: TocItem[] = [
  { id: 'overview', num: '01', label: 'Overview & Vision', level: 2 },
  { id: 'core-principles', num: '02', label: 'Core Principles & Safety', level: 2 },
  { id: 'pipeline-stages', num: '03', label: 'The 6-Stage Pipeline', level: 2 },
  { id: 'ingress-topology', num: '04', label: '5-Hop Ingress Flow', level: 2 },
  { id: 'infrastructure-categories', num: '05', label: 'Infrastructure Categories', level: 2 },
  { id: 'severity-taxonomy', num: '06', label: 'Finding Taxonomy', level: 2 },
  { id: 'workspace-parity', num: '07', label: 'Guest vs Workspace Parity', level: 2 },
  { id: 'seo-privacy', num: '08', label: 'SEO & Privacy Invariants', level: 2 },
  { id: 'contracts', num: '09', label: 'Contract Specifications', level: 2 },
];

interface DocsTocProps {
  onItemClick?: (id: string) => void;
  className?: string;
}

export const DocsToc: React.FC<DocsTocProps> = ({ onItemClick, className = '' }) => {
  const [activeId, setActiveId] = useState<string>('overview');

  useEffect(() => {
    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) {
        setActiveId(visible[0].target.id);
      }
    };

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '-80px 0px -60% 0px',
      threshold: [0, 0.2, 0.5],
    });

    TOC_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setActiveId(id);
    onItemClick?.(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <aside
      aria-label="Table of contents"
      className={`w-56 xl:w-60 2xl:w-64 shrink-0 py-8 pl-6 2xl:pl-8 border-l border-border sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto ${className}`}
    >
      <div className="space-y-3">
        <h3 className="font-mono text-[10px] font-medium tracking-wider text-muted-foreground/70 uppercase">
          On this page
        </h3>

        <ul className="space-y-1" role="list">
          {TOC_ITEMS.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => handleClick(e, item.id)}
                  className={`flex items-baseline gap-2 text-xs py-0.5 leading-snug transition-colors ${
                    isActive
                      ? 'text-foreground font-medium pl-2 border-l-2 border-primary -ml-[1px]'
                      : 'text-muted-foreground/70 hover:text-foreground pl-2 border-l-2 border-transparent'
                  }`}
                >
                  <span className="font-mono text-[10px] text-muted-foreground/60 select-none">
                    {item.num}
                  </span>
                  <span>{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};
