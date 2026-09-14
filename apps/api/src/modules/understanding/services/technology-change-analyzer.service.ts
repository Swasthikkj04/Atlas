import { Injectable, Logger } from '@nestjs/common';
import {
  ChangeSeverity,
  ChangeType,
  FindingCategory,
  FindingModule,
} from '@prisma/client';
import {
  ForensicExplanation,
  TechnologyChangeClassification,
  TechnologyChangeImpact,
  TechnologyDifference,
} from '../contracts/technology-change.interface';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';
import {
  DetectedTechnology,
  TopologyLayer,
} from '../../../infrastructure/discovery/technology/contracts';
import { BehavioralSignal } from '../../../infrastructure/discovery/technology/contracts/behavioral-signal.interface';

@Injectable()
export class TechnologyChangeAnalyzerService {
  private readonly logger = new Logger(TechnologyChangeAnalyzerService.name);

  /**
   * Evaluates and produces semantic, evidence-backed technology and architecture differences
   * between two discovery snapshots according to the H3 change forensics specification.
   */
  analyzeDifferences(
    previous: DiscoverySnapshot,
    current: DiscoverySnapshot,
  ): TechnologyDifference[] {
    const diffs: TechnologyDifference[] = [];

    // 0. Fast-path optimization: Check overall cryptographic fingerprints
    const prevOverall = (previous as any).fingerprints?.overallFingerprint;
    const currOverall = (current as any).fingerprints?.overallFingerprint;
    if (prevOverall && currOverall && prevOverall === currOverall) {
      return [];
    }

    const prevTechResult = previous.technology;
    const currTechResult = current.technology;

    const prevTechnologies: DetectedTechnology[] = (
      prevTechResult?.technologies || []
    ).map((t: any) =>
      typeof t === 'string'
        ? ({
            id: `tech-${t.toLowerCase()}`,
            name: t,
            category: 'Web Server',
          } as any)
        : t,
    );

    const currTechnologies: DetectedTechnology[] = (
      currTechResult?.technologies || []
    ).map((t: any) =>
      typeof t === 'string'
        ? ({
            id: `tech-${t.toLowerCase()}`,
            name: t,
            category: 'Web Server',
          } as any)
        : t,
    );

    // 1. Technology Lifecycle: Added / Removed / Changed (T1-T30)
    this.diffTechnologyLifecycle(
      prevTechnologies,
      currTechnologies,
      previous,
      current,
      diffs,
    );

    // 2. External Integrations
    this.diffIntegrations(previous, current, diffs);

    // 3. Gateway Migrations, Edge Drift & Ingress Path (H1)
    this.diffArchitectureDrift(previous, current, diffs);

    // 4. Ingress Path Hops (H1)
    this.diffIngressHops(previous, current, diffs);

    // 5. Uncertainty & Unknown Transitions
    this.diffUnknownTransitions(previous, current, diffs);

    // 6. Topology Relationships (H1)
    this.diffTopologyRelationships(previous, current, diffs);

    // 7. Deep Wire & Behavioral Signals (H2)
    this.diffBehavioralSignals(previous, current, diffs);

    return diffs;
  }

