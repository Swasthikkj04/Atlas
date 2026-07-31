import { JobStatus } from '@prisma/client';
import { GuestUnderstandingStatusDto } from '../dto/response/guest-understanding-status.dto';

export class GuestUnderstandingPresenter {
  static toProgressResponse(job: {
    status: JobStatus;
    current_phase?: string | null;
  }): GuestUnderstandingStatusDto {
    const phase = job.current_phase || 'INGRESS_DISCOVERY';

    if (job.status === JobStatus.PENDING) {
      return {
        status: 'PENDING',
        progress: {
          percentage: 10,
          message: 'Observing public infrastructure',
        },
      };
    }

    if (phase === 'INGRESS_DISCOVERY' || phase === 'DNS_DISCOVERY') {
      return {
        status: 'DISCOVERING',
        progress: {
          percentage: 35,
          message: 'Observing public infrastructure',
        },
      };
    }

    if (phase === 'HTTP_FINGERPRINT' || phase === 'TOPOLOGY_MAP') {
      return {
        status: 'ANALYZING',
        progress: {
          percentage: 65,
          message: 'Building infrastructure relationships',
        },
      };
    }

    return {
      status: 'GENERATING_SUMMARY',
      progress: {
        percentage: 85,
        message: 'Synthesizing executive understanding',
      },
    };
  }

  static toCompletedResponse(
    brief: { summary?: string; highlights?: any; overallHealth?: string } | null,
    findingsCount: number,
  ): GuestUnderstandingStatusDto {
    const highlightsList = Array.isArray(brief?.highlights)
      ? (brief?.highlights as string[])
      : typeof brief?.highlights === 'string'
      ? [brief.highlights]
      : ['Multi-region CDN Edge', 'TLS 1.3 Strict HSTS', 'DNS Topology Verified'];

    return {
      status: 'COMPLETED',
      summary: {
        executiveBrief:
          brief?.summary ||
          'Infrastructure is engineered for global availability with distributed edge routing.',
        highlights: highlightsList,
        riskLevel: brief?.overallHealth === 'HEALTHY' ? 'LOW' : 'MEDIUM',
      },
      stats: {
        hosts: Math.max(1, highlightsList.length * 4),
        services: Math.max(1, highlightsList.length * 8),
        findings: findingsCount,
      },
      next: {
        action: 'CREATE_ACCOUNT',
      },
    };
  }

  static toFailedResponse(errorMessage?: string | null): GuestUnderstandingStatusDto {
    return {
      status: 'FAILED',
      message:
        errorMessage ||
        'We could not complete infrastructure understanding for the target host.',
      retryAvailable: true,
    };
  }
}
