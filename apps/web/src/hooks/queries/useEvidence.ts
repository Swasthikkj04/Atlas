import { useQuery } from '@tanstack/react-query';
import {
  resolveAuthoritativeEvidence,
  type CanonicalEvidencePayload,
} from '../../features/workspace/contracts/canonical-evidence-resolver.contract';
import { queryKeys } from './query-keys';

export function useEvidenceResolver(params: {
  targetId: string | null | undefined;
  domainId?: string;
  enabled?: boolean;
}) {
  const { targetId, domainId, enabled = true } = params;

  return useQuery<CanonicalEvidencePayload>({
    queryKey: queryKeys.evidence.target(targetId || ''),
    queryFn: ({ signal }) =>
      resolveAuthoritativeEvidence({
        targetId: targetId!,
        domainId,
        signal,
      }),
    enabled: Boolean(targetId) && enabled,
  });
}