  private diffTechnologyLifecycle(
    prevTechs: DetectedTechnology[],
    currTechs: DetectedTechnology[],
    prevSnapshot: DiscoverySnapshot,
    currSnapshot: DiscoverySnapshot,
    diffs: TechnologyDifference[],
  ): void {
    const prevMap = new Map<string, DetectedTechnology>();
    for (const t of prevTechs) {
      prevMap.set(this.normalizeTechKey(t), t);
    }

    const currMap = new Map<string, DetectedTechnology>();
    for (const t of currTechs) {
      currMap.set(this.normalizeTechKey(t), t);
    }

    // Technology Added
    for (const [key, currTech] of currMap.entries()) {
      if (!prevMap.has(key)) {
        const afterEvidence = this.extractTechnologyEvidence(
          currTech,
          currSnapshot,
        );
        diffs.push({
          classification: TechnologyChangeClassification.TECHNOLOGY_ADDED,
          impact: TechnologyChangeImpact.LIFECYCLE,
          module: FindingModule.TECHNOLOGY,
          category: FindingCategory.TECHNOLOGY,
          changeType: ChangeType.ADDED,
          severity: ChangeSeverity.LOW,
          title: `Technology added: ${currTech.name}`,
          description: `Technology ${currTech.name}${currTech.role ? ` (${currTech.role})` : ''} was detected on the target infrastructure.`,
          technologyId: currTech.id,
          technologyName: currTech.name,
          currentState: currTech,
          evidenceBefore: [],
          evidenceAfter: afterEvidence,
          whatThisMeans: `Technology ${currTech.name}${currTech.role ? ` (${currTech.role})` : ''} is now active in the publicly observable infrastructure.`,
          whatThisDoesNotProve:
            'Detection of an added component does not establish complete internal architecture or unobserved backend services.',
          forensicExplanation: {
            whatChanged: `Technology added: ${currTech.name}`,
            whyWeBelieveIt:
              afterEvidence.length > 0
                ? afterEvidence.join(', ')
                : 'Direct response observation',
            whatItMeans: `Technology ${currTech.name} appeared in verified observations.`,
            whatWeCannotConclude:
              'Does not establish full backend topology or unobserved internal dependencies.',
            impact:
              'Broadens observable surface area and component lifecycle tracking.',
          },
        });
      }
    }

    // Technology Removed (Conservative / Anti-Overreach: state "no longer observable")
    for (const [key, prevTech] of prevMap.entries()) {
      if (!currMap.has(key)) {
        const beforeEvidence = this.extractTechnologyEvidence(
          prevTech,
          prevSnapshot,
        );
        diffs.push({
          classification: TechnologyChangeClassification.TECHNOLOGY_REMOVED,
          impact: TechnologyChangeImpact.LIFECYCLE,
          module: FindingModule.TECHNOLOGY,
          category: FindingCategory.TECHNOLOGY,
          changeType: ChangeType.REMOVED,
          severity: ChangeSeverity.LOW,
          title: `Technology no longer observed: ${prevTech.name}`,
          description: `Technology ${prevTech.name} is no longer observable from the current public telemetry.`,
          technologyId: prevTech.id,
          technologyName: prevTech.name,
          previousState: prevTech,
          evidenceBefore: beforeEvidence,
          evidenceAfter: [],
          whatThisMeans: `Technology ${prevTech.name} is no longer observable in public responses.`,
          whatThisDoesNotProve:
            'Absence of public evidence does not prove the component was decommissioned from internal networks.',
          forensicExplanation: {
            whatChanged: `Technology no longer observed: ${prevTech.name}`,
            whyWeBelieveIt:
              'Previously observable signals are absent in current snapshot telemetry',
            whatItMeans: `Technology ${prevTech.name} is no longer exposed to public clients.`,
            whatWeCannotConclude:
              'Does not prove internal deletion or retirement behind upstream reverse proxies.',
            impact:
              'Removes previously active public signature from surface tracking.',
          },
        });
      }
    }

    // Technology Changed (e.g. Version Updates)
    for (const [key, currTech] of currMap.entries()) {
      const prevTech = prevMap.get(key);
      if (prevTech) {
        if (
          prevTech.version &&
          currTech.version &&
          prevTech.version !== currTech.version
        ) {
          diffs.push({
            classification: TechnologyChangeClassification.TECHNOLOGY_CHANGED,
            impact: TechnologyChangeImpact.LIFECYCLE,
            module: FindingModule.TECHNOLOGY,
            category: FindingCategory.TECHNOLOGY,
            changeType: ChangeType.MODIFIED,
            severity: ChangeSeverity.LOW,
            title: `Technology version changed: ${currTech.name}`,
            description: `${currTech.name} version changed from '${prevTech.version}' to '${currTech.version}'.`,
            technologyId: currTech.id,
            technologyName: currTech.name,
            previousState: prevTech,
            currentState: currTech,
            evidenceBefore: [`Version: ${prevTech.version}`],
            evidenceAfter: [`Version: ${currTech.version}`],
            whatThisMeans: `${currTech.name} reported software version changed from ${prevTech.version} to ${currTech.version}.`,
            whatThisDoesNotProve:
              'Version string change alone does not verify vulnerability state, backported patches, or complete build configuration.',
            forensicExplanation: {
              whatChanged: `${currTech.name} version changed from ${prevTech.version} to ${currTech.version}`,
              whyWeBelieveIt: `Direct software version header/evidence delta (${prevTech.version} -> ${currTech.version})`,
              whatItMeans:
                'Underlying component binary or reported release version was modified.',
              whatWeCannotConclude:
                'Does not prove whether vendor backports or custom configuration patches were applied.',
              impact: 'Alters component version lineage in memory records.',
            },
          });
        }
      }
    }
  }

