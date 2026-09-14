import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { subscribeToUnderstandingStream } from './stream.ts';
import type { UnderstandingStreamPayload } from './stream.ts';

class MockEventSource {
  public url: string;
  public options?: any;
  public onmessage: ((event: any) => void) | null = null;
  public onerror: ((event: any) => void) | null = null;
  private listeners: Map<string, Array<(event: any) => void>> = new Map();
  public closed = false;

  constructor(url: string, options?: any) {
    this.url = url;
    this.options = options;
  }

  addEventListener(type: string, listener: (event: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(listener);
  }

  removeEventListener(type: string, listener: (event: any) => void) {
    const list = this.listeners.get(type);
    if (list) {
      this.listeners.set(type, list.filter((l) => l !== listener));
    }
  }

  dispatchEvent(type: string, data: any) {
    const event = { type, data: typeof data === 'string' ? data : JSON.stringify(data) };
    if (type === 'message' && this.onmessage) {
      this.onmessage(event);
    }
    const handlers = this.listeners.get(type) || [];
    handlers.forEach((h) => h(event));
  }

  triggerError(errorEvent: any = {}) {
    if (this.onerror) {
      this.onerror(errorEvent);
    }
  }

  close() {
    this.closed = true;
  }
}

describe('subscribeToUnderstandingStream', () => {
  let originalEventSource: any;
  let activeMock: MockEventSource | null = null;

  beforeEach(() => {
    originalEventSource = (globalThis as any).EventSource;
    (globalThis as any).EventSource = class extends MockEventSource {
      constructor(url: string, options?: any) {
        super(url, options);
        activeMock = this;
      }
    };
  });

  afterEach(() => {
    (globalThis as any).EventSource = originalEventSource;
    activeMock = null;
  });

  it('should create EventSource with credentials and correct URL', () => {
    const unsubscribe = subscribeToUnderstandingStream('job_test_123', {});

    assert.ok(activeMock);
    assert.match(activeMock.url, /\/api\/v1\/jobs\/job_test_123\/stream$/);
    assert.strictEqual(activeMock.options?.withCredentials, true);

    unsubscribe();
    assert.strictEqual(activeMock.closed, true);
  });

  it('should trigger onInit when init event arrives', () => {
    let receivedPayload: UnderstandingStreamPayload | null = null;

    subscribeToUnderstandingStream('job_test_init', {
      onInit: (payload) => {
        receivedPayload = payload;
      },
    });

    assert.ok(activeMock);
    const mockData: UnderstandingStreamPayload = {
      type: 'INIT',
      jobId: 'job_test_init',
      stage: 'QUEUED',
      stageIndex: 0,
      totalStages: 6,
      percent: 0,
      timestamp: Date.now(),
    };

    activeMock.dispatchEvent('init', mockData);

    assert.ok(receivedPayload);
    assert.strictEqual(receivedPayload.jobId, 'job_test_init');
    assert.strictEqual(receivedPayload.stage, 'QUEUED');
  });

  it('should trigger onProgress and update stage percent', () => {
    const progressEvents: UnderstandingStreamPayload[] = [];

    subscribeToUnderstandingStream('job_test_prog', {
      onProgress: (payload) => {
        progressEvents.push(payload);
      },
    });

    assert.ok(activeMock);
    activeMock.dispatchEvent('progress', {
      type: 'PROGRESS',
      jobId: 'job_test_prog',
      stage: 'BEHAVIORAL_FINGERPRINTING',
      stageIndex: 3,
      percent: 50,
      timestamp: Date.now(),
    });

    assert.strictEqual(progressEvents.length, 1);
    assert.strictEqual(progressEvents[0].stage, 'BEHAVIORAL_FINGERPRINTING');
    assert.strictEqual(progressEvents[0].percent, 50);
  });

  it('should trigger onComplete and close stream when COMPLETED event arrives', () => {
    let completedPayload: UnderstandingStreamPayload | null = null;

    subscribeToUnderstandingStream('job_test_comp', {
      onComplete: (payload) => {
        completedPayload = payload;
      },
    });

    assert.ok(activeMock);
    activeMock.dispatchEvent('complete', {
      type: 'COMPLETED',
      jobId: 'job_test_comp',
      stage: 'COMPLETED',
      percent: 100,
      snapshotId: 'snap-abc',
      timestamp: Date.now(),
    });

    assert.ok(completedPayload);
    assert.strictEqual(completedPayload.snapshotId, 'snap-abc');
    assert.strictEqual(activeMock.closed, true);
  });

  it('should trigger onError and close stream when EventSource errors', () => {
    let errorReceived = false;

    subscribeToUnderstandingStream('job_test_err', {
      onError: () => {
        errorReceived = true;
      },
    });

    assert.ok(activeMock);
    activeMock.triggerError();

    assert.strictEqual(errorReceived, true);
    assert.strictEqual(activeMock.closed, true);
  });
});
