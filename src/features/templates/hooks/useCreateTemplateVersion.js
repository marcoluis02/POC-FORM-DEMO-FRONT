import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIdempotencyKey } from '@/shared/hooks/useIdempotencyKey';
import { createTemplateVersion } from '../api/templatesApi';
import { cacheSavedTemplate } from './cacheSavedTemplate';

export function useCreateTemplateVersion(templateId) {
  const queryClient = useQueryClient();
  const { keyFor, release } = useIdempotencyKey();

  return useMutation({
    mutationFn: ({ definition, sourceImportId }) =>
      createTemplateVersion(templateId, definition, {
        sourceImportId,
        idempotencyKey: keyFor({ definition, sourceImportId }),
      }),
    onSuccess: (template) => {
      release();
      cacheSavedTemplate(queryClient, template);
    },
  });
}
