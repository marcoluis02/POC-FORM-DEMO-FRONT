import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createImport } from '@/shared/api/importsApi';
import { importKeys } from '@/shared/api/importKeys';
import { useIdempotencyKey } from '@/shared/hooks/useIdempotencyKey';
import { fileIdentity } from '@/shared/utils/fileIdentity';

// La clave no se libera al terminar: si después falla guardar la plantilla y se reintenta
// con el mismo archivo, el backend regresa el mismo documento en vez de subirlo otra vez.
export function useCreateImport() {
  const queryClient = useQueryClient();
  const { keyFor } = useIdempotencyKey();

  return useMutation({
    mutationFn: (file) => createImport(file, { idempotencyKey: keyFor(fileIdentity(file)) }),
    onSuccess: (created) => {
      queryClient.setQueryData(importKeys.detail(created.id), created);
    },
  });
}
