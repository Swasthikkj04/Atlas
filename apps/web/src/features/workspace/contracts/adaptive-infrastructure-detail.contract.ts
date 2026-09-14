import type {
  SemanticInfrastructureCategory,
  AdaptiveInfrastructureComponent,
} from './adaptive-infrastructure.contract.ts';

export type ProgressiveDisclosureLevel = 'LEVEL_1_UNDERSTANDING' | 'LEVEL_2_CONTEXT' | 'LEVEL_3_EVIDENCE';

export interface InfrastructureAttributeViewModel {
  key: string;
  label: string;
  value: string;
  type?: 'text' | 'badge' | 'mono' | 'code';
}

export interface InfrastructureEvidenceViewModel {
  id: string;
  sourceType: string;
  sourceDescription: string;
  observedSignal: string;
  observedValue?: string;
  observedAt?: string;
  confidence?: string;
}

export interface InfrastructureComponentViewModel {
  id: string;
  category: SemanticInfrastructureCategory;
  name: string;
  technology?: string;
  version?: string;
  role?: string;
  layer?: string;
  confidence?: number;
  confidenceLevel?: 'HIGH' | 'MEDIUM' | 'LOW' | 'INCONCLUSIVE';
  status: 'OBSERVED' | 'UNOBSERVED' | 'MASKED' | 'ABSENT';
  attributes: InfrastructureAttributeViewModel[];
  whyThisAppears?: string;
  whatThisDoesNotProve?: string;
  evidence: InfrastructureEvidenceViewModel[];
  hasContext: boolean;
  hasEvidence: boolean;
}

/**
 * Normalizes raw component telemetry into an authoritative InfrastructureComponentViewModel.
 * Adheres strictly to: 0 technology-specific branching, optional versions, and honest evidence preservation.
 */
export function buildComponentViewModel(
  component: AdaptiveInfrastructureComponent,
  observedTimestamp?: string,
): InfrastructureComponentViewModel {
  const attributes: InfrastructureAttributeViewModel[] = [];

  if (component.layer) {
    attributes.push({ key: 'layer', label: 'Layer', value: component.layer, type: 'badge' });
  }

  if (component.version) {
    attributes.push({ key: 'version', label: 'Version', value: component.version, type: 'mono' });
  }

  if (component.role) {
    attributes.push({ key: 'role', label: 'Role', value: component.role, type: 'text' });
  }

  // Specialized metadata attributes if present
  if (component.metadata?.sslExpiresAt) {
    attributes.push({ key: 'sslExpiresAt', label: 'Expires', value: new Date(component.metadata.sslExpiresAt).toLocaleDateString(), type: 'mono' });
  }

  if (component.metadata?.ipv4Addresses && component.metadata.ipv4Addresses.length > 0) {
    attributes.push({ key: 'ipv4', label: 'IPv4 Endpoints', value: component.metadata.ipv4Addresses.join(', '), type: 'mono' });
  }

  // Normalize Evidence View Models
  const evidenceList: InfrastructureEvidenceViewModel[] = [];

  if (component.evidenceReferences && Array.isArray(component.evidenceReferences)) {
    for (let idx = 0; idx < component.evidenceReferences.length; idx++) {
      const ref = component.evidenceReferences[idx];
      const source = ref.source || ref.sourceType || 'HTTP / HTML response';
      const signal = ref.indicator || ref.observedValue || (typeof ref === 'string' ? ref : 'Telemetry signature');

      evidenceList.push({
        id: `ev-${component.id}-${idx}`,
        sourceType: ref.sourceType || 'PUBLIC_TELEMETRY',
        sourceDescription: source,
        observedSignal: signal,
        observedValue: ref.observedValue,
        observedAt: observedTimestamp ? new Date(observedTimestamp).toLocaleString() : undefined,
        confidence: ref.confidence || component.confidenceLevel,
      });
    }
  }

  // If whyDetected is present but evidence array was empty, provide authoritative why signal
  if (evidenceList.length === 0 && component.whyDetected) {
    evidenceList.push({
      id: `ev-${component.id}-why`,
      sourceType: 'PUBLIC_TELEMETRY',
      sourceDescription: 'HTTP / Response Headers',
      observedSignal: component.whyDetected,
      observedAt: observedTimestamp ? new Date(observedTimestamp).toLocaleString() : undefined,
      confidence: component.confidenceLevel,
    });
  }

  const whyThisAppears = component.infrastructureMeaning || component.whyDetected;
  const whatThisDoesNotProve = component.whatThisDoesNotProve;

  return {
    id: component.id,
    category: component.category,
    name: component.name,
    technology: component.technology,
    version: component.version,
    role: component.role,
    layer: component.layer,
    confidence: component.confidence,
    confidenceLevel: component.confidenceLevel,
    status: component.state,
    attributes,
    whyThisAppears,
    whatThisDoesNotProve,
    evidence: evidenceList,
    hasContext: Boolean(whyThisAppears || whatThisDoesNotProve),
    hasEvidence: evidenceList.length > 0,
  };
}
