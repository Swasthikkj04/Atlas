import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Info,
  FileCode2,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Search,
  Globe,
  Radio,
  Terminal,
} from "lucide-react";
import type { AssessmentData, Observation } from "../types";
import { ease } from "../types";
import { GuestInfrastructureTable } from "./GuestInfrastructureTable";

interface SplitIntelligenceSurfaceProps {
  domain: string;
  data: AssessmentData;
  reduced: boolean;
  onReset?: () => void;
  onClaim?: () => void;
}

export function parseFindingDescription(body?: string): {
  occurrence: string;
  significance: string | null;
} {
  if (!body) return { occurrence: "", significance: null };
  const trimmed = body.trim();
  const firstPeriodIdx = trimmed.indexOf(". ");
  if (firstPeriodIdx !== -1) {
    const occurrence = trimmed.slice(0, firstPeriodIdx + 1).trim();
    const significance = trimmed.slice(firstPeriodIdx + 2).trim();
    if (significance.length > 0) {
      return { occurrence, significance };
    }
  }
  return { occurrence: trimmed, significance: null };
}

export function getFindingObservationState(item?: { label: string; body: string }): {
  state: "OBSERVED" | "MISSING" | "UNKNOWN" | "FAILED";
  summary: string;
} {
  if (!item) return { state: "MISSING", summary: "" };
  const labelLower = item.label.toLowerCase();
  const bodyLower = (item.body || "").toLowerCase();
  const { occurrence } = parseFindingDescription(item.body);

  if (
    bodyLower.includes("failed") ||
    bodyLower.includes("could not establish") ||
    bodyLower.includes("connection refused") ||
    bodyLower.includes("timeout") ||
    labelLower.includes("unreachable") ||
    labelLower.includes("failed")
  ) {
    return {
      state: "FAILED",
      summary: occurrence || "Evidence collection probe failed.",
    };
  }

  if (
    bodyLower.includes("unknown") ||
    bodyLower.includes("could not be determined") ||
    bodyLower.includes("inconclusive") ||
    labelLower.includes("unknown")
  ) {
    return {
      state: "UNKNOWN",
      summary: occurrence || "Observation could not be determined.",
    };
  }

  if (
    labelLower.includes("missing") ||
    labelLower.includes("not found") ||
    labelLower.includes("not configured") ||
    labelLower.includes("no spf") ||
    labelLower.includes("no dmarc") ||
    labelLower.includes("no aaaa")
  ) {
    return {
      state: "MISSING",
      summary: occurrence || "No record was observed.",
    };
  }

  return {
    state: "OBSERVED",
    summary: occurrence || "Observed signal in snapshot.",
  };
}

export function getSeverityStyle(severity?: string): {
  badge: string;
  border: string;
  text: string;
  icon: typeof AlertTriangle;
} {
  switch (severity?.toLowerCase()) {
    case "critical":
      return {
        badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
        border: "border-l-red-500",
        text: "text-red-600 dark:text-red-400",
        icon: ShieldAlert,
      };
    case "high":
      return {
        badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
        border: "border-l-amber-500",
        text: "text-amber-600 dark:text-amber-400",
        icon: AlertTriangle,
      };
    case "medium":
      return {
        badge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
        border: "border-l-yellow-500",
        text: "text-yellow-600 dark:text-yellow-400",
        icon: AlertTriangle,
      };
    case "low":
      return {
        badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
        border: "border-l-blue-500",
        text: "text-blue-600 dark:text-blue-400",
        icon: Info,
      };
    case "informational":
    case "info":
    default:
      return {
        badge: "bg-muted text-muted-foreground border-border",
        border: "border-l-muted-foreground/40",
        text: "text-muted-foreground",
        icon: Info,
      };
  }
}

