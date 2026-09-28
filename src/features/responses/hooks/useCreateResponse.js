import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIdempotencyKey } from '@/shared/hooks/useIdempotencyKey';
import { createResponse } from '../api/responsesApi';
import { cacheResponse } from './cacheResponse';

export function useCreateResponse(templateVersionId) {
  const queryClient = useQueryClient();
  const { keyFor, release } = useIdempotencyKey();

  return useMutation({
    mutationFn: (name) =>
      createResponse(templateVersionId, name, {
        idempotencyKey: keyFor({ templateVersionId, name }),
      }),
    onSuccess: (created) => {
      release();
      cacheResponse(queryClient, created);
    },
  });
}