  private diffIntegrations(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: TechnologyDifference[],
  ): void {
    const prevIntegrations =
      prev.technology?.architectureBrief?.integrations || [];
    const currIntegrations =
      curr.technology?.architectureBrief?.integrations || [];

    const prevMap = new Map<string, any>(
      prevIntegrations.map((i: any) => [
        i.technologyId || i.name.toLowerCase(),
        i,
      ]),
    );
    const currMap = new Map<string, any>(
      currIntegrations.map((i: any) => [
        i.technologyId || i.name.toLowerCase(),
        i,
      ]),
    );

    for (const [key, currInt] of currMap.entries()) {
      if (!prevMap.has(key)) {
        diffs.push({
          classification: TechnologyChangeClassification.INTEGRATION_ADDED,
          impact: TechnologyChangeImpact.INTEGRATION,
          module: FindingModule.TECHNOLOGY,
          category: FindingCategory.TECHNOLOGY,
          changeType: ChangeType.ADDED,
          severity: ChangeSeverity.LOW,
          title: `Integration added: ${currInt.name}`,
          description: `External integration ${currInt.name}${currInt.role ? ` (${currInt.role})` : ''} was observed participating in the application infrastructure.`,
          technologyId: currInt.technologyId,
          technologyName: currInt.name,
          currentState: currInt,
          evidenceBefore: [],
          evidenceAfter: [`Observed integration: ${currInt.name}`],
          whatThisMeans: `Third-party or external integration ${currInt.name} was observed.`,
          whatThisDoesNotProve:
            'Does not prove access level or data processing scope of the integration.',
        });
      }
    }

    for (const [key, prevInt] of prevMap.entries()) {
      if (!currMap.has(key)) {
        diffs.push({
          classification: TechnologyChangeClassification.INTEGRATION_REMOVED,
          impact: TechnologyChangeImpact.INTEGRATION,
          module: FindingModule.TECHNOLOGY,
          category: FindingCategory.TECHNOLOGY,
          changeType: ChangeType.REMOVED,
          severity: ChangeSeverity.LOW,
          title: `Integration no longer observed: ${prevInt.name}`,
          description: `External integration ${prevInt.name} is no longer observable from the current public telemetry.`,
          technologyId: prevInt.technologyId,
          technologyName: prevInt.name,
          previousState: prevInt,
          evidenceBefore: [`Observed integration: ${prevInt.name}`],
          evidenceAfter: [],
          whatThisMeans: `Integration ${prevInt.name} is no longer evidenced in public responses.`,
          whatThisDoesNotProve:
            'Does not prove backend webhook or internal API key revocation.',
        });
      }
    }
  }

