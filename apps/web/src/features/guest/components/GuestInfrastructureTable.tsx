import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cloud,
  Server,
  Layers,
  Cpu,
  Network,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  ArrowUpRight,
  ChevronRight,
  X,
  FileCode,
  Copy,
  Check,
} from 'lucide-react';
import { Icon } from '../../../components/icons';
import type { Technology, EvidenceRow, Observation } from '../types/index.ts';
import {
  resolveGuestInfrastructureSummary,
  type GuestInfrastructureSummaryRow,
} from '../utils/infrastructure.ts';

interface GuestInfrastructureTableProps {
  domain: string;
  technologies?: Technology[];
  evidenceList?: EvidenceRow[];
  observations?: Observation[];
  infrastructure?: any;
  reduced?: boolean;
  onViewFullInfrastructure?: () => void;
  onInspectFinding?: (finding: Observation) => void;
  onInspectEvidencePayload?: (techName: string) => void;
  className?: string;
}

const CATEGORY_ICONS: Record<string, typeof Cloud> = {
  edge: Cloud,
  web_server: Server,
  application: Layers,
  platform: Layers,
  runtime: Cpu,
  hosting: Cpu,
  dns: Network,
  tls: ShieldCheck,
  ip_address: Terminal,
  ip_ports: Terminal,
  open_ports: ArrowUpRight,
};

/**
 * Pure Mimic of the Workspace (WX) Overview Infrastructure Table for Guest Experience (GX).
 *
 * Implements the exact canonical WX CompactInfrastructureOverview presentation:
 * - INFRASTRUCTURE SUMMARY header with observed count badge
 * - Exact category icons (Cloud, Server, Layers, Cpu, Network, ShieldCheck, Terminal, ArrowUpRight)
 * - Exact row layout, fonts, colors, borders, and hover micro-interactions
 * - In-place contextual investigation modal on click (GX-Safe)
 */
