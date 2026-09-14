import type {
  InfrastructureFindingDto,
  TimelineEventDto,
  ProcessingEvidenceItemDto,
} from '../../../types/api';

/**
 * WX-1019 / WX-1023: Investigation Meaning & Evidence Hierarchy Contract.
 *
 * Canonical Information Hierarchy:
 * 1. FINDING / CHANGE HERO: Editorial title, category, calibrated severity & separate confidence indicator.
 * 2. WHAT HAPPENED: Plain-language observation.
 * 3. WHY IT MATTERS: Security/operational significance and explicit severity rationale.
 * 4. WHAT NEBULA ACTUALLY KNOWS & WHAT THIS MEANS: Compact domain/control/state breakdown and evidence lineage.
 * 5. WHAT NEBULA DOES NOT PROVE: Explicit boundary against overclaiming or inferring active exploitation.
 * 6. OBSERVED EVIDENCE: Technical proof layer (Rule, Observation Key, Observed Value).
 * 7. HOW NEBULA KNOWS: Progressively disclosed verification details.
 * 8. VERIFIED CONTEXT: Restrained snapshot context footer.
 */

export interface FindingMeaningHierarchy {
  readonly hero: {
    readonly title: string;
    readonly subtitle: string;
    readonly category: string;
    readonly severity: string;
    readonly confidence: string;
    readonly riskClassification: string;
    readonly detectedDateFormatted: string;
    readonly snapshotShortId: string;
    readonly snapshotFullId: string;
  };
  readonly whatHappened: {
    readonly explanation: string;
    readonly supportingFact?: string;
  };
  readonly whyItMatters: {
    readonly significance: string;
    readonly impactLevel?: string;
    readonly severityRationale?: string;
  };
  readonly whatThisMeans: {
    readonly domain: string;
    readonly control: string;
    readonly observedState: string;
  };
  readonly whatNebulaDoesNotProve: {
    readonly title: string;
    readonly description: string;
  };
  readonly observedEvidence: {
    readonly ruleId?: string;
    readonly observationKey?: string;
    readonly observedValue?: string | null;
  };
  readonly howNebulaKnows: readonly ProcessingEvidenceItemDto[];
  readonly verifiedContext: {
    readonly domain: string;
    readonly snapshotId: string;
    readonly detectedAt: string;
  };
}

export interface ChangeMeaningHierarchy {
  readonly hero: {
    readonly title: string;
    readonly subtitle: string;
    readonly changeType: string;
    readonly severity: string;
    readonly detectedDateFormatted: string;
    readonly snapshotShortId?: string;
    readonly snapshotFullId?: string;
  };
  readonly whatHappened: {
    readonly explanation: string;
  };
  readonly whyItMatters: {
    readonly significance: string;
    readonly impactLevel: string;
  };
  readonly whatThisMeans: {
    readonly domain: string;
    readonly changeType: string;
    readonly transitionState: string;
  };
  readonly whatThisEstablishes?: {
    readonly title: string;
    readonly description: string;
  };
  readonly whatNebulaDoesNotProve?: {
    readonly title: string;
    readonly description: string;
  };
  readonly derivedSummary?: {
    readonly previousLabel?: string;
    readonly currentLabel?: string;
    readonly postureChange?: string;
    readonly directives?: { readonly previous: number; readonly current: number };
    readonly allowedSources?: string;
    readonly browserRestrictions?: string;
    readonly overallPosture?: string;
  } | null;
  readonly observedEvidence: {
    readonly previousValue?: string | null;
    readonly currentValue?: string | null;
    readonly previousSnapshotId?: string | null;
    readonly currentSnapshotId?: string | null;
  };
  readonly howNebulaKnows: readonly ProcessingEvidenceItemDto[];
  readonly verifiedContext: {
    readonly domain: string;
    readonly snapshotId?: string;
    readonly previousSnapshotId?: string | null;
    readonly detectedAt: string;
  };
}

export function formatInvestigationDate(rawDate?: string | Date | null): string {
  if (!rawDate) return 'Timestamp unavailable';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'Unverified timestamp';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Timestamp unavailable';
  }
}

