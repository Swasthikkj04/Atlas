import { TechnologyCategory } from './technology-category.enum';
import { TechnologyConfidenceLevel } from './technology-confidence.enum';
import { DetectionStatus } from './detection-status.enum';
import { TechnologyEvidence } from './technology-evidence.interface';
import { TechnologySignal } from './technology-signal.interface';
import { TechnologyMeaning } from './technology-meaning.interface';
import {
  BehavioralConfidencePosture,
  BehavioralSignal,
} from './behavioral-fingerprint.interface';

export interface TechnologyDetectionResult extends TechnologyMeaning {
  /**
   * Question 1: What is it?
   */
  readonly id: string;
  readonly name: string;
  readonly category: TechnologyCategory | string;
  readonly description?: string;
  readonly version?: string;
  readonly versionEvidence?: string;

  /**
   * Detection lifecycle and confidence scoring
   */
  readonly status: DetectionStatus;
  readonly confidence: number;
  readonly confidenceLevel: TechnologyConfidenceLevel;
  readonly behavioralPosture?: BehavioralConfidencePosture;
  readonly behavioralSignals?: BehavioralSignal[];

  /**
   * Question 2: Why do we believe it is present?
   */
  readonly whyDetected: string;

  /**
   * Question 3: What role does it play in this infrastructure?
   */
  readonly role: string;

  /**
   * Question 4: What does its presence mean for this infrastructure?
   */
  readonly infrastructureMeaning: string;
  readonly whatThisDoesNotProve?: string;
  readonly implications?: string[];

  /**
   * Evidence lineage and telemetry trace
   */
  readonly evidence: TechnologyEvidence[];
  readonly signals: TechnologySignal[];
  readonly evidenceCount: number;
}

import { InfrastructureTopology } from './infrastructure-topology.interface';
import { InfrastructureArchitectureBrief } from './architecture-brief.interface';
import { BehavioralFingerprintResult } from './behavioral-fingerprint.interface';

export type DetectedTechnology = TechnologyDetectionResult;

export interface TechnologyDiscoveryResult {
  readonly technologies: DetectedTechnology[];
  readonly topology?: InfrastructureTopology;
  readonly architectureBrief?: InfrastructureArchitectureBrief;
  readonly behavioralFingerprint?: BehavioralFingerprintResult;
  readonly totalDetected?: number;
  readonly evaluatedDetectorsCount?: number;
  readonly evaluatedAt?: string;
}
