import { env } from '@/app/config/env';
import { ApiError } from './ApiError';
import { buildUrl } from './buildUrl';

const NO_CONTENT = 204;

function buildSignal(externalSignal) {
  const timeoutSignal = AbortSignal.timeout(env.apiTimeoutMs);
  return externalSignal ? AbortSignal.any([externalSignal, timeoutSignal]) : timeoutSignal;
}

function buildBody(body) {
  if (body === undefined) return { body: undefined, headers: {} };
  if (body instanceof FormData) return { body, headers: {} };
  return { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } };
}

async function readPayload(response) {
  if (response.status === NO_CONTENT) return null;
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function request(
  path,
  { method = 'GET', body, pathParams, query, signal, headers = {} } = {},
) {
  const url = buildUrl(env.apiUrl, path, pathParams, query);
  const prepared = buildBody(body);

  let response;
  try {
    response = await fetch(url, {
      method,
      body: prepared.body,
      headers: { Accept: 'application/json', ...prepared.headers, ...headers },
      signal: buildSignal(signal),
    });
  } catch (error) {
    // Si quien llamó canceló la petición (ej. React Query), se respeta la cancelación
    if (signal?.aborted) throw error;
    throw ApiError.fromNetworkFailure(error);
  }

  const payload = await readPayload(response);
  if (!response.ok) throw ApiError.fromResponse(response.status, payload);
  return payload;
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
