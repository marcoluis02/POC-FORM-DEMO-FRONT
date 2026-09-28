import { env } from "@/app/config/env";
import { apiClient } from "@/shared/api/apiClient";
import {
  createResponse,
  deleteAttachment,
  getResponse,
  listResponses,
  saveResponseDraft,
  submitResponse,
  uploadAttachment,
} from "../api/responsesApi";

vi.mock("@/shared/api/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const RESPONSE_ID = "c428d024-f8bb-4cf3-98df-e77fe0fb2bee";
const TEMPLATE_ID = "97787fca-eee7-4b42-92fd-b1d8c59062e3";
const TEMPLATE_VERSION_ID = "8c35f0cf-2ad9-4b77-a58f-7aa8a36d1fd0";

describe("responsesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea respuesta con template_version_id exacto, nombre e idempotency key", async () => {
    apiClient.post.mockResolvedValue({ id: RESPONSE_ID });

    await createResponse(TEMPLATE_VERSION_ID, "Visita A", {
      idempotencyKey: "response-create-1",
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      env.endpoints.responses,
      { template_version_id: TEMPLATE_VERSION_ID, name: "Visita A" },
      { headers: { "Idempotency-Key": "response-create-1" } },
    );
  });

  it("consulta la respuesta y el listado de una plantilla", async () => {
    const controller = new AbortController();
    apiClient.get.mockResolvedValue({});

    await getResponse(RESPONSE_ID, { signal: controller.signal });
    await listResponses(TEMPLATE_ID, {
      cursor: "next-1",
      signal: controller.signal,
    });

    expect(apiClient.get).toHaveBeenNthCalledWith(
      1,
      env.endpoints.responseDetail,
      {
        pathParams: { responseId: RESPONSE_ID },
        signal: controller.signal,
      },
    );
    expect(apiClient.get).toHaveBeenNthCalledWith(2, env.endpoints.responses, {
      query: { template_id: TEMPLATE_ID, cursor: "next-1" },
      signal: controller.signal,
    });
  });

  it("guarda draft y submit sin cambiar la forma de values", async () => {
    const body = { name: "Visita A", values: { f_001: "yes", f_002: 35 } };
    apiClient.put.mockResolvedValue({});
    apiClient.post.mockResolvedValue({});

    await saveResponseDraft(RESPONSE_ID, body, { idempotencyKey: "draft-1" });
    await submitResponse(RESPONSE_ID, body, { idempotencyKey: "submit-1" });

    expect(apiClient.put).toHaveBeenCalledWith(
      env.endpoints.responseDetail,
      body,
      {
        pathParams: { responseId: RESPONSE_ID },
        headers: { "Idempotency-Key": "draft-1" },
      },
    );
    expect(apiClient.post).toHaveBeenCalledWith(
      env.endpoints.responseSubmit,
      body,
      {
        pathParams: { responseId: RESPONSE_ID },
        headers: { "Idempotency-Key": "submit-1" },
      },
    );
  });

  it("sube evidencia multipart con field_id, timeout e idempotency key", async () => {
    const file = new File(["foto"], "equipo.png", { type: "image/png" });
    apiClient.post.mockResolvedValue({ id: "attachment-1" });

    await uploadAttachment(RESPONSE_ID, "f_007", file, {
      idempotencyKey: "photo-1",
    });

    const [path, body, options] = apiClient.post.mock.calls[0];
    expect(path).toBe(env.endpoints.responseAttachments);
    expect(body).toBeInstanceOf(FormData);
    expect(body.get("field_id")).toBe("f_007");
    expect(body.get("file")).toBe(file);
    expect(options).toEqual({
      pathParams: { responseId: RESPONSE_ID },
      headers: { "Idempotency-Key": "photo-1" },
      timeoutMs: env.uploadTimeoutMs,
    });
  });

  it("elimina evidencia usando el attachment exacto", async () => {
    apiClient.delete.mockResolvedValue({ id: "attachment-1" });

    await deleteAttachment(RESPONSE_ID, "attachment-1", {
      idempotencyKey: "delete-1",
    });

    expect(apiClient.delete).toHaveBeenCalledWith(
      env.endpoints.responseAttachmentDetail,
      {
        pathParams: { responseId: RESPONSE_ID, attachmentId: "attachment-1" },
        headers: { "Idempotency-Key": "delete-1" },
      },
    );
  });
});
