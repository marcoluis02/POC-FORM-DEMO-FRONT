import { useQuery } from '@tanstack/react-query';
import { getTemplate } from '../api/templatesApi';
import { templateKeys } from '../api/templateKeys';

export function useTemplate(templateId) {
  return useQuery({
    queryKey: templateKeys.detail(templateId),
    queryFn: ({ signal }) => getTemplate(templateId, { signal }),
    enabled: Boolean(templateId),
  });
}
