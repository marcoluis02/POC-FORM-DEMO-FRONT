import { env } from '@/app/config/env';
import { apiClient } from '@/shared/api/apiClient';
import { idempotencyHeaders } from '@/shared/api/idempotencyHeaders';

const { responses, responseDetail, responseSubmit, responseAttachments, responseAttachmentDetail } =
  env.endpoints;

// Formularios llenados de una plantilla, del más nuevo al más viejo. cursor viene de next_cursor.
export function listResponses(templateId, { cursor, signal } = {}) {
  return apiClient.get(responses, { query: { template_id: templateId, cursor }, signal });
}

// Empieza un formulario en borrador con la última versión de la plantilla
export function createResponse(templateId, name, { idempotencyKey } = {}) {
  return apiClient.post(
    responses,
    { template_id: templateId, name },
    { headers: idempotencyHeaders(idempotencyKey) },
  );
}

export function getResponse(responseId, { signal } = {}) {
  return apiClient.get(responseDetail, { pathParams: { responseId }, signal });
}

// body: { name, values }. Guarda sin exigir las obligatorias.
export function saveResponseDraft(responseId, body, { idempotencyKey } = {}) {
  return apiClient.put(responseDetail, body, {
    pathParams: { responseId },
    headers: idempotencyHeaders(idempotencyKey),
  });
}

// Guarda las respuestas finales y envía. Si falta una obligatoria regresa 422 con las preguntas.
export function submitResponse(responseId, body, { idempotencyKey } = {}) {
  return apiClient.post(responseSubmit, body, {
    pathParams: { responseId },
    headers: idempotencyHeaders(idempotencyKey),
  });
}

export function uploadAttachment(responseId, fieldId, file, { idempotencyKey } = {}) {
  const body = new FormData();
  body.append('field_id', fieldId);
  body.append('file', file);
  return apiClient.post(responseAttachments, body, {
    pathParams: { responseId },
    headers: idempotencyHeaders(idempotencyKey),
    timeoutMs: env.uploadTimeoutMs,
  });
}

export function deleteAttachment(responseId, attachmentId, { idempotencyKey } = {}) {
  return apiClient.delete(responseAttachmentDetail, {
    pathParams: { responseId, attachmentId },
    headers: idempotencyHeaders(idempotencyKey),
  });
}
