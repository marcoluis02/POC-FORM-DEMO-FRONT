import { responseKeys } from '../api/responseKeys';

// El backend regresa el formulario completo al guardar: se deja en caché para no volver a pedirlo.
// El listado de la plantilla se marca como viejo y se pide otra vez solo cuando alguien lo vea.
export function cacheResponse(queryClient, response) {
  queryClient.setQueryData(responseKeys.detail(response.id), response);
  queryClient.invalidateQueries({ queryKey: responseKeys.list(response.template_id) });
}

// Cambia solo las fotos del formulario que ya está en caché
export function updateCachedAttachments(queryClient, responseId, change) {
  queryClient.setQueryData(responseKeys.detail(responseId), (current) =>
    current ? { ...current, attachments: change(current.attachments) } : current,
  );
}
