import { useQuery } from '@tanstack/react-query';
import { authService } from '../../services/auth';
import { queryKeys } from './query-keys';
import type { UserDto } from '../../types/api';

export function useCurrentUser() {
  return useQuery<UserDto>({
    queryKey: queryKeys.auth.currentUser(),
    queryFn: ({ signal }) => authService.getCurrentUser(signal),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}