  private diffArchitectureDrift(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: TechnologyDifference[],
  ): void {
    const prevPath = prev.technology?.architectureBrief?.architecturePath || [];
    const currPath = curr.technology?.architectureBrief?.architecturePath || [];

    // Gateway Migration
    const prevGateway = prevPath.find(
      (p) =>
        p.layer === TopologyLayer.GATEWAY &&
        p.technologyId !== 'public-endpoint',
    );
    const currGateway = currPath.find(
      (p) =>
        p.layer === TopologyLayer.GATEWAY &&
        p.technologyId !== 'public-endpoint',
    );

    if (
      prevGateway &&
      currGateway &&
      prevGateway.technologyId !== currGateway.technologyId
    ) {
      const prevEvidence = this.extractHeaderOrName(
        prev,
        'server',
        prevGateway.technologyName,
      );
      const currEvidence = this.extractHeaderOrName(
        curr,
        'server',
        currGateway.technologyName,
      );

      diffs.push({
        classification: TechnologyChangeClassification.GATEWAY_MIGRATED,
        impact: TechnologyChangeImpact.ARCHITECTURAL,
        module: FindingModule.TECHNOLOGY,
        category: FindingCategory.TECHNOLOGY,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.MEDIUM,
        title: 'Gateway architecture changed',
        description: `Web gateway migrated from ${prevGateway.technologyName} to ${currGateway.technologyName}.`,
        previousState: prevGateway,
        currentState: currGateway,
        evidenceBefore: [prevEvidence],
        evidenceAfter: [currEvidence],
        whatThisMeans: `The publicly observable gateway boundary changed from ${prevGateway.technologyName} to ${currGateway.technologyName}.`,
        whatThisDoesNotProve:
          'This does not establish a Kubernetes migration, service-mesh deployment, or cloud-provider change.',
        forensicExplanation: {
          whatChanged: `Gateway migrated from ${prevGateway.technologyName} to ${currGateway.technologyName}`,
          whyWeBelieveIt: `Previous: ${prevEvidence} | Current: ${currEvidence}`,
          whatItMeans: `The publicly observable gateway boundary changed from ${prevGateway.technologyName} to ${currGateway.technologyName}.`,
          whatWeCannotConclude:
            'This does not establish a Kubernetes migration, service-mesh deployment, or cloud-provider change.',
          impact:
            'Routing behaviors, reverse proxy header processing, and gateway TLS termination characteristics have changed.',
        },
      });
    }

    // Application Framework Migration
    const prevApp = prevPath.find(
      (p) =>
        p.layer === TopologyLayer.APPLICATION &&
        p.technologyId !== 'public-endpoint',
    );
    const currApp = currPath.find(
      (p) =>
        p.layer === TopologyLayer.APPLICATION &&
        p.technologyId !== 'public-endpoint',
    );

    if (prevApp && currApp && prevApp.technologyId !== currApp.technologyId) {
      const prevEvidence = this.extractHeaderOrName(
        prev,
        'x-powered-by',
        prevApp.technologyName,
      );
      const currEvidence = this.extractHeaderOrName(
        curr,
        'x-powered-by',
        currApp.technologyName,
      );

      diffs.push({
        classification: TechnologyChangeClassification.FRAMEWORK_MIGRATED,
        impact: TechnologyChangeImpact.ARCHITECTURAL,
        module: FindingModule.TECHNOLOGY,
        category: FindingCategory.TECHNOLOGY,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.MEDIUM,
        title: 'Application framework changed',
        description: `Application framework migrated from ${prevApp.technologyName} to ${currApp.technologyName}.`,
        previousState: prevApp,
        currentState: currApp,
        evidenceBefore: [prevEvidence],
        evidenceAfter: [currEvidence],
        whatThisMeans: `The application framework layer changed from ${prevApp.technologyName} to ${currApp.technologyName}.`,
        whatThisDoesNotProve:
          'This does not establish an origin cloud provider migration or container orchestrator change.',
        forensicExplanation: {
          whatChanged: `Application framework changed from ${prevApp.technologyName} to ${currApp.technologyName}`,
          whyWeBelieveIt: `Previous: ${prevEvidence} | Current: ${currEvidence}`,
          whatItMeans: `The application runtime/framework layer changed from ${prevApp.technologyName} to ${currApp.technologyName}.`,
          whatWeCannotConclude:
            'This does not establish an origin cloud provider migration or container orchestrator change.',
          impact:
            'Alters application runtime stack and dependency vulnerability boundary.',
        },
      });
    }

    // Edge / CDN Drift
    const prevEdge = prevPath.find(
      (p) =>
        p.layer === TopologyLayer.EDGE && p.technologyId !== 'public-endpoint',
    );
    const currEdge = currPath.find(
      (p) =>
        p.layer === TopologyLayer.EDGE && p.technologyId !== 'public-endpoint',
    );

    if (prevEdge && !currEdge) {
      diffs.push({
        classification: TechnologyChangeClassification.EDGE_LAYER_DRIFT,
        impact: TechnologyChangeImpact.ARCHITECTURAL,
        module: FindingModule.TECHNOLOGY,
        category: FindingCategory.CDN,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.MEDIUM,
        title: 'Edge layer no longer observed',
        description: `${prevEdge.technologyName} is no longer observable in the current public request path.`,
        previousState: prevEdge,
        evidenceBefore: [`Edge: ${prevEdge.technologyName}`],
        evidenceAfter: [],
        whatThisMeans: `Edge proxy layer ${prevEdge.technologyName} is no longer observable.`,
        whatThisDoesNotProve:
          'Does not establish that DDoS or CDN protections were removed if alternative origin protections exist.',
      });
    } else if (!prevEdge && currEdge) {
      diffs.push({
        classification: TechnologyChangeClassification.EDGE_LAYER_DRIFT,
        impact: TechnologyChangeImpact.ARCHITECTURAL,
        module: FindingModule.TECHNOLOGY,
        category: FindingCategory.CDN,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.LOW,
        title: 'Edge layer appeared',
        description: `${currEdge.technologyName} was observed protecting and delivering the public endpoint.`,
        currentState: currEdge,
        evidenceBefore: [],
        evidenceAfter: [`Edge: ${currEdge.technologyName}`],
        whatThisMeans: `${currEdge.technologyName} was observed fronting public requests.`,
        whatThisDoesNotProve:
          'Does not establish full backend origin provider.',
      });
    } else if (
      prevEdge &&
      currEdge &&
      prevEdge.technologyId !== currEdge.technologyId
    ) {
      diffs.push({
        classification: TechnologyChangeClassification.EDGE_LAYER_DRIFT,
        impact: TechnologyChangeImpact.ARCHITECTURAL,
        module: FindingModule.TECHNOLOGY,
        category: FindingCategory.CDN,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.MEDIUM,
        title: 'Edge delivery network changed',
        description: `Edge delivery changed from ${prevEdge.technologyName} to ${currEdge.technologyName}.`,
        previousState: prevEdge,
        currentState: currEdge,
        evidenceBefore: [`Edge: ${prevEdge.technologyName}`],
        evidenceAfter: [`Edge: ${currEdge.technologyName}`],
        whatThisMeans: `Edge delivery changed from ${prevEdge.technologyName} to ${currEdge.technologyName}.`,
        whatThisDoesNotProve:
          'This does not prove that backend origin servers have migrated to a different cloud provider.',
        forensicExplanation: {
          whatChanged: `Edge delivery changed from ${prevEdge.technologyName} to ${currEdge.technologyName}`,
          whyWeBelieveIt: `Edge headers and DNS routing shifted from ${prevEdge.technologyName} to ${currEdge.technologyName}`,
          whatItMeans: `Edge delivery changed from ${prevEdge.technologyName} to ${currEdge.technologyName}.`,
          whatWeCannotConclude:
            'This does not prove that backend origin servers have migrated to a different cloud provider.',
          impact:
            'Alters edge caching rules, WAF rulesets, and global ingress routing.',
        },
      });
    }

    // Ingress Path Structural Drift
    const prevPathString = prevPath.map((p) => p.technologyName).join(' ➔ ');
    const currPathString = currPath.map((p) => p.technologyName).join(' ➔ ');

    if (
      prevPath.length > 0 &&
      currPath.length > 0 &&
      prevPathString !== currPathString &&
      !(
        prevGateway &&
        currGateway &&
        prevGateway.technologyId !== currGateway.technologyId
      ) &&
      !(prevEdge && !currEdge) &&
      !(!prevEdge && currEdge) &&
      !(
        prevEdge &&
        currEdge &&
        prevEdge.technologyId !== currEdge.technologyId
      ) &&
      !(prevApp && currApp && prevApp.technologyId !== currApp.technologyId)
    ) {
      diffs.push({
        classification:
          TechnologyChangeClassification.ARCHITECTURE_PATH_CHANGED,
        impact: TechnologyChangeImpact.ARCHITECTURAL,
        module: FindingModule.TECHNOLOGY,
        category: FindingCategory.TECHNOLOGY,
        changeType: ChangeType.MODIFIED,
        severity: ChangeSeverity.LOW,
        title: 'Architecture ingress path changed',
        description: `Ingress path changed from '${prevPathString}' to '${currPathString}'.`,
        evidenceBefore: [prevPathString],
        evidenceAfter: [currPathString],
        whatThisMeans: `The linear request path through observed layers changed from ${prevPathString} to ${currPathString}.`,
        whatThisDoesNotProve:
          'Does not establish internal networking changes behind sealed perimeter boundaries.',
      });
    }
  }

