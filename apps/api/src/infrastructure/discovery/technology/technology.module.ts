import { Module } from '@nestjs/common';

import * as AllDetectors from './detectors';
import * as AllRules from './rules';
import { TechnologyDiscoveryService } from './technology-discovery.service';
import { TechnologyDetectorRegistryService } from './registry/technology-detector-registry.service';
import { TechnologyRelationshipRegistryService } from './registry/technology-relationship-registry.service';
import { DeepBehavioralFingerprintingEngine } from './engine/deep-behavioral-fingerprinting.engine';
import { TechnologyMeaningEngine } from './engine/technology-meaning.engine';
import { InfrastructureRelationshipEngine } from './engine/infrastructure-relationship.engine';
import { InfrastructureArchitectureSynthesisEngine } from './engine/infrastructure-architecture-synthesis.engine';
import { TechnologyFingerprintingEngine } from './engine/technology-fingerprinting.engine';
import { HttpBehaviorAnalyzer } from './behavioral/http-behavior.analyzer';
import { CookieBehaviorAnalyzer } from './behavioral/cookie-behavior.analyzer';
import { ErrorBehaviorAnalyzer } from './behavioral/error-behavior.analyzer';
import { TlsBehaviorAnalyzer } from './behavioral/tls-behavior.analyzer';
import { EvidenceFusionEngine } from './behavioral/evidence-fusion.engine';

const detectorProviders = Object.values(AllDetectors).filter(
  (d) => typeof d === 'function' && d.prototype,
) as any[];

const ruleProviders = Object.values(AllRules).filter(
  (r) => typeof r === 'function' && r.prototype,
) as any[];

const behavioralProviders = [
  HttpBehaviorAnalyzer,
  CookieBehaviorAnalyzer,
  ErrorBehaviorAnalyzer,
  TlsBehaviorAnalyzer,
  EvidenceFusionEngine,
];

@Module({
  providers: [
    ...detectorProviders,
    ...ruleProviders,
    ...behavioralProviders,
    TechnologyDetectorRegistryService,
    TechnologyRelationshipRegistryService,
    DeepBehavioralFingerprintingEngine,
    TechnologyMeaningEngine,
    InfrastructureRelationshipEngine,
    InfrastructureArchitectureSynthesisEngine,
    TechnologyFingerprintingEngine,
    TechnologyDiscoveryService,
  ],
  exports: [
    ...detectorProviders,
    ...ruleProviders,
    ...behavioralProviders,
    TechnologyDetectorRegistryService,
    TechnologyRelationshipRegistryService,
    DeepBehavioralFingerprintingEngine,
    TechnologyMeaningEngine,
    InfrastructureRelationshipEngine,
    InfrastructureArchitectureSynthesisEngine,
    TechnologyFingerprintingEngine,
    TechnologyDiscoveryService,
  ],
})
export class TechnologyModule {}
