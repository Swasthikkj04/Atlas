import React from 'react';
import { Compass } from 'lucide-react';

interface WhatNebulaUnderstandsProps {
  headline: string;
  narrative: string;
  domain?: string;
}

export const WhatNebulaUnderstands: React.FC<WhatNebulaUnderstandsProps> = ({
  headline,
  narrative,
  domain,
}) => {
  return (
    <section
      aria-label="What Nebula understands"
      className="bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-[0_1px_3px_rgba(16,24,20,0.035)]"
    >
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#EEEEEB] dark:border-border-divider">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.24em] text-[#3568C8] dark:text-primary font-semibold">
            <Compass className="w-3.5 h-3.5" />
            <span>02 &bull; {headline}</span>
          </div>
          {domain && (
            <p className="text-xs text-[#5F625F] dark:text-muted-foreground mt-0.5">
              Active perimeter model for <span className="font-mono text-foreground font-semibold">{domain}</span>
            </p>
          )}
        </div>
        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium self-start sm:self-auto">
          Architectural Synthesis
        </span>
      </div>

      <div className="p-4 sm:p-5 rounded-xl bg-[#F8F9FA] dark:bg-muted/20 border border-[#E5E7EB] dark:border-border">
        <p className="text-sm sm:text-base text-foreground leading-relaxed font-sans font-normal">
          {narrative}
        </p>
      </div>
    </section>
  );
};
