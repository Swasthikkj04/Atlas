import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseFindingDescription,
  getFindingObservationState,
  getSeverityStyle,
  determineEvidenceSource,
} from "./utils/findings.ts";
import {
  TELEMETRY_STAGES,
  SAMPLE_DOMAINS,
  isValidDomain,
  normalizeDomain,
} from "./types/index.ts";
import type { Observation } from "./types/index.ts";

describe("GX-REDESIGN: Guest Experience UI & UX Redesign Specification", () => {
  describe("1. Canonical Findings Model & Progressive Disclosure", () => {
    it("correctly decomposes finding description into occurrence and significance", () => {
      const sampleBody =
        "No DMARC policy published in DNS. Without DMARC, unauthorized senders can forge emails from your domain with high deliverability.";
      const { occurrence, significance } = parseFindingDescription(sampleBody);

      assert.equal(occurrence, "No DMARC policy published in DNS.");
      assert.equal(
        significance,
        "Without DMARC, unauthorized senders can forge emails from your domain with high deliverability."
      );
    });

    it("handles single-sentence descriptions gracefully", () => {
      const sampleBody = "HSTS max-age is set to 31536000 seconds.";
      const { occurrence, significance } = parseFindingDescription(sampleBody);

      assert.equal(occurrence, "HSTS max-age is set to 31536000 seconds.");
      assert.equal(significance, null);
    });

    it("determines accurate observation states across signals", () => {
      assert.equal(
        getFindingObservationState({
          label: "Missing DMARC Policy",
          body: "No record found.",
        }).state,
        "MISSING"
      );

      assert.equal(
        getFindingObservationState({
          label: "TLS 1.3 Active",
          body: "Negotiated TLS 1.3 with X25519.",
        }).state,
        "OBSERVED"
      );

      assert.equal(
        getFindingObservationState({
          label: "Origin Unreachable",
          body: "TCP connection refused on port 443.",
        }).state,
        "FAILED"
      );

      assert.equal(
        getFindingObservationState({
          label: "Unknown Reverse Proxy",
          body: "Signature could not be determined.",
        }).state,
        "UNKNOWN"
      );
    });

    it("maps findings to canonical evidence sources", () => {
      const dnsObs: Observation = {
        label: "SPF Record Softfail Directive",
        body: "v=spf1 include:_spf.google.com ~all in DNS TXT.",
        severity: "medium",
      };
      assert.equal(determineEvidenceSource(dnsObs), "DNS lookup");

      const httpObs: Observation = {
        label: "Missing Content-Security-Policy Header",
        body: "No CSP header detected in HTTP response.",
        severity: "high",
      };
      assert.equal(determineEvidenceSource(httpObs), "HTTP response");

      const tlsObs: Observation = {
        label: "TLS 1.0/1.1 Deprecation",
        body: "Legacy TLS protocol suites observed during handshake probe.",
        severity: "high",
      };
      assert.equal(determineEvidenceSource(tlsObs), "TLS handshake");

      const techObs: Observation = {
        label: "Cloudflare Ingress Detected",
        body: "cf-ray and server headers identify Cloudflare Edge.",
        severity: "informational",
      };
      assert.equal(determineEvidenceSource(techObs), "Technology detection");
    });

    it("provides distinct styling tokens for all canonical severity tiers", () => {
      const crit = getSeverityStyle("critical");
      assert.ok(crit.badge.includes("red"));

      const high = getSeverityStyle("high");
      assert.ok(high.badge.includes("amber"));

      const med = getSeverityStyle("medium");
      assert.ok(med.badge.includes("yellow"));

      const low = getSeverityStyle("low");
      assert.ok(low.badge.includes("blue"));

      const info = getSeverityStyle("informational");
      assert.ok(info.badge.includes("muted"));
    });
  });

  describe("2. Live Telemetry Pipeline Contracts", () => {
    it("defines 5 canonical discovery stages with required metadata", () => {
      assert.equal(TELEMETRY_STAGES.length, 5);
      const stageIds = TELEMETRY_STAGES.map((s) => s.id);
      assert.deepEqual(stageIds, ["dns", "tls", "http", "tech", "brief"]);

      TELEMETRY_STAGES.forEach((stage) => {
        assert.ok(stage.label.length > 5);
        assert.ok(stage.detail.length > 10);
        assert.ok(["DNS", "TLS", "HTTP", "TECH", "BRIEF"].includes(stage.category));
      });
    });

    it("includes well-formed Quick-Try sample domains", () => {
      assert.ok(SAMPLE_DOMAINS.length >= 4);
      SAMPLE_DOMAINS.forEach((sample) => {
        assert.ok(isValidDomain(sample.domain));
        assert.ok(sample.label.length > 0);
        assert.ok(sample.category.length > 0);
        assert.ok(sample.highlight.length > 0);
      });
    });
  });

  describe("3. Domain Normalization & Invariants", () => {
    it("normalizes diverse input formats into clean FQDNs", () => {
      assert.equal(normalizeDomain("https://stripe.com/"), "stripe.com");
      assert.equal(normalizeDomain("http://github.com/login?ref=1"), "github.com");
      assert.equal(normalizeDomain("  cloudflare.com#anchor  "), "cloudflare.com");
      assert.equal(normalizeDomain("vercel.com."), "vercel.com");
    });

    it("validates domain syntax strictly", () => {
      assert.equal(isValidDomain("stripe.com"), true);
      assert.equal(isValidDomain("sub.domain.co.uk"), true);
      assert.equal(isValidDomain("not-a-domain"), false);
      assert.equal(isValidDomain(""), false);
    });
  });

  describe("4. Infrastructure Architecture Table & Matrix Contracts", () => {
    it("categorizes technologies into semantic infrastructure layers accurately", async () => {
      const { categorizeTechnology } = await import("./utils/infrastructure.ts");

      assert.equal(categorizeTechnology("Cloudflare", "CDN and WAF"), "Edge & CDN");
      assert.equal(categorizeTechnology("Fastly", "Edge Cloud"), "Edge & CDN");
      assert.equal(categorizeTechnology("NGINX", "Reverse Proxy"), "Ingress & Gateway");
      assert.equal(categorizeTechnology("Apache", "HTTP Server"), "Ingress & Gateway");
      assert.equal(categorizeTechnology("Next.js", "React Framework"), "Application & Frameworks");
      assert.equal(categorizeTechnology("AWS", "Cloud Infrastructure"), "Cloud & Hosting");
      assert.equal(categorizeTechnology("TLS Certificate", "SSL Encryption"), "Security & Cryptography");
    });

    it("synthesizes multi-hop packet ingress flow from observed components", async () => {
      const { synthesizeIngressHops } = await import("./utils/infrastructure.ts");

      const techs = [
        { name: "Cloudflare", role: "Anycast CDN", confidence: "high" as const },
        { name: "NGINX", role: "Reverse Proxy", confidence: "high" as const, version: "1.24" },
        { name: "Next.js", role: "Web Application", confidence: "high" as const },
      ];

      const hops = synthesizeIngressHops(techs, "stripe.com");
      assert.ok(hops.length >= 3);
      assert.equal(hops[0].name, "Public Client");
      assert.equal(hops[1].name, "Cloudflare");
      assert.equal(hops[2].name, "NGINX");
    });

    it("generates honest anti-overreach claim boundaries for components", async () => {
      const { generateClaimBoundaries } = await import("./utils/infrastructure.ts");

      const cfBoundaries = generateClaimBoundaries(
        { name: "Cloudflare", role: "Edge CDN", confidence: "high" as const },
        "example.com"
      );
      assert.ok(cfBoundaries.whatThisProves.includes("Cloudflare Edge"));
      assert.ok(cfBoundaries.whatThisDoesNotProve.includes("origin IP"));

      const nginxBoundaries = generateClaimBoundaries(
        { name: "NGINX", role: "Reverse Proxy", confidence: "high" as const },
        "example.com"
      );
      assert.ok(nginxBoundaries.whatThisProves.includes("NGINX"));
      assert.ok(nginxBoundaries.whatThisDoesNotProve.includes("backend"));
    });

    it("exports well-structured Infrastructure Bill of Materials (IBOM)", async () => {
      const { enrichTechnologies, generateInventoryExport } = await import("./utils/infrastructure.ts");

      const techs = [
        { name: "Cloudflare", role: "Edge Anycast", confidence: "high" as const },
        { name: "NGINX", role: "HTTP Gateway", confidence: "high" as const, version: "1.24" },
      ];
      const observations = [
        { label: "TLS 1.3 Active", body: "Modern cipher suites configured.", severity: "informational" as const },
      ];

      const enriched = enrichTechnologies(techs, [], "stripe.com");
      const ibom = generateInventoryExport("stripe.com", enriched, observations);

      assert.ok(ibom.includes("# Infrastructure Bill of Materials (IBOM)"));
      assert.ok(ibom.includes("stripe.com"));
      assert.ok(ibom.includes("Cloudflare"));
      assert.ok(ibom.includes("NGINX"));
      assert.ok(ibom.includes("TLS 1.3 Active"));
    });
  });

  describe("5. Landing-to-Guest State Handoff Contracts", () => {
    it("extracts and normalizes query parameter domains safely", () => {
      const parseQueryDomain = (queryString: string): string | null => {
        const params = new URLSearchParams(queryString);
        const raw = params.get("domain") || params.get("d");
        if (!raw) return null;
        const normalized = normalizeDomain(raw);
        return isValidDomain(normalized) ? normalized : null;
      };

      assert.equal(parseQueryDomain("?domain=stripe.com"), "stripe.com");
      assert.equal(parseQueryDomain("?domain=https%3A%2F%2Fgithub.com%2Flogin"), "github.com");
      assert.equal(parseQueryDomain("?d=cloudflare.com"), "cloudflare.com");
      assert.equal(parseQueryDomain("?domain=invalid_domain_with_no_tld"), null);
      assert.equal(parseQueryDomain(""), null);
      assert.equal(parseQueryDomain("?other=123"), null);
    });

    it("prevents malformed or XSS query injections from executing", () => {
      const sanitizeAndValidate = (input: string): boolean => {
        const normalized = normalizeDomain(input);
        return isValidDomain(normalized);
      };

      assert.equal(sanitizeAndValidate("<script>alert(1)</script>"), false);
      assert.equal(sanitizeAndValidate("javascript:void(0)"), false);
      assert.equal(sanitizeAndValidate("stripe.com/../../../etc/passwd"), true); // stripped to stripe.com FQDN
      assert.equal(normalizeDomain("stripe.com/../../../etc/passwd"), "stripe.com");
    });
  });
});


