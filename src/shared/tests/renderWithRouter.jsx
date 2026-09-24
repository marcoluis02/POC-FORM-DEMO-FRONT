import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import ConfirmProvider from '@/shared/components/ConfirmModal/ConfirmProvider';
import ToastProvider from '@/shared/components/Toast/ToastProvider';

// Monta pantallas con los mismos providers de la app y un router en memoria.
// routes: [{ path, element }]   initialPath: ruta donde arranca la prueba
export function renderWithRouter(routes, { initialPath = '/' } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });

  const view = render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <RouterProvider router={router} />
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );

  return { ...view, router, queryClient };
}
