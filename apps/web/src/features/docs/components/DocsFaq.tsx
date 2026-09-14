import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS } from '../data/docsData';
import { HeadingAnchor } from './HeadingAnchor';

export const DocsFaq: React.FC = () => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  const toggleIndex = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <section id="faq" className="my-10 space-y-4">
      <HeadingAnchor id="faq" level={2}>
        Frequently Asked Questions
      </HeadingAnchor>
      <p className="text-sm text-foreground/80 leading-relaxed">
        Common architectural inquiries regarding non-intrusive discovery, protocol attribution, and safety guarantees:
      </p>

      <div className="space-y-2 pt-2">
        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndexes.includes(idx);
          return (
            <div
              key={idx}
              className="rounded-lg border border-border bg-card overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleIndex(idx)}
                className="w-full flex items-center justify-between p-3.5 text-left font-medium text-xs sm:text-sm text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="pr-4">{item.question}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-150 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-3.5 pb-3.5 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/50 bg-muted/10">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
