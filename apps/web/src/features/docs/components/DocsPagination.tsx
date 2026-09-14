import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { DocArticleMeta } from '../data/docsData';

interface DocsPaginationProps {
  prevArticle?: DocArticleMeta;
  nextArticle?: DocArticleMeta;
  onSelectArticle: (slug: string) => void;
}

export const DocsPagination: React.FC<DocsPaginationProps> = ({
  prevArticle,
  nextArticle,
  onSelectArticle,
}) => {
  return (
    <nav aria-label="Documentation Pagination" className="my-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {prevArticle ? (
        <button
          type="button"
          onClick={() => onSelectArticle(prevArticle.slug)}
          className="group flex flex-col items-start p-4 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground mb-1">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
            <span>Previous</span>
          </div>
          <span className="text-sm font-serif font-semibold text-foreground group-hover:text-primary transition-colors">
            {prevArticle.shortTitle}
          </span>
          <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
            {prevArticle.description}
          </span>
        </button>
      ) : (
        <div />
      )}

      {nextArticle ? (
        <button
          type="button"
          onClick={() => onSelectArticle(nextArticle.slug)}
          className="group flex flex-col items-end p-4 rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors text-right cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground mb-1">
            <span>Next</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <span className="text-sm font-serif font-semibold text-foreground group-hover:text-primary transition-colors">
            {nextArticle.shortTitle}
          </span>
          <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
            {nextArticle.description}
          </span>
        </button>
      ) : (
        <div />
      )}
    </nav>
  );
};
