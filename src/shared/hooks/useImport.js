import { useQuery } from '@tanstack/react-query';
import { getImport } from '@/shared/api/importsApi';
import { importKeys } from '@/shared/api/importKeys';
import { shouldPollImport } from '@/shared/domain/importStatus';

export const IMPORT_POLL_INTERVAL_MS = 2000;

// poll=true se usa solo en el flujo de procesamiento. En vistas de documento almacenado
// se hace una lectura normal para no dejar timers innecesarios.
export function useImport(importId, { poll = false } = {}) {
  return useQuery({
    queryKey: importKeys.detail(importId),
    queryFn: ({ signal }) => getImport(importId, { signal }),
    enabled: Boolean(importId),
    refetchInterval: poll
      ? (query) =>
          shouldPollImport(query.state.data?.status) ? IMPORT_POLL_INTERVAL_MS : false
      : false,
  });
}
