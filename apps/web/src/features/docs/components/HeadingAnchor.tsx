import React, { useState } from 'react';
import { Hash, Check } from 'lucide-react';

interface HeadingAnchorProps {
  id: string;
  level?: 2 | 3 | 4;
  children: React.ReactNode;
  className?: string;
}

export const HeadingAnchor: React.FC<HeadingAnchorProps> = ({
  id,
  level = 2,
  children,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url);
    window.history.replaceState(null, '', `#${id}`);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Tag = (level === 2 ? 'h2' : level === 3 ? 'h3' : 'h4') as React.ElementType;

  const styleClasses =
    level === 2
      ? 'text-xl sm:text-2xl font-serif font-bold text-foreground mt-10 mb-4'
      : level === 3
      ? 'text-base sm:text-lg font-serif font-semibold text-foreground mt-8 mb-3'
      : 'text-sm font-semibold text-foreground mt-6 mb-2';

  return (
    <Tag
      id={id}
      className={`group relative flex items-center gap-2 scroll-mt-24 ${styleClasses} ${className}`}
    >
      <span>{children}</span>
      <a
        href={`#${id}`}
        onClick={handleCopyLink}
        aria-label={`Direct permalink to ${id}`}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Hash className="w-3.5 h-3.5" />
        )}
      </a>
    </Tag>
  );
};
