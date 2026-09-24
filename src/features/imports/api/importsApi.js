import { env } from '@/app/config/env';
import { apiClient } from '@/shared/api/apiClient';
import { idempotencyHeaders } from '@/shared/api/idempotencyHeaders';

const { imports, importDetail } = env.endpoints;

// Sube la foto o PDF del formato original. El backend lo guarda en S3.
export function createImport(file, { idempotencyKey } = {}) {
  const body = new FormData();
  body.append('file', file);
  return apiClient.post(imports, body, {
    headers: idempotencyHeaders(idempotencyKey),
    timeoutMs: env.uploadTimeoutMs,
  });
}

// Trae el documento con una URL firmada nueva (las URLs vencen después de unos minutos)
export function getImport(importId, { signal } = {}) {
  return apiClient.get(importDetail, { pathParams: { importId }, signal });
}
