import { useQuery } from '@tanstack/react-query';
import { getImport } from '../api/importsApi';
import { importKeys } from '../api/importKeys';

export function useImport(importId) {
  return useQuery({
    queryKey: importKeys.detail(importId),
    queryFn: ({ signal }) => getImport(importId, { signal }),
    enabled: Boolean(importId),
  });
}
