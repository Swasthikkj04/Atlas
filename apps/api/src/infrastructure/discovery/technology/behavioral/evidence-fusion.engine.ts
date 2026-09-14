import { Injectable, Logger } from '@nestjs/common';
import {
  TechnologyCategory,
  TechnologyConfidenceLevel,
  TechnologyDetectionResult,
  TechnologyEvidence,
  TechnologySignal,
  BehavioralSignal,
  BehavioralConfidencePosture,
} from '../contracts';

export interface FusionOutput {
  results: TechnologyDetectionResult[];
  posturesByTechnology: Record<string, BehavioralConfidencePosture>;
}

/**
 * T22-E — Evidence Fusion Engine
 *
 * Combines independent direct observations and behavioral signals without collapsing them:
 * - Direct + Behavioral => CORROBORATED (HIGH confidence)
 * - Direct only => DIRECT (Authoritative confidence)
 * - Multiple/Strong Behavioral => CONSISTENT (MEDIUM confidence)
 * - Single Weak Behavioral => WEAK_SIGNAL (LOW confidence)
 *
 * Preserves strict anti-overreach guarantees and complete evidence lineage.
 */
@Injectable()
export class EvidenceFusionEngine {
  private readonly logger = new Logger(EvidenceFusionEngine.name);

  fuse(
    existingResults: TechnologyDetectionResult[],
    behavioralSignals: BehavioralSignal[],
  ): FusionOutput {
    const enrichedResults = [...existingResults];
    const postures: Record<string, BehavioralConfidencePosture> = {};

    // Group behavioral signals by targetTechnologyId or normalized name
    const signalsByTech = new Map<string, BehavioralSignal[]>();
    for (const signal of behavioralSignals) {
      const key =
        signal.targetTechnologyId ||
        signal.targetTechnologyName?.toLowerCase() ||
        'unknown';
      const list = signalsByTech.get(key) || [];
      list.push(signal);
      signalsByTech.set(key, list);
    }

    // 1. Process and enrich existing direct detection results
    for (const result of enrichedResults) {
      const key = result.id;
      const matchingSignals =
        signalsByTech.get(key) ||
        signalsByTech.get(result.name.toLowerCase()) ||
        [];

      if (matchingSignals.length > 0) {
        // Direct detection corroborated by independent behavioral signals
        postures[result.id] = 'CORROBORATED';

        const updatedEvidence: TechnologyEvidence[] = [...result.evidence];
        const updatedSignals: TechnologySignal[] = [...result.signals];

        for (const sig of matchingSignals) {
          updatedEvidence.push({
            sourceType: 'WIRE_BEHAVIOR',
            source: sig.evidenceReferences[0] || sig.type,
            indicator: sig.observedWireEvidence,
            observedValue: sig.description,
            confidence: sig.confidenceLevel,
          });

          updatedSignals.push({
            name: `Behavioral: ${sig.type}`,
            type: 'WIRE_BEHAVIOR',
            indicator: sig.observedWireEvidence,
            matched: true,
            weight: Math.round(sig.strength * 10),
          });
        }

        // Corroboration strengthens confidence up to 0.98
        const fusedConfidence = Math.min(
          0.98,
          Math.max(result.confidence + 0.05, 0.95),
        );
        const fusedConfidenceLevel: TechnologyConfidenceLevel = 'HIGH';

        (result as any).confidence = fusedConfidence;
        (result as any).confidenceLevel = fusedConfidenceLevel;
        (result as any).evidence = updatedEvidence;
        (result as any).signals = updatedSignals;
        (result as any).evidenceCount = updatedEvidence.length;
        (result as any).behavioralPosture = 'CORROBORATED';
        (result as any).behavioralSignals = matchingSignals;
      } else {
        // Direct observation without behavioral corroboration
        postures[result.id] = 'DIRECT';
        (result as any).behavioralPosture = 'DIRECT';
      }
    }

    // 2. Process behavioral signals for technologies that had NO direct detection
    for (const [techKey, signals] of signalsByTech.entries()) {
      const alreadyPresent = enrichedResults.some(
        (r) =>
          r.id === techKey ||
          r.name.toLowerCase() ===
            signals[0]?.targetTechnologyName?.toLowerCase(),
      );

      if (
        alreadyPresent ||
        signals.length === 0 ||
        techKey === 'unknown' ||
        !signals[0]?.targetTechnologyName
      ) {
        continue;
      }

      const primary = signals[0];
      const maxStrength = Math.max(...signals.map((s) => s.strength));
      const avgConfidence =
        signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length;

      const techId = primary.targetTechnologyId || `tech-behavioral-${techKey}`;
      const techName = primary.targetTechnologyName || techKey;
      const category =
        primary.targetCategory || TechnologyCategory.CLOUD_INFRASTRUCTURE;
      const role = primary.targetRole || 'Observed Infrastructure Component';

      let posture: BehavioralConfidencePosture = 'CONSISTENT';
      let confidenceLevel: TechnologyConfidenceLevel = 'MEDIUM';
      let confidence = 0.7;

      // Classify posture based on signal weight and multi-signal corroboration
      if (signals.length >= 2 || maxStrength >= 0.85 || avgConfidence >= 0.65) {
        posture = 'CONSISTENT';
        confidence = Math.min(0.85, Math.max(avgConfidence, 0.7));
        confidenceLevel = confidence >= 0.8 ? 'HIGH' : 'MEDIUM';
      } else {
        posture = 'WEAK_SIGNAL';
        confidence = Math.min(0.45, Math.max(avgConfidence, 0.35));
        confidenceLevel = 'LOW';
      }

      postures[techId] = posture;

      const evidenceList: TechnologyEvidence[] = signals.map((s) => ({
        sourceType: 'WIRE_BEHAVIOR',
        source: s.evidenceReferences[0] || s.type,
        indicator: s.observedWireEvidence,
        observedValue: s.description,
        confidence: s.confidenceLevel,
      }));

      const signalList: TechnologySignal[] = signals.map((s) => ({
        name: `Behavioral: ${s.type}`,
        type: 'WIRE_BEHAVIOR',
        indicator: s.observedWireEvidence,
        matched: true,
        weight: Math.round(s.strength * 10),
      }));

      const whyDetected =
        posture === 'CONSISTENT'
          ? `Public endpoint behavior is consistent with ${techName} (${role}). Identified via ${signals.length} independent wire behavioral signals.`
          : `Weak behavioral indicator consistent with ${techName}.`;

      const infrastructureMeaning = `Public endpoint exhibits behavioral characteristics consistent with ${techName} (${signals.map((s) => s.type).join(', ')}).`;

      const whatThisDoesNotProve = `Behavioral wire signals indicate ${techName} characteristics, but absence of direct explicit banners prevents deterministic version or configuration verification.`;

      enrichedResults.push({
        id: techId,
        name: techName,
        category,
        status: 'DETECTED',
        confidence,
        confidenceLevel,
        behavioralPosture: posture,
        behavioralSignals: signals,
        role,
        whyDetected,
        infrastructureMeaning,
        whatThisDoesNotProve,
        implications: [
          `${techName} characteristics observed through response wire behavior.`,
          `Confidence is calibrated to behavioral observations rather than explicit banners.`,
        ],
        evidence: evidenceList,
        signals: signalList,
        evidenceCount: evidenceList.length,
      } as any);
    }

    return {
      results: enrichedResults,
      posturesByTechnology: postures,
    };
  }
}
