import { useQuery } from '@tanstack/react-query';
import { getHealth, healthKeys } from '@/shared/api/healthApi';

export function useApiHealth() {
  return useQuery({
    queryKey: healthKeys.status,
    queryFn: ({ signal }) => getHealth({ signal }),
  });
}