export function determineEvidenceSource(finding: Observation): string {
  const labelLower = finding.label.toLowerCase();
  const bodyLower = (finding.body || "").toLowerCase();

  if (
    labelLower.includes("spf") ||
    labelLower.includes("dmarc") ||
    labelLower.includes("dns") ||
    labelLower.includes("ipv6") ||
    labelLower.includes("nameserver") ||
    bodyLower.includes("dns")
  ) {
    return "DNS lookup";
  }
  if (
    labelLower.includes("header") ||
    labelLower.includes("hsts") ||
    labelLower.includes("csp") ||
    labelLower.includes("x-frame") ||
    labelLower.includes("http") ||
    bodyLower.includes("http response")
  ) {
    return "HTTP response";
  }
  if (
    labelLower.includes("ssl") ||
    labelLower.includes("tls") ||
    labelLower.includes("cert") ||
    bodyLower.includes("tls handshake")
  ) {
    return "TLS handshake";
  }
  return "Technology detection";
}

function PayloadCopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied to clipboard" : "Copy evidence to clipboard"}
      className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded bg-card border border-border/80 focus-ring cursor-pointer"
    >
      {copied ? (
        <>
          <Check className="size-3 text-emerald-500" strokeWidth={2.5} />
          <span className="text-emerald-500">Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3" strokeWidth={1.5} />
          <span>Copy payload</span>
        </>
      )}
    </button>
  );
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  informational: 0,
  info: 0,
};

