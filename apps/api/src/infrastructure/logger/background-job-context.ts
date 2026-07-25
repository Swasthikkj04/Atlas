import { RequestContext, RequestContextStore } from './request-context.store';

export function runWithCorrelationId<T>(
  correlationId: string,
  jobId?: string,
  fn?: () => T,
): T {
  const context: RequestContext = {
    correlationId: correlationId || `corr_job_${Date.now()}`,
    requestId: `req_job_${Date.now()}`,
    jobId,
    startTime: Date.now(),
  };
  return RequestContextStore.run(context, fn || (() => undefined as any));
}
