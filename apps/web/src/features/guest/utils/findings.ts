import type { Observation, Severity } from "../types/index.ts";

export interface FindingDecomposition {
  occurrence: string;
  significance: string | null;
}

export function parseFindingDescription(description: string): FindingDecomposition {
  if (!description) return { occurrence: "No observation details available.", significance: null };
  const firstDot = description.indexOf(". ");
  if (firstDot === -1) {
    return { occurrence: description, significance: null };
  }
  return {
    occurrence: description.slice(0, firstDot + 1).trim(),
    significance: description.slice(firstDot + 2).trim(),
  };
}

export function getFindingObservationState(finding: {
  label: string;
  body?: string;
  observationState?: string;
}): {
  state: "OBSERVED" | "MISSING" | "FAILED" | "UNKNOWN";
  label: string;
} {
  if (finding.observationState) {
    return {
      state: finding.observationState as any,
      label: finding.observationState,
    };
  }

  const text = (finding.label + " " + (finding.body || "")).toLowerCase();
  if (
    text.includes("missing") ||
    text.includes("not found") ||
    text.includes("no dmarc") ||
    text.includes("no spf") ||
    text.includes("absent") ||
    text.includes("unprotected")
  ) {
    return { state: "MISSING", label: "MISSING" };
  }
  if (
    text.includes("refused") ||
    text.includes("failed") ||
    text.includes("error") ||
    text.includes("unreachable") ||
    text.includes("timed out")
  ) {
    return { state: "FAILED", label: "FAILED" };
  }
  if (
    text.includes("unknown") ||
    text.includes("insufficient") ||
    text.includes("undetermined")
  ) {
    return { state: "UNKNOWN", label: "UNKNOWN" };
  }
  return { state: "OBSERVED", label: "OBSERVED" };
}

export function getSeverityStyle(sev: Severity) {
  switch (sev) {
    case "critical":
      return {
        badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25",
        dot: "bg-red-500",
        border: "border-red-500/30",
        bg: "bg-red-500/[0.02]",
        label: "Critical",
      };
    case "high":
      return {
        badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
        dot: "bg-amber-500",
        border: "border-amber-500/30",
        bg: "bg-amber-500/[0.02]",
        label: "High Priority",
      };
    case "medium":
      return {
        badge: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/25",
        dot: "bg-yellow-500",
        border: "border-yellow-500/20",
        bg: "bg-yellow-500/[0.02]",
        label: "Medium",
      };
    case "low":
      return {
        badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
        dot: "bg-blue-500",
        border: "border-blue-500/20",
        bg: "bg-transparent",
        label: "Low",
      };
    case "informational":
    default:
      return {
        badge: "bg-muted text-muted-foreground border-border/60",
        dot: "bg-muted-foreground/60",
        border: "border-border/40",
        bg: "bg-transparent",
        label: "Informational",
      };
  }
}

export function determineEvidenceSource(finding: Observation): string {
  if ((finding as any).source) return (finding as any).source;
  const category = (finding.category || "").toLowerCase();
  if (category === "technology" || category === "tech" || category === "infrastructure") {
    return "Technology detection";
  }
  const text = (finding.label + " " + (finding.body || "")).toLowerCase();
  if (
    text.includes("cloudflare") ||
    text.includes("aws") ||
    text.includes("nginx") ||
    text.includes("fastly") ||
    text.includes("vercel") ||
    text.includes("framework") ||
    text.includes("technology")
  ) {
    return "Technology detection";
  }
  if (text.includes("dns") || text.includes("txt") || text.includes("spf") || text.includes("dmarc") || text.includes("dkim") || text.includes("mx") || text.includes("cname") || text.includes("aaaa")) {
    return "DNS lookup";
  }
  if (text.includes("tls") || text.includes("ssl") || text.includes("cert") || text.includes("cipher") || text.includes("handshake") || text.includes("alpn")) {
    return "TLS handshake";
  }
  if (text.includes("header") || text.includes("csp") || text.includes("hsts") || text.includes("cookie") || text.includes("http") || text.includes("x-frame") || text.includes("cors")) {
    return "HTTP response";
  }
  return "Technology detection";
}
