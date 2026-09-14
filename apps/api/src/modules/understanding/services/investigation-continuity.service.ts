import { Injectable, Logger } from '@nestjs/common';
import type {
  InvestigationContextDto,
  InvestigationContextValidationResult,
  EvidenceDrawerItem,
  InvestigationSourceSurface,
  InvestigationEntityType,
} from '../contracts/investigation-continuity.interface';

@Injectable()
export class InvestigationContinuityService {
  private readonly logger = new Logger(InvestigationContinuityService.name);

  private readonly validSurfaces: Set<InvestigationSourceSurface> = new Set([
    'overview',
    'findings',
    'changes',
    'infrastructure',
    'memory',
  ]);

  private readonly validEntityTypes: Set<InvestigationEntityType> = new Set([
    'technology',
    'finding',
    'change',
    'observation',
    'snapshot',
    'control',
  ]);

  /**
   * Validates and sanitizes an incoming investigation context.
   * Enforces tenant domain security boundaries, strips sensitive data,
   * and provides a defensive fallback if context is invalid or expired.
   */
  public validateAndSanitizeContext(
    rawContext: unknown,
    authenticatedDomainIds?: string[],
  ): InvestigationContextValidationResult {
    if (!rawContext || typeof rawContext !== 'object') {
      return {
        isValid: false,
        isAuthorized: true,
        isExpired: true,
        sanitizedContext: null,
        fallbackDestination: {
          surface: 'overview',
          reason: 'The original investigation context is no longer available.',
        },
        returnLabel: '← Back to Overview',
      };
    }

    const ctx = rawContext as Record<string, any>;

    // 1. Validate required fields
    const domainId =
      typeof ctx.domainId === 'string' ? ctx.domainId.trim() : '';
    const domainName =
      typeof ctx.domainName === 'string' ? ctx.domainName.trim() : '';
    const sourceSurface = ctx.sourceSurface as InvestigationSourceSurface;
    const entityType = ctx.entityType as InvestigationEntityType;
    const entityId =
      typeof ctx.entityId === 'string' ? ctx.entityId.trim() : '';
    const snapshotId =
      typeof ctx.snapshotId === 'string' ? ctx.snapshotId.trim() : '';

    if (
      !domainId ||
      !this.validSurfaces.has(sourceSurface) ||
      !this.validEntityTypes.has(entityType) ||
      !entityId
    ) {
      return {
        isValid: false,
        isAuthorized: true,
        isExpired: false,
        sanitizedContext: null,
        fallbackDestination: {
          surface: 'overview',
          reason: 'The original investigation context is malformed or invalid.',
        },
        returnLabel: '← Back to Overview',
      };
    }

    // 2. Enforce Tenant Authorization Boundaries (H6-009)
    if (authenticatedDomainIds && authenticatedDomainIds.length > 0) {
      const isAuthorized = authenticatedDomainIds.includes(domainId);
      if (!isAuthorized) {
        this.logger.warn(
          `Tenant authorization failed for domainId ${domainId} in investigation context`,
        );
        return {
          isValid: false,
          isAuthorized: false,
          isExpired: false,
          sanitizedContext: null,
          fallbackDestination: {
            surface: 'overview',
            reason: 'Access to this investigation context is not authorized.',
          },
          returnLabel: '← Back to Overview',
        };
      }
    }

    // 3. Sanitize inputs against secrets / script injection
    const sanitizedDomainId = this.sanitizeString(domainId);
    const sanitizedDomainName = this.sanitizeString(domainName || domainId);
    const sanitizedEntityId = this.sanitizeString(entityId);
    const sanitizedEntityName = ctx.entityName
      ? this.sanitizeString(String(ctx.entityName))
      : undefined;
    const sanitizedSourceSection = ctx.sourceSection
      ? this.sanitizeString(String(ctx.sourceSection))
      : undefined;
    const sanitizedSnapshotId = this.sanitizeString(
      snapshotId || 'snapshot-latest',
    );
    const sanitizedFindingId = ctx.findingId
      ? this.sanitizeString(String(ctx.findingId))
      : undefined;
    const sanitizedEvidenceId = ctx.evidenceId
      ? this.sanitizeString(String(ctx.evidenceId))
      : undefined;
    const sanitizedScrollAnchor = ctx.scrollAnchor
      ? this.sanitizeString(String(ctx.scrollAnchor))
      : undefined;

    let disclosureLevel: 1 | 2 | 3 | undefined = undefined;
    if (
      ctx.disclosureLevel === 1 ||
      ctx.disclosureLevel === 2 ||
      ctx.disclosureLevel === 3
    ) {
      disclosureLevel = ctx.disclosureLevel;
    }

    let sanitizedFilterState:
      Record<string, string | number | boolean> | undefined = undefined;
    if (
      ctx.filterState &&
      typeof ctx.filterState === 'object' &&
      !Array.isArray(ctx.filterState)
    ) {
      sanitizedFilterState = {};
      for (const [k, v] of Object.entries(ctx.filterState)) {
        if (
          typeof v === 'string' ||
          typeof v === 'number' ||
          typeof v === 'boolean'
        ) {
          sanitizedFilterState[this.sanitizeString(k)] =
            typeof v === 'string' ? this.sanitizeString(v) : v;
        }
      }
    }

    const sanitizedContext: InvestigationContextDto = {
      domainId: sanitizedDomainId,
      domainName: sanitizedDomainName,
      sourceSurface,
      sourceSection: sanitizedSourceSection,
      entityType,
      entityId: sanitizedEntityId,
      entityName: sanitizedEntityName,
      snapshotId: sanitizedSnapshotId,
      findingId: sanitizedFindingId,
      evidenceId: sanitizedEvidenceId,
      disclosureLevel,
      filterState: sanitizedFilterState,
      scrollAnchor: sanitizedScrollAnchor,
      timestamp: ctx.timestamp
        ? this.sanitizeString(String(ctx.timestamp))
        : undefined,
    };

    const returnLabel = this.computeReturnLabel(sanitizedContext);

    return {
      isValid: true,
      isAuthorized: true,
      isExpired: false,
      sanitizedContext,
      fallbackDestination: {
        surface: sourceSurface,
        section: sanitizedSourceSection,
        reason: 'Restoring exact prior context.',
      },
      returnLabel,
    };
  }

