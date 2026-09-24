import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useIdempotencyKey } from '@/shared/hooks/useIdempotencyKey';
import { createTemplate } from '../api/templatesApi';
import { cacheSavedTemplate } from './cacheSavedTemplate';

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { keyFor, release } = useIdempotencyKey();

  return useMutation({
    mutationFn: ({ definition, sourceImportId }) =>
      createTemplate(definition, {
        sourceImportId,
        idempotencyKey: keyFor({ definition, sourceImportId }),
      }),
    onSuccess: (template) => {
      release();
      cacheSavedTemplate(queryClient, template);
    },
  });
}
