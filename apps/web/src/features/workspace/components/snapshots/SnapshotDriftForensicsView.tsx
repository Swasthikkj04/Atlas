import React from 'react';
import {
  Layers,
  Globe,
  Lock,
  Server,
  PlusCircle,
  MinusCircle,
  RefreshCw,
} from 'lucide-react';
import type {
  SnapshotDriftForensicsDto,
  DiffItemDto,
  DriftRiskLevel,
} from '../../../../types/api';

export interface SnapshotDriftForensicsViewProps {
  readonly driftData: SnapshotDriftForensicsDto;
  readonly onSelectSnapshot?: (snapshotId: string) => void;
  readonly className?: string;
}

const RISK_BADGE_STYLES: Record<DriftRiskLevel, { bg: string; text: string; border: string }> = {
  CLEAN: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  LOW: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  MODERATE: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  HIGH: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  CRITICAL: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/20' },
};

export const SnapshotDriftForensicsView: React.FC<SnapshotDriftForensicsViewProps> = ({
  driftData,
  className = '',
}) => {
  const badgeStyle = RISK_BADGE_STYLES[driftData.riskLevel] || RISK_BADGE_STYLES.CLEAN;

  return (
    <div className={`space-y-6 ${className}`} data-testid="snapshot-drift-forensics-view">
      {/* Header & Risk Score Overview */}
      <div className="p-5 rounded-lg border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Forensic Drift Analysis
              </span>
              <span
                className={`px-2 py-0.5 text-xs font-mono font-medium rounded-full border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                data-testid="drift-risk-badge"
              >
                {driftData.riskLevel} RISK ({driftData.driftScore}/100)
              </span>
            </div>
            <h3 className="text-lg font-medium text-neutral-100">
              {driftData.domainName} Infrastructure Shift
            </h3>
            <p className="text-xs text-neutral-400 font-mono mt-1">
              Comparing Baseline ({driftData.baseSnapshotId.slice(0, 10)}) → Target ({driftData.targetSnapshotId.slice(0, 10)})
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs text-neutral-400 block font-mono">Total Changes</span>
              <span className="text-2xl font-mono font-bold text-neutral-100" data-testid="total-changes-count">
                {driftData.totalChangesCount}
              </span>
            </div>
          </div>
        </div>

        {/* Narrative Bullets */}
        {driftData.forensicNarrative.length > 0 && (
          <div className="mt-4 pt-4 border-t border-neutral-800">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
              Forensic Narrative & Impact
            </h4>
            <ul className="space-y-1.5 text-xs text-neutral-300">
              {driftData.forensicNarrative.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-neutral-500 font-mono">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Layer Diffs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* DNS Drift Section */}
        <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-neutral-200">DNS & Routing</span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {driftData.dns.changes.length} {driftData.dns.changes.length === 1 ? 'diff' : 'diffs'}
            </span>
          </div>

          {driftData.dns.changes.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">No DNS or routing changes detected.</p>
          ) : (
            <div className="space-y-2">
              {driftData.dns.changes.map((change, idx) => (
                <DiffItemCard key={idx} item={change} />
              ))}
            </div>
          )}
        </div>

        {/* TLS / SSL Drift Section */}
        <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium text-neutral-200">TLS / SSL Certificates</span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {driftData.tls.changes.length} {driftData.tls.changes.length === 1 ? 'diff' : 'diffs'}
            </span>
          </div>

          {driftData.tls.changes.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">Certificate state is consistent.</p>
          ) : (
            <div className="space-y-2">
              {driftData.tls.changes.map((change, idx) => (
                <DiffItemCard key={idx} item={change} />
              ))}
            </div>
          )}
        </div>

        {/* HTTP & Security Headers Drift Section */}
        <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-neutral-200">HTTP & Security Headers</span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {driftData.http.changes.length} {driftData.http.changes.length === 1 ? 'diff' : 'diffs'}
            </span>
          </div>

          {driftData.http.changes.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">No header security regressions detected.</p>
          ) : (
            <div className="space-y-2">
              {driftData.http.changes.map((change, idx) => (
                <DiffItemCard key={idx} item={change} />
              ))}
            </div>
          )}
        </div>

        {/* Technology Stack Drift Section */}
        <div className="p-4 rounded-lg border border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-neutral-200">Technology Stack</span>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {driftData.technology.changes.length} {driftData.technology.changes.length === 1 ? 'diff' : 'diffs'}
            </span>
          </div>

          {driftData.technology.changes.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">Technology fingerprint footprint matches baseline.</p>
          ) : (
            <div className="space-y-2">
              {driftData.technology.changes.map((change, idx) => (
                <DiffItemCard key={idx} item={change} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DiffItemCard: React.FC<{ item: DiffItemDto }> = ({ item }) => {
  const isAdded = item.type === 'ADDED';
  const isRemoved = item.type === 'REMOVED';

  const icon = isAdded ? (
    <PlusCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
  ) : isRemoved ? (
    <MinusCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
  ) : (
    <RefreshCw className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
  );

  return (
    <div className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800/80 text-xs">
      <div className="flex items-start gap-2">
        {icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-neutral-200 truncate">{item.field}</span>
            <span
              className={`px-1.5 py-0.2 font-mono text-[10px] rounded uppercase ${
                isAdded
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : isRemoved
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-amber-500/10 text-amber-400'
              }`}
            >
              {item.type}
            </span>
          </div>
          <p className="text-neutral-400 mt-0.5 text-[11px] leading-relaxed">{item.description}</p>
        </div>
      </div>
    </div>
  );
};