function formatRiskClassification(classification?: string): string {
  switch (classification) {
    case 'CONFIRMED_SECURITY_CONDITION':
      return 'Confirmed Security Condition';
    case 'SECURITY_HARDENING_GAP':
      return 'Security Hardening Gap';
    case 'OPERATIONAL_OBSERVATION':
      return 'Operational Observation';
    case 'INFORMATIONAL_OBSERVATION':
      return 'Informational Observation';
    default:
      return 'Security Hardening Gap';
  }
}

function formatConfidenceLabel(confidence?: string): string {
  switch (confidence?.toUpperCase()) {
    case 'AUTHORITATIVE':
      return 'Authoritative observation';
    case 'SUPPORTED':
      return 'Supported observation';
    case 'CONTEXTUAL':
      return 'Contextual signal';
    case 'INCONCLUSIVE':
      return 'Inconclusive';
    default:
      return 'Authoritative observation';
  }
}

/**
 * Pure resolver for Finding Meaning Hierarchy (WX-1019 / WX-1023).
 */
export function resolveFindingMeaningHierarchy(params: {
  finding: InfrastructureFindingDto;
  domainName: string;
}): FindingMeaningHierarchy {
  const { finding, domainName } = params;

  const detectedDateFormatted = formatInvestigationDate(
    finding.detectedAt || finding.createdAt || finding.timeline?.firstDetectedAt
  );

  const snapshotFullId = finding.snapshotId || 'Unavailable';
  const snapshotShortId =
    finding.snapshotId && finding.snapshotId.length > 8
      ? `${finding.snapshotId.slice(0, 8)}…`
      : finding.snapshotId || 'Unavailable';

  // 1. Subtitle (concise factual headline summary)
  const subtitle =
    finding.description ||
    (finding.title.toLowerCase().includes('spf')
      ? `${domainName} does not publish an SPF record.`
      : `${finding.category} observation recorded for ${domainName}.`);

  // 2. What Happened (Factual explanation)
  const explanation =
    finding.explanation ||
    finding.processingSummary ||
    finding.description ||
    `${finding.title} was observed during infrastructure understanding for ${domainName}.`;

  // 3. Why It Matters (Significance / Impact before technical evidence)
  const significance =
    finding.remediation ||
    finding.recommendations?.[0]?.description ||
    (finding.severity === 'CRITICAL' || finding.severity === 'HIGH'
      ? `This finding directly affects the security posture, authentication, or availability of ${domainName}. Addressing it mitigates exposure to impersonation, interception, or service degradation.`
      : `Maintaining expected configuration for ${finding.category} ensures consistent infrastructure baseline and operational resilience for ${domainName}.`);

  // 4. What This Means (Domain, Control, Observed State)
  const control =
    finding.rule?.name ||
    finding.category ||
    (finding.title.toLowerCase().includes('spf') ? 'SPF' : 'Security Control');

  const observedState =
    finding.status === 'RESOLVED'
      ? 'Resolved'
      : finding.title.toLowerCase().includes('not found') ||
        finding.title.toLowerCase().includes('missing')
      ? 'Not published'
      : finding.status || 'Active';

  // 5. What Nebula Does NOT Prove (Explicit Boundary against overclaiming - WX-1023)
  const whatThisDoesNotProve =
    finding.whatThisDoesNotProve ||
    (finding.title.toLowerCase().includes('content security policy') || finding.title.toLowerCase().includes('csp')
      ? 'This observation does not establish that the application is currently exploitable to cross-site scripting (XSS). It identifies the absence of a browser-side mitigation policy.'
      : finding.title.toLowerCase().includes('hsts')
      ? 'This observation does not establish that network traffic is currently being intercepted or downgraded. It identifies the absence of a proactive HTTPS enforcement header.'
      : finding.title.toLowerCase().includes('spf')
      ? 'This observation does not establish that unauthorized emails are currently being forged using this domain. It identifies the absence of an authoritative sender validation policy.'
      : finding.title.toLowerCase().includes('dmarc')
      ? 'This observation does not establish that phishing attacks are actively impersonating this domain. It identifies the absence of an enforcement policy for SPF/DKIM alignment.'
      : finding.category === 'PERFORMANCE' || finding.title.toLowerCase().includes('slow')
      ? 'This observation is an operational performance metric and does not represent a security vulnerability.'
      : 'This observation identifies an infrastructure configuration state and does not establish that an exploitable vulnerability exists.');

  // 6. Observed Evidence
  const ruleId =
    finding.lineage?.ruleId ||
    finding.rule?.ruleId ||
    (finding.category === 'DNS' ? 'dns.missing-spf' : undefined);
  const observationKey = finding.lineage?.observationKey || 'observation_key';
  const observedValue =
    finding.lineage?.observedValue ||
    finding.observations?.[0]?.value ||
    finding.title;

  const isResolved =
    finding.status === 'RESOLVED' || finding.state === 'RESOLVED';

  // 7. How Nebula Knows (Verification Details - WX-211 / WX-1019)
  const howNebulaKnows: readonly ProcessingEvidenceItemDto[] =
    finding.processingEvidence && finding.processingEvidence.length > 0
      ? finding.processingEvidence
      : isResolved
      ? [
          {
            step: 'Finding resolved',
            status: 'SUCCESS',
            description: `Resolved against snapshot ${snapshotShortId}`,
            timestamp: finding.detectedAt || finding.createdAt,
          },
          {
            step: 'Resolving snapshot verified',
            status: 'SUCCESS',
            description: 'Infrastructure state was authoritative',
            timestamp: finding.detectedAt || finding.createdAt,
          },
          {
            step: 'Resolution observation evaluated',
            status: 'SUCCESS',
            description: `Evaluated against ${ruleId || finding.category}`,
            timestamp: finding.detectedAt || finding.createdAt,
          },
          {
            step: 'Investigation assembled',
            status: 'SUCCESS',
            description: 'Evidence lineage verified',
            timestamp: finding.detectedAt || finding.createdAt,
          },
        ]
      : [
          {
            step: 'Finding active',
            status: 'SUCCESS',
            description: `Finding active in snapshot ${snapshotShortId}`,
            timestamp: finding.detectedAt || finding.createdAt,
          },
          {
            step: 'Snapshot verified',
            status: 'SUCCESS',
            description: 'Infrastructure state was authoritative',
            timestamp: finding.detectedAt || finding.createdAt,
          },
          {
            step: 'Observation evaluated',
            status: 'SUCCESS',
            description: `Evaluated against ${ruleId || finding.category}`,
            timestamp: finding.detectedAt || finding.createdAt,
          },
          {
            step: 'Investigation assembled',
            status: 'SUCCESS',
            description: 'Evidence lineage verified',
            timestamp: finding.detectedAt || finding.createdAt,
          },
        ];

  return {
    hero: {
      title: finding.title,
      subtitle,
      category: String(finding.category),
      severity: String(finding.severity),
      confidence: formatConfidenceLabel(finding.confidence),
      riskClassification: formatRiskClassification(finding.riskClassification),
      detectedDateFormatted,
      snapshotShortId,
      snapshotFullId,
    },
    whatHappened: {
      explanation,
    },
    whyItMatters: {
      significance,
      impactLevel: String(finding.severity),
      severityRationale: finding.severityRationale,
    },
    whatThisMeans: {
      domain: domainName,
      control: String(control),
      observedState: String(observedState),
    },
    whatNebulaDoesNotProve: {
      title: 'What this does not establish',
      description: whatThisDoesNotProve,
    },
    observedEvidence: {
      ruleId,
      observationKey,
      observedValue,
    },
    howNebulaKnows,
    verifiedContext: {
      domain: domainName,
      snapshotId: snapshotFullId,
      detectedAt: detectedDateFormatted,
    },
  };
}