  private diffIngressHops(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: TechnologyDifference[],
  ): void {
    const prevPath = prev.technology?.architectureBrief?.architecturePath || [];
    const currPath = curr.technology?.architectureBrief?.architecturePath || [];

    const prevIds = new Set(
      prevPath.map((p) => p.technologyId).filter(Boolean),
    );
    const currIds = new Set(
      currPath.map((p) => p.technologyId).filter(Boolean),
    );

    // Hop Added
    for (const currHop of currPath) {
      if (
        currHop.technologyId &&
        currHop.technologyId !== 'public-endpoint' &&
        !prevIds.has(currHop.technologyId)
      ) {
        // If not already covered by gateway/edge drift
        const alreadyCovered = diffs.some(
          (d) =>
            (d.classification ===
              TechnologyChangeClassification.GATEWAY_MIGRATED ||
              d.classification ===
                TechnologyChangeClassification.EDGE_LAYER_DRIFT ||
              d.classification ===
                TechnologyChangeClassification.FRAMEWORK_MIGRATED) &&
            d.currentState?.technologyId === currHop.technologyId,
        );

        if (!alreadyCovered) {
          diffs.push({
            classification: TechnologyChangeClassification.HOP_ADDED,
            impact: TechnologyChangeImpact.ARCHITECTURAL,
            module: FindingModule.TECHNOLOGY,
            category: FindingCategory.TECHNOLOGY,
            changeType: ChangeType.ADDED,
            severity: ChangeSeverity.LOW,
            title: `Ingress path hop added: ${currHop.technologyName}`,
            description: `New hop ${currHop.technologyName} (${currHop.layer}) was observed in the request path.`,
            technologyId: currHop.technologyId,
            technologyName: currHop.technologyName,
            currentState: currHop,
            evidenceBefore: [],
            evidenceAfter: [
              `Hop: ${currHop.technologyName} (${currHop.layer})`,
            ],
            whatThisMeans: `An additional proxy or processing hop (${currHop.technologyName}) is now part of the verified request path.`,
            whatThisDoesNotProve:
              'Does not prove unobserved internal mesh or container routing.',
          });
        }
      }
    }

    // Hop Removed
    for (const prevHop of prevPath) {
      if (
        prevHop.technologyId &&
        prevHop.technologyId !== 'public-endpoint' &&
        !currIds.has(prevHop.technologyId)
      ) {
        const alreadyCovered = diffs.some(
          (d) =>
            (d.classification ===
              TechnologyChangeClassification.GATEWAY_MIGRATED ||
              d.classification ===
                TechnologyChangeClassification.EDGE_LAYER_DRIFT ||
              d.classification ===
                TechnologyChangeClassification.FRAMEWORK_MIGRATED) &&
            d.previousState?.technologyId === prevHop.technologyId,
        );

        if (!alreadyCovered) {
          diffs.push({
            classification: TechnologyChangeClassification.HOP_REMOVED,
            impact: TechnologyChangeImpact.ARCHITECTURAL,
            module: FindingModule.TECHNOLOGY,
            category: FindingCategory.TECHNOLOGY,
            changeType: ChangeType.REMOVED,
            severity: ChangeSeverity.LOW,
            title: `Ingress path hop no longer observed: ${prevHop.technologyName}`,
            description: `Hop ${prevHop.technologyName} (${prevHop.layer}) is no longer observable in the request path.`,
            technologyId: prevHop.technologyId,
            technologyName: prevHop.technologyName,
            previousState: prevHop,
            evidenceBefore: [
              `Hop: ${prevHop.technologyName} (${prevHop.layer})`,
            ],
            evidenceAfter: [],
            whatThisMeans: `Hop ${prevHop.technologyName} is no longer observable in the verified request path.`,
            whatThisDoesNotProve: 'Does not prove internal network removal.',
          });
        }
      }
    }
  }

