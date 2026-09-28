import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getTemplateVersion } from "@/features/templates/api/templatesApi";
import { ApiError } from "@/shared/api/ApiError";
import { renderWithRouter } from "@/shared/tests/renderWithRouter";
import {
  deleteAttachment,
  getResponse,
  saveResponseDraft,
  submitResponse,
  uploadAttachment,
} from "../api/responsesApi";
import { useDraftAutosave } from "../hooks/useDraftAutosave";
import ResponseFillPage from "../pages/ResponseFillPage/ResponseFillPage";
import definition from "./fixtures/inspectionDefinition.json";

vi.mock("../api/responsesApi", () => ({
  getResponse: vi.fn(),
  saveResponseDraft: vi.fn(),
  submitResponse: vi.fn(),
  uploadAttachment: vi.fn(),
  deleteAttachment: vi.fn(),
}));

vi.mock("../hooks/useDraftAutosave", () => ({
  // Apagado aquí: el autoguardado se prueba en useDraftAutosave.test.js
  useDraftAutosave: vi.fn(),
}));

vi.mock("@/features/templates/api/templatesApi", () => ({
  getTemplateVersion: vi.fn(),
}));

const RESPONSE_ID = "c428d024-f8bb-4cf3-98df-e77fe0fb2bee";
const TEMPLATE_ID = "97787fca-eee7-4b42-92fd-b1d8c59062e3";
const PHOTO = {
  id: "a-1",
  field_id: "f_007",
  filename: "equipo.png",
  mime_type: "image/png",
  created_at: "2026-09-24T19:02:00Z",
  url: "https://s3.test/equipo.png?firma=1",
};

function buildResponse(changes = {}) {
  return {
    id: RESPONSE_ID,
    template_id: TEMPLATE_ID,
    template_version_id: "version-1",
    version: 1,
    name: "Visita de prueba",
    status: "draft",
    values: {},
    attachments: [],
    submitted_at: null,
    created_at: "2026-09-24T19:00:00Z",
    updated_at: "2026-09-24T19:00:00Z",
    ...changes,
  };
}

function renderPage(
  response = buildResponse(),
  currentDefinition = definition,
) {
  getResponse.mockResolvedValue(response);
  getTemplateVersion.mockResolvedValue({
    id: "version-1",
    version: 1,
    definition: currentDefinition,
  });
  return renderWithRouter(
    [
      { path: "/responses/:responseId", element: <ResponseFillPage /> },
      { path: "/responses/:responseId/report", element: <p>Reporte final</p> },
      {
        path: "/templates/:templateId",
        element: <p>Detalle de la plantilla</p>,
      },
    ],
    { initialPath: `/responses/${RESPONSE_ID}` },
  );
}

async function confirmWith(user, label) {
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: label }));
}

