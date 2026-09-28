import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createImport } from '@/shared/api/importsApi';
import { importKeys } from '@/shared/api/importKeys';
import { useIdempotencyKey } from '@/shared/hooks/useIdempotencyKey';
import { fileIdentity } from '@/shared/utils/fileIdentity';

// La misma petición conserva su key durante reintentos para evitar duplicados si la red se corta.
// Al cambiar de archivo cambia la identidad; al salir de la pantalla el hook se desmonta y una
// digitalización nueva obtiene otra key. Esto también permite reintentar el guardado manual sin
// volver a crear el import si el archivo ya alcanzó el backend.
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
