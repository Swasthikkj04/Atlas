import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Globe,
  Lock,
  Server,
  Layers,
  ArrowRight,
} from 'lucide-react';
import type { DriftAlertDto } from '../../../../types/api';
import { useAcknowledgeDriftAlert } from '../../../../hooks/queries/useDriftAlerts';

export interface DriftAlertBannerProps {
  readonly alerts: readonly DriftAlertDto[];
  readonly domainId: string;
  readonly onInspectAlert?: (alert: DriftAlertDto) => void;
  readonly className?: string;
}

export const DriftAlertBanner: React.FC<DriftAlertBannerProps> = ({
  alerts,
  domainId,
  onInspectAlert,
  className = '',
}) => {
  const acknowledgeMutation = useAcknowledgeDriftAlert();
  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');

  if (activeAlerts.length === 0) {
    return null;
  }

  const highestAlert = activeAlerts.reduce((prev, curr) => {
    const severityWeight: Record<string, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MODERATE: 2,
      LOW: 1,
      CLEAN: 0,
    };
    return (severityWeight[curr.riskLevel] || 0) > (severityWeight[prev.riskLevel] || 0)
      ? curr
      : prev;
  }, activeAlerts[0]);

  const isCritical = highestAlert.riskLevel === 'CRITICAL';
  const isHigh = highestAlert.riskLevel === 'HIGH';

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DNS':
      case 'ROUTING':
        return <Globe className="w-4 h-4 text-rose-400" />;
      case 'TLS':
        return <Lock className="w-4 h-4 text-amber-400" />;
      case 'HTTP_SECURITY':
        return <Server className="w-4 h-4 text-rose-400" />;
      default:
        return <Layers className="w-4 h-4 text-blue-400" />;
    }
  };

  const handleAcknowledge = (e: React.MouseEvent, alertId: string) => {
    e.stopPropagation();
    acknowledgeMutation.mutate({ domainId, alertId });
  };

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        isCritical
          ? 'bg-rose-950/40 border-rose-800/80 text-rose-200 shadow-lg shadow-rose-950/30'
          : isHigh
          ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
          : 'bg-blue-950/40 border-blue-800/80 text-blue-200'
      } p-4 ${className}`}
      data-testid="drift-alert-banner"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5 relative flex items-center justify-center">
            {isCritical ? (
              <>
                <span className="absolute -inset-1 rounded-full bg-rose-500/20 animate-ping" />
                <ShieldAlert className="w-5 h-5 text-rose-400 relative" />
              </>
            ) : isHigh ? (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            ) : (
              <Info className="w-5 h-5 text-blue-400" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-black/40 border border-current">
                {highestAlert.riskLevel} DRIFT ALERT
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px] text-neutral-400">
                {getCategoryIcon(highestAlert.category)}
                <span>{highestAlert.category}</span>
              </span>
              {activeAlerts.length > 1 && (
                <span className="font-mono text-[11px] text-neutral-400">
                  (+{activeAlerts.length - 1} more active)
                </span>
              )}
            </div>

            <h4 className="text-sm font-medium text-neutral-100 mt-1 truncate">
              {highestAlert.title}
            </h4>
            <p className="text-xs text-neutral-300/90 mt-0.5 leading-relaxed">
              {highestAlert.summary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {onInspectAlert && (
            <button
              onClick={() => onInspectAlert(highestAlert)}
              className="px-3 py-1.5 text-xs font-mono rounded bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1"
              data-testid="inspect-drift-button"
            >
              <span>Inspect</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={(e) => handleAcknowledge(e, highestAlert.id)}
            disabled={acknowledgeMutation.isPending}
            className="px-3 py-1.5 text-xs font-mono rounded bg-black/50 hover:bg-black/70 border border-white/20 text-neutral-200 hover:text-white transition-colors flex items-center gap-1.5"
            data-testid="acknowledge-drift-button"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{acknowledgeMutation.isPending ? 'Acking...' : 'Acknowledge'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
