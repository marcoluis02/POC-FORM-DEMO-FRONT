import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getImport } from "@/shared/api/importsApi";
import { renderWithRouter } from "@/shared/tests/renderWithRouter";
import ImportStatusPage from "../pages/ImportStatusPage/ImportStatusPage";

vi.mock("@/shared/api/importsApi", () => ({
  createImport: vi.fn(),
  getImport: vi.fn(),
}));

const IMPORT_ID = "880de87b-9acd-4acf-a14e-27327668e66e";
const baseImport = {
  id: IMPORT_ID,
  original_filename: "checklist.pdf",
  mime_type: "application/pdf",
  original_url: "https://files.test/checklist.pdf",
  warnings: [],
  draft_json: null,
};

function renderPage() {
  return renderWithRouter(
    [
      { path: "/imports/:importId", element: <ImportStatusPage /> },
      { path: "/imports/new", element: <p>Nueva importación</p> },
      { path: "/templates/new", element: <p>Revisión IA</p> },
    ],
    { initialPath: `/imports/${IMPORT_ID}` },
  );
}

describe("ImportStatusPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("muestra el estado received mientras espera al worker", async () => {
    getImport.mockResolvedValue({ ...baseImport, status: "received" });
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Documento recibido" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Preparando análisis...")).toBeInTheDocument();
  });

  it("muestra el estado processing", async () => {
    getImport.mockResolvedValue({ ...baseImport, status: "processing" });
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Analizando documento" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Analizando documento...")).toBeInTheDocument();
    expect(screen.getByText('Identificando secciones y preguntas.')).toBeInTheDocument();
  });

  it("detiene el flujo en failed y permite comenzar otra importación", async () => {
    const user = userEvent.setup();
    getImport.mockResolvedValue({
      ...baseImport,
      status: "failed",
      error_code: "document_unreadable",
      error_message:
        "No fue posible extraer un formulario útil de este documento.",
    });
    const { router } = renderPage();

    expect(
      await screen.findByText(
        "No fue posible extraer un formulario útil de este documento.",
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("link", { name: "Subir otro archivo" }));
    expect(router.state.location.pathname).toBe("/imports/new");
  });

  it("muestra un error seguro de IA sin exponer detalles internos", async () => {
    getImport.mockResolvedValue({
      ...baseImport,
      status: "failed",
      error_code: "ai_provider_error",
      error_message: "No fue posible analizar el documento. Intenta de nuevo.",
    });
    renderPage();

    expect(
      await screen.findByText(
        "No fue posible analizar el documento. Intenta de nuevo.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("ai_provider_error")).not.toBeInTheDocument();
  });

  it("al llegar a requires_review abre la revisión conservando importId", async () => {
    getImport.mockResolvedValue({
      ...baseImport,
      status: "requires_review",
      draft_json: {
        schema_version: 1,
        title: "Checklist",
        sections: [
          {
            id: "s_001",
            title: "General",
            position: 1,
            fields: [
              {
                id: "f_001",
                type: "short_text",
                label: "Técnico",
                required: false,
                position: 1,
                allow_evidence: false,
              },
            ],
          },
        ],
      },
    });
    const { router } = renderPage();

    expect(await screen.findByText("Revisión IA")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/templates/new");
    expect(router.state.location.search).toBe(`?importId=${IMPORT_ID}`);
  });
});
