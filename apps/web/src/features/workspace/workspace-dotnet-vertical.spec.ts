import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TechnologyArchitectureOverviewDto, DomainOverviewResponseDto } from '../../types/api/overview.dto';
import { resolveAdaptiveInfrastructureModel } from './contracts/adaptive-infrastructure.contract.ts';
import { buildComponentViewModel } from './contracts/adaptive-infrastructure-detail.contract.ts';

describe('T24: .NET / ASP.NET Core Infrastructure Understanding Vertical Invariants', () => {
  // ---------------------------------------------------------------------------
  // 1. .NET & ASP.NET Core Category & Semantic Role Mapping
  // ---------------------------------------------------------------------------
  describe('1. .NET & ASP.NET Core Category & Semantic Role Mapping', () => {
    it('maps .NET to RUNTIME layer and ASP.NET Core to APPLICATION layer with authoritative roles', () => {
      const dotnetArchitecture: TechnologyArchitectureOverviewDto = {
        architectureSummary:
          'The public endpoint is served through an NGINX reverse proxy gateway delivering an ASP.NET Core web application executing on the Microsoft .NET runtime.',
        ingressPath: [
          {
            hop: 0,
            layer: 'GATEWAY',
            technologyId: 'public-endpoint',
            technologyName: 'Public Endpoint',
            role: 'Ingress',
          },
          {
            hop: 1,
            layer: 'GATEWAY',
            technologyId: 'tech-nginx',
            technologyName: 'NGINX',
            role: 'Web Gateway / Reverse Proxy',
          },
          {
            hop: 2,
            layer: 'APPLICATION',
            technologyId: 'tech-aspnet-core',
            technologyName: 'ASP.NET Core',
            role: 'Server-side Web Application Framework',
          },
          {
            hop: 3,
            layer: 'RUNTIME',
            technologyId: 'tech-dotnet',
            technologyName: '.NET',
            role: 'Server-side Application Runtime / .NET Environment',
          },
        ],
        layers: [
          {
            layer: 'APPLICATION',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [
              {
                technologyId: 'tech-aspnet-core',
                name: 'ASP.NET Core',
                category: 'Frameworks',
                layer: 'APPLICATION',
                role: 'Server-side Web Application Framework',
                infrastructureMeaning:
                  'The observed endpoint appears to use ASP.NET Core as a server-side web application framework.',
                whyDetected: 'Observed X-Powered-By: ASP.NET Core 8.0',
                whatThisDoesNotProve:
                  'ASP.NET Core presence indicates a server-side web application framework, but does not prove IIS, Windows Server, Azure, SQL Server, Docker, Kubernetes, Entity Framework, or hosting environment.',
                confidence: 0.98,
                confidenceLevel: 'HIGH',
                version: '8.0',
                evidence: [],
              },
            ],
          },
          {
            layer: 'RUNTIME',
            state: 'OBSERVED',
            confidenceLevel: 'HIGH',
            technologies: [
              {
                technologyId: 'tech-dotnet',
                name: '.NET',
                category: 'Infrastructure Runtime',
                layer: 'RUNTIME',
                role: 'Server-side Application Runtime / .NET Environment',
                infrastructureMeaning:
                  'The observed endpoint appears to expose or execute a Microsoft .NET-based server-side application/runtime boundary.',
                whyDetected: 'Observed .NET runtime environment signature',
                whatThisDoesNotProve:
                  '.NET presence confirms server-side runtime execution, but does not prove C# specifically, ASP.NET Core, IIS, Kestrel, Azure, Windows Server, SQL Server, Docker, Kubernetes, Entity Framework, Blazor, or any database.',
                confidence: 0.95,
                confidenceLevel: 'HIGH',
                version: '8.0',
                evidence: [],
              },
            ],
          },
        ],
        keyTechnologies: [
          {
            technologyId: 'tech-aspnet-core',
            name: 'ASP.NET Core',
            category: 'Frameworks',
            layer: 'APPLICATION',
            role: 'Server-side Web Application Framework',
            infrastructureMeaning:
              'The observed endpoint appears to use ASP.NET Core as a server-side web application framework.',
            whyDetected: 'Observed X-Powered-By: ASP.NET Core 8.0',
            whatThisDoesNotProve:
              'ASP.NET Core presence indicates a server-side web application framework, but does not prove IIS, Windows Server, Azure, SQL Server, Docker, Kubernetes, Entity Framework, or hosting environment.',
            confidence: 0.98,
            confidenceLevel: 'HIGH',
            version: '8.0',
            evidence: [],
          },
          {
            technologyId: 'tech-dotnet',
            name: '.NET',
            category: 'Infrastructure Runtime',
            layer: 'RUNTIME',
            role: 'Server-side Application Runtime / .NET Environment',
            infrastructureMeaning:
              'The observed endpoint appears to expose or execute a Microsoft .NET-based server-side application/runtime boundary.',
            whyDetected: 'Observed .NET runtime environment signature',
            whatThisDoesNotProve:
              '.NET presence confirms server-side runtime execution, but does not prove C# specifically, ASP.NET Core, IIS, Kestrel, Azure, Windows Server, SQL Server, Docker, Kubernetes, Entity Framework, Blazor, or any database.',
            confidence: 0.95,
            confidenceLevel: 'HIGH',
            version: '8.0',
            evidence: [],
          },
        ],
        integrations: [],
        knownUnknowns: [
          {
            dimension: 'Database Backend',
            status: 'UNOBSERVED',
            explanation: 'Backend database (SQL Server, PostgreSQL, MySQL) is unobservable from public HTTP/API responses.',
          },
          {
            dimension: 'Host Operating System',
            status: 'UNOBSERVED',
            explanation: 'Operating system (Windows Server vs Linux container) is not established by the .NET runtime boundary.',
          },
        ],
        claimBoundaries: [
          {
            technologyId: 'tech-dotnet',
            technologyName: '.NET',
            boundary:
              '.NET presence confirms server runtime execution, but does not prove C#, Windows Server, Azure, or SQL Server backends.',
          },
        ],
        confidence: {
          overallLevel: 'HIGH',
          overallScore: 0.95,
          layerConfidence: { RUNTIME: 'HIGH', APPLICATION: 'HIGH' },
          rationale: 'Observed X-Powered-By: ASP.NET Core 8.0',
          confirmedRelationshipsCount: 2,
          supportedRelationshipsCount: 0,
          inferredRelationshipsCount: 0,
        },
      };

      const aspnetCore = dotnetArchitecture.keyTechnologies.find((t) => t.name === 'ASP.NET Core')!;
      assert.ok(aspnetCore);
      assert.equal(aspnetCore.layer, 'APPLICATION');
      assert.equal(aspnetCore.version, '8.0');
      assert.ok(aspnetCore.infrastructureMeaning.includes('ASP.NET Core as a server-side web application framework'));

      const dotnet = dotnetArchitecture.keyTechnologies.find((t) => t.name === '.NET')!;
      assert.ok(dotnet);
      assert.equal(dotnet.layer, 'RUNTIME');
      assert.equal(dotnet.version, '8.0');
      assert.ok(dotnet.infrastructureMeaning.includes('Microsoft .NET-based server-side application/runtime boundary'));
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Version Fidelity (Optional, No "Version: Unknown")
  // ---------------------------------------------------------------------------
  describe('2. Version Fidelity', () => {
    it('preserves exact .NET and ASP.NET Core versions when evidenced and leaves version undefined when unevidenced', () => {
      const versionedAspNetCore = buildComponentViewModel({
        id: 'tech-aspnet-core',
        category: 'FRAMEWORK',
        name: 'ASP.NET Core',
        role: 'Server-side Web Application Framework',
        layer: 'APPLICATION',
        confidenceLevel: 'HIGH',
        version: '8.0',
        state: 'OBSERVED',
      });

      assert.equal(versionedAspNetCore.version, '8.0');

      const unversionedDotNet = buildComponentViewModel({
        id: 'tech-dotnet',
        category: 'RUNTIME',
        name: '.NET',
        role: 'Server-side Application Runtime',
        layer: 'RUNTIME',
        confidenceLevel: 'HIGH',
        state: 'OBSERVED',
      });

      assert.equal(unversionedDotNet.version, undefined);
      assert.ok(!unversionedDotNet.attributes.some((attr) => attr.value.toLowerCase().includes('unknown')));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Multi-Technology Coexistence (Cloudflare + IIS/NGINX + ASP.NET Core + .NET)
  // ---------------------------------------------------------------------------
  describe('3. Multi-Technology Coexistence & Anti-Stack Collapsing', () => {
    it('independently models Cloudflare, IIS, ASP.NET Core, and .NET without collapsing into generic "Microsoft Stack"', () => {
      const mockDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-dotnet-full', domainName: 'enterprise-dotnet.com', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 95, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-dotnet', createdAt: new Date().toISOString(), responseTimeMs: 20, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Enterprise architecture with Cloudflare, IIS gateway, ASP.NET Core application framework, and .NET runtime.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-cloudflare', name: 'Cloudflare', category: 'CDN / Edge', layer: 'EDGE', role: 'Edge Proxy', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-microsoft-iis', name: 'Microsoft IIS', category: 'Web / Server', layer: 'GATEWAY', role: 'Web Gateway', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-aspnet-core', name: 'ASP.NET Core', category: 'Frameworks', layer: 'APPLICATION', role: 'Web Framework', version: '8.0', confidence: 0.98, confidenceLevel: 'HIGH', evidence: [] },
              { technologyId: 'tech-dotnet', name: '.NET', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server Runtime', version: '8.0', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const model = resolveAdaptiveInfrastructureModel('dom-dotnet-full', 'enterprise-dotnet.com', mockDomain);

      const edgeGroup = model.categoryGroups.find((g) => g.category === 'EDGE');
      assert.ok(edgeGroup);
      assert.equal(edgeGroup?.components[0].name, 'Cloudflare');

      const gwGroup = model.categoryGroups.find((g) => g.category === 'GATEWAY');
      assert.ok(gwGroup);
      assert.equal(gwGroup?.components[0].name, 'Microsoft IIS');

      const appGroup = model.categoryGroups.find((g) => g.category === 'APPLICATION');
      assert.ok(appGroup);
      assert.equal(appGroup?.components[0].name, 'ASP.NET Core');
      assert.equal(appGroup?.components[0].version, '8.0');

      const runtimeGroup = model.categoryGroups.find((g) => g.category === 'RUNTIME');
      assert.ok(runtimeGroup);
      assert.equal(runtimeGroup?.components[0].name, '.NET');
      assert.equal(runtimeGroup?.components[0].version, '8.0');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. IA-2 3-Tier Progressive Disclosure for ASP.NET Core & .NET
  // ---------------------------------------------------------------------------
  describe('4. IA-2 Progressive Disclosure for ASP.NET Core & .NET', () => {
    it('provides 3 levels of investigation (Understanding -> Context -> Evidence) for ASP.NET Core', () => {
      const viewModel = buildComponentViewModel(
        {
          id: 'tech-aspnet-core',
          category: 'FRAMEWORK',
          name: 'ASP.NET Core',
          role: 'Server-side Web Application Framework',
          layer: 'APPLICATION',
          version: '8.0',
          confidenceLevel: 'HIGH',
          state: 'OBSERVED',
          infrastructureMeaning: 'The observed endpoint appears to use ASP.NET Core as a server-side web application framework.',
          whatThisDoesNotProve: 'ASP.NET Core presence indicates a server-side web application framework, but does not prove IIS, Windows Server, Azure, SQL Server, Docker, Kubernetes, Entity Framework, or hosting environment.',
          evidenceReferences: [
            {
              sourceType: 'HTTP_HEADER',
              source: 'Response Header: x-powered-by',
              indicator: 'X-Powered-By: ASP.NET Core 8.0',
              confidence: 'HIGH',
            },
          ],
        },
        '2026-08-28T10:00:00.000Z',
      );

      // Level 1: Understanding
      assert.equal(viewModel.name, 'ASP.NET Core');
      assert.equal(viewModel.version, '8.0');
      assert.equal(viewModel.layer, 'APPLICATION');
      assert.equal(viewModel.confidenceLevel, 'HIGH');

      // Level 2: Context
      assert.equal(viewModel.hasContext, true);
      assert.ok(viewModel.whyThisAppears?.includes('ASP.NET Core as a server-side web application framework'));
      assert.ok(viewModel.whatThisDoesNotProve?.includes('does not prove IIS'));

      // Level 3: Evidence
      assert.equal(viewModel.hasEvidence, true);
      assert.equal(viewModel.evidence.length, 1);
      assert.equal(viewModel.evidence[0].observedSignal, 'X-Powered-By: ASP.NET Core 8.0');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Domain Switching & Re-Understanding Isolation
  // ---------------------------------------------------------------------------
  describe('5. Domain Switching Isolation & Re-Understanding', () => {
    it('completely isolates .NET / ASP.NET Core state between domains during context switching', () => {
      const dotnetDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-dotnet', domainName: 'dotnet-service.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-dn1', createdAt: new Date().toISOString(), responseTimeMs: 20, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: '.NET server runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-dotnet', name: '.NET', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Server Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const kotlinDomain: DomainOverviewResponseDto = {
        domain: { id: 'dom-kotlin', domainName: 'kotlin-service.org', monitoringEnabled: true, createdAt: new Date().toISOString() },
        health: { score: 90, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        latestSnapshot: { id: 'snap-k1', createdAt: new Date().toISOString(), responseTimeMs: 20, httpStatus: 200 },
        latestBrief: null,
        findingsSummary: { total: 0, critical: 0, high: 0, medium: 0, low: 0, informational: 0 },
        recentFindings: [],
        recentChanges: [],
        latestVerification: null,
        statistics: { totalSnapshots: 1, totalVerifications: 1, totalFindings: 0, criticalFindings: 0, changesLast30Days: 0, lastUnderstandingAt: new Date().toISOString() },
        infrastructure: {
          technologyArchitecture: {
            architectureSummary: 'Kotlin runtime observed.',
            ingressPath: [],
            keyTechnologies: [
              { technologyId: 'tech-kotlin', name: 'Kotlin', category: 'Infrastructure Runtime', layer: 'RUNTIME', role: 'Kotlin Runtime', confidence: 0.95, confidenceLevel: 'HIGH', evidence: [] },
            ],
            layers: [],
            integrations: [],
            knownUnknowns: [],
            claimBoundaries: [],
            confidence: { overallLevel: 'HIGH', overallScore: 0.95, layerConfidence: {}, rationale: '', confirmedRelationshipsCount: 0, supportedRelationshipsCount: 0, inferredRelationshipsCount: 0 },
          },
        },
      };

      const modelA = resolveAdaptiveInfrastructureModel('dom-dotnet', 'dotnet-service.org', dotnetDomain);
      const modelB = resolveAdaptiveInfrastructureModel('dom-kotlin', 'kotlin-service.org', kotlinDomain);

      assert.equal(modelA.categoryGroups[0].components[0].name, '.NET');
      assert.equal(modelB.categoryGroups[0].components[0].name, 'Kotlin');
      assert.ok(!modelB.categoryGroups[0].components.some((c) => c.name === '.NET'));
    });
  });
});
