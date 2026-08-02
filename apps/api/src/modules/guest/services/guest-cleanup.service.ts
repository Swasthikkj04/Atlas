import { Injectable, Logger } from '@nestjs/common';
import { GuestSessionStatus } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { GuestRetentionPolicy } from '../policies/guest-retention.policy';
import { GuestAnalyticsService } from './guest-analytics.service';
import { SYSTEM_GUEST_USER_ID } from '../constants/guest.constants';

export interface CleanupResultSummary {
  sessionsCleaned: number;
  jobsCleaned: number;
  snapshotsCleaned: number;
  briefsCleaned: number;
  findingsCleaned: number;
}

@Injectable()
export class GuestCleanupService {
  private readonly logger = new Logger(GuestCleanupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly retentionPolicy: GuestRetentionPolicy,
    private readonly analyticsService: GuestAnalyticsService,
  ) {}

  async cleanupExpiredSessions(
    now: Date = new Date(),
  ): Promise<CleanupResultSummary> {
    const summary: CleanupResultSummary = {
      sessionsCleaned: 0,
      jobsCleaned: 0,
      snapshotsCleaned: 0,
      briefsCleaned: 0,
      findingsCleaned: 0,
    };

    // 1. Load Expired Guest Sessions (Explicitly excluding CONVERTED sessions)
    const expiredSessions = await this.prisma.guestSession.findMany({
      where: {
        status: {
          not: GuestSessionStatus.CONVERTED,
        },
        expiresAt: {
          lt: now,
        },
      },
    });

    if (expiredSessions.length === 0) {
      this.logger.debug(
        'Guest cleanup iteration: No expired guest sessions found.',
      );
      return summary;
    }

    this.logger.log(
      `Starting guest cleanup for ${expiredSessions.length} expired sessions...`,
    );

    // 2. Iterate and purge temporary infrastructure per session with failure isolation
    for (const session of expiredSessions) {
      if (!this.retentionPolicy.isEligibleForCleanup(session, now)) {
        continue;
      }

      try {
        if (session.understandingJobId) {
          const job = await this.prisma.understandingJob.findUnique({
            where: { id: session.understandingJobId },
            include: {
              domain: true,
              infrastructureSnapshot: {
                include: {
                  brief: true,
                  findings: true,
                },
              },
            },
          });

          // Enforce Safety Guard: Only delete infrastructure owned by SYSTEM_GUEST_USER_ID
          if (job && job.domain && job.domain.userId === SYSTEM_GUEST_USER_ID) {
            const snapshot = job.infrastructureSnapshot;

            if (snapshot) {
              // Step A: Delete Brief
              if (snapshot.brief) {
                try {
                  await this.prisma.infrastructureBrief.delete({
                    where: { snapshotId: snapshot.id },
                  });
                  summary.briefsCleaned++;
                } catch {
                  // Ignore if already deleted
                }
              }

              // Step B: Delete Findings
              try {
                const findingsResult =
                  await this.prisma.infrastructureFinding.deleteMany({
                    where: { snapshotId: snapshot.id },
                  });
                summary.findingsCleaned += findingsResult.count;
              } catch {
                // Ignore if already deleted
              }

              // Step C: Delete Snapshot
              try {
                await this.prisma.infrastructureSnapshot.delete({
                  where: { id: snapshot.id },
                });
                summary.snapshotsCleaned++;
              } catch {
                // Ignore if already deleted
              }
            }

            // Step D: Delete UnderstandingJob
            try {
              await this.prisma.understandingJob.delete({
                where: { id: job.id },
              });
              summary.jobsCleaned++;
            } catch {
              // Ignore if already deleted
            }

            // Step E: Delete orphaned Guest Domain if no other active jobs exist for it
            try {
              const remainingJobs = await this.prisma.understandingJob.count({
                where: { domainId: job.domainId },
              });
              if (remainingJobs === 0) {
                await this.prisma.domain.delete({
                  where: { id: job.domainId },
                });
              }
            } catch {
              // Ignore if already deleted
            }
          }
        }

        // Step F: Delete Expired Guest Session
        await this.prisma.guestSession.delete({
          where: { id: session.id },
        });
        summary.sessionsCleaned++;

        // Non-blocking analytics tracking
        void this.analyticsService
          .trackSessionCleaned(session.id)
          .catch(() => null);
      } catch (err: any) {
        this.logger.error(
          `Failed to clean up expired guest session ${session.id}: ${err.message}`,
          err.stack,
        );
        // Continue iterating to next session
      }
    }

    this.logger.log(
      `Guest cleanup completed: ${summary.sessionsCleaned} sessions, ${summary.jobsCleaned} jobs, ${summary.snapshotsCleaned} snapshots removed.`,
    );

    return summary;
  }
}
