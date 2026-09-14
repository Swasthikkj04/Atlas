import { Test, TestingModule } from '@nestjs/testing';
import {
  UnderstandingStreamService,
  UnderstandingStreamEvent,
} from './understanding-stream.service';
import { take, toArray } from 'rxjs/operators';
import { MessageEvent } from '@nestjs/common';

describe('UnderstandingStreamService', () => {
  let service: UnderstandingStreamService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnderstandingStreamService],
    }).compile();

    service = module.get<UnderstandingStreamService>(
      UnderstandingStreamService,
    );
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  it('should emit initial INIT event upon subscription', (done) => {
    const jobId = 'job_test_1';
    const stream$ = service.getJobStream(jobId);

    stream$.pipe(take(1)).subscribe({
      next: (event: MessageEvent) => {
        expect(event.type).toBe('init');
        const data = event.data as UnderstandingStreamEvent;
        expect(data.type).toBe('INIT');
        expect(data.jobId).toBe(jobId);
        expect(data.stage).toBe('QUEUED');
        expect(data.stageIndex).toBe(0);
        expect(data.percent).toBe(0);
        done();
      },
      error: done.fail,
    });
  });

  it('should stream stage progress updates with correct stageIndex and percent', (done) => {
    const jobId = 'job_test_2';
    const stream$ = service.getJobStream(jobId);

    const receivedEvents: MessageEvent[] = [];

    stream$.pipe(take(3)).subscribe({
      next: (event) => {
        receivedEvents.push(event);
        if (receivedEvents.length === 3) {
          // Event 0: init
          expect(receivedEvents[0].type).toBe('init');

          // Event 1: DNS
          expect(receivedEvents[1].type).toBe('progress');
          const dnsData = receivedEvents[1].data as UnderstandingStreamEvent;
          expect(dnsData.stage).toBe('PROBING_DNS_NETWORK');
          expect(dnsData.stageIndex).toBe(1);
          expect(dnsData.percent).toBeGreaterThan(0);
          expect(dnsData.stageLabel).toBe('DNS & Perimeter Routing');

          // Event 2: TLS
          expect(receivedEvents[2].type).toBe('progress');
          const tlsData = receivedEvents[2].data as UnderstandingStreamEvent;
          expect(tlsData.stage).toBe('ANALYZING_TLS_SECURITY');
          expect(tlsData.stageIndex).toBe(2);
          expect(tlsData.percent).toBeGreaterThan(dnsData.percent);
          done();
        }
      },
      error: done.fail,
    });

    // Simulate progress emissions
    service.publishProgress(
      jobId,
      'PROBING_DNS_NETWORK',
      'Probing authoritative DNS',
    );
    service.publishProgress(
      jobId,
      'ANALYZING_TLS_SECURITY',
      'Analyzing TLS cipher suites',
    );
  });

  it('should emit COMPLETED event and complete stream', (done) => {
    const jobId = 'job_test_3';
    const stream$ = service.getJobStream(jobId);

    const events: MessageEvent[] = [];

    stream$.subscribe({
      next: (event) => {
        events.push(event);
      },
      complete: () => {
        expect(events.length).toBe(2); // init + complete
        expect(events[1].type).toBe('complete');
        const compData = events[1].data as UnderstandingStreamEvent;
        expect(compData.type).toBe('COMPLETED');
        expect(compData.percent).toBe(100);
        expect(compData.snapshotId).toBe('snap-123');
        expect(compData.durationMs).toBe(1500);
        done();
      },
      error: done.fail,
    });

    service.publishComplete(jobId, 'snap-123', 1500);
  });

  it('should emit FAILED event on error and complete stream', (done) => {
    const jobId = 'job_test_4';
    const stream$ = service.getJobStream(jobId);

    const events: MessageEvent[] = [];

    stream$.subscribe({
      next: (event) => {
        events.push(event);
      },
      complete: () => {
        expect(events.length).toBe(2); // init + failed
        expect(events[1].type).toBe('failed');
        const failData = events[1].data as UnderstandingStreamEvent;
        expect(failData.type).toBe('FAILED');
        expect(failData.errorMessage).toBe('Connection reset by peer');
        done();
      },
      error: done.fail,
    });

    service.publishError(jobId, 'Connection reset by peer', 800);
  });

  it('should support multiple concurrent subscribers for the same job', (done) => {
    const jobId = 'job_test_multisub';
    const stream1$ = service.getJobStream(jobId);
    const stream2$ = service.getJobStream(jobId);

    let stream1Completed = false;
    let stream2Completed = false;

    const checkDone = () => {
      if (stream1Completed && stream2Completed) {
        done();
      }
    };

    stream1$.subscribe({
      complete: () => {
        stream1Completed = true;
        checkDone();
      },
    });

    stream2$.subscribe({
      complete: () => {
        stream2Completed = true;
        checkDone();
      },
    });

    service.publishComplete(jobId, 'snap-multi', 500);
  });
});
