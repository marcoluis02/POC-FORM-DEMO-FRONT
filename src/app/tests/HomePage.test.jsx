import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import HomePage from '@/app/pages/HomePage/HomePage';
import { ApiError } from '@/shared/api/ApiError';
import { getHealth } from '@/shared/api/healthApi';

vi.mock('@/shared/api/healthApi', () => ({
  healthKeys: { status: ['health', 'status'] },
  getHealth: vi.fn(),
}));

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('HomePage', () => {
  it('muestra que el sistema está conectado', async () => {
    getHealth.mockResolvedValue({ status: 'ok', database: 'ok' });

    renderPage();

    expect(screen.getByText('Revisando la conexión con el servidor...')).toBeInTheDocument();
    expect(await screen.findByText('Conectado')).toBeInTheDocument();
  });

  it('tiene el acceso para crear una plantilla', () => {
    getHealth.mockResolvedValue({ status: 'ok', database: 'ok' });

    renderPage();

    expect(screen.getByRole('link', { name: '+ Crear plantilla' })).toHaveAttribute(
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
    expect(await screen.findByText('Conectado')).toBeInTheDocument();
  });
});
