import React from 'react';
import {
  QueryClient,
  QueryClientProvider,
  type DefaultOptions,
} from '@tanstack/react-query';
import { ApiError } from './api-client.ts';

/**
 * Canonical Query Client Configuration for Nebula.
 *
 * Defaults prioritize calm state stability, predictable caching,
 * and intelligent error suppression.
 */
export const defaultQueryOptions: DefaultOptions = {
  queries: {
    staleTime: 60 * 1000, // 1 minute fresh window
    gcTime: 5 * 60 * 1000, // 5 minutes cache garbage collection
    refetchOnWindowFocus: false, // Prevents sudden layout shift and visual noise
    refetchOnReconnect: 'always',
    retry: (failureCount, error) => {
      // Do not retry client errors or authentication challenges
      if (error instanceof ApiError) {
        if (error.status && [400, 401, 403, 404, 422].includes(error.status)) {
          return false;
        }
      }
      return failureCount < 2;
    },
  },
  mutations: {
    retry: false,
  },
};

/**
 * Factory to create an isolated QueryClient instance.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
  });
}

/**
 * Singleton QueryClient for the application lifecycle.
 */
export const queryClient = createQueryClient();

export interface QueryProviderProps {
  client?: QueryClient;
  children: React.ReactNode;
}

/**
 * React Query Provider component wrapping application tree.
 */
export const QueryProvider: React.FC<QueryProviderProps> = ({
  client = queryClient,
  children,
}) => {
  return React.createElement(QueryClientProvider, { client }, children);
};
