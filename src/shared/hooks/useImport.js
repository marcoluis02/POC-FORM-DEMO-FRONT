import { useQuery } from '@tanstack/react-query';
import { getImport } from '@/shared/api/importsApi';
import { importKeys } from '@/shared/api/importKeys';

export function useImport(importId) {
  return useQuery({
    queryKey: importKeys.detail(importId),
    queryFn: ({ signal }) => getImport(importId, { signal }),
    enabled: Boolean(importId),
  });
}
