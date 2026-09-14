import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export interface CodeSnippetTab {
  language: string;
  label: string;
  code: string;
}

interface CodeBlockProps {
  title?: string;
  tabs: CodeSnippetTab[];
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  title,
  tabs,
  className = '',
}) => {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const activeTab = tabs[activeTabIdx] || tabs[0];

  const handleCopy = () => {
    if (!activeTab) return;
    navigator.clipboard.writeText(activeTab.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`rounded-lg border border-border bg-card overflow-hidden my-6 ${className}`}>
      {/* Header with Title and Language Tabs */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-2 overflow-x-auto">
          {title && (
            <span className="font-mono text-[11px] font-medium text-muted-foreground pr-2 border-r border-border">
              {title}
            </span>
          )}

          <div className="flex items-center gap-1" role="tablist">
            {tabs.map((tab, idx) => (
              <button
                key={tab.label}
                role="tab"
                aria-selected={activeTabIdx === idx}
                onClick={() => setActiveTabIdx(idx)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  activeTabIdx === idx
                    ? 'bg-background text-foreground font-medium border border-border shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-4 text-xs font-mono text-foreground/90 overflow-x-auto leading-relaxed bg-background/50 selection:bg-primary/20">
        <code>{activeTab?.code}</code>
      </pre>
    </div>
  );
};
