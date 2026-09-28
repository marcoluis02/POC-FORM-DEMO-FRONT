import { env } from '@/app/config/env';
import { apiClient } from '@/shared/api/apiClient';
import { idempotencyHeaders } from '@/shared/api/idempotencyHeaders';
import { parseImportResponse } from '@/shared/domain/importContract';

const { imports, importDetail } = env.endpoints;

// Sube la foto o PDF del formato original. El backend lo guarda en S3.
export async function createImport(file, { idempotencyKey } = {}) {
  const body = new FormData();
  body.append('file', file);
  const created = await apiClient.post(imports, body, {
    headers: idempotencyHeaders(idempotencyKey),
    timeoutMs: env.uploadTimeoutMs,
  });
  return parseImportResponse(created);
}

// Trae el documento con una URL firmada nueva (las URLs vencen después de unos minutos)
export async function getImport(importId, { signal } = {}) {
  const imported = await apiClient.get(importDetail, { pathParams: { importId }, signal });
  return parseImportResponse(imported);
}
