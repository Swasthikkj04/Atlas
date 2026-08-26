import { type HTMLAttributes } from 'react';

export interface WorkspaceEntrySurfaceProps extends HTMLAttributes<HTMLDivElement> {
  greetingName?: string;
  targetDomain: string;
  onDomainChange: (val: string) => void;
  onSubmitDomain: (e: React.FormEvent) => void;
  isAnalyzing?: boolean;
  userEmail?: string;
  className?: string;
}
