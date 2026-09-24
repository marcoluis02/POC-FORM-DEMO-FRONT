import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getImport } from '@/features/imports/api/importsApi';
import { createResponse, listResponses } from '@/features/responses/api/responsesApi';
import { renderWithRouter } from '@/shared/tests/renderWithRouter';
import { getTemplate, getTemplateVersion } from '../api/templatesApi';
import TemplateDetailPage from '../pages/TemplateDetailPage/TemplateDetailPage';
import maintenanceTemplate from './fixtures/maintenanceTemplate.json';

vi.mock('../api/templatesApi', () => ({
  listTemplates: vi.fn(),
  getTemplate: vi.fn(),
  getTemplateVersion: vi.fn(),
  createTemplate: vi.fn(),
  createTemplateVersion: vi.fn(),
}));

vi.mock('@/features/imports/api/importsApi', () => ({
  createImport: vi.fn(),
  getImport: vi.fn(),
}));

vi.mock('@/features/responses/api/responsesApi', () => ({
  listResponses: vi.fn(),
  createResponse: vi.fn(),
}));

const EMPTY_PAGE = { items: [], next_cursor: null };

beforeEach(() => {
  listResponses.mockResolvedValue(EMPTY_PAGE);
});

const TEMPLATE_ID = '97787fca-eee7-4b42-92fd-b1d8c59062e3';
const IMPORT_ID = '5d1f4a7e-2b9c-4c55-8f0e-1a2b3c4d5e6f';
const storedImport = {
  id: IMPORT_ID,
  status: 'received',
  original_filename: 'revision.png',
  mime_type: 'image/png',
  created_at: '2026-09-24T18:20:00Z',
  original_url: 'https://s3.test/revision.png?firma=1',
};
const V2_DEFINITION = { ...maintenanceTemplate, title: 'Revisión v2' };

const templateV2 = {
  id: TEMPLATE_ID,
  name: 'Revisión v2',
  status: 'active',
  latest_version: 2,
  created_at: '2026-09-24T18:22:17Z',
  updated_at: '2026-09-24T18:30:00Z',
  current_version: {
    id: 'version-2',
    template_id: TEMPLATE_ID,
    version: 2,
    definition: V2_DEFINITION,
    source_import_id: null,
    created_at: '2026-09-24T18:30:00Z',
  },
};

function withDocument(template) {
  return {
    ...template,
    current_version: { ...template.current_version, source_import_id: IMPORT_ID },
  };
}

function renderDetail(initialPath = `/templates/${TEMPLATE_ID}`) {
  return renderWithRouter(
    [
      { path: '/templates/:templateId', element: <TemplateDetailPage /> },
      { path: '/templates/:templateId/edit', element: <p>Editor</p> },
      { path: '/responses/:responseId', element: <p>Pantalla para contestar</p> },
    ],
    { initialPath },
  );
}

