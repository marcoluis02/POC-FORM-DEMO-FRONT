import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIdempotencyKey } from '@/shared/hooks/useIdempotencyKey';
import { fileIdentity } from '@/shared/utils/fileIdentity';
import { deleteAttachment, uploadAttachment } from '../api/responsesApi';
import { responseKeys } from '../api/responseKeys';
import { updateCachedAttachments } from './cacheResponse';

// La foto se guarda en cuanto se sube; no espera a "Guardar borrador"
export function useUploadAttachment(responseId) {
  const queryClient = useQueryClient();
  const { keyFor, release } = useIdempotencyKey();

  return useMutation({
    mutationFn: ({ fieldId, file }) =>
      uploadAttachment(responseId, fieldId, file, {
        idempotencyKey: keyFor({ fieldId, file: fileIdentity(file) }),
      }),
    onSuccess: (attachment) => {
      release();
      updateCachedAttachments(queryClient, responseId, (current) => [...current, attachment]);
    },
  });
}

export function useDeleteAttachment(responseId) {
  const queryClient = useQueryClient();
  const { keyFor, release } = useIdempotencyKey();

  return useMutation({
    mutationFn: (attachmentId) =>
      deleteAttachment(responseId, attachmentId, { idempotencyKey: keyFor({ attachmentId }) }),
    onSuccess: ({ id }) => {
      release();
      updateCachedAttachments(queryClient, responseId, (current) =>
        current.filter((item) => item.id !== id),
      );
    },
  });
}

// Pide el formulario otra vez: trae URLs nuevas de las fotos (vencen) y el estado actual
export function useRefreshResponse(responseId) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: responseKeys.detail(responseId) });
}
