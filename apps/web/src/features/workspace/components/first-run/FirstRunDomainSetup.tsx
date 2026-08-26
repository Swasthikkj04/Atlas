import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import { DomainEntryDialog } from '../domain-dialog';
import type { FirstRunDomainSetupProps } from './FirstRunDomainSetup.types';

/**
 * Authoritative Direct Entry Workspace Experience (WX-203 / WX-211).
 *
 * Spacious, calm, editorial direct-entry surface for newly registered users with 0 domains:
 * - Clear editorial center of gravity with luxurious whitespace
 * - Strict hierarchy: Eyebrow -> Display Headline -> Concise Copy -> Focused CTA
 * - The Workspace itself is the surface (zero giant bordered cards)
 * - Primary CTA opens the focused minimal DomainEntryDialog modal
 * - Zero marketing fluff, zero fake telemetry, zero conversational greetings
 */
export const FirstRunDomainSetup: React.FC<FirstRunDomainSetupProps> = ({
  onDomainEstablished,
  className = '',
  ...rest
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div
      className={`w-full flex-1 flex flex-col items-center justify-center text-center py-20 sm:py-28 md:py-36 px-4 ${className}`}
      {...rest}
    >
      <div className="max-w-xl sm:max-w-2xl mx-auto flex flex-col items-center text-center space-y-8 sm:space-y-10">
        {/* Context Eyebrow */}
        <span className="font-mono text-[11px] sm:text-xs font-semibold tracking-[0.28em] text-muted-foreground/70 uppercase select-none">
          YOUR WORKSPACE
        </span>

        {/* Editorial Headline */}
        <h1 className="font-display font-normal text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.12] tracking-tight text-foreground max-w-xl sm:max-w-2xl">
          Understand what matters
          <br />
          across your <span className="font-serif italic text-foreground/85">infrastructure.</span>
        </h1>

        {/* Concise Supporting Copy */}
        <p className="text-base sm:text-lg text-muted-foreground/80 leading-relaxed max-w-md font-normal">
          Your workspace is ready.
          <br />
          Add your first domain to begin.
        </p>

        {/* Primary Focused Action */}
        <div className="pt-2 sm:pt-4">
          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-2.5 bg-primary text-primary-foreground text-sm font-medium px-7 py-3.5 rounded-xl hover:opacity-90 active:opacity-75 transition-all shadow-[0_2px_12px_rgba(26,86,219,0.25)] focus-ring cursor-pointer"
          >
            <Icon icon={Plus} size="small" />
            <span>Add your first domain</span>
          </button>
        </div>
      </div>

      {/* Focused Add Domain Modal Dialog */}
      {isDialogOpen && (
        <DomainEntryDialog
          isFirstDomain={true}
          isModal={true}
          isDismissable={true}
          onClose={() => setIsDialogOpen(false)}
          onDomainEstablished={onDomainEstablished}
        />
      )}
    </div>
  );
};

FirstRunDomainSetup.displayName = 'FirstRunDomainSetup';
