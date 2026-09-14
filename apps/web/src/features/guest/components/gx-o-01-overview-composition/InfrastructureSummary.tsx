import React from 'react';
import { ArrowRight, Server } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import type { GuestWorkspaceViewModel } from '../../contracts/gx-r013-guest-workspace-shell.contract.ts';
import { GuestInfrastructureTable } from '../GuestInfrastructureTable.tsx';

interface InfrastructureSummaryProps {
  viewModel: GuestWorkspaceViewModel;
  onViewFullInfrastructure?: () => void;
  className?: string;
}

export const InfrastructureSummary: React.FC<InfrastructureSummaryProps> = ({
  viewModel,
  onViewFullInfrastructure,
  className = '',
}) => {
  const { domain, categorizedComponents, rawEvidenceRecords, findings, infrastructure } = viewModel;

  return (
    <section
      aria-labelledby="infrastructure-understanding-title"
      data-testid="gx-infrastructure-summary-section"
      className={`space-y-3 pt-2 ${className}`}
    >
      <div className="px-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon icon={Server} size="small" className="text-[#5F625F] dark:text-muted-foreground" />
          <span
            id="infrastructure-understanding-title"
            className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-[#5F625F] dark:text-muted-foreground/90"
          >
            INFRASTRUCTURE UNDERSTANDING
          </span>
        </div>

        {onViewFullInfrastructure && (
          <button
            type="button"
            onClick={onViewFullInfrastructure}
            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 cursor-pointer focus-ring font-mono"
          >
            <span>View full infrastructure</span>
            <Icon icon={ArrowRight} size="small" />
          </button>
        )}
      </div>

      <GuestInfrastructureTable
        domain={domain}
        technologies={(categorizedComponents || []).map((comp) => ({
          name: comp.name,
          category: comp.category,
          role: comp.role,
          version: comp.version,
          confidence: comp.confidence,
        }))}
        evidenceList={(rawEvidenceRecords as any) || []}
        observations={(findings || []).map((f) => ({
          label: f.label || 'Finding',
          body: f.occurrence || f.whyItMatters || '',
          severity: (f.severity || 'INFORMATIONAL').toLowerCase() as any,
          category: f.category,
        }))}
        infrastructure={infrastructure}
        onViewFullInfrastructure={onViewFullInfrastructure}
      />
    </section>
  );
};

export default InfrastructureSummary;