  /**
   * Computes an explicit, human-readable, origin-descriptive return label (H6-002).
   * Invariant: Never outputs generic "Back".
   */
  public computeReturnLabel(ctx: Partial<InvestigationContextDto>): string {
    if (ctx.sourceSection === 'narrative') {
      return '← Back to Infrastructure Narrative';
    }

    if (ctx.entityType === 'technology' && (ctx.entityName || ctx.entityId)) {
      const name = ctx.entityName || ctx.entityId;
      return `← Back to ${name} evidence`;
    }

    if (ctx.entityType === 'finding' && (ctx.entityName || ctx.findingId)) {
      const name = ctx.entityName || ctx.findingId;
      return `← Back to ${name} investigation`;
    }

    if (ctx.sourceSurface === 'changes') {
      return '← Back to Changes';
    }

    if (ctx.sourceSurface === 'findings') {
      return '← Back to Findings';
    }

    if (ctx.sourceSurface === 'infrastructure') {
      return '← Back to Infrastructure Overview';
    }

    if (ctx.sourceSurface === 'memory') {
      return '← Back to Snapshot History';
    }

    return '← Back to Overview';
  }

  /**
   * Reconciles finding lifecycle state to guarantee WX-211 integrity (H6-006).
   */
  public reconcileFindingLifecycle(finding: {
    id: string;
    status: 'ACTIVE' | 'RESOLVED' | string;
    observationState?: string;
  }): {
    lifecycleState: 'ACTIVE' | 'RESOLVED';
    observationState: 'NON_COMPLIANT' | 'COMPLIANT';
    isConsistent: boolean;
  } {
    const isResolved = finding.status === 'RESOLVED';
    const lifecycleState: 'ACTIVE' | 'RESOLVED' = isResolved
      ? 'RESOLVED'
      : 'ACTIVE';
    const observationState: 'NON_COMPLIANT' | 'COMPLIANT' = isResolved
      ? 'COMPLIANT'
      : 'NON_COMPLIANT';

    // Verify consistency with input observationState if provided
    let isConsistent = true;
    if (finding.observationState) {
      if (
        lifecycleState === 'ACTIVE' &&
        finding.observationState === 'COMPLIANT'
      ) {
        isConsistent = false;
      }
      if (
        lifecycleState === 'RESOLVED' &&
        finding.observationState === 'NON_COMPLIANT'
      ) {
        isConsistent = false;
      }
    }

    return {
      lifecycleState,
      observationState,
      isConsistent,
    };
  }

  /**
   * Builds a reusable 3-level Evidence Drawer item from raw evidence (H6-004 / H6-005).
   */
  public buildEvidenceDrawerItem(params: {
    id: string;
    claim: string;
    layer: string;
    source: string;
    rawEvidence: string;
    timestamp: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE';
    technology?: string;
    snapshotId: string;
    rawPayload?: Record<string, any>;
  }): EvidenceDrawerItem {
    const {
      id,
      claim,
      layer,
      source,
      rawEvidence,
      timestamp,
      confidence,
      technology,
      snapshotId,
      rawPayload,
    } = params;

    const level1Summary = `Observed ${source.toLowerCase()} at ${layer} boundary.`;
    const level2Meaning = technology
      ? `${rawEvidence} — Directly identifies the observed ${technology} ${layer.toLowerCase()} signature.`
      : `${claim} — Corroborated with ${confidence.toLowerCase()} confidence.`;

    return {
      id,
      claim,
      layer,
      source,
      rawEvidence,
      timestamp,
      confidence,
      technology,
      level1Summary,
      level2Meaning,
      level3RawTelemetry: {
        sourceType: source,
        key: technology,
        value: rawEvidence,
        payload: rawPayload,
        snapshotId,
        timestamp,
      },
    };
  }

  /**
   * Helper to strip potentially hazardous characters or long strings.
   */
  private sanitizeString(input: string): string {
    return input.replace(/[<>"'`\\]/g, '').substring(0, 256);
  }
}
