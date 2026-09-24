import { useQuery } from '@tanstack/react-query';
import { getResponse } from '../api/responsesApi';
import { responseKeys } from '../api/responseKeys';

export function useResponse(responseId) {
  return useQuery({
    queryKey: responseKeys.detail(responseId),
    queryFn: ({ signal }) => getResponse(responseId, { signal }),
    enabled: Boolean(responseId),
  });
}
