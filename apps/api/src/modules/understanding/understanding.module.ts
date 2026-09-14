import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { DnsModule } from '../../infrastructure/discovery/dns/dns.module';

import { DomainsModule } from '../domains/domains.module';

import { UnderstandingController } from './understanding.controller';
import { UnderstandingService } from './understanding.service';
import { UnderstandingWorker } from './understanding.worker';
import { UnderstandingEngine } from './understanding.engine';
import { UnderstandingRepository } from './repositories/understanding.repository';
import { InfrastructureVerificationRepository } from './repositories/infrastructure-verification.repository';
import { InfrastructureVerificationService } from './services/infrastructure-verification.service';
import { SnapshotEqualityEngine } from './services/snapshot-equality.engine';
import { ChangeDetectionEngine } from './services/change-detection.engine';
import { UnderstandingStreamService } from './services/understanding-stream.service';
import { HttpModule } from '../../infrastructure/discovery/http/http.module';
import { DiscoveryModule } from '../../infrastructure/discovery/discovery.module';
import { InfrastructureSnapshotsModule } from '../infrastructure-snapshots/infrastructure-snapshots.module';
import { FindingsModule } from '../findings/findings.module';
import { InfrastructureFindingsModule } from '../infrastructure-findings/infrastructure-findings.module';
import { InfrastructureBriefModule } from '../infrastructure-brief/infrastructure-brief.module';
import { WorkerReliabilityService } from './services/worker-reliability.service';

import { GuestModule } from '../guest/guest.module';
import { AttributionModule } from '../../infrastructure/attribution/attribution.module';
import { MetricsModule } from '../../infrastructure/metrics/metrics.module';

import { SnapshotCanonicalizerService } from './services/snapshot-canonicalizer.service';
import { SnapshotFingerprintService } from './services/snapshot-fingerprint.service';
import { SnapshotMemoryService } from './services/snapshot-memory.service';
import { TechnologyChangeAnalyzerService } from './services/technology-change-analyzer.service';
import { TemporalDeltaEngineService } from './services/temporal-delta-engine.service';
import { IntelligenceIntegrityGateService } from './services/intelligence-integrity-gate.service';
import { IntelligenceConsistencyAuthorityService } from './services/intelligence-consistency-authority.service';

@Module({
  imports: [
    PrismaModule,
    DomainsModule,
    forwardRef(() => GuestModule),
    DnsModule,
    HttpModule,
    DiscoveryModule,
    InfrastructureSnapshotsModule,
    FindingsModule,
    InfrastructureFindingsModule,
    InfrastructureBriefModule,
    AttributionModule,
    MetricsModule,
  ],
  controllers: [UnderstandingController],
  providers: [
    UnderstandingService,
    UnderstandingRepository,
    InfrastructureVerificationRepository,
    InfrastructureVerificationService,
    SnapshotEqualityEngine,
    ChangeDetectionEngine,
    UnderstandingStreamService,
    WorkerReliabilityService,
    UnderstandingWorker,
    UnderstandingEngine,
    SnapshotCanonicalizerService,
    SnapshotFingerprintService,
    SnapshotMemoryService,
    TechnologyChangeAnalyzerService,
    TemporalDeltaEngineService,
    IntelligenceIntegrityGateService,
    IntelligenceConsistencyAuthorityService,
  ],
  exports: [
    UnderstandingService,
    UnderstandingRepository,
    InfrastructureVerificationRepository,
    InfrastructureVerificationService,
    SnapshotEqualityEngine,
    ChangeDetectionEngine,
    UnderstandingStreamService,
    WorkerReliabilityService,
    UnderstandingEngine,
    SnapshotCanonicalizerService,
    SnapshotFingerprintService,
    SnapshotMemoryService,
    TechnologyChangeAnalyzerService,
    TemporalDeltaEngineService,
    IntelligenceIntegrityGateService,
    IntelligenceConsistencyAuthorityService,
  ],
})
export class UnderstandingModule {}
