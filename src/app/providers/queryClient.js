import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/ApiError';

const MAX_RETRIES = 2;
const TOO_MANY_REQUESTS = 429;

// No reintenta errores del usuario (400, 404, 422...) porque volverían a fallar igual
function shouldRetry(failureCount, error) {
  if (error instanceof ApiError && error.isClientError && error.status !== TOO_MANY_REQUESTS) {
    return false;
  }
  return failureCount < MAX_RETRIES;
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
