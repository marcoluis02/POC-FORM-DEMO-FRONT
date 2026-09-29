import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import AppLayout from '@/app/layouts/AppLayout/AppLayout';
import HomePage from '@/app/pages/HomePage/HomePage';
import { ApiError } from '@/shared/api/ApiError';
import { listTemplates } from '@/features/templates/api/templatesApi';
import { getHealth } from '@/shared/api/healthApi';
import ToastProvider from '@/shared/components/Toast/ToastProvider';

vi.mock('@/shared/api/healthApi', () => ({
  healthKeys: { status: ['health', 'status'] },
  getHealth: vi.fn(),
}));

vi.mock('@/features/templates/api/templatesApi', () => ({
  listTemplates: vi.fn(),
  getTemplate: vi.fn(),
  getTemplateVersion: vi.fn(),
  createTemplate: vi.fn(),
  createTemplateVersion: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  beforeEach(() => {
    listTemplates.mockResolvedValue({ items: [], next_cursor: null });
    delete window.matchMedia;
  });

  it('muestra que el sistema está conectado', async () => {
    getHealth.mockResolvedValue({ status: 'ok', database: 'ok' });

    renderPage();

    expect(await screen.findByRole('link', { name: 'Sannia · Formularios' })).toBeInTheDocument();
    expect(screen.queryByText('No pudimos conectar con el servidor')).not.toBeInTheDocument();
  });

  it('en web abre el archivo o una plantilla en blanco', async () => {
    const user = userEvent.setup();
    getHealth.mockResolvedValue({ status: 'ok', database: 'ok' });

    renderPage();

    await user.click((await screen.findAllByRole('button', { name: '+ Crear plantilla' }))[0]);

    expect(screen.queryByRole('button', { name: /Tomar foto/ })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Subir documento o PDF')).toHaveAttribute('type', 'file');
    expect(screen.getByRole('link', { name: /Crear desde cero/ })).toHaveAttribute(
      'href',
      '/templates/new',
    );
  });

  it('en celular abre la cámara, el archivo o una plantilla en blanco', async () => {
    const user = userEvent.setup();
    getHealth.mockResolvedValue({ status: 'ok', database: 'ok' });
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    renderPage();

    await user.click((await screen.findAllByRole('button', { name: '+ Crear plantilla' }))[0]);

    expect(screen.getByLabelText('Tomar foto o escanear')).toHaveAttribute('capture', 'environment');
    expect(screen.getByLabelText('Subir documento o PDF')).toHaveAttribute('type', 'file');
    expect(screen.getByRole('link', { name: /Crear desde cero/ })).toHaveAttribute(
      'href',
      '/templates/new',
    );
  });

  it('muestra el error y permite reintentar', async () => {
    const user = userEvent.setup();
    getHealth
      .mockRejectedValueOnce(
        new ApiError({ status: 503, code: 'database_unavailable', message: 'Servidor ocupado' }),
      )
      .mockResolvedValueOnce({ status: 'ok', database: 'ok' });

    renderPage();

    expect(await screen.findByText('No pudimos conectar con el servidor')).toBeInTheDocument();
    expect(screen.getByText('Servidor ocupado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));
    await waitFor(() => {
      expect(screen.queryByText('No pudimos conectar con el servidor')).not.toBeInTheDocument();
    });
  });
});
