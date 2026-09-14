import React, { useState } from 'react';
import { Check } from 'lucide-react';

export const DocsFeedback: React.FC = () => {
  const [feedbackGiven, setFeedbackGiven] = useState<'yes' | 'no' | null>(null);

  return (
    <div className="my-10 p-4 rounded-lg border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div>
        <h4 className="text-xs font-medium text-foreground">
          Was this documentation accurate and helpful?
        </h4>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Nebula documentation is maintained strictly against verified engine contracts.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {feedbackGiven ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-muted text-foreground border border-border text-xs font-mono">
            <Check className="w-3 h-3 text-emerald-500" />
            <span>Feedback recorded</span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setFeedbackGiven('yes')}
              className="px-2.5 py-1 rounded border border-border bg-background text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setFeedbackGiven('no')}
              className="px-2.5 py-1 rounded border border-border bg-background text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              No
            </button>
          </>
        )}
      </div>
    </div>
  );
};
