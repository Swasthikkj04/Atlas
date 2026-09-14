import React from 'react';
import { ShieldAlert, AlertTriangle, Network, Layers, Server, ShieldCheck } from 'lucide-react';
import { Icon } from '../../../../components/icons';
import type { FleetPostureSummary, VendorConcentrationMetric } from '../../contracts/multi-domain-matrix.contract';

export interface VendorConcentrationCardProps {
  readonly fleetPosture: FleetPostureSummary;
  readonly concentrations: readonly VendorConcentrationMetric[];
  readonly className?: string;
}

export const VendorConcentrationCard: React.FC<VendorConcentrationCardProps> = ({
  fleetPosture,
  concentrations,
  className = '',
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'EDGE':
        return Network;
      case 'GATEWAY':
        return Server;
      case 'APPLICATION':
        return Layers;
      default:
        return Server;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[#178A68] dark:text-[#178A68] bg-[#EAF7F2] dark:bg-[#178A68]/15 border-[#B9E5D6] dark:border-[#178A68]/30';
    if (score >= 75) return 'text-[#B86F18] dark:text-[#E68A1F] bg-[#FFF4E3] dark:bg-[#B86F18]/15 border-[#F0D3A5] dark:border-[#B86F18]/30';
    return 'text-[#C24D57] dark:text-[#FF6B6B] bg-[#FFF0F1] dark:bg-[#C24D57]/15 border-[#F0C3C7] dark:border-[#C24D57]/30';
  };

  const displayConcentrations = concentrations.slice(0, 4);

  return (
    <div
      className={`w-full rounded-2xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card p-6 shadow-sm ${className}`}
      data-testid="vendor-concentration-card"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E1E1DC] dark:border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-semibold bg-[#FAFAF8] dark:bg-surface-secondary text-[#5F625F] dark:text-muted-foreground border border-[#E1E1DC] dark:border-border">
              Portfolio Intelligence
            </span>
            <span className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
              Move 5 Matrix
            </span>
          </div>
          <h3 className="text-lg font-serif font-medium text-foreground mt-1.5">
            Fleet Architecture & Concentration
          </h3>
        </div>

        {/* Fleet Average Score Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground">Fleet Posture</div>
            <div className="text-xs font-medium text-foreground">
              {fleetPosture.domainsAtRiskCount > 0 ? `${fleetPosture.domainsAtRiskCount} domain(s) at risk` : 'All domains healthy'}
            </div>
          </div>
          <div
            className={`px-3 py-1.5 rounded-lg border text-sm font-mono font-semibold flex items-center gap-1.5 ${getScoreColor(fleetPosture.averageScore)}`}
            data-testid="fleet-average-score-pill"
          >
            {fleetPosture.averageScore >= 80 ? (
              <Icon icon={ShieldCheck} size="small" />
            ) : (
              <Icon icon={ShieldAlert} size="small" />
            )}
            <span>{fleetPosture.averageScore}/100</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-5">
        {/* Left Column: Vendor Concentration Metrics */}
        <div>
          <h4 className="text-xs font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground mb-3 flex items-center justify-between">
            <span>Provider Concentration</span>
            <span className="text-[11px] lowercase text-[#5F625F]/70">(fleet share)</span>
          </h4>

          {displayConcentrations.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-[#E1E1DC] dark:border-border text-center text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
              No concentrated providers detected across domains.
            </div>
          ) : (
            <div className="space-y-3">
              {displayConcentrations.map((metric) => (
                <div
                  key={`${metric.category}-${metric.vendorName}`}
                  className="p-3 rounded-xl border border-[#E1E1DC] dark:border-border/60 bg-[#FAFAF8] dark:bg-surface-secondary/40 flex flex-col gap-2"
                  data-testid={`concentration-row-${metric.vendorName.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Icon
                        icon={getCategoryIcon(metric.category)}
                        size="small"
                        className="text-[#5F625F] dark:text-muted-foreground"
                      />
                      <span className="font-medium text-foreground">{metric.vendorName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-[#E1E1DC] dark:border-border text-[#5F625F] dark:text-muted-foreground">
                        {metric.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold text-foreground">
                        {metric.percentage}%
                      </span>
                      <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
                        ({metric.count} {metric.count === 1 ? 'domain' : 'domains'})
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-full bg-[#E1E1DC]/60 dark:bg-border/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        metric.isSinglePointOfFailure
                          ? 'bg-[#B86F18] dark:bg-[#E68A1F]'
                          : 'bg-[#178A68] dark:bg-[#178A68]'
                      }`}
                      style={{ width: `${metric.percentage}%` }}
                    />
                  </div>

                  {metric.isSinglePointOfFailure && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#B86F18] dark:text-[#E68A1F]">
                      <Icon icon={AlertTriangle} size="small" />
                      <span>Single Point of Failure: high fleet reliance on {metric.vendorName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Fleet Anomalies Breakdown */}
        <div className="flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground mb-3">
              Fleet Anomaly Overview
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary/40">
                <div className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
                  Critical Anomalies
                </div>
                <div
                  className={`text-xl font-mono font-semibold mt-1 ${
                    fleetPosture.criticalAnomaliesCount > 0
                      ? 'text-[#C24D57] dark:text-[#FF6B6B]'
                      : 'text-foreground'
                  }`}
                  data-testid="fleet-critical-anomalies-count"
                >
                  {fleetPosture.criticalAnomaliesCount}
                </div>
                <div className="text-[10px] font-mono text-[#5F625F]/70 dark:text-muted-foreground/70 mt-0.5">
                  Debug traces, origin IP leaks
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[#E1E1DC] dark:border-border bg-[#FAFAF8] dark:bg-surface-secondary/40">
                <div className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
                  High Severity Anomalies
                </div>
                <div
                  className={`text-xl font-mono font-semibold mt-1 ${
                    fleetPosture.highAnomaliesCount > 0
                      ? 'text-[#B86F18] dark:text-[#E68A1F]'
                      : 'text-foreground'
                  }`}
                  data-testid="fleet-high-anomalies-count"
                >
                  {fleetPosture.highAnomaliesCount}
                </div>
                <div className="text-[10px] font-mono text-[#5F625F]/70 dark:text-muted-foreground/70 mt-0.5">
                  Insecure transit, missing HSTS
                </div>
              </div>
            </div>
          </div>

          {fleetPosture.highestRiskDomainName ? (
            <div className="mt-4 p-3 rounded-xl border border-[#F0C3C7] dark:border-[#C24D57]/30 bg-[#FFF0F1] dark:bg-[#C24D57]/10 text-xs font-mono text-[#C24D57] dark:text-[#FF6B6B] flex items-center gap-2">
              <Icon icon={AlertTriangle} size="small" />
              <span>Highest risk attention target: <strong>{fleetPosture.highestRiskDomainName}</strong></span>
            </div>
          ) : (
            <div className="mt-4 p-3 rounded-xl border border-[#B9E5D6] dark:border-[#178A68]/30 bg-[#EAF7F2] dark:bg-[#178A68]/10 text-xs font-mono text-[#178A68] dark:text-[#178A68] flex items-center gap-2">
              <Icon icon={ShieldCheck} size="small" />
              <span>Zero critical risks identified across monitored infrastructure.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
