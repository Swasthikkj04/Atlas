/**
 * Core Logic and State Derivation for Error Boundary.
 */

export interface ErrorBoundaryDerivedState {
  hasError: boolean;
  error: Error;
  errorId: string;
}

export function generateErrorReferenceId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 6);
  return `err_${timestamp}_${randomPart}`;
}

export function deriveErrorBoundaryState(error: Error): ErrorBoundaryDerivedState {
  return {
    hasError: true,
    error,
    errorId: generateErrorReferenceId(),
  };
}

export function shouldErrorBoundaryReset(
  prevKeys?: unknown[],
  nextKeys?: unknown[]
): boolean {
  if (!prevKeys && !nextKeys) return false;
  const p = prevKeys || [];
  const n = nextKeys || [];
  if (p.length !== n.length) return true;
  return p.some((key, idx) => key !== n[idx]);
}
