import { env } from '@/app/config/env';
import { apiClient } from '@/shared/api/apiClient';
import { createImport, getImport } from '@/shared/api/importsApi';

vi.mock('@/shared/api/apiClient', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

const IMPORT_ID = '880de87b-9acd-4acf-a14e-27327668e66e';
const importPayload = {
  id: IMPORT_ID,
  status: 'received',
  original_filename: 'checklist.png',
  mime_type: 'image/png',
  page_count: 1,
  warnings: [],
  draft_json: null,
  original_url: 'https://files.test/checklist.png',
};

describe('importsApi', () => {
  it('POST /poc/imports manda multipart, idempotency key y timeout de upload', async () => {
    const file = new File(['foto'], 'checklist.png', { type: 'image/png' });
    apiClient.post.mockResolvedValue(importPayload);

    const created = await createImport(file, { idempotencyKey: 'import-key-1' });

    expect(created.id).toBe(IMPORT_ID);
    const [path, body, options] = apiClient.post.mock.calls[0];
    expect(path).toBe(env.endpoints.imports);
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('file')).toBe(file);
    expect(options.headers).toEqual({ 'Idempotency-Key': 'import-key-1' });
    expect(options.timeoutMs).toBe(env.uploadTimeoutMs);
  });

  it('GET /poc/imports/{id} manda importId y signal', async () => {
    const controller = new AbortController();
    apiClient.get.mockResolvedValue(importPayload);

    await getImport(IMPORT_ID, { signal: controller.signal });

    expect(apiClient.get).toHaveBeenCalledWith(env.endpoints.importDetail, {
      pathParams: { importId: IMPORT_ID },
      signal: controller.signal,
    });
  });
});
