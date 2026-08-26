import { useQuery } from '@tanstack/react-query';
import { findingService, type FindingQueryParams } from '../../services/finding.service';
import { queryKeys } from './query-keys';
import type {
  InfrastructureFindingDto,
  FindingListResponseDto,
  FindingEvidenceResponseDto,
} from '../../types/api';

export function useFindings(
  domainId: string | null | undefined,
  params?: FindingQueryParams
) {
  return useQuery<FindingListResponseDto>({
    queryKey: queryKeys.findings.byDomain(domainId || '', params),
    queryFn: ({ signal }) => findingService.getFindingsForDomain(domainId!, params, signal),
    enabled: Boolean(domainId),
  });
}

export function useFinding(findingId: string | null | undefined) {
  return useQuery<InfrastructureFindingDto>({
    queryKey: queryKeys.findings.detail(findingId || ''),
    queryFn: ({ signal }) => findingService.getFindingById(findingId!, signal),
    enabled: Boolean(findingId),
  });
}

export function useFindingEvidence(findingId: string | null | undefined) {
  return useQuery<FindingEvidenceResponseDto>({
    queryKey: queryKeys.findings.evidence(findingId || ''),
    queryFn: ({ signal }) => findingService.getFindingEvidence(findingId!, signal),
    enabled: Boolean(findingId),
  });
}
