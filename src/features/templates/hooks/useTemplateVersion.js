import { useQuery } from '@tanstack/react-query';
import { getTemplateVersion } from '../api/templatesApi';
import { templateKeys } from '../api/templateKeys';

// Las versiones nunca cambian una vez creadas, por eso no se vuelven a pedir
export function useTemplateVersion(templateId, version, { enabled = true } = {}) {
  return useQuery({
    queryKey: templateKeys.version(templateId, version),
    queryFn: ({ signal }) => getTemplateVersion(templateId, version, { signal }),
    enabled: enabled && Boolean(templateId) && Boolean(version),
    staleTime: Infinity,
  });
}
