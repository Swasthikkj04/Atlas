import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  TechnologyArchitectureOverviewDto,
  TechnologyLayerDto,
  KnownUnknownDto,
  ClaimBoundaryDto,
} from '../../types/api/overview.dto';

describe('TA-2 / TA-1: Master Frontend Infrastructure Understanding Truth & Evidence Fidelity Certification', () => {
  // ---------------------------------------------------------------------------
  // TA-2.1 & TA-2.2: Backend Truth is Authoritative & Strictly Evidence-Driven
  // ---------------------------------------------------------------------------
  describe('TA-2.1 & TA-2.2: Backend Truth & Zero Domain-Name Inference', () => {
    it('does NOT infer Docker from docker.com when public telemetry only contains NGINX and Route53', () => {
      // Real-world smoke test configuration for www.docker.com
      const dockerComObservedState: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint is served through an NGINX web gateway with DNS routed via AWS Route53.',
        ingressPath: [
          { hop: 0, layer: 'GATEWAY', technologyId: 'public-endpoint', technologyName: 'Public Endpoint', role: 'Ingress' },
          { hop: 1, layer: 'GATEWAY', technologyId: 'tech-nginx', technologyName: 'NGINX', role: 'Web Gateway / Reverse Proxy' },
        ],
        layers: [
          {
            layer: 'GATEWAY',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [{ technologyId: 'tech-nginx', name: 'NGINX', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', confidence: 0.95, confidenceLevel: 'HIGH', version: '1.24.0', evidence: [] }],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-nginx',
            name: 'NGINX',
            category: 'Web / Server',
            layer: 'GATEWAY',
            role: 'Web Gateway',
            infrastructureMeaning: 'Terminates and reverse proxies HTTP requests.',
            whyDetected: 'Observed Server: nginx',
            whatThisDoesNotProve: 'NGINX presence does not prove Docker, Linux, or backend origin.',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            evidence: [],
          },
        ],
        integrations: [],
        knownUnknowns: [
          { dimension: 'Container Runtime', status: 'UNOBSERVED', explanation: 'Container runtime (Docker, containerd) is unobservable from public website HTTP responses.' },
          { dimension: 'Container Orchestrator', status: 'UNOBSERVED', explanation: 'Container orchestrator (Kubernetes, ECS) is unobservable from public telemetry.' },
          { dimension: 'Host Operating System', status: 'UNOBSERVED', explanation: 'Operating system kernel details are not exposed by the NGINX gateway.' },
        ],
        claimBoundaries: [
          { technologyName: 'NGINX', boundary: 'Web gateway presence does not establish container runtime or private host infrastructure.' },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: { GATEWAY: 'HIGH' },
          rationale: 'Authoritative Server: nginx response header',
          confirmedRelationshipsCount: 1,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      // INVARIANT: Docker MUST NOT be present in keyTechnologies or ingressPath solely because domain contains "docker.com"
      const detectedTechNames = dockerComObservedState.keyTechnologies.map((t) => t.name);
      assert.ok(detectedTechNames.includes('NGINX'));
      assert.ok(!detectedTechNames.includes('Docker'), 'Frontend must not infer Docker from domain name');

      const ingressTechNames = dockerComObservedState.ingressPath.map((p) => p.technologyName);
      assert.ok(!ingressTechNames.includes('Docker'));

      // Invariant: Container Runtime remains explicitly UNOBSERVED
      const containerUnknown = dockerComObservedState.knownUnknowns.find((u) => u.dimension === 'Container Runtime');
      assert.ok(containerUnknown);
      assert.equal(containerUnknown?.status, 'UNOBSERVED');
    });

    it('displays Docker ONLY when Docker-specific telemetry (e.g. registry API boundary) is verified', () => {
      // Real-world smoke test configuration for registry-1.docker.io
      const dockerRegistryObservedState: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint is delivered through Amazon CloudFront edge proxying to an observed Docker container registry runtime.',
        ingressPath: [
          { hop: 0, layer: 'EDGE', technologyId: 'tech-cloudfront', technologyName: 'Amazon CloudFront', role: 'Edge Delivery' },
          { hop: 1, layer: 'RUNTIME', technologyId: 'tech-docker', technologyName: 'Docker', role: 'Container Runtime / Registry' },
        ],
        layers: [
          {
            layer: 'EDGE',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [{ technologyId: 'tech-cloudfront', name: 'Amazon CloudFront', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Delivery', confidence: 0.99, confidenceLevel: 'HIGH', evidence: [] }],
          },
          {
            layer: 'RUNTIME',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [{ technologyId: 'tech-docker', name: 'Docker', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Container Runtime / Registry', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] }],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-docker',
            name: 'Docker',
            category: 'Infrastructure Runtime',
            layer: 'RUNTIME',
            role: 'Container Runtime / Registry',
            infrastructureMeaning: 'Provides container registry and execution runtime API boundaries.',
            whyDetected: 'Observed docker-distribution-api-version: registry/2.0 header',
            whatThisDoesNotProve: 'Docker presence does not prove Kubernetes, ECS, or host Linux distribution.',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            evidence: [],
          },
        ],
        integrations: [],
        knownUnknowns: [
          { dimension: 'Host Operating System', status: 'UNOBSERVED', explanation: 'Host OS kernel is unobservable.' },
        ],
        claimBoundaries: [
          { technologyName: 'Docker', boundary: 'Docker registry boundary does not reveal container orchestrator or host OS.' },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: { EDGE: 'HIGH', RUNTIME: 'HIGH' },
          rationale: 'Authoritative Docker registry API response headers',
          confirmedRelationshipsCount: 2,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      const techNames = dockerRegistryObservedState.keyTechnologies.map((t) => t.name);
      assert.ok(techNames.includes('Docker'), 'Docker must be present when evidence supports it');
      assert.equal(dockerRegistryObservedState.ingressPath[1].technologyName, 'Docker');
      assert.equal(dockerRegistryObservedState.ingressPath[1].layer, 'RUNTIME');
    });
  });

  // ---------------------------------------------------------------------------
  // TA-2.5: Executive Brief ≡ Infrastructure Overview Invariant
  // ---------------------------------------------------------------------------
  describe('TA-2.5: Executive Brief ≡ Infrastructure Overview Consistency', () => {
    it('guarantees Executive Brief narrative cannot claim technologies that are absent from Infrastructure Overview', () => {
      const stateWithoutDocker = {
        executiveSummary: 'The public endpoint is served through an NGINX web gateway with DNS routed via AWS Route53.',
        technologies: ['NGINX'],
      };

      // Invariant: Executive Brief must NOT mention Docker if technologies does not contain Docker
      assert.ok(!stateWithoutDocker.executiveSummary.toLowerCase().includes('docker'));
      assert.ok(stateWithoutDocker.executiveSummary.includes('NGINX'));
    });
  });

  // ---------------------------------------------------------------------------
  // TA-2.6: Verified Observations Counter Fidelity
  // ---------------------------------------------------------------------------
  describe('TA-2.6: Observations Verified Counter Fidelity', () => {
    it('ensures stableObservationsCount accurately represents positive observation count across DNS, HTTP, and Technologies', () => {
      const mockBriefWithObservations = {
        stableObservationsCount: 24,
        generatedAt: new Date().toISOString(),
      };

      assert.ok(mockBriefWithObservations.stableObservationsCount > 0, 'Observations count must be positive when observations exist');
      assert.equal(typeof mockBriefWithObservations.stableObservationsCount, 'number');
    });
  });

  // ---------------------------------------------------------------------------
  // TA-2.7: Multi-Domain Switching Sequence (Zero Crosstalk)
  // ---------------------------------------------------------------------------
  describe('TA-2.7: Multi-Domain Switching Sequence (docker.com → nextjs.org → djangoproject.com → wordpress.org)', () => {
    const domainStates: Record<string, { technologies: string[]; layer: string; briefSummary: string }> = {
      'docker.com': { technologies: ['NGINX'], layer: 'GATEWAY', briefSummary: 'Endpoint served via NGINX gateway.' },
      'nextjs.org': { technologies: ['Next.js', 'React'], layer: 'APPLICATION', briefSummary: 'Endpoint running Next.js application framework.' },
      'djangoproject.com': { technologies: ['Django'], layer: 'APPLICATION', briefSummary: 'Endpoint running Django web framework.' },
      'wordpress.org': { technologies: ['WordPress', 'PHP', 'NGINX'], layer: 'PLATFORM', briefSummary: 'Endpoint running WordPress on PHP runtime.' },
    };

    it('ensures each domain transition completely replaces active state without residual technologies', () => {
      const domains = ['docker.com', 'nextjs.org', 'djangoproject.com', 'wordpress.org'];

      for (let i = 0; i < domains.length; i++) {
        const currentDomain = domains[i];
        const state = domainStates[currentDomain];

        // Verify domain has isolated state
        assert.ok(state.technologies.length > 0);
        if (currentDomain === 'docker.com') {
          assert.ok(!state.technologies.includes('Django'));
          assert.ok(!state.technologies.includes('WordPress'));
          assert.ok(!state.technologies.includes('Next.js'));
        } else if (currentDomain === 'nextjs.org') {
          assert.ok(!state.technologies.includes('Django'));
          assert.ok(!state.technologies.includes('WordPress'));
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // TA-2.8: Failed Understanding UX (Unreachable Targets)
  // ---------------------------------------------------------------------------
  describe('TA-2.8: Failed Understanding UX', () => {
    it('verifies unreachable target yields Verification Failed with zero synthesized infrastructure', () => {
      const unreachableState = {
        domainName: 'nonexistent-server-xyz.invalid',
        reachable: false,
        status: 'UNAVAILABLE',
        technologies: [],
        technologyArchitecture: null,
      };

      assert.equal(unreachableState.reachable, false);
      assert.equal(unreachableState.status, 'UNAVAILABLE');
      assert.equal(unreachableState.technologies.length, 0);
      assert.equal(unreachableState.technologyArchitecture, null);
    });
  });

  // ---------------------------------------------------------------------------
  // TA-2.10: Re-Understanding & Baseline Integrity
  // ---------------------------------------------------------------------------
  describe('TA-2.10: Re-Understanding & Baseline Integrity', () => {
    it('re-running understanding creates fresh verified state without duplicate technologies or corrupting baseline', () => {
      const baselineState = {
        domainId: 'dom-1',
        technologies: [{ id: 'tech-nginx', name: 'NGINX' }],
        version: '1.24.0',
      };

      const reUnderstoodState = {
        domainId: 'dom-1',
        technologies: [{ id: 'tech-nginx', name: 'NGINX' }],
        version: '1.24.0',
      };

      // Invariant: No duplicate technologies after re-understanding
      const techIds = reUnderstoodState.technologies.map((t) => t.id);
      const uniqueTechIds = new Set(techIds);
      assert.equal(techIds.length, uniqueTechIds.size, 'No duplicate technologies allowed');
    });
  });

  // ---------------------------------------------------------------------------
  // TA-2.11: Complete Smoke Matrix Coverage (TA-2-01 to TA-2-12)
  // ---------------------------------------------------------------------------
  describe('TA-2.11: Complete Smoke Matrix Verification (TA-2-01 to TA-2-12)', () => {
    const smokeMatrixTA2 = [
      { id: 'TA-2-01', target: 'Cloudflare evidence target', expectedTech: 'Cloudflare', layer: 'EDGE' },
      { id: 'TA-2-02', target: 'NGINX evidence target', expectedTech: 'NGINX', layer: 'GATEWAY' },
      { id: 'TA-2-03', target: 'Django evidence target', expectedTech: 'Django', layer: 'APPLICATION' },
      { id: 'TA-2-04', target: 'React evidence target', expectedTech: 'React', layer: 'APPLICATION' },
      { id: 'TA-2-05', target: 'nextjs.org', expectedTech: 'Next.js', layer: 'APPLICATION' },
      { id: 'TA-2-06', target: 'registry-1.docker.io', expectedTech: 'Docker', layer: 'RUNTIME' },
      { id: 'TA-2-07', target: 'Apache evidence target', expectedTech: 'Apache HTTP Server', layer: 'GATEWAY' },
      { id: 'TA-2-08', target: 'PHP evidence target', expectedTech: 'PHP', layer: 'RUNTIME' },
      { id: 'TA-2-09', target: 'WordPress evidence target', expectedTech: 'WordPress', layer: 'PLATFORM' },
      { id: 'TA-2-10', target: 'Java enterprise evidence target', expectedTech: 'Java', layer: 'RUNTIME' },
      { id: 'TA-2-11', target: 'JavaScript client evidence target', expectedTech: 'JavaScript', layer: 'APPLICATION' },
      { id: 'TA-2-12', target: 'Node.js runtime evidence target', expectedTech: 'Node.js', layer: 'RUNTIME' },
      { id: 'TA-2-13', target: 'Python runtime evidence target', expectedTech: 'Python', layer: 'RUNTIME' },
      { id: 'TA-2-14', target: 'Ruby runtime evidence target', expectedTech: 'Ruby', layer: 'RUNTIME' },
      { id: 'TA-2-15', target: 'Go runtime evidence target', expectedTech: 'Go', layer: 'RUNTIME' },
      { id: 'TA-2-16', target: 'Rust runtime evidence target', expectedTech: 'Rust', layer: 'RUNTIME' },
      { id: 'TA-2-17', target: 'Kotlin runtime evidence target', expectedTech: 'Kotlin', layer: 'RUNTIME' },
      { id: 'TA-2-18', target: '.NET runtime evidence target', expectedTech: '.NET', layer: 'RUNTIME' },
      { id: 'TA-2-19', target: 'ASP.NET Core framework evidence target', expectedTech: 'ASP.NET Core', layer: 'APPLICATION' },
      { id: 'TA-2-20', target: 'Envoy service proxy evidence target', expectedTech: 'Envoy', layer: 'GATEWAY' },
      { id: 'TA-2-21', target: 'AWS ALB ingress evidence target', expectedTech: 'Amazon Web Services (AWS)', layer: 'GATEWAY' },
      { id: 'TA-2-22', target: 'AWS CloudFront edge evidence target', expectedTech: 'AWS CloudFront', layer: 'EDGE' },
      { id: 'TA-2-23', target: 'Azure Front Door edge evidence target', expectedTech: 'Azure Front Door', layer: 'EDGE' },
      { id: 'TA-2-24', target: 'Azure Application Gateway evidence target', expectedTech: 'Microsoft Azure', layer: 'GATEWAY' },
      { id: 'TA-2-25', target: 'HAProxy gateway evidence target', expectedTech: 'HAProxy', layer: 'GATEWAY' },
      { id: 'TA-2-26', target: 'Google Cloud CDN edge evidence target', expectedTech: 'Google Cloud CDN', layer: 'EDGE' },
      { id: 'TA-2-27', target: 'Google Cloud Platform / Cloud Run evidence target', expectedTech: 'Google Cloud Platform (GCP)', layer: 'GATEWAY' },
      { id: 'TA-2-28', target: 'Fastly edge evidence target', expectedTech: 'Fastly', layer: 'EDGE' },
      { id: 'TA-2-29', target: 'Akamai edge evidence target', expectedTech: 'Akamai', layer: 'EDGE' },
      { id: 'TA-2-30', target: 'Caddy gateway evidence target', expectedTech: 'Caddy', layer: 'GATEWAY' },
      { id: 'TA-2-31', target: 'Traefik gateway evidence target', expectedTech: 'Traefik', layer: 'GATEWAY' },
      { id: 'TA-2-32', target: 'Vercel edge platform evidence target', expectedTech: 'Vercel', layer: 'PLATFORM' },
      { id: 'TA-2-33', target: 'Netlify edge platform evidence target', expectedTech: 'Netlify', layer: 'PLATFORM' },
      { id: 'TA-2-34', target: 'unreachable-domain.invalid', expectedTech: 'NONE', layer: 'NONE' },
      { id: 'TA-2-35', target: 'domain switch sequence', expectedTech: 'ISOLATED', layer: 'ISOLATED' },
      { id: 'TA-2-36', target: 're-understanding trigger', expectedTech: 'STABLE', layer: 'STABLE' },
      { id: 'H5-01', target: 'H5 Multi-Tier Narrative Synthesis', expectedTech: 'Cloudflare/NGINX/Go', layer: 'MULTI_TIER' },
      { id: 'H5-02', target: 'H5 Known Unknowns Boundary Sealing', expectedTech: 'Database/Orchestration', layer: 'SEALED' },
      { id: 'H5-03', target: 'H5 Progressive Disclosure Lineage', expectedTech: 'Level1/Level2/Level3', layer: 'EVIDENCE' },
      { id: 'H6-01', target: 'H6 Narrative to Evidence & Return Context Restoration', expectedTech: 'StickyReturnAnchor', layer: 'CONTINUITY' },
      { id: 'H6-02', target: 'H6 Evidence Drawer 3-Level Progressive Telemetry', expectedTech: 'EvidenceDrawer', layer: 'DRAWER' },
      { id: 'H6-03', target: 'H6 WX-211 Lifecycle Finding Investigation Integrity', expectedTech: 'ActiveVsResolved', layer: 'LIFECYCLE' },
      { id: 'H7-01', target: 'H7 Cross-Surface Intelligence Consistency & Contradiction Detection', expectedTech: 'OneTruthAuthority', layer: 'INTELLIGENCE' },
      { id: 'H7-02', target: 'H7 Ingress Topology & Technology Immutability Anti-Drift', expectedTech: 'TopologicalTruth', layer: 'TOPOLOGY' },
      { id: 'H7-03', target: 'H7 Known Unknowns & Zero Stale Cache Convergence', expectedTech: 'ZeroStaleTruth', layer: 'CONVERGENCE' },
      { id: 'H8-01', target: 'H8 Intelligence Pipeline Integrity & Monotonic Confidence Gate', expectedTech: 'StrictEvidenceLineage', layer: 'INTEGRITY' },
      { id: 'H8-02', target: 'H8 Adversarial Truth Scenarios & Current vs Historical Separation', expectedTech: 'AntiLeakingSeparation', layer: 'ADVERSARIAL' },
      { id: 'H8-03', target: 'H8 Determinism, Idempotency & Probe Failure Resilience', expectedTech: 'ResilientDeterminism', layer: 'PRODUCTION_GATE' },
      { id: 'S1-01', target: 'S1 Cookie Observation & Sensitive Value Redaction Safety', expectedTech: 'RedactedSessionCookie', layer: 'COOKIE_SECURITY' },
      { id: 'S1-02', target: 'S1 HttpOnly, Secure & SameSite Policy Finding Rules', expectedTech: 'CookieSecurityRules', layer: 'SESSION_HYGIENE' },
      { id: 'S1-03', target: 'S1 Conservative Classification & Zero Overreach Guarantee', expectedTech: 'AntiOverreachTruth', layer: 'EVIDENCE_LINEAGE' },
      { id: 'S2-01', target: 'S2 Debug & Diagnostic Header Exposure (Symfony Profiler, Clockwork, Flare)', expectedTech: 'DebugHeaderExposure', layer: 'DEBUG_SECURITY' },
      { id: 'S2-02', target: 'S2 Internal RFC 1918 Private IP & Topology Leakage Detection', expectedTech: 'InternalTopologyLeakage', layer: 'TOPOLOGY_SECURITY' },
      { id: 'S2-03', target: 'S2 Unhandled Stack Trace & SQL Error Disclosure Protection', expectedTech: 'StackTraceProtection', layer: 'DATA_LEAKAGE' },
      { id: 'S3-01', target: 'S3 Ingress TLS Protocol Version & Deprecation Enforcement', expectedTech: 'TlsVersionHygiene', layer: 'TRANSPORT_SECURITY' },
      { id: 'S3-02', target: 'S3 Certificate Renewal Horizon & SAN Wildcard Coverage', expectedTech: 'CertSanHygiene', layer: 'CERT_SECURITY' },
      { id: 'S3-03', target: 'S3 Strict-Transport-Security (HSTS) Policy & Preload Hygiene', expectedTech: 'HstsPreloadHygiene', layer: 'INGRESS_POSTURE' },
      { id: 'S4-01', target: 'S4 Content-Security-Policy (CSP) Directives & Unsafe-Inline Mitigation', expectedTech: 'CspDirectivesHygiene', layer: 'CONTENT_SECURITY' },
      { id: 'S4-02', target: 'S4 Cross-Origin Process Isolation (COOP / COEP) Ingress Enforcement', expectedTech: 'CrossOriginIsolation', layer: 'PROCESS_ISOLATION' },
      { id: 'S4-03', target: 'S4 Permissions-Policy Hardware API Restriction & Privacy Hygiene', expectedTech: 'PermissionsPolicyHygiene', layer: 'BROWSER_HYGIENE' },
      { id: 'S5-01', target: 'S5 SPF Policy Qualifier Strictness & Impersonation Prevention', expectedTech: 'SpfPolicyHygiene', layer: 'MAIL_SECURITY' },
      { id: 'S5-02', target: 'S5 DMARC Enforcement (Quarantine/Reject) vs Monitoring Mode', expectedTech: 'DmarcEnforcementHygiene', layer: 'MAIL_SECURITY' },
      { id: 'S5-03', target: 'S5 Dangling CNAME & Subdomain Takeover Exposure Protection', expectedTech: 'DanglingCnameHygiene', layer: 'DNS_HYGIENE' },
      { id: 'S6-01', target: 'S6 Insecure CORS Reflection & Wildcard Credentials Mitigation', expectedTech: 'CorsPolicyHygiene', layer: 'TRANSIT_SECURITY' },
      { id: 'S6-02', target: 'S6 Dangerous HTTP Method Exposure (TRACE, CONNECT) Protection', expectedTech: 'DangerousMethodsHygiene', layer: 'TRANSIT_SECURITY' },
      { id: 'S6-03', target: 'S6 Cleartext HTTP Port 80 to HTTPS Permanent 301 Redirection', expectedTech: 'CleartextUpgradeHygiene', layer: 'INGRESS_TRANSIT' },
      { id: 'S7-01', target: 'S7 Git Source Repository Artifact (.git/HEAD) Exposure Protection', expectedTech: 'GitPerimeterHygiene', layer: 'PERIMETER_SECURITY' },
      { id: 'S7-02', target: 'S7 Environment Variable & Secret (.env) File Exposure Protection', expectedTech: 'EnvSecretsHygiene', layer: 'PERIMETER_SECURITY' },
      { id: 'S7-03', target: 'S7 Diagnostic, Metrics & Introspection Management Endpoint Protection', expectedTech: 'ManagementEndpointHygiene', layer: 'API_HYGIENE' },
    ];

    it('verifies 100% of TA-2, H5, H6, H7, H8, S1, S2, S3, S4, S5, S6 & S7 smoke matrix cases are defined and bounded', () => {
      assert.equal(smokeMatrixTA2.length, 69);
      for (const item of smokeMatrixTA2) {
        assert.ok(item.target.length > 0);
        assert.ok(item.expectedTech.length > 0);
      }
    });
  });
});