  private diffUnknownTransitions(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: TechnologyDifference[],
  ): void {
    const prevUnknowns =
      prev.technology?.architectureBrief?.knownUnknowns || [];
    const currUnknowns =
      curr.technology?.architectureBrief?.knownUnknowns || [];

    const prevMap = new Map<string, any>(
      prevUnknowns.map((u: any) => [u.dimension, u]),
    );
    const currMap = new Map<string, any>(
      currUnknowns.map((u: any) => [u.dimension, u]),
    );

    for (const [dimension, currU] of currMap.entries()) {
      const prevU = prevMap.get(dimension);
      if (prevU && prevU.status !== currU.status) {
        if (
          (prevU.status as string) === 'MASKED' &&
          (currU.status as string) === 'OBSERVED'
        ) {
          diffs.push({
            classification:
              TechnologyChangeClassification.MASKED_BECAME_OBSERVED,
            impact: TechnologyChangeImpact.OBSERVABILITY,
            module: FindingModule.TECHNOLOGY,
            category: FindingCategory.TECHNOLOGY,
            changeType: ChangeType.MODIFIED,
            severity: ChangeSeverity.LOW,
            title: `${dimension} now observable`,
            description: `The ${dimension.toLowerCase()} transitioned from MASKED to observable infrastructure.`,
            previousState: prevU,
            currentState: currU,
            whatThisMeans: `Telemetry directly evidenced the previously masked ${dimension.toLowerCase()} component.`,
            whatThisDoesNotProve:
              'Does not prove internal credentials or direct access availability.',
          });
        } else if (
          (prevU.status as string) === 'OBSERVED' &&
          (currU.status as string) === 'MASKED'
        ) {
          diffs.push({
            classification:
              TechnologyChangeClassification.OBSERVED_BECAME_MASKED,
            impact: TechnologyChangeImpact.OBSERVABILITY,
            module: FindingModule.TECHNOLOGY,
            category: FindingCategory.TECHNOLOGY,
            changeType: ChangeType.MODIFIED,
            severity: ChangeSeverity.LOW,
            title: `${dimension} now masked`,
            description: `The ${dimension.toLowerCase()} is now masked behind edge infrastructure.`,
            previousState: prevU,
            currentState: currU,
            whatThisMeans: `The ${dimension.toLowerCase()} is now masked behind reverse proxy or edge layers.`,
            whatThisDoesNotProve:
              'Does not prove the backend component was modified or replaced.',
          });
        }
      }
    }
  }

