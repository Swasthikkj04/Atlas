import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  correlationId: string;
  requestId: string;
  userId?: string;
  domainId?: string;
  jobId?: string;
  startTime: number;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export class RequestContextStore {
  static getContext(): RequestContext | undefined {
    return requestContextStorage.getStore();
  }

  static getCorrelationId(): string {
    return this.getContext()?.correlationId || 'corr_system';
  }

  static getRequestId(): string {
    return this.getContext()?.requestId || 'req_system';
  }

  static getUserId(): string | undefined {
    return this.getContext()?.userId;
  }

  static getDomainId(): string | undefined {
    return this.getContext()?.domainId;
  }

  static getJobId(): string | undefined {
    return this.getContext()?.jobId;
  }

  static setUserId(userId: string): void {
    const ctx = this.getContext();
    if (ctx) {
      ctx.userId = userId;
    }
  }

  static setDomainId(domainId: string): void {
    const ctx = this.getContext();
    if (ctx) {
      ctx.domainId = domainId;
    }
  }

  static setJobId(jobId: string): void {
    const ctx = this.getContext();
    if (ctx) {
      ctx.jobId = jobId;
    }
  }

  static run<T>(context: RequestContext, fn: () => T): T {
    return requestContextStorage.run(context, fn);
  }
}