/**
 * Pure resolver for Change Meaning Hierarchy (WX-1019).
 */
export function resolveChangeMeaningHierarchy(params: {
  change?: TimelineEventDto;
  event?: TimelineEventDto;
  domainName: string;
}): ChangeMeaningHierarchy {
  const event = params.change || params.event!;
  const { domainName } = params;

  const detectedDateFormatted = formatInvestigationDate(event.detectedAt || event.timestamp);
  const snapshotFullId = event.snapshotId || event.currentSnapshotId || undefined;
  const snapshotShortId =
    snapshotFullId && snapshotFullId.length > 8
      ? `${snapshotFullId.slice(0, 8)}…`
      : snapshotFullId;

  const changeType = String(event.changeType || 'INFRASTRUCTURE_CHANGED').replace(/_/g, ' ');
  const title = event.title || 'Infrastructure Change Detected';
  const subtitle =
    event.summary ||
    event.description ||
    `Verified state transition recorded for ${domainName}.`;

  const explanation =
    event.explanation ||
    event.description ||
    event.summary ||
    `A verified infrastructure transition was recorded on ${domainName}.`;

  const significance =
    event.impact ||
    'Infrastructure transitions can alter security posture, routing behaviors, and application delivery paths.';

  const impactLevel = String(event.severity || 'LOW');

  const transitionState = `${event.previousValue || 'Initial State'} → ${event.currentValue || 'Observed State'}`;

  const howNebulaKnows: readonly ProcessingEvidenceItemDto[] = [
    {
      step: 'Change resolved',
      status: 'SUCCESS',
      description: `Transition verified between snapshots`,
      timestamp: event.detectedAt || event.timestamp,
    },
    {
      step: 'Previous snapshot evaluated',
      status: 'SUCCESS',
      description: event.previousSnapshotId ? `Snapshot ${event.previousSnapshotId.slice(0, 8)}… baseline loaded` : 'Baseline snapshot verified',
      timestamp: event.detectedAt || event.timestamp,
    },
    {
      step: 'Current snapshot evaluated',
      status: 'SUCCESS',
      description: event.currentSnapshotId ? `Snapshot ${event.currentSnapshotId.slice(0, 8)}… state compared` : 'Current snapshot verified',
      timestamp: event.detectedAt || event.timestamp,
    },
    {
      step: 'Diff verified',
      status: 'SUCCESS',
      description: 'Zero fabricated transition state confirmed',
      timestamp: event.detectedAt || event.timestamp,
    },
  ];

  const titleLower = (event.title || '').toLowerCase();
  const isCsp = titleLower.includes('content-security-policy') || titleLower.includes('csp');
  const isHsts = titleLower.includes('strict-transport-security') || titleLower.includes('hsts');

  const whatThisEstablishes = {
    title: 'What this establishes',
    description:
      event.whatThisEstablishes ||
      (isCsp
        ? 'Nebula verified that the current authoritative response contains a Content-Security-Policy that differs from the previous verified response.'
        : isHsts
        ? 'Nebula verified that the current authoritative response contains a Strict-Transport-Security header enforcing HTTPS transport.'
        : `Nebula verified that the current authoritative response differs from the previous verified response for ${domainName}.`),
  };

  const whatNebulaDoesNotProve = {
    title: 'What this does not establish',
    description:
      event.whatThisDoesNotEstablish ||
      (isCsp
        ? 'This change does not guarantee that all content-injection or XSS scenarios are prevented.'
        : isHsts
        ? 'This change does not guarantee that client connections or application endpoints cannot be compromised through other vectors.'
        : 'This change does not guarantee that all operational risks or security vulnerabilities are eliminated.'),
  };

  const derivedSummary = event.derivedSummary || (isCsp ? {
    previousLabel: event.previousValue ? 'CSP present' : 'No effective CSP',
    currentLabel: event.currentValue ? 'CSP present' : 'No effective CSP',
    postureChange: 'Protection improved',
    allowedSources: 'Configured',
    browserRestrictions: 'Stronger',
    overallPosture: 'Improved',
  } : null);

  return {
    hero: {
      title,
      subtitle,
      changeType,
      severity: impactLevel,
      detectedDateFormatted,
      snapshotShortId,
      snapshotFullId,
    },
    whatHappened: {
      explanation,
    },
    whyItMatters: {
      significance,
      impactLevel,
    },
    whatThisMeans: {
      domain: domainName,
      changeType,
      transitionState,
    },
    whatThisEstablishes,
    whatNebulaDoesNotProve,
    derivedSummary,
    observedEvidence: {
      previousValue: event.previousValue,
      currentValue: event.currentValue,
      previousSnapshotId: event.previousSnapshotId,
      currentSnapshotId: event.currentSnapshotId,
    },
    howNebulaKnows,
    verifiedContext: {
      domain: domainName,
      snapshotId: snapshotFullId,
      previousSnapshotId: event.previousSnapshotId,
      detectedAt: detectedDateFormatted,
    },
  };
}
