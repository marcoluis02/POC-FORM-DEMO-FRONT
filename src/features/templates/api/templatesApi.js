import { env } from '@/app/config/env';
import { apiClient } from '@/shared/api/apiClient';
import { idempotencyHeaders } from '@/shared/api/idempotencyHeaders';

const { templates, templateDetail, templateVersions, templateVersionDetail } = env.endpoints;

// Página del listado. cursor viene de next_cursor de la página anterior; el tamaño lo decide el backend.
export function listTemplates({ cursor, signal } = {}) {
  return apiClient.get(templates, { query: { cursor }, signal });
}

export function getTemplate(templateId, { signal } = {}) {
  return apiClient.get(templateDetail, { pathParams: { templateId }, signal });
}

export function getTemplateVersion(templateId, version, { signal } = {}) {
  return apiClient.get(templateVersionDetail, { pathParams: { templateId, version }, signal });
}

// sourceImportId: documento original ya subido (opcional)
export function createTemplate(definition, { idempotencyKey, sourceImportId } = {}) {
  return apiClient.post(templates, definition, {
    query: { source_import_id: sourceImportId },
    headers: idempotencyHeaders(idempotencyKey),
  });
}

export function createTemplateVersion(
  templateId,
  definition,
  { idempotencyKey, sourceImportId } = {},
) {
  return apiClient.post(templateVersions, definition, {
    pathParams: { templateId },
    query: { source_import_id: sourceImportId },
    headers: idempotencyHeaders(idempotencyKey),
  });
}