  private diffTopologyRelationships(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: TechnologyDifference[],
  ): void {
    const prevRels = prev.technology?.topology?.relationships || [];
    const currRels = curr.technology?.topology?.relationships || [];

    const prevKeys = new Set(
      prevRels.map(
        (r) =>
          `${r.sourceTechnologyId}:${r.relationshipType}:${r.targetTechnologyId}`,
      ),
    );

    const prevTechIds = new Set(
      (prev.technology?.technologies || []).map((t: any) =>
        this.normalizeTechKey(t),
      ),
    );
    const currTechIds = new Set(
      (curr.technology?.technologies || []).map((t: any) =>
        this.normalizeTechKey(t),
      ),
    );

    for (const r of currRels) {
      const key = `${r.sourceTechnologyId}:${r.relationshipType}:${r.targetTechnologyId}`;
      if (!prevKeys.has(key)) {
        // Only emit if both source and target existed previously to avoid duplicate noise on simple tech add
        const sourceExisted = prevTechIds.has(r.sourceTechnologyId);
        const targetExisted = prevTechIds.has(r.targetTechnologyId);

        if (sourceExisted && targetExisted) {
          diffs.push({
            classification: TechnologyChangeClassification.RELATIONSHIP_ADDED,
            impact: TechnologyChangeImpact.ARCHITECTURAL,
            module: FindingModule.TECHNOLOGY,
            category: FindingCategory.TECHNOLOGY,
            changeType: ChangeType.ADDED,
            severity: ChangeSeverity.LOW,
            title: `Infrastructure relationship added: ${r.sourceTechnologyName} -> ${r.targetTechnologyName}`,
            description: `Observed relationship (${r.relationshipType}): ${r.explanation}`,
            currentState: r,
            evidenceBefore: [],
            evidenceAfter: [`Relationship: ${r.relationshipType}`],
            whatThisMeans: `An evidence-backed relationship was verified between ${r.sourceTechnologyName} and ${r.targetTechnologyName}.`,
            whatThisDoesNotProve:
              'Does not prove unevidenced internal network routes.',
          });
        }
      }
    }
  }