export function SplitIntelligenceSurface({
  domain,
  data,
  reduced,
}: SplitIntelligenceSurfaceProps) {
  const [selectedFindingLabel, setSelectedFindingLabel] = useState<string | null>(null);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>("ALL");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [isEvidenceDrawerOpen, setIsEvidenceDrawerOpen] = useState<boolean>(false);
  const [expandedFindingKeys, setExpandedFindingKeys] = useState<Record<string, boolean>>({});

  const paragraphs = data.brief?.paragraphs ?? [];
  const observations = useMemo(() => data.observations ?? [], [data.observations]);
  const technologies = data.technologies ?? [];
  const evidenceList = useMemo(() => data.evidence ?? [], [data.evidence]);

  // Severity counts
  const criticalCount = observations.filter(
    (o) => o.severity?.toLowerCase() === "critical"
  ).length;
  const highCount = observations.filter(
    (o) => o.severity?.toLowerCase() === "high"
  ).length;
  const mediumCount = observations.filter(
    (o) => o.severity?.toLowerCase() === "medium"
  ).length;
  const lowCount = observations.filter(
    (o) => o.severity?.toLowerCase() === "low"
  ).length;
  const infoCount = observations.filter(
    (o) =>
      o.severity?.toLowerCase() === "informational" ||
      o.severity?.toLowerCase() === "info"
  ).length;

  // Filter out internal processing events
  const userFacingObservations = useMemo(() => {
    return observations.filter(
      (o) =>
        !o.label.toLowerCase().includes("infrastructure processed") &&
        !o.label.toLowerCase().includes("atlashealth")
    );
  }, [observations]);

  // Section 2: What Matters Now (Critical & High)
  const whatMattersNow = useMemo(() => {
    return userFacingObservations
      .filter(
        (o) =>
          o.severity?.toLowerCase() === "critical" ||
          o.severity?.toLowerCase() === "high"
      )
      .sort(
        (a, b) =>
          (SEVERITY_ORDER[b.severity?.toLowerCase() ?? ""] ?? 0) -
          (SEVERITY_ORDER[a.severity?.toLowerCase() ?? ""] ?? 0)
      );
  }, [userFacingObservations]);

  // Section 3: Other Things Worth Knowing (Medium, Low, Info)
  const otherObservations = useMemo(() => {
    return userFacingObservations
      .filter(
        (o) =>
          o.severity?.toLowerCase() !== "critical" &&
          o.severity?.toLowerCase() !== "high"
      )
      .sort(
        (a, b) =>
          (SEVERITY_ORDER[b.severity?.toLowerCase() ?? ""] ?? 0) -
          (SEVERITY_ORDER[a.severity?.toLowerCase() ?? ""] ?? 0)
      );
  }, [userFacingObservations]);

  // Filtered other findings by tab and search
  const filteredOtherObservations = useMemo(() => {
    return otherObservations.filter((obs) => {
      // Category filter
      if (selectedCategoryTab === "DNS") {
        const isDns =
          obs.category?.toLowerCase() === "dns" ||
          obs.label.toLowerCase().includes("spf") ||
          obs.label.toLowerCase().includes("dmarc") ||
          obs.label.toLowerCase().includes("ipv6");
        if (!isDns) return false;
      } else if (selectedCategoryTab === "TLS") {
        const isTls =
          obs.category?.toLowerCase() === "tls" ||
          obs.category?.toLowerCase() === "security" ||
          obs.label.toLowerCase().includes("tls") ||
          obs.label.toLowerCase().includes("ssl") ||
          obs.label.toLowerCase().includes("hsts");
        if (!isTls) return false;
      } else if (selectedCategoryTab === "HTTP") {
        const isHttp =
          obs.category?.toLowerCase() === "http" ||
          obs.label.toLowerCase().includes("header") ||
          obs.label.toLowerCase().includes("csp") ||
          obs.label.toLowerCase().includes("x-frame");
        if (!isHttp) return false;
      } else if (selectedCategoryTab === "INFO") {
        const isInfo =
          obs.severity?.toLowerCase() === "informational" ||
          obs.severity?.toLowerCase() === "info";
        if (!isInfo) return false;
      }

      // Search filter
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        return (
          obs.label.toLowerCase().includes(q) ||
          obs.body.toLowerCase().includes(q) ||
          (obs.whyItMatters && obs.whyItMatters.toLowerCase().includes(q))
        );
      }

      return true;
    });
  }, [otherObservations, selectedCategoryTab, searchFilter]);

  // Active finding for evidence inspection
  const activeFinding = useMemo(() => {
    if (!selectedFindingLabel) return userFacingObservations[0] ?? null;
    return (
      userFacingObservations.find(
        (f) =>
          f.label.trim().toLowerCase() === selectedFindingLabel.trim().toLowerCase()
      ) ?? userFacingObservations[0] ?? null
    );
  }, [selectedFindingLabel, userFacingObservations]);

  // Matching evidence for active finding
  const matchingEvidence = useMemo(() => {
    if (!activeFinding) return null;
    const labelLower = activeFinding.label.toLowerCase();

    // 1. Check direct relatedObservations mapping
    const directMatch = evidenceList.find((e) =>
      e.relatedObservations?.some(
        (ro) => ro.trim().toLowerCase() === labelLower
      )
    );
    if (directMatch) return directMatch;

    // 2. Keyword fallback matching
    return (
      evidenceList.find((e) => {
        const titleLower = (e.title || "").toLowerCase();
        const summaryLower = (e.summary || "").toLowerCase();
        const catLower = (e.category || "").toLowerCase();

        if (labelLower.includes("spf") && (titleLower.includes("spf") || summaryLower.includes("spf"))) return true;
        if (labelLower.includes("hsts") && (titleLower.includes("hsts") || summaryLower.includes("hsts") || catLower.includes("tls"))) return true;
        if (labelLower.includes("ipv6") && (titleLower.includes("ipv6") || titleLower.includes("a records") || summaryLower.includes("a records"))) return true;
        if ((labelLower.includes("ssl") || labelLower.includes("tls") || labelLower.includes("cert")) && (catLower.includes("tls") || titleLower.includes("tls") || titleLower.includes("cert"))) return true;
        return false;
      }) ?? evidenceList[0] ?? null
    );
  }, [activeFinding, evidenceList]);

  const toggleFindingExpand = (key: string) => {
    setExpandedFindingKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleInspectFinding = (finding: Observation) => {
    setSelectedFindingLabel(finding.label);
    setIsEvidenceDrawerOpen(true);
  };

  const handleInspectEvidenceForTech = (techName: string) => {
    const matchingObs = userFacingObservations.find(
      (obs) =>
        obs.label.toLowerCase().includes(techName.toLowerCase()) ||
        obs.body.toLowerCase().includes(techName.toLowerCase())
    );
    if (matchingObs) {
      setSelectedFindingLabel(matchingObs.label);
    } else {
      const matchingEv = evidenceList.find(
        (e) =>
          e.relatedTechnologies?.some((t) => t.toLowerCase() === techName.toLowerCase()) ||
          e.title.toLowerCase().includes(techName.toLowerCase()) ||
          e.summary.toLowerCase().includes(techName.toLowerCase()) ||
          (e.payload && e.payload.toLowerCase().includes(techName.toLowerCase()))
      );
      if (matchingEv) {
        setSelectedFindingLabel(matchingEv.title);
      } else if (userFacingObservations.length > 0) {
        setSelectedFindingLabel(userFacingObservations[0].label);
      }
    }
    setIsEvidenceDrawerOpen(true);
  };

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.45, ease }}
      aria-label={`Infrastructure assessment for ${domain}`}
      className="max-w-[1480px] xl:max-w-[1600px] w-full mx-auto px-4 sm:px-8 lg:px-12 pb-12 sm:pb-16 space-y-10"
    >
      {/* ─── 0. DOMAIN IDENTITY & VERIFICATION SCOPE HEADER ───────────────── */}
      <header className="border-b border-border/80 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Globe className="size-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-mono text-[1.375rem] sm:text-[1.625rem] font-bold tracking-[0.08em] text-foreground uppercase">
                  {domain}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified
                </span>
              </div>
              <p className="text-[12.5px] font-mono text-muted-foreground mt-0.5">
                Snapshot captured {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · Canonical Infrastructure Intelligence
              </p>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="flex items-center gap-4 text-[12.5px] font-mono bg-card/60 p-2.5 rounded-xl border border-border/70">
            <div className="text-center px-2">
              <span className="block text-[15px] font-bold text-foreground tabular-nums">
                {userFacingObservations.length}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">Findings</span>
            </div>
            <div className="w-px h-6 bg-border/60" />
            <div className="text-center px-2">
              <span className="block text-[15px] font-bold text-foreground tabular-nums">
                {technologies.length}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">Technologies</span>
            </div>
            <div className="w-px h-6 bg-border/60" />
            <div className="text-center px-2">
              <span className="block text-[15px] font-bold text-foreground tabular-nums">
                {evidenceList.length}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">Evidences</span>
            </div>
          </div>
        </div>

        {/* Honest Verification Scope Notice */}
        <div className="p-3.5 sm:p-4 rounded-xl bg-card/50 border border-border/70 flex items-start gap-3 text-[12.5px] text-muted-foreground leading-relaxed">
          <Info className="size-4 text-cyan-500 shrink-0 mt-0.5" />
          <div>
            <strong className="text-foreground font-medium">Verification Scope Boundary: </strong>
            These findings are synthesized from non-invasive passive perimeter telemetry (authoritative DNS, edge TLS handshakes, HTTP response policies, and public technology signatures). Internal VPC configurations, private subnets, cloud IAM, and deep code repositories cannot be inspected in Guest mode.
          </div>
        </div>
      </header>

      {/* ─── 1. EXECUTIVE UNDERSTANDING ────────────────────────────────────── */}
      <section aria-labelledby="executive-understanding-heading" className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
          <h2
            id="executive-understanding-heading"
            className="font-mono text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase"
          >
            1. Executive Understanding
          </h2>
          <span className="font-mono text-[11px] text-muted-foreground/70">
            Synthesized Architectural Narrative
          </span>
        </div>

        <div className="p-5 sm:p-6 rounded-xl bg-card/60 border border-border/80 space-y-4 shadow-2xs">
          {paragraphs.length > 0 ? (
            paragraphs.map((para, pIdx) => (
              <p
                key={pIdx}
                className={`font-display text-foreground leading-[1.65] ${
                  pIdx === 0
                    ? "text-[1.0625rem] sm:text-[1.125rem] font-medium text-foreground"
                    : "text-[0.9375rem] sm:text-[1rem] text-foreground/85"
                }`}
              >
                {para}
              </p>
            ))
          ) : (
            <p className="font-display text-[1rem] text-muted-foreground">
              {domain} infrastructure snapshot recorded. Origin endpoints and perimeter routing are active.
            </p>
          )}

          {/* Severity Breakdown Badges */}
          <div className="pt-4 border-t border-border/50 flex flex-wrap items-center gap-3 font-mono text-[11.5px]">
            <span className="text-muted-foreground uppercase tracking-wider text-[10.5px]">Findings Distribution:</span>
            {criticalCount > 0 && (
              <span className="px-2.5 py-0.5 rounded bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 font-bold">
                {criticalCount} Critical
              </span>
            )}
            {highCount > 0 && (
              <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
                {highCount} High
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20 font-semibold">
              {mediumCount} Medium
            </span>
            <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {lowCount} Low
            </span>
            {infoCount > 0 && (
              <span className="px-2.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                {infoCount} Info
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ─── 2. WHAT MATTERS NOW (CRITICAL & HIGH FINDINGS) ───────────────── */}
      <section aria-labelledby="what-matters-now-heading" className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <h2
              id="what-matters-now-heading"
              className="font-mono text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase"
            >
              2. What Matters Now
            </h2>
            {whatMattersNow.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                {whatMattersNow.length} Actionable
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] text-muted-foreground/70">
            Critical & High Priority Observations
          </span>
        </div>

        {whatMattersNow.length === 0 ? (
          <div className="p-5 rounded-xl border border-border/70 bg-card/40 flex items-center gap-3 text-[13.5px] text-muted-foreground">
            <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
            <span>
              <strong>No Critical or High severity findings detected.</strong> The observable perimeter satisfies baseline cryptographic and routing standards.
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            {whatMattersNow.map((finding, idx) => {
              const sev = getSeverityStyle(finding.severity);
              const { occurrence, significance } = parseFindingDescription(finding.body);
              const whyItMattersText = finding.whyItMatters || significance;
              const source = determineEvidenceSource(finding);
              const isSelected = activeFinding?.label === finding.label;

              return (
                <div
                  key={finding.label + idx}
                  className={`p-5 sm:p-6 rounded-xl border bg-card/70 border-l-4 transition-all shadow-2xs space-y-3.5 ${sev.border} ${
                    isSelected ? "border-primary/40 ring-1 ring-primary/20" : "border-border/80"
                  }`}
                >
                  {/* Card Header: Severity, Source, Action */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10.5px] font-mono font-bold tracking-wider uppercase border ${sev.badge}`}
                      >
                        {finding.severity}
                      </span>
                      <span className="text-[11.5px] font-mono text-muted-foreground flex items-center gap-1">
                        <Radio className="size-3" />
                        Source: {source}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleInspectFinding(finding)}
                      className="inline-flex items-center gap-1.5 text-[12px] font-mono font-medium text-foreground/80 hover:text-foreground bg-muted/50 hover:bg-muted px-2.5 py-1 rounded border border-border/70 transition-colors cursor-pointer focus-ring"
                    >
                      <Terminal className="size-3" />
                      <span>Inspect Evidence</span>
                      <span>→</span>
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-medium text-[1.0625rem] sm:text-[1.125rem] text-foreground leading-snug">
                    {finding.label}
                  </h3>

                  {/* Finding Breakdown: What Happened & Why It Matters */}
                  <div className="space-y-2.5 pt-1">
                    {/* What Happened */}
                    <div className="p-3 rounded-lg bg-background/60 border border-border/50 text-[13px] sm:text-[13.5px] leading-relaxed">
                      <span className="font-mono text-[10.5px] uppercase font-bold tracking-wider text-muted-foreground/80 block mb-0.5">
                        What Happened:
                      </span>
                      <span className="text-foreground/90">{occurrence || finding.body}</span>
                    </div>

                    {/* Why It Matters */}
                    {whyItMattersText && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 text-[13px] sm:text-[13.5px] leading-relaxed">
                        <span className="font-mono text-[10.5px] uppercase font-bold tracking-wider text-primary block mb-0.5">
                          Why It Matters:
                        </span>
                        <span className="text-foreground/90">{whyItMattersText}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── 3. OTHER THINGS WORTH KNOWING (MEDIUM, LOW, INFO) ────────────── */}
      <section aria-labelledby="other-findings-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <h2
              id="other-findings-heading"
              className="font-mono text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase"
            >
              3. Other Things Worth Knowing
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono bg-muted text-muted-foreground border border-border">
              {otherObservations.length} Observations
            </span>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 p-0.5 bg-card rounded-lg border border-border/80 text-[11.5px] font-mono">
              {[
                { id: "ALL", label: "All" },
                { id: "DNS", label: "DNS & Mail" },
                { id: "TLS", label: "TLS & Sec" },
                { id: "HTTP", label: "HTTP" },
                { id: "INFO", label: "Info" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategoryTab(tab.id)}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    selectedCategoryTab === tab.id
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative">
              <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filter findings..."
                className="pl-8 pr-3 py-1 rounded-lg border border-border/80 bg-card text-[12px] font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {filteredOtherObservations.length === 0 ? (
          <div className="p-5 rounded-xl border border-border/70 bg-card/40 text-[13px] text-muted-foreground">
            No matching findings in this category.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOtherObservations.map((obs, idx) => {
              const sev = getSeverityStyle(obs.severity);
              const { occurrence, significance } = parseFindingDescription(obs.body);
              const whyText = obs.whyItMatters || significance;
              const source = determineEvidenceSource(obs);
              const isExpanded = !!expandedFindingKeys[obs.label + idx];

              return (
                <div
                  key={obs.label + idx}
                  className={`p-4 sm:p-5 rounded-xl border border-border/80 bg-card/50 hover:bg-card/80 transition-colors border-l-4 ${sev.border}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border ${sev.badge}`}
                        >
                          {obs.severity || "Info"}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground/80">
                          {source}
                        </span>
                      </div>

                      <h3 className="font-display font-medium text-[14.5px] sm:text-[15px] text-foreground leading-snug">
                        {obs.label}
                      </h3>

                      <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                        {occurrence || obs.body}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleInspectFinding(obs)}
                        className="text-[11px] font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded bg-muted/40 hover:bg-muted border border-border/60 transition-colors cursor-pointer focus-ring"
                        title="Inspect technical evidence"
                      >
                        Evidence
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleFindingExpand(obs.label + idx)}
                        className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-ring rounded"
                        aria-label={isExpanded ? "Collapse finding details" : "Expand finding details"}
                      >
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Progressive Disclosure (Expanded View) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-3 border-t border-border/50 space-y-2 text-[12.5px] leading-relaxed overflow-hidden"
                      >
                        <div>
                          <strong className="text-foreground font-mono text-[10.5px] uppercase block mb-0.5">
                            Full Occurrence:
                          </strong>
                          <p className="text-muted-foreground">{obs.body}</p>
                        </div>
                        {whyText && (
                          <div className="p-2.5 rounded bg-primary/5 border border-primary/10">
                            <strong className="text-primary font-mono text-[10.5px] uppercase block mb-0.5">
                              Why It Matters:
                            </strong>
                            <p className="text-foreground/90">{whyText}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── 4. INFRASTRUCTURE & ARCHITECTURE MATRIX ────────────────────────── */}
      <section aria-labelledby="infrastructure-matrix-heading" className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-border/60 pb-2">
          <div className="flex items-center gap-2">
            <h2
              id="infrastructure-matrix-heading"
              className="font-mono text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase"
            >
              4. Infrastructure & Architecture Matrix
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-mono bg-muted text-muted-foreground border border-border">
              {technologies.length} Components Discovered
            </span>
          </div>
          <span className="font-mono text-[11px] text-muted-foreground/70">
            Authoritative Ingress Flow, Observed Wire Fingerprints & Anti-Overreach Boundaries
          </span>
        </div>

        <GuestInfrastructureTable
          domain={domain}
          technologies={technologies}
          evidenceList={evidenceList}
          observations={observations}
          reduced={reduced}
          onInspectFinding={handleInspectFinding}
          onInspectEvidencePayload={handleInspectEvidenceForTech}
        />
      </section>

      {/* ─── 5. EVIDENCE & VERIFICATION MODAL / DRAWER ─────────────────────── */}
      <AnimatePresence>
        {isEvidenceDrawerOpen && activeFinding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="evidence-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md"
          >
            <motion.div
              initial={reduced ? false : { scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.24, ease }}
              className="w-full max-w-[760px] max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 sm:p-6 border-b border-border flex items-start justify-between gap-4 bg-muted/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Terminal className="size-4 text-cyan-500" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Technical Evidence Inspection
                    </span>
                  </div>
                  <h2
                    id="evidence-modal-title"
                    className="font-display font-medium text-[1.125rem] text-foreground leading-snug"
                  >
                    {activeFinding.label}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEvidenceDrawerOpen(false)}
                  className="size-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-ring"
                  aria-label="Close evidence inspection"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-background border border-border/80 text-[11.5px] font-mono">
                  <div>
                    <span className="text-muted-foreground/75 block text-[10px] uppercase tracking-wider">
                      Telemetry Source
                    </span>
                    <span className="text-foreground font-medium truncate block">
                      {matchingEvidence?.source || determineEvidenceSource(activeFinding)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground/75 block text-[10px] uppercase tracking-wider">
                      Severity Tier
                    </span>
                    <span className="text-foreground font-bold uppercase block">
                      {activeFinding.severity || "Info"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground/75 block text-[10px] uppercase tracking-wider">
                      Confidence
                    </span>
                    <span className="text-foreground font-medium uppercase block">
                      {activeFinding.confidence || "high"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground/75 block text-[10px] uppercase tracking-wider">
                      Observed Date
                    </span>
                    <span className="text-foreground font-medium truncate block">
                      {matchingEvidence?.collectedAt || activeFinding.firstObserved || "Today"}
                    </span>
                  </div>
                </div>

                {/* Occurrence & Significance */}
                <div className="space-y-2">
                  <div className="p-3.5 rounded-xl bg-background border border-border/70 space-y-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Observed Signal / Occurrence
                    </span>
                    <p className="text-[13px] text-foreground/90 leading-relaxed">
                      {activeFinding.body}
                    </p>
                  </div>

                  {activeFinding.whyItMatters && (
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-primary block">
                        Architectural Significance (Why It Matters)
                      </span>
                      <p className="text-[13px] text-foreground/90 leading-relaxed">
                        {activeFinding.whyItMatters}
                      </p>
                    </div>
                  )}
                </div>

                {/* Raw Evidence Payload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      <FileCode2 className="size-3.5" />
                      <span>Raw Collector Payload</span>
                    </div>
                    {matchingEvidence?.payload && (
                      <PayloadCopyButton value={matchingEvidence.payload} />
                    )}
                  </div>

                  {matchingEvidence?.payload ? (
                    <pre className="p-4 rounded-xl bg-surface-app border border-border/80 font-mono text-[12px] text-foreground leading-relaxed overflow-x-auto select-text whitespace-pre-wrap break-all max-h-[220px]">
                      {matchingEvidence.payload}
                    </pre>
                  ) : (
                    <div className="p-4 rounded-xl bg-surface-app border border-border/80 font-mono text-[12px] text-muted-foreground italic">
                      Direct raw artifact for this observation is encapsulated in the snapshot graph.
                    </div>
                  )}

                  {/* Hash & Collector info */}
                  {matchingEvidence?.hash && (
                    <div className="flex items-center justify-between text-[10.5px] font-mono text-muted-foreground/75 pt-1">
                      <span>Integrity: {matchingEvidence.hash}</span>
                      <span>Collector: {matchingEvidence.collector || "Nebula Engine v1.4"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-border flex items-center justify-end bg-muted/20">
                <button
                  type="button"
                  onClick={() => setIsEvidenceDrawerOpen(false)}
                  className="px-4 py-2 rounded-lg bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition-opacity cursor-pointer focus-ring"
                  style={{ color: "var(--background)" }}
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SplitIntelligenceSurface;
