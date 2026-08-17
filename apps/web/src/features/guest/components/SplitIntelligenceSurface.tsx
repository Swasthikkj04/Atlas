import { useState } from "react";
import { motion } from "motion/react";
import type { AssessmentData } from "../types";
import { ease } from "../types";

interface SplitIntelligenceSurfaceProps {
  domain: string;
  data: AssessmentData;
  reduced: boolean;
}

function parseFindingDescription(body?: string): {
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

function getFindingObservationState(item?: { label: string; body: string }): {
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

export function SplitIntelligenceSurface({
  domain,
  data,
  reduced,
}: SplitIntelligenceSurfaceProps) {
  const [selectedFindingLabel, setSelectedFindingLabel] = useState<string | null>(null);
  const [isRawEvidenceOpen, setIsRawEvidenceOpen] = useState<boolean>(false);
  const [isAllFindingsExpanded, setIsAllFindingsExpanded] = useState<boolean>(false);

  const paragraphs = data.brief?.paragraphs ?? [];
  const observations = data.observations ?? [];
  const technologies = data.technologies ?? [];

  // Parse BE-128 paragraphs into 3 executive visual layers
  const fullText = paragraphs.join(" ").trim();
  const sentences = fullText
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const overallState = sentences[0] ?? "";
  const mainConcern = sentences[1] ?? "";
  const secondaryObservation = sentences.slice(2).join(" ");

  // Severity counts (excluding INFO)
  const criticalCount = observations.filter(
    (o) => o.severity?.toLowerCase() === "critical",
  ).length;
  const highCount = observations.filter(
    (o) => o.severity?.toLowerCase() === "high",
  ).length;
  const mediumCount = observations.filter(
    (o) => o.severity?.toLowerCase() === "medium",
  ).length;
  const lowCount = observations.filter(
    (o) => o.severity?.toLowerCase() === "low",
  ).length;

  const severityItems = [
    { count: criticalCount, label: "Critical" },
    { count: highCount, label: "High" },
    { count: mediumCount, label: "Medium" },
    { count: lowCount, label: "Low" },
  ];

  // Actionable findings only (exclude INFO and 'Infrastructure processed')
  const actionable = observations.filter(
    (o) =>
      o.severity &&
      o.severity.toLowerCase() !== "informational" &&
      o.severity.toLowerCase() !== "info" &&
      !o.label.toLowerCase().includes("infrastructure processed"),
  );

  const severityOrder: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const sortedActionable = [...actionable].sort(
    (a, b) =>
      (severityOrder[b.severity?.toLowerCase() ?? ""] ?? 0) -
      (severityOrder[a.severity?.toLowerCase() ?? ""] ?? 0),
  );

  // Construct quiet infrastructure history rail items from backend data
  const formattedToday = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const historyItems: Array<{ date: string; headline: string }> = [];

  // 1. Always start with Infrastructure understood
  historyItems.push({
    date: formattedToday,
    headline: "Infrastructure understood",
  });

  // 2. Include backend timeline entries if provided (excluding internal processing/system events)
  if (data.timeline && data.timeline.length > 0) {
    for (const entry of data.timeline) {
      const rawHeadline = entry.headline || "";
      if (
        rawHeadline.toLowerCase().includes("infrastructure processed") ||
        rawHeadline.toLowerCase().includes("atlashealth")
      ) {
        continue;
      }

      const entryDate = entry.date
        ? new Date(entry.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : formattedToday;

      if (!historyItems.some((h) => h.headline === rawHeadline)) {
        historyItems.push({
          date: entryDate,
          headline: rawHeadline,
        });
      }
    }
  }

  // 3. Include actionable findings as meaningful user-facing events
  for (const obs of sortedActionable) {
    const rawLabel = obs.label;
    if (
      rawLabel.toLowerCase().includes("infrastructure processed") ||
      rawLabel.toLowerCase().includes("atlashealth")
    ) {
      continue;
    }

    if (!historyItems.some((h) => h.headline === rawLabel)) {
      historyItems.push({
        date: formattedToday,
        headline: rawLabel,
      });
    }
  }

  const getSeverityBadgeClass = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "text-red-600 dark:text-red-400 font-bold";
      case "high":
        return "text-amber-600 dark:text-amber-400 font-bold";
      case "medium":
        return "text-yellow-600 dark:text-yellow-400 font-semibold";
      case "low":
      default:
        return "text-blue-600 dark:text-blue-400 font-medium";
    }
  };

  const effectiveFindingLabel =
    selectedFindingLabel ?? (sortedActionable[0]?.label ?? null);

  const selectedFinding = effectiveFindingLabel
    ? (sortedActionable.find(
        (f) =>
          f.label.trim().toLowerCase() ===
          effectiveFindingLabel.trim().toLowerCase(),
      ) ?? sortedActionable[0] ?? null)
    : null;

  const { state: observationState, summary: observationSummary } =
    getFindingObservationState(selectedFinding ?? undefined);
  let evidenceSource = "DNS lookup";

  if (selectedFinding) {
    const labelLower = selectedFinding.label.toLowerCase();

    // Determine Evidence Source Category (DNS, HTTP, TLS, Technology)
    if (
      labelLower.includes("spf") ||
      labelLower.includes("dmarc") ||
      labelLower.includes("dns") ||
      labelLower.includes("ipv6")
    ) {
      evidenceSource = "DNS lookup";
    } else if (
      labelLower.includes("header") ||
      labelLower.includes("hsts") ||
      labelLower.includes("csp") ||
      labelLower.includes("http")
    ) {
      evidenceSource = "HTTP response";
    } else if (
      labelLower.includes("ssl") ||
      labelLower.includes("tls") ||
      labelLower.includes("cert")
    ) {
      evidenceSource = "TLS handshake";
    } else {
      evidenceSource = "Technology detection";
    }
  }

  const matchingEvidence = selectedFinding
    ? (data.evidence?.find(
        (e) =>
          e.relatedObservations?.some(
            (ro) =>
              ro.trim().toLowerCase() ===
              selectedFinding.label.trim().toLowerCase(),
          ),
      ) ||
      data.evidence?.find((e) => {
        const labelLower = selectedFinding.label.toLowerCase();
        const titleLower = (e.title || "").toLowerCase();
        const summaryLower = (e.summary || "").toLowerCase();
        const catLower = (e.category || "").toLowerCase();

        if (labelLower.includes("spf") && (titleLower.includes("spf") || summaryLower.includes("spf"))) return true;
        if (labelLower.includes("hsts") && (titleLower.includes("hsts") || summaryLower.includes("hsts") || catLower.includes("tls"))) return true;
        if (labelLower.includes("ipv6") && (titleLower.includes("ipv6") || titleLower.includes("a records") || summaryLower.includes("a records"))) return true;
        if ((labelLower.includes("ssl") || labelLower.includes("tls") || labelLower.includes("cert")) && (catLower.includes("tls") || titleLower.includes("tls") || titleLower.includes("cert"))) return true;
        return false;
      }) || null)
    : null;

  const selectedObservedDate =
    selectedFinding?.firstObserved ||
    new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.5, ease }}
      aria-label={`Split Intelligence Surface for ${domain}`}
      className="max-w-[1200px] mx-auto px-5 sm:px-10 mb-4 sm:mb-6"
    >
      {/* Subject Identity Header */}
      <header className="pb-3.5 mb-4 sm:pb-4 sm:mb-5 border-b border-border/60 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-mono text-[1.25rem] sm:text-[1.375rem] font-bold tracking-[0.12em] text-foreground uppercase">
            {domain.toUpperCase()}
          </h1>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] sm:text-[11.5px] text-muted-foreground/80 tracking-wider uppercase select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>Infrastructure understood</span>
        </div>
      </header>

      {/* Main Upper Split Grid: Executive Understanding | What Matters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-6 lg:gap-8 pb-4 mb-4 sm:pb-5 sm:mb-5 border-b border-border/60">
        {/* Left Column: Executive Understanding (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-3.5 bg-surface-understanding p-4 sm:p-5">
          <h2 className="font-mono text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase">
            Executive Understanding
          </h2>

          <div className="space-y-2 sm:space-y-2.5">
            {/* Layer 1: Overall State */}
            {overallState.length > 0 && (
              <p className="font-display font-medium text-[1.0625rem] sm:text-[1.1875rem] text-foreground leading-[1.48] tracking-[-0.015em]">
                {overallState}
              </p>
            )}

            {/* Layer 2: Main Concern */}
            {mainConcern.length > 0 && (
              <p className="font-display font-normal text-[0.9375rem] sm:text-[1rem] text-foreground/90 leading-[1.5] tracking-[-0.01em]">
                {mainConcern}
              </p>
            )}

            {/* Layer 3: Secondary Observation */}
            {secondaryObservation.length > 0 && (
              <div className="pt-2 border-t border-border/40">
                <p className="font-display text-[0.875rem] sm:text-[0.9375rem] text-muted-foreground leading-[1.5] tracking-[-0.005em]">
                  {secondaryObservation}
                </p>
              </div>
            )}
          </div>

          {/* Severity Metrics */}
          <div className="pt-2.5 sm:pt-3 border-t border-border/40 flex flex-wrap items-center gap-x-6 gap-y-1.5">
            {severityItems.map(({ count, label }) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-semibold tabular-nums text-foreground">
                  {count}
                </span>
                <span className="text-[12px] font-medium text-muted-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: What Matters (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-2 sm:space-y-2.5 bg-surface-matters p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-mono text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase">
              What Matters
            </h2>
            <span className="text-[11.5px] text-muted-foreground/70 font-mono">
              {sortedActionable.length === 1
                ? "1 finding"
                : `${sortedActionable.length} findings`}
            </span>
          </div>

          {sortedActionable.length === 0 ? (
            <div className="py-4 px-1 space-y-1.5">
              <h3 className="font-display font-medium text-[14.5px] text-foreground">
                Nothing requires immediate attention.
              </h3>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                No critical, high, medium, or low findings were identified in this snapshot.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="divide-y divide-border/40">
                {(isAllFindingsExpanded
                  ? sortedActionable
                  : sortedActionable.slice(0, 3)
                ).map((item, idx) => {
                  const isSelected =
                    effectiveFindingLabel !== null &&
                    effectiveFindingLabel.trim().toLowerCase() ===
                      item.label.trim().toLowerCase();
                  const { occurrence, significance } = parseFindingDescription(
                    item.body,
                  );

                  return (
                    <button
                      key={item.label + idx}
                      type="button"
                      onClick={() => {
                        setSelectedFindingLabel(
                          selectedFindingLabel &&
                            selectedFindingLabel.trim().toLowerCase() ===
                              item.label.trim().toLowerCase()
                            ? null
                            : item.label,
                        );
                      }}
                      aria-selected={isSelected}
                      aria-controls="evidence-rail"
                      className={`w-full text-left py-2.5 px-3 -mx-3 transition-colors cursor-pointer space-y-1 rounded-none ${
                        isSelected
                          ? "bg-surface-evidence border-l-2 border-foreground ring-1 ring-border/80"
                          : "hover:bg-surface-app/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold tracking-widest uppercase ${getSeverityBadgeClass(
                            item.severity,
                          )}`}
                        >
                          {item.severity}
                        </span>
                        {isSelected && (
                          <span className="text-[9.5px] font-mono text-foreground font-bold uppercase tracking-wider bg-surface-app px-1.5 py-0.5 border border-border/60">
                            SELECTED
                          </span>
                        )}
                      </div>

                      <h3 className="font-display font-medium text-[13.5px] sm:text-[14px] text-foreground leading-snug truncate">
                        {item.label}
                      </h3>

                      <div className="flex items-center justify-between text-[12px] text-muted-foreground pt-0.5">
                        <span className={isSelected ? "text-foreground/90 leading-snug" : "truncate pr-2"}>
                          {occurrence}
                        </span>
                        <span
                          className={`shrink-0 transition-transform ${
                            isSelected ? "text-foreground font-bold translate-x-0.5" : "text-foreground/50"
                          }`}
                        >
                          →
                        </span>
                      </div>

                      {isSelected &&
                        significance &&
                        getFindingObservationState(item).state !== "FAILED" &&
                        getFindingObservationState(item).state !== "UNKNOWN" && (
                          <div className="pt-2 mt-1 border-t border-border/40 space-y-0.5">
                            <div className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-muted-foreground/80">
                              Why it matters
                            </div>
                            <div className="text-[12px] text-foreground/90 leading-relaxed font-sans">
                              {significance}
                            </div>
                          </div>
                        )}
                    </button>
                  );
                })}
              </div>

              {sortedActionable.length > 3 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAllFindingsExpanded((prev) => !prev)}
                    aria-expanded={isAllFindingsExpanded}
                    className="text-[12px] font-medium text-foreground hover:text-foreground/80 transition-colors cursor-pointer focus-ring"
                  >
                    {isAllFindingsExpanded
                      ? "Show fewer findings ↑"
                      : `View all ${sortedActionable.length} findings →`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lower Split Grid: Evidence Rail (Left) | Infrastructure (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-start gap-6 lg:gap-8">
        {/* Left Lower: Evidence Lineage Rail (6 cols on lg) */}
        <div
          id="evidence-rail"
          className="lg:col-span-6 space-y-2.5 sm:space-y-3 bg-surface-evidence p-4 sm:p-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase">
              Evidence
            </h2>
            {selectedFinding && (
              <button
                type="button"
                onClick={() => setSelectedFindingLabel(null)}
                className="text-[10.5px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-ring"
                aria-label="Close evidence inspection"
              >
                Close ✕
              </button>
            )}
          </div>

          {selectedFinding ? (
            <div className="space-y-2.5 pt-0.5">
              <div className="relative pl-5 space-y-2.5">
                {/* Continuous vertical connecting line */}
                <div className="absolute left-[3.5px] top-[5px] bottom-[8px] w-[1px] bg-border/70" />

                {/* Node 1: Finding */}
                <div className="relative flex items-start gap-2.5">
                  <span className="absolute -left-[20px] top-[5px] w-2 h-2 rounded-full bg-foreground ring-4 ring-surface-evidence" />
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-medium text-foreground text-[13px] leading-snug">
                      {selectedFinding.label}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground/75 uppercase tracking-wider">
                      Finding
                    </div>
                  </div>
                </div>

                {/* Node 2: Observation */}
                <div className="relative flex items-start gap-2.5">
                  <span className="absolute -left-[20px] top-[5px] w-2 h-2 rounded-full bg-foreground ring-4 ring-surface-evidence" />
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-mono text-[12px] font-semibold text-foreground uppercase tracking-wider">
                      {observationState}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground/75 uppercase tracking-wider">
                      Observation
                    </div>
                  </div>
                </div>

                {/* Node 3: Source */}
                <div className="relative flex items-start gap-2.5">
                  <span className="absolute -left-[20px] top-[5px] w-2 h-2 rounded-full bg-foreground ring-4 ring-surface-evidence" />
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-mono text-[12px] text-foreground/90">
                      {evidenceSource}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground/75 uppercase tracking-wider">
                      Source
                    </div>
                  </div>
                </div>

                {/* Node 4: Observed Signal */}
                <div className="relative flex items-start gap-2.5">
                  <span className="absolute -left-[20px] top-[5px] w-2 h-2 rounded-full bg-foreground ring-4 ring-surface-evidence" />
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-[12px] text-foreground/90 leading-snug line-clamp-2">
                      {observationSummary}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground/75 uppercase tracking-wider">
                      Observed signal
                    </div>
                  </div>
                </div>

                {/* Node 5: Observed Time */}
                <div className="relative flex items-start gap-2.5">
                  <span className="absolute -left-[20px] top-[5px] w-2 h-2 rounded-full bg-foreground ring-4 ring-surface-evidence" />
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-mono text-[11.5px] text-foreground/90">
                      {selectedObservedDate}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground/75 uppercase tracking-wider">
                      Observed time
                    </div>
                  </div>
                </div>
              </div>

              {/* Progressive Raw Evidence Inspection (FE-GX-006) */}
              {!isRawEvidenceOpen ? (
                <div className="pt-1.5 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setIsRawEvidenceOpen(true)}
                    className="text-[11.5px] font-mono text-foreground/70 hover:text-foreground transition-colors cursor-pointer focus-ring"
                  >
                    View raw evidence →
                  </button>
                </div>
              ) : (
                <div className="pt-2.5 mt-2 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-mono text-[10.5px] font-bold tracking-[0.2em] text-foreground uppercase">
                      Raw Evidence
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsRawEvidenceOpen(false)}
                      className="text-[10.5px] font-mono text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-ring"
                      aria-label="Close raw evidence inspection"
                    >
                      Close raw evidence ×
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono pb-1 border-b border-border/40">
                    <div>
                      <span className="text-muted-foreground/75 block text-[9.5px] uppercase tracking-wider">Source</span>
                      <span className="text-foreground/90 font-medium truncate block">{matchingEvidence?.source || evidenceSource}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/75 block text-[9.5px] uppercase tracking-wider">Status</span>
                      <span className="text-foreground/90 font-bold block">{observationState}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground/75 block text-[9.5px] uppercase tracking-wider">Observed</span>
                      <span className="text-foreground/90 font-medium truncate block">{matchingEvidence?.collectedAt || selectedObservedDate}</span>
                    </div>
                  </div>

                  {matchingEvidence?.payload ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9.5px] font-mono text-muted-foreground/75 uppercase tracking-wider">
                        <span>Observed artifact</span>
                        <span>{matchingEvidence.category || evidenceSource}</span>
                      </div>
                      <pre className="font-mono text-[11px] text-foreground/90 whitespace-pre-wrap break-all bg-surface-app/90 p-2.5 rounded border border-border/50 leading-relaxed max-h-[140px] overflow-y-auto select-text">
                        {matchingEvidence.payload}
                      </pre>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-[9.5px] font-mono text-muted-foreground/75 uppercase tracking-wider">
                        Observation status ({observationState})
                      </div>
                      <div className="text-[11.5px] font-mono text-foreground/90 bg-surface-app/90 p-2.5 rounded border border-border/50 leading-relaxed">
                        {observationSummary || "Observation recorded in snapshot."}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-2 text-[12.5px] text-muted-foreground/75 font-mono">
              Select a finding to inspect its evidence.
            </div>
          )}
        </div>

        {/* Right Lower: Infrastructure (6 cols on lg) */}
        <div className="lg:col-span-6 space-y-2.5 sm:space-y-3 bg-surface-infrastructure p-4 sm:p-5">
          <h2 className="font-mono text-[11px] font-bold tracking-[0.22em] text-muted-foreground uppercase">
            Infrastructure
          </h2>
          {technologies.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground italic">
              Origin web endpoint availability verified.
            </p>
          ) : (
            <div className="divide-y divide-border/40">
              {technologies.slice(0, 4).map((tech, idx) => (
                <div
                  key={tech.name + idx}
                  className="py-2.5 first:pt-0.5 last:pb-0.5 space-y-0.5"
                >
                  <div className="font-medium text-foreground text-[13px] sm:text-[13.5px] leading-snug">
                    {tech.name}
                  </div>
                  {(tech.role || tech.category) && (
                    <div className="text-[12px] text-muted-foreground leading-normal">
                      {tech.role || tech.category}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

export default SplitIntelligenceSurface;
