import { templateKeys } from '../api/templateKeys';

// El backend ya regresa la plantilla completa al guardar: se deja en caché
// para que la pantalla de detalle no la vuelva a pedir. El listado se marca como viejo
// y solo se vuelve a pedir cuando alguien lo abra.
export function cacheSavedTemplate(queryClient, template) {
  queryClient.setQueryData(templateKeys.detail(template.id), template);
  queryClient.setQueryData(
    templateKeys.version(template.id, template.current_version.version),
    template.current_version,
  );
  queryClient.invalidateQueries({ queryKey: templateKeys.list() });
}
