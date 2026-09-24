import { useInfiniteQuery } from '@tanstack/react-query';
import { listTemplates } from '../api/templatesApi';
import { templateKeys } from '../api/templateKeys';

// Listado por páginas: cada "Ver más" pide la siguiente con el cursor que dio el backend
export function useTemplatesList() {
  return useInfiniteQuery({
    queryKey: templateKeys.list(),
    queryFn: ({ pageParam, signal }) => listTemplates({ cursor: pageParam, signal }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    select: (data) => data.pages.flatMap((page) => page.items),
  });
}
