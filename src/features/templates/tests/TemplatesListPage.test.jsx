import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ApiError } from '@/shared/api/ApiError';
import { renderWithRouter } from '@/shared/tests/renderWithRouter';
import { listTemplates } from '../api/templatesApi';
import TemplatesListPage from '../pages/TemplatesListPage/TemplatesListPage';

vi.mock('../api/templatesApi', () => ({
  listTemplates: vi.fn(),
  getTemplate: vi.fn(),
  getTemplateVersion: vi.fn(),
  createTemplate: vi.fn(),
  createTemplateVersion: vi.fn(),
}));

function summary(id, name, version = 1) {
  return {
    id,
    name,
    status: 'active',
    latest_version: version,
    created_at: '2026-09-24T18:22:17Z',
    updated_at: '2026-09-24T18:22:17Z',
  };
}

function renderList() {
  return renderWithRouter(
    [
      { path: '/templates', element: <TemplatesListPage /> },
      { path: '/templates/:templateId', element: <p>Detalle</p> },
    ],
    { initialPath: '/templates' },
  );
}

describe('TemplatesListPage', () => {
  it('muestra las plantillas y carga más páginas con el cursor', async () => {
    const user = userEvent.setup();
    listTemplates
      .mockResolvedValueOnce({
        items: [summary('a', 'Revisión de mantenimiento', 2)],
        next_cursor: 'c1',
      })
      .mockResolvedValueOnce({
        items: [summary('b', 'Inspección de seguridad')],
        next_cursor: null,
      });
    renderList();

    const firstItem = await screen.findByRole('link', { name: /Revisión de mantenimiento/ });
    expect(firstItem).toHaveAttribute('href', '/templates/a');
    expect(screen.getByText('Versión 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ver más plantillas' }));

    expect(
      await screen.findByRole('link', { name: /Inspección de seguridad/ }),
    ).toBeInTheDocument();
    expect(listTemplates).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'c1' }));
    expect(screen.queryByRole('button', { name: 'Ver más plantillas' })).not.toBeInTheDocument();
  });

  it('invita a crear la primera plantilla si no hay ninguna', async () => {
    listTemplates.mockResolvedValue({ items: [], next_cursor: null });
    renderList();

    expect(await screen.findByText('Todavía no hay plantillas')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '+ Crear plantilla' })).toHaveLength(2);
  });

  it('muestra el error y permite reintentar', async () => {
    const user = userEvent.setup();
    listTemplates
      .mockRejectedValueOnce(
        new ApiError({ status: 503, code: 'database_unavailable', message: 'Servidor ocupado' }),
      )
      .mockResolvedValueOnce({
        items: [summary('a', 'Revisión de mantenimiento')],
        next_cursor: null,
      });
    renderList();

    expect(await screen.findByText('Servidor ocupado')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    expect(
      await screen.findByRole('link', { name: /Revisión de mantenimiento/ }),
    ).toBeInTheDocument();
  });
});