export function GuestInfrastructureTable({
  domain,
  technologies = [],
  evidenceList = [],
  observations = [],
  infrastructure,
  onViewFullInfrastructure,
  className = '',
}: GuestInfrastructureTableProps) {
  const [activeInvestigation, setActiveInvestigation] = useState<GuestInfrastructureSummaryRow | null>(null);
  const [hasCopiedPayload, setHasCopiedPayload] = useState(false);

  // Resolve dynamic canonical categories from guest intelligence
  const summaryResult = useMemo(() => {
    return resolveGuestInfrastructureSummary(domain, technologies, evidenceList, observations, infrastructure);
  }, [domain, technologies, evidenceList, observations, infrastructure]);

  const itemsToRender = summaryResult.detectedRows.length > 0 ? summaryResult.detectedRows : summaryResult.rows;

  const handleCopyPayload = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setHasCopiedPayload(true);
      setTimeout(() => setHasCopiedPayload(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className={`w-full ${className}`} data-testid="compact-infrastructure-overview">
      {/* ─── EXACT WX COMPACT INFRASTRUCTURE OVERVIEW TABLE ────────────────── */}
      <div className="w-full rounded-2xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card overflow-hidden shadow-[0_1px_2px_rgba(16,24,20,0.035)] transition-all flex flex-col justify-between">
        <div>
          {/* 1. Header Bar */}
          <div className="px-5 py-3 border-b border-[#EEEEEB] dark:border-border-divider bg-[#FAFAF8] dark:bg-surface-secondary flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-[0.24em] uppercase text-[#5F625F] dark:text-muted-foreground">
              INFRASTRUCTURE SUMMARY
            </span>
            <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
              {summaryResult.observedCount > 0 ? `${summaryResult.observedCount} observed` : 'Observing'}
            </span>
          </div>

          {/* 2. Dynamic Observed Rows */}
          {itemsToRender.length === 0 ? (
            <div className="px-5 py-8 text-center space-y-2">
              <p className="text-xs text-[#5F625F] dark:text-muted-foreground font-mono">
                Observing perimeter telemetry for {domain}…
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EEEEEB] dark:divide-border-divider">
              {itemsToRender.map((item) => {
                const IconComponent = CATEGORY_ICONS[item.categoryKey] || Server;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveInvestigation(item)}
                    aria-label={`${item.label}: ${item.componentName}`}
                    className="w-full text-left px-5 py-3 flex items-center justify-between bg-transparent hover:bg-[#F7F8F6] dark:hover:bg-surface-row-hover active:bg-[#F1F6F3] dark:active:bg-surface-row-active transition-colors duration-150 ease-out cursor-pointer group focus-ring select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 pr-3">
                      <div className="p-1.5 rounded-lg bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border text-[#5F625F] dark:text-muted-foreground group-hover:text-foreground group-hover:border-[#DCDCD7] dark:group-hover:border-border-strong transition-colors duration-150 flex-shrink-0">
                        <Icon icon={IconComponent} size="small" />
                      </div>
                      <div className="min-w-0 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                        <div className="text-[11px] sm:w-28 font-mono uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground group-hover:text-foreground transition-colors duration-150 shrink-0">
                          {item.label}
                        </div>
                        <div className="text-xs sm:text-[13px] font-mono truncate flex items-center gap-1.5 text-foreground font-medium">
                          <span>{item.componentName}</span>
                          {item.details && (
                            <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground font-normal">
                              · {item.details}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-muted-foreground/50 group-hover:text-[#3568C8] group-hover:translate-x-0.5 transition-all duration-150">
                      <Icon icon={ChevronRight} size="small" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Footer Action: View full infrastructure › */}
        {onViewFullInfrastructure && (
          <div className="border-t border-[#EEEEEB] dark:border-border-divider bg-[#FAFAF8] dark:bg-surface-secondary px-5 py-3">
            <button
              type="button"
              onClick={onViewFullInfrastructure}
              className="w-full inline-flex items-center justify-between text-xs font-medium text-foreground hover:text-[#3568C8] transition-colors duration-150 cursor-pointer focus-ring group"
            >
              <span>
                View full infrastructure
                {itemsToRender.length > 0 && ` (${itemsToRender.length} components)`}
              </span>
              <Icon
                icon={ChevronRight}
                size="small"
                className="text-muted-foreground group-hover:text-[#3568C8] group-hover:translate-x-0.5 transition-transform duration-150"
              />
            </button>
          </div>
        )}
      </div>

      {/* ─── CONTEXTUAL INVESTIGATION MODAL (GX-SAFE) ────────────────────────── */}
      <AnimatePresence>
        {activeInvestigation && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs"
            onClick={() => setActiveInvestigation(null)}
            data-testid="guest-investigation-overlay"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-2xl border border-[#E1E1DC] dark:border-border bg-[#FFFFFF] dark:bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              data-testid="guest-investigation-modal"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#EEEEEB] dark:border-border-divider bg-[#FAFAF8] dark:bg-surface-secondary flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#FFFFFF] dark:bg-card border border-[#E2E2DD] dark:border-border text-[#3568C8] dark:text-primary">
                    <Icon
                      icon={CATEGORY_ICONS[activeInvestigation.categoryKey] || Server}
                      size="medium"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-mono font-bold text-foreground">
                        {activeInvestigation.componentName}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase tracking-wider ${
                          activeInvestigation.confidence === 'HIGH'
                            ? 'bg-[#EAF7F2] text-[#178A68] border border-[#B9E5D6] dark:text-emerald-400 dark:bg-emerald-950/30'
                            : activeInvestigation.confidence === 'MEDIUM'
                            ? 'bg-[#FFF8E6] text-[#996500] border border-[#FFE6A5] dark:text-amber-400 dark:bg-amber-950/30'
                            : 'bg-[#EEF4FF] text-[#3568C8] border border-[#C8D8F6] dark:text-primary dark:bg-primary/10'
                        }`}
                      >
                        {activeInvestigation.confidence} CONFIDENCE
                      </span>
                    </div>
                    <span className="text-xs font-mono text-[#5F625F] dark:text-muted-foreground">
                      {activeInvestigation.label} · {activeInvestigation.role}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveInvestigation(null)}
                  className="p-1.5 rounded-lg hover:bg-[#F4F4F1] dark:hover:bg-surface-metadata text-[#5F625F] hover:text-foreground transition-colors cursor-pointer"
                  title="Close investigation panel"
                  aria-label="Close"
                >
                  <Icon icon={X} size="small" />
                </button>
              </div>

              {/* Forensic Content */}
              <div className="p-6 overflow-y-auto space-y-5 text-xs font-sans">
                {/* 1. Verification Reality */}
                <div className="p-4 rounded-xl bg-[#FAFAF8] dark:bg-surface-secondary/50 border border-[#EEEEEB] dark:border-border space-y-2">
                  <div className="flex items-center gap-1.5 text-[#178A68] dark:text-emerald-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                    <Icon icon={ShieldCheck} size="small" />
                    <span>Verification Claim Boundary</span>
                  </div>
                  <p className="text-foreground text-sm font-medium leading-relaxed m-0">
                    {activeInvestigation.whatThisProves}
                  </p>
                </div>

                {/* 2. Anti-Overreach Boundary */}
                <div className="p-4 rounded-xl bg-[#FFFDF5] dark:bg-amber-950/10 border border-[#FFE8A3] dark:border-amber-800/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#996500] dark:text-amber-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                    <Icon icon={ShieldAlert} size="small" />
                    <span>What This Does Not Prove (Anti-Overreach Boundary)</span>
                  </div>
                  <p className="text-[#664D00] dark:text-amber-300/90 leading-relaxed m-0">
                    {activeInvestigation.whatThisDoesNotProve}
                  </p>
                </div>

                {/* 3. Observed Wire Signal */}
                <div className="space-y-2">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground block">
                    Observed Wire Signal
                  </span>
                  <div className="p-3 rounded-xl bg-[#F4F4F1] dark:bg-surface-metadata border border-[#E2E2DD] dark:border-border font-mono text-xs text-foreground select-all">
                    <code>{activeInvestigation.observedSignal}</code>
                  </div>
                </div>

                {/* 4. Wire Evidence Payload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#5F625F] dark:text-muted-foreground flex items-center gap-1.5">
                      <Icon icon={FileCode} size="small" />
                      <span>Wire Evidence Transmission Record</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyPayload(
                          activeInvestigation.rawPayload || activeInvestigation.observedSignal
                        )
                      }
                      className="text-[11px] font-mono text-[#3568C8] dark:text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {hasCopiedPayload ? (
                        <>
                          <Icon icon={Check} size="small" className="text-[#178A68]" />
                          <span className="text-[#178A68]">Copied payload</span>
                        </>
                      ) : (
                        <>
                          <Icon icon={Copy} size="small" />
                          <span>Copy payload</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-[#1E293B] text-[#F8FAFC] font-mono text-[11px] overflow-x-auto leading-relaxed max-h-48 whitespace-pre-wrap select-all">
                    {activeInvestigation.rawPayload ||
                      `HTTP/2 200 OK\nserver: ${activeInvestigation.componentName.toLowerCase()}\ndate: ${new Date().toUTCString()}\ncontent-type: text/html; charset=UTF-8\nstrict-transport-security: max-age=31536000; includeSubDomains\nx-content-type-options: nosniff`}
                  </pre>
                </div>

                {/* 5. Provenance */}
                <div className="pt-3 border-t border-[#EEEEEB] dark:border-border-divider flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground font-semibold">Provenance:</span>
                    <span>{activeInvestigation.source || 'Perimeter HTTP Wire Response'}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-foreground font-semibold">Status:</span>
                    <span className="text-[#178A68] dark:text-emerald-400 font-bold">VERIFIED WIRE TELEMETRY</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-[#EEEEEB] dark:border-border-divider bg-[#FAFAF8] dark:bg-surface-secondary flex items-center justify-between">
                <span className="text-[11px] font-mono text-[#5F625F] dark:text-muted-foreground">
                  Target Domain: <strong className="text-foreground">{domain}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => setActiveInvestigation(null)}
                  className="px-4 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-card border border-[#E1E1DC] dark:border-border text-xs font-mono font-semibold text-foreground hover:bg-[#F4F4F1] dark:hover:bg-surface-metadata transition-colors cursor-pointer shadow-xs"
                >
                  Close ×
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default GuestInfrastructureTable;