describe("ResponseFillPage", () => {
  it("arma el formulario con la versión con la que se empezó", async () => {
    renderPage(buildResponse({ values: { f_001: "no", f_002: 70 } }));

    expect(
      await screen.findByRole("heading", {
        name: "Contestar formulario",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de este llenado/)).toHaveValue(
      "Visita de prueba",
    );
    expect(
      screen.getByText(/Plantilla: Inspección completa/),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "No" })).toBeChecked();
    expect(screen.getByLabelText(/Temperatura final/)).toHaveValue(70);
    expect(
      screen.getByText("Firma no disponible en esta POC."),
    ).toBeInTheDocument();
    expect(screen.getByText("Foto de evidencia")).toBeInTheDocument();
    expect(getTemplateVersion).toHaveBeenCalledWith(
      TEMPLATE_ID,
      1,
      expect.anything(),
    );
  });

  it("no muestra botón de guardar porque el borrador se guarda solo", async () => {
    renderPage();

    expect(
      await screen.findByRole("button", { name: "Enviar formulario" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Guardar ahora" }),
    ).not.toBeInTheDocument();
  });

  it("al enviar incompleto marca las preguntas y no llama al servidor", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Enviar formulario" }),
    );

    expect(
      await screen.findByText("Hay 4 pregunta(s) por revisar"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Foto del equipo: Agrega al menos una foto."),
    ).toBeInTheDocument();
    expect(screen.getByText("Debes marcar esta casilla.")).toBeInTheDocument();
    expect(submitResponse).not.toHaveBeenCalled();
  });

  it("al enviar completo abre el reporte final", async () => {
    const user = userEvent.setup();
    const { router } = renderPage(
      buildResponse({
        values: { f_001: "yes", f_003: true, f_004: "Juan" },
        attachments: [PHOTO],
      }),
    );
    submitResponse.mockImplementation(async (_, body) =>
      buildResponse({
        ...body,
        attachments: [PHOTO],
        status: "submitted",
        submitted_at: "2026-09-24T19:10:00Z",
      }),
    );

    await user.click(
      await screen.findByRole("button", { name: "Enviar formulario" }),
    );
    await confirmWith(user, "Sí, enviar");

    expect(await screen.findByText("Reporte final")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(
      `/responses/${RESPONSE_ID}/report`,
    );
  });

  it("si se abre directamente un enviado queda solo lectura y ofrece el reporte", async () => {
    renderPage(
      buildResponse({
        status: "submitted",
        submitted_at: "2026-09-24T19:10:00Z",
        values: { f_001: "yes", f_003: true, f_004: "Juan" },
        attachments: [PHOTO],
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Visita de prueba",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Este formulario ya fue enviado. Solo se puede consultar.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Enviar formulario" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Nombre de este llenado/),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del técnico/)).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Quitar foto" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver reporte" })).toHaveAttribute(
      "href",
      `/responses/${RESPONSE_ID}/report`,
    );
  });

  it("muestra en cada pregunta los errores que regresa el servidor", async () => {
    const user = userEvent.setup();
    renderPage(
      buildResponse({
        values: { f_001: "yes", f_003: true, f_004: "Juan" },
        attachments: [PHOTO],
      }),
    );
    submitResponse.mockRejectedValue(
      new ApiError({
        status: 422,
        code: "response_incomplete",
        message: "Faltan preguntas obligatorias por contestar.",
        details: [
          {
            code: "required",
            message: "Falta este dato.",
            field_id: "values.f_004",
          },
        ],
      }),
    );

    await user.click(
      await screen.findByRole("button", { name: "Enviar formulario" }),
    );
    await confirmWith(user, "Sí, enviar");

    expect(
      await screen.findByText("Nombre del técnico: Falta este dato."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Faltan preguntas obligatorias por contestar."),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(document.activeElement).toHaveAttribute("id", "field-f_004"),
    );
  });

  it("sube una foto con confirmación y la muestra", async () => {
    const user = userEvent.setup();
    renderPage();
    uploadAttachment.mockResolvedValue(PHOTO);
    const file = new File(["foto"], "equipo.png", { type: "image/png" });

    const [photoInput] = await screen.findAllByLabelText("Tomar o elegir foto");
    await user.upload(photoInput, file);
    await confirmWith(user, "Sí, subir");

    expect(await screen.findByText("Foto guardada.")).toBeInTheDocument();
    expect(uploadAttachment).toHaveBeenCalledWith(
      RESPONSE_ID,
      "f_001",
      file,
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
    expect(
      screen.getByRole("img", { name: "Foto: equipo.png" }),
    ).toBeInTheDocument();
  });

  it("quita una foto con confirmación", async () => {
    const user = userEvent.setup();
    renderPage(buildResponse({ attachments: [PHOTO] }));
    deleteAttachment.mockResolvedValue({ id: PHOTO.id });

    await user.click(
      await screen.findByRole("button", { name: "Quitar foto" }),
    );
    await confirmWith(user, "Sí, quitar");

    expect(await screen.findByText("Foto quitada.")).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Foto: equipo.png" }),
    ).not.toBeInTheDocument();
  });

  it("la captura de evidencia solicita cámara trasera en móvil", async () => {
    renderPage();

    const photoInputs = await screen.findAllByLabelText("Tomar o elegir foto");
    expect(photoInputs.length).toBeGreaterThan(0);
    photoInputs.forEach((input) => {
      expect(input).toHaveAttribute("capture", "environment");
      expect(input).toHaveAttribute(
        "accept",
        expect.stringContaining("image/jpeg"),
      );
    });
  });

  it("renderiza select usando las opciones de la versión", async () => {
    const user = userEvent.setup();
    const selectDefinition = structuredClone(definition);
    selectDefinition.sections[0].fields.push({
      id: "f_009",
      type: "select",
      label: "Estado general",
      required: false,
      position: 7,
      allow_evidence: false,
      options: [
        { value: "ok", label: "Buen estado" },
        { value: "bad", label: "Requiere atención" },
      ],
    });
    renderPage(buildResponse(), selectDefinition);

    const option = await screen.findByRole("radio", { name: "Buen estado" });
    await user.click(option);
    expect(option).toBeChecked();
  });

  it("si el autosave recibe 422 conserva lo escrito y marca el campo", async () => {
    const user = userEvent.setup();
    saveResponseDraft.mockRejectedValue(
      new ApiError({
        status: 422,
        code: "invalid_response_value",
        message: "Hay una respuesta inválida.",
        details: [
          {
            code: "invalid",
            message: "Revisa este valor.",
            field_id: "values.f_004",
          },
        ],
      }),
    );
    renderPage(buildResponse({ values: { f_004: "Juan" } }));

    const technician = await screen.findByLabelText(/Nombre del técnico/);
    await user.clear(technician);
    await user.type(technician, "Marco");

    const config = useDraftAutosave.mock.calls.at(-1)[0];
    await act(async () => {
      await config.onSave();
    });

    expect(technician).toHaveValue("Marco");
    expect(
      await screen.findByText("Nombre del técnico: Revisa este valor."),
    ).toBeInTheDocument();
    expect(screen.getByText("Hay una respuesta inválida.")).toBeInTheDocument();
  });

  it("formulario inexistente muestra el aviso", async () => {
    getResponse.mockRejectedValue(
      new ApiError({
        status: 404,
        code: "not_found",
        message: "No encontramos este formulario.",
      }),
    );
    renderWithRouter(
      [{ path: "/responses/:responseId", element: <ResponseFillPage /> }],
      {
        initialPath: `/responses/${RESPONSE_ID}`,
      },
    );

    expect(
      await screen.findByText("No encontramos este formulario"),
    ).toBeInTheDocument();
  });
});
