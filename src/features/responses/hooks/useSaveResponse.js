import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIdempotencyKey } from '@/shared/hooks/useIdempotencyKey';
import { saveResponseDraft, submitResponse } from '../api/responsesApi';
import { cacheResponse } from './cacheResponse';

// Guardar borrador y enviar comparten todo menos el endpoint. body: { name, values }
function useResponseMutation(responseId, send) {
  const queryClient = useQueryClient();
  const { keyFor, release } = useIdempotencyKey();

  return useMutation({
    mutationFn: (body) => send(responseId, body, { idempotencyKey: keyFor(body) }),
    onSuccess: (response) => {
      release();
      cacheResponse(queryClient, response);
    },
  });
}

export function useSaveResponse(responseId) {
  return useResponseMutation(responseId, saveResponseDraft);
}

export function useSubmitResponse(responseId) {
  return useResponseMutation(responseId, submitResponse);
}