  private diffBehavioralSignals(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
    diffs: TechnologyDifference[],
  ): void {
    const prevSignals: BehavioralSignal[] =
      prev.technology?.behavioralFingerprint?.signals || [];
    const currSignals: BehavioralSignal[] =
      curr.technology?.behavioralFingerprint?.signals || [];

    if (prevSignals.length === 0 && currSignals.length === 0) {
      return;
    }

    const prevMap = new Map<string, BehavioralSignal>();
    for (const s of prevSignals) {
      const k = `${s.category}:${s.type}:${s.targetTechnologyId || 'general'}`;
      prevMap.set(k, s);
    }

    const currMap = new Map<string, BehavioralSignal>();
    for (const s of currSignals) {
      const k = `${s.category}:${s.type}:${s.targetTechnologyId || 'general'}`;
      currMap.set(k, s);
    }

    // Behavioral Signals Added or Modified
    for (const [key, currSig] of currMap.entries()) {
      const prevSig = prevMap.get(key);
      if (!prevSig) {
        // Signal Added
        let classification =
          TechnologyChangeClassification.HTTP_BEHAVIOR_CHANGED;
        if (currSig.category === 'TLS')
          classification = TechnologyChangeClassification.TLS_CHANGED;
        else if (currSig.category === 'COOKIE')
          classification =
            TechnologyChangeClassification.COOKIE_SEMANTICS_CHANGED;
        else if (currSig.category === 'ERROR')
          classification =
            TechnologyChangeClassification.ERROR_BEHAVIOR_CHANGED;

        // Skip general metadata without target tech to avoid noise
        if (
          !currSig.targetTechnologyId ||
          currSig.targetTechnologyId === 'unknown'
        ) {
          continue;
        }

        diffs.push({
          classification,
          impact: TechnologyChangeImpact.ARCHITECTURAL,
          module: FindingModule.TECHNOLOGY,
          category: FindingCategory.TECHNOLOGY,
          changeType: ChangeType.ADDED,
          severity: ChangeSeverity.LOW,
          title: `Wire behavioral signal observed: ${currSig.targetTechnologyName || currSig.type}`,
          description: `Behavioral fingerprint (${currSig.category}) observed: ${currSig.description}`,
          currentState: currSig,
          evidenceBefore: [],
          evidenceAfter: currSig.observedWireEvidence
            ? [currSig.observedWireEvidence]
            : [],
          whatThisMeans: `Observed wire telemetry behavior matching ${currSig.targetTechnologyName || currSig.type}.`,
          whatThisDoesNotProve:
            'Behavioral wire signals corroborate active profiles but do not manufacture certainty.',
          forensicExplanation: {
            whatChanged: `Behavioral signal observed: ${currSig.targetTechnologyName || currSig.type}`,
            whyWeBelieveIt:
              currSig.observedWireEvidence || 'Wire protocol pattern',
            whatItMeans: `Wire behavior is consistent with ${currSig.targetTechnologyName || currSig.type}.`,
            whatWeCannotConclude:
              'Wire behavioral signals corroborate active profiles but do not manufacture certainty.',
            impact:
              'Corroborates infrastructure classification with deep wire telemetry.',
          },
        });
      }
    }
  }

  private extractTechnologyEvidence(
    tech: DetectedTechnology,
    snapshot: DiscoverySnapshot,
  ): string[] {
    const evidence: string[] = [];
    if (tech.evidence && Array.isArray(tech.evidence)) {
      tech.evidence.forEach((e) => {
        if (e.indicator)
          evidence.push(`${e.sourceType || 'EVIDENCE'}: ${e.indicator}`);
      });
    }
    if (evidence.length === 0 && snapshot.http?.headers) {
      const server = snapshot.http.headers['server'];
      if (server && server.toLowerCase().includes(tech.name.toLowerCase())) {
        evidence.push(`Server: ${server}`);
      }
    }
    return evidence;
  }

  private extractHeaderOrName(
    snapshot: DiscoverySnapshot,
    headerKey: string,
    fallback: string,
  ): string {
    if (snapshot.http?.headers) {
      for (const [k, v] of Object.entries(snapshot.http.headers)) {
        if (k.toLowerCase() === headerKey.toLowerCase()) {
          return `${headerKey}: ${v}`;
        }
      }
    }
    return fallback;
  }

  private normalizeTechKey(t: DetectedTechnology | any): string {
    if (!t) return '';
    return (t.id || t.name || '').toLowerCase().trim();
  }
}
