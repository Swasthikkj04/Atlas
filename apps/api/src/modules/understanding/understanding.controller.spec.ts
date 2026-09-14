import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { of } from 'rxjs';
import { take } from 'rxjs/operators';
import { UnderstandingController } from './understanding.controller';
import { UnderstandingService } from './understanding.service';
import { GuestUnderstandingService } from '../guest/guest-understanding.service';
import { UnderstandingStreamService } from './services/understanding-stream.service';
import { JobStatus, TriggerType } from '@prisma/client';

describe('UnderstandingController', () => {
  let controller: UnderstandingController;
  let understandingService: jest.Mocked<Partial<UnderstandingService>>;
  let guestService: jest.Mocked<Partial<GuestUnderstandingService>>;
  let streamService: jest.Mocked<Partial<UnderstandingStreamService>>;

  beforeEach(async () => {
    understandingService = {
      create: jest.fn(),
      findById: jest.fn(),
      findByDomain: jest.fn(),
    };

    guestService = {
      getGuestJobStatus: jest.fn(),
      startGuestUnderstanding: jest.fn(),
      getGuestUnderstandingResult: jest.fn(),
      claimGuestSession: jest.fn(),
    };

    streamService = {
      getJobStream: jest.fn(),
      publishProgress: jest.fn(),
      publishComplete: jest.fn(),
      publishError: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnderstandingController],
      providers: [
        { provide: UnderstandingService, useValue: understandingService },
        { provide: GuestUnderstandingService, useValue: guestService },
        { provide: UnderstandingStreamService, useValue: streamService },
      ],
    }).compile();

    controller = module.get<UnderstandingController>(UnderstandingController);
  });

  describe('create', () => {
    it('should trigger job creation and set Location header', async () => {
      const mockJob = {
        id: 'job-123',
        domainId: 'dom-1',
        trigger: TriggerType.MANUAL,
        status: JobStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: null,
        completedAt: null,
        heartbeatAt: null,
        leaseUntil: null,
        workerId: null,
        attemptCount: 0,
        maxAttempts: 3,
        durationMs: null,
        errorMessage: null,
        nextRetryAt: null,
      };

      (understandingService.create as jest.Mock).mockResolvedValue(mockJob);

      const mockRes: any = {
        setHeader: jest.fn(),
      };

      const result = await controller.create(
        { user: { id: 'usr-1' } } as any,
        'dom-1',
        mockRes,
      );

      expect(result).toEqual(mockJob);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Location',
        '/api/v1/jobs/job-123',
      );
    });
  });

  describe('findById', () => {
    it('should route guest job id to guestService', async () => {
      const guestJob = {
        jobId: 'gst_job_123',
        sessionId: 'ses_123',
        status: 'RUNNING',
      };
      (guestService.getGuestJobStatus as jest.Mock).mockResolvedValue(guestJob);

      const result = await controller.findById({} as any, 'gst_job_123');
      expect(result).toEqual(guestJob);
      expect(guestService.getGuestJobStatus).toHaveBeenCalledWith(
        'gst_job_123',
      );
    });

    it('should throw UnauthorizedException for registered job without auth', async () => {
      await expect(
        controller.findById({} as any, 'job-reg-123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return job for authenticated user', async () => {
      const mockJob = {
        id: 'job-reg-123',
        progress: { currentStage: 'PROBING_DNS_NETWORK' },
      };
      (understandingService.findById as jest.Mock).mockResolvedValue(
        mockJob as any,
      );

      const result = await controller.findById(
        { user: { id: 'usr-1' } } as any,
        'job-reg-123',
      );

      expect(result).toEqual(mockJob);
      expect(understandingService.findById).toHaveBeenCalledWith(
        'usr-1',
        'job-reg-123',
      );
    });
  });

  describe('streamJob (SSE)', () => {
    it('should establish SSE stream for guest job', async () => {
      const guestJob = {
        jobId: 'gst_job_456',
        sessionId: 'ses_456',
        status: 'RUNNING',
      };
      (guestService.getGuestJobStatus as jest.Mock).mockResolvedValue(guestJob);

      const mockStream$ = of({
        type: 'init',
        data: { type: 'INIT', jobId: 'gst_job_456' },
      });
      (streamService.getJobStream as jest.Mock).mockReturnValue(mockStream$);

      const stream$ = await controller.streamJob({} as any, 'gst_job_456');

      expect(streamService.getJobStream).toHaveBeenCalledWith(
        'gst_job_456',
        null,
      );

      const event = await stream$.pipe(take(1)).toPromise();
      expect(event?.type).toBe('init');
    });

    it('should establish SSE stream for completed guest job with formatted initial progress', async () => {
      const guestJob = {
        jobId: 'gst_job_completed',
        sessionId: 'ses_comp',
        status: 'COMPLETED',
      };
      (guestService.getGuestJobStatus as jest.Mock).mockResolvedValue(guestJob);

      const mockStream$ = of({
        type: 'complete',
        data: { type: 'COMPLETED', jobId: 'gst_job_completed' },
      });
      (streamService.getJobStream as jest.Mock).mockReturnValue(mockStream$);

      await controller.streamJob({} as any, 'gst_job_completed');

      expect(streamService.getJobStream).toHaveBeenCalledWith(
        'gst_job_completed',
        expect.objectContaining({
          currentStage: 'COMPLETED',
          stageIndex: 6,
        }),
      );
    });

    it('should establish SSE stream for authenticated registered job', async () => {
      const mockJob = {
        id: 'job-auth-789',
        progress: { currentStage: 'BEHAVIORAL_FINGERPRINTING', stageIndex: 3 },
      };
      (understandingService.findById as jest.Mock).mockResolvedValue(
        mockJob as any,
      );

      const mockStream$ = of({
        type: 'progress',
        data: {
          type: 'PROGRESS',
          jobId: 'job-auth-789',
          stage: 'BEHAVIORAL_FINGERPRINTING',
        },
      });
      (streamService.getJobStream as jest.Mock).mockReturnValue(mockStream$);

      const stream$ = await controller.streamJob(
        { user: { id: 'usr-1' } } as any,
        'job-auth-789',
      );

      expect(understandingService.findById).toHaveBeenCalledWith(
        'usr-1',
        'job-auth-789',
      );
      expect(streamService.getJobStream).toHaveBeenCalledWith(
        'job-auth-789',
        mockJob.progress,
      );
    });

    it('should throw UnauthorizedException when unauthenticated user requests registered job stream', async () => {
      await expect(
        controller.streamJob({} as any, 'job-non-guest'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