describe('TemplateDetailPage', () => {
  it('muestra la plantilla con sus preguntas', async () => {
    getTemplate.mockResolvedValue(templateV2);
    renderDetail();

    expect(
      await screen.findByRole('heading', { name: 'Revisión v2', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByText('¿Se limpió el filtro?')).toBeInTheDocument();
    expect(screen.getByText('Unidad: °F')).toBeInTheDocument();
    expect(screen.getByText('Obligatoria')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Editar plantilla' })).toHaveAttribute(
      'href',
      `/templates/${TEMPLATE_ID}/edit`,
    );
    expect(getTemplateVersion).not.toHaveBeenCalled();
  });

  it('permite consultar una versión anterior', async () => {
    const user = userEvent.setup();
    getTemplate.mockResolvedValue(templateV2);
    getTemplateVersion.mockResolvedValue({
      id: 'version-1',
      template_id: TEMPLATE_ID,
      version: 1,
      definition: maintenanceTemplate,
      created_at: '2026-09-24T18:22:17Z',
    });
    const { router } = renderDetail();

    await user.selectOptions(await screen.findByLabelText('Ver versión'), '1');

    expect(await screen.findByText(/Estás viendo la versión 1/)).toBeInTheDocument();
    expect(getTemplateVersion).toHaveBeenCalledWith(TEMPLATE_ID, 1, expect.anything());
    expect(router.state.location.search).toBe('?version=1');
  });

  it('una versión inválida en la URL muestra la actual', async () => {
    getTemplate.mockResolvedValue(templateV2);
    renderDetail(`/templates/${TEMPLATE_ID}?version=99`);

    expect(await screen.findByLabelText('Ver versión')).toHaveValue('2');
    expect(getTemplateVersion).not.toHaveBeenCalled();
  });

  it('sin documento original no muestra la sección', async () => {
    getTemplate.mockResolvedValue(templateV2);
    renderDetail();

    await screen.findByRole('heading', { name: 'Revisión v2', level: 1 });
    expect(screen.queryByText('Documento original')).not.toBeInTheDocument();
  });

  it('una versión anterior sin foto no muestra la foto de la versión actual', async () => {
    const user = userEvent.setup();
    getTemplate.mockResolvedValue(withDocument(templateV2));
    getTemplateVersion.mockResolvedValue({
      id: 'version-1',
      template_id: TEMPLATE_ID,
      version: 1,
      definition: maintenanceTemplate,
      source_import_id: null,
      created_at: '2026-09-24T18:22:17Z',
    });
    renderDetail();

    expect(await screen.findByText('Documento original')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Ver versión'), '1');

    expect(await screen.findByText(/Estás viendo la versión 1/)).toBeInTheDocument();
    expect(screen.queryByText('Documento original')).not.toBeInTheDocument();
  });

  it('carga el documento original solo cuando el usuario lo pide', async () => {
    const user = userEvent.setup();
    getTemplate.mockResolvedValue(withDocument(templateV2));
    getImport.mockResolvedValue(storedImport);
    renderDetail();

    const showButton = await screen.findByRole('button', { name: 'Ver documento original' });
    expect(getImport).not.toHaveBeenCalled();

    await user.click(showButton);

    const image = await screen.findByRole('img', { name: 'Documento original: revision.png' });
    expect(image).toHaveAttribute('src', storedImport.original_url);
    expect(getImport).toHaveBeenCalledWith(IMPORT_ID, expect.anything());
  });

  describe('formularios llenados', () => {
    const summary = (id, status, name = `Llenado ${id}`) => ({
      id,
      template_id: TEMPLATE_ID,
      version: 2,
      name,
      status,
      submitted_at: status === 'submitted' ? '2026-09-24T19:10:00Z' : null,
      created_at: '2026-09-24T19:00:00Z',
      updated_at: '2026-09-24T19:05:00Z',
    });

    it('muestra el listado con su estado y pide la siguiente página', async () => {
      const user = userEvent.setup();
      getTemplate.mockResolvedValue(templateV2);
      listResponses
        .mockResolvedValueOnce({
          items: [summary('r-1', 'draft', 'Visita mañana')],
          next_cursor: 'pagina-2',
        })
        .mockResolvedValueOnce({
          items: [summary('r-2', 'submitted', 'Visita tarde')],
          next_cursor: null,
        });
      renderDetail();

      expect(await screen.findByText('Visita mañana')).toBeInTheDocument();
      expect(screen.getByText('Borrador')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Ver más formularios' }));

      expect(await screen.findByText('Visita tarde')).toBeInTheDocument();
      expect(screen.getByText('Enviado')).toBeInTheDocument();
      expect(listResponses).toHaveBeenLastCalledWith(
        TEMPLATE_ID,
        expect.objectContaining({ cursor: 'pagina-2' }),
      );
      expect(screen.queryByRole('button', { name: 'Ver más formularios' })).not.toBeInTheDocument();
    });

    it('sin formularios muestra el aviso', async () => {
      getTemplate.mockResolvedValue(templateV2);
      renderDetail();

      expect(
        await screen.findByText('Todavía no se ha llenado ningún formulario'),
      ).toBeInTheDocument();
    });

    it('llenar formulario pide nombre, lo crea y abre la pantalla para contestar', async () => {
      const user = userEvent.setup();
      getTemplate.mockResolvedValue(templateV2);
      createResponse.mockResolvedValue({
        ...summary('r-9', 'draft', 'Visita Centro'),
        values: {},
        attachments: [],
      });
      const { router } = renderDetail();

      await user.click(await screen.findByRole('button', { name: '+ Llenar formulario' }));
      expect(await screen.findByLabelText(/Nombre de este llenado/)).toBeInTheDocument();
      await user.type(screen.getByLabelText(/Nombre de este llenado/), 'Visita Centro');
      await user.click(screen.getByRole('button', { name: 'Sí, empezar' }));

      expect(await screen.findByText('Pantalla para contestar')).toBeInTheDocument();
      expect(router.state.location.pathname).toBe('/responses/r-9');
      expect(createResponse).toHaveBeenCalledWith(
        TEMPLATE_ID,
        'Visita Centro',
        expect.objectContaining({ idempotencyKey: expect.any(String) }),
      );
    });

    it('si cancela no crea nada', async () => {
      const user = userEvent.setup();
      getTemplate.mockResolvedValue(templateV2);
      renderDetail();

      await user.click(await screen.findByRole('button', { name: '+ Llenar formulario' }));
      await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

      expect(createResponse).not.toHaveBeenCalled();
    });
  });

  it('si la URL firmada venció pide una nueva al reintentar', async () => {
    const user = userEvent.setup();
    const renewed = { ...storedImport, original_url: 'https://s3.test/revision.png?firma=nueva' };
    getTemplate.mockResolvedValue(withDocument(templateV2));
    getImport.mockResolvedValueOnce(storedImport).mockResolvedValueOnce(renewed);
    renderDetail();

    await user.click(await screen.findByRole('button', { name: 'Ver documento original' }));
    fireEvent.error(await screen.findByRole('img', { name: /Documento original/ }));
    await user.click(await screen.findByRole('button', { name: 'Intentar de nuevo' }));

    expect(await screen.findByRole('img', { name: /Documento original/ })).toHaveAttribute(
      'src',
      renewed.original_url,
    );
  });
});
