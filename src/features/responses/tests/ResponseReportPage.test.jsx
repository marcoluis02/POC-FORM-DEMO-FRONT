import { screen } from "@testing-library/react";
import { getTemplateVersion } from "@/features/templates/api/templatesApi";
import { ApiError } from "@/shared/api/ApiError";
import { renderWithRouter } from "@/shared/tests/renderWithRouter";
import { getResponse } from "../api/responsesApi";
import ResponseReportPage from "../pages/ResponseReportPage/ResponseReportPage";
import definition from "./fixtures/inspectionDefinition.json";

vi.mock("../api/responsesApi", () => ({
  getResponse: vi.fn(),
}));

vi.mock("@/features/templates/api/templatesApi", () => ({
  getTemplateVersion: vi.fn(),
}));

const RESPONSE_ID = "c428d024-f8bb-4cf3-98df-e77fe0fb2bee";
const TEMPLATE_ID = "97787fca-eee7-4b42-92fd-b1d8c59062e3";
const EVIDENCE = {
  id: "a-1",
  field_id: "f_001",
  filename: "filtro.png",
  mime_type: "image/png",
  created_at: "2026-09-25T12:00:00Z",
  url: "https://s3.test/filtro.png?firma=1",
};
const PHOTO = {
  ...EVIDENCE,
  id: "a-2",
  field_id: "f_007",
  filename: "equipo.png",
  url: "https://s3.test/equipo.png?firma=1",
};

function response(changes = {}) {
  return {
    id: RESPONSE_ID,
    template_id: TEMPLATE_ID,
    template_version_id: "version-1",
    version: 1,
    name: "Inspección turno A",
    status: "draft",
    values: {},
    attachments: [],
    submitted_at: null,
    created_at: "2026-09-25T10:00:00Z",
    updated_at: "2026-09-25T11:00:00Z",
    ...changes,
  };
}

function renderPage(currentResponse = response()) {
  getResponse.mockResolvedValue(currentResponse);
  getTemplateVersion.mockResolvedValue({
    id: "version-1",
    version: 1,
    definition,
  });
  return renderWithRouter(
    [
      {
        path: "/responses/:responseId/report",
        element: <ResponseReportPage />,
      },
      { path: "/responses/:responseId", element: <p>Formulario</p> },
      { path: "/templates/:templateId", element: <p>Plantilla</p> },
    ],
    { initialPath: `/responses/${RESPONSE_ID}/report` },
  );
}

describe("ResponseReportPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("muestra un borrador y señala claramente las preguntas sin contestar", async () => {
    renderPage(
      response({
        values: { f_001: "no", f_002: 70, f_003: false },
        attachments: [EVIDENCE],
      }),
    );

    expect(
      await screen.findByRole("heading", {
        name: "Inspección turno A",
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();
    expect(screen.getByText("Versión 1")).toBeInTheDocument();
    expect(screen.getByText(/Plantilla:/)).toHaveTextContent(
      "Inspección completa",
    );
    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.getByText("70 °F")).toBeInTheDocument();
    expect(screen.getByText("No marcado")).toBeInTheDocument();
    expect(screen.getAllByText("Sin contestar").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Este reporte corresponde a un borrador/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Evidencia: filtro.png" }),
    ).toBeInTheDocument();
    expect(getTemplateVersion).toHaveBeenCalledWith(
      TEMPLATE_ID,
      1,
      expect.anything(),
    );
  });

  it("muestra reporte enviado con evidencia y la versión exacta de la respuesta", async () => {
    renderPage(
      response({
        status: "submitted",
        submitted_at: "2026-09-25T12:30:00Z",
        values: {
          f_001: "yes",
          f_002: 72.5,
          f_003: true,
          f_004: "Marco",
          f_005: "Sin novedad",
          f_006: "2026-09-25",
        },
        attachments: [EVIDENCE, PHOTO],
      }),
    );

    expect(await screen.findByText("Enviado")).toBeInTheDocument();
    expect(screen.getByText("Sí")).toBeInTheDocument();
    expect(screen.getByText("72.5 °F")).toBeInTheDocument();
    expect(screen.getByText("Sí, marcado")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Evidencia: filtro.png" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Evidencia: equipo.png" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Firma no disponible en esta POC."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/versión exacta con la que se envió/),
    ).toBeInTheDocument();
    expect(getTemplateVersion).toHaveBeenCalledWith(
      TEMPLATE_ID,
      1,
      expect.anything(),
    );
  });

  it("no usa latest_version: si la respuesta es v1 pide exactamente v1", async () => {
    renderPage(response({ version: 1 }));

    await screen.findByRole("heading", { name: "Inspección turno A" });
    expect(getTemplateVersion).toHaveBeenCalledTimes(1);
    expect(getTemplateVersion.mock.calls[0][1]).toBe(1);
  });

  it("muestra un estado recuperable si no puede cargar la versión histórica", async () => {
    getResponse.mockResolvedValue(response());
    getTemplateVersion.mockRejectedValue(
      new ApiError({
        status: 503,
        code: "database_unavailable",
        message: "Servidor ocupado.",
      }),
    );
    renderWithRouter(
      [
        {
          path: "/responses/:responseId/report",
          element: <ResponseReportPage />,
        },
      ],
      { initialPath: `/responses/${RESPONSE_ID}/report` },
    );

    expect(
      await screen.findByText(
        "No pudimos cargar la versión usada en este reporte",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Servidor ocupado.")).toBeInTheDocument();
  });
});
