import { useInfiniteQuery } from '@tanstack/react-query';
import { listResponses } from '../api/responsesApi';
import { responseKeys } from '../api/responseKeys';

// Listado por páginas: cada "Ver más" pide la siguiente con el cursor que dio el backend
export function useResponsesList(templateId) {
  return useInfiniteQuery({
    queryKey: responseKeys.list(templateId),
    queryFn: ({ pageParam, signal }) => listResponses(templateId, { cursor: pageParam, signal }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.items),
    enabled: Boolean(templateId),
  });
}
