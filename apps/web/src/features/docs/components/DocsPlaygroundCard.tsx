import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export const DocsPlaygroundCard: React.FC = () => {
  const [domainInput, setDomainInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = domainInput.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    if (!clean) return;
    window.location.href = `/guest?domain=${encodeURIComponent(clean)}`;
  };

  return (
    <div className="my-8 rounded-lg border border-border bg-card/60 p-4 sm:p-5 max-w-2xl">
      <div className="space-y-1 mb-3.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80 block">
          Live Example
        </span>
        <h4 className="text-sm font-medium text-foreground">
          Test the understanding pipeline
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          placeholder="example.com"
          className="flex-1 px-3 py-1.5 rounded border border-border bg-background text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-hidden focus:border-primary/60 transition-colors"
        />

        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium text-primary-foreground bg-primary hover:opacity-90 transition-opacity cursor-pointer shrink-0"
        >
          <span>Understand</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </form>
    </div>
  );
};
