import { apiClient } from '@/shared/api/apiClient';
import { API_ERROR_CODES, ApiError } from '@/shared/api/ApiError';

vi.mock('@/app/config/env', () => ({
  env: { apiUrl: 'http://api.test', apiTimeoutMs: 1000, endpoints: {} },
}));

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('hace GET con parámetros de ruta y query string', async () => {
    fetch.mockResolvedValue(jsonResponse(200, { ok: true }));

    const data = await apiClient.get('/poc/templates/{id}', {
      pathParams: { id: 'a b' },
      query: { page: 2, empty: '' },
    });

    expect(data).toEqual({ ok: true });
    expect(fetch.mock.calls[0][0]).toBe('http://api.test/poc/templates/a%20b?page=2');
  });

  it('manda JSON en POST y PUT', async () => {
    fetch.mockResolvedValue(jsonResponse(200, {}));

    await apiClient.post('/items', { name: 'uno' });
    await apiClient.put('/items/1', { name: 'dos' });

    const [, postInit] = fetch.mock.calls[0];
    expect(postInit.method).toBe('POST');
    expect(postInit.body).toBe('{"name":"uno"}');
    expect(postInit.headers['Content-Type']).toBe('application/json');
    expect(fetch.mock.calls[1][1].method).toBe('PUT');
  });

  it('manda FormData sin forzar Content-Type', async () => {
    fetch.mockResolvedValue(jsonResponse(200, {}));
    const form = new FormData();
    form.append('file', new Blob(['x']), 'foto.jpg');

    await apiClient.post('/upload', form);

    const [, init] = fetch.mock.calls[0];
    expect(init.body).toBe(form);
    expect(init.headers['Content-Type']).toBeUndefined();
  });

  it('regresa null cuando la respuesta es 204', async () => {
    fetch.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiClient.delete('/items/1')).resolves.toBeNull();
  });

  it('convierte el error del backend en ApiError', async () => {
    fetch.mockResolvedValue(
      jsonResponse(422, {
        error: {
          code: 'validation_error',
          message: 'Faltan campos obligatorios.',
          details: [{ code: 'required', message: 'Obligatorio', field_id: 'f_001' }],
        },
      }),
    );

    const error = await apiClient.get('/x').catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.isValidationError).toBe(true);
    expect(error.message).toBe('Faltan campos obligatorios.');
    expect(error.details[0].field_id).toBe('f_001');
  });

  it('usa un mensaje entendible si el backend no manda cuerpo', async () => {
    fetch.mockResolvedValue(new Response('<html>', { status: 503 }));

    const error = await apiClient.get('/x').catch((e) => e);

    expect(error.status).toBe(503);
    expect(error.message).toContain('ocupado');
  });

  it('convierte una falla de red en ApiError de red', async () => {
    fetch.mockRejectedValue(new TypeError('Failed to fetch'));

    const error = await apiClient.get('/x').catch((e) => e);

    expect(error.code).toBe(API_ERROR_CODES.NETWORK);
    expect(error.status).toBe(0);
  });

  it('convierte un timeout en ApiError de timeout', async () => {
    fetch.mockRejectedValue(new DOMException('timeout', 'TimeoutError'));

    const error = await apiClient.get('/x').catch((e) => e);

    expect(error.code).toBe(API_ERROR_CODES.TIMEOUT);
  });

  it('respeta la cancelación de quien llamó', async () => {
    const controller = new AbortController();
    controller.abort();
    fetch.mockRejectedValue(new DOMException('aborted', 'AbortError'));

    const error = await apiClient.get('/x', { signal: controller.signal }).catch((e) => e);

    expect(error).not.toBeInstanceOf(ApiError);
    expect(error.name).toBe('AbortError');
  });

  it('avisa si falta un parámetro de ruta', async () => {
    await expect(apiClient.get('/poc/templates/{id}')).rejects.toThrow('Falta el parámetro "id"');
  });
});
