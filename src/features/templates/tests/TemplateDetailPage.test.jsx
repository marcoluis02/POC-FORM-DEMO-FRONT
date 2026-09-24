import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getImport } from '@/features/imports/api/importsApi';
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
