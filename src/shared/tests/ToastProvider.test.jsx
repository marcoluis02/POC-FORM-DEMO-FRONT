import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastProvider from '@/shared/components/Toast/ToastProvider';
import { useToast } from '@/shared/components/Toast/useToast';

function SaveButton() {
  const toast = useToast();
  return (
    <>
      <button type="button" onClick={() => toast.success('Guardado correctamente')}>
        Guardar
      </button>
      <button type="button" onClick={() => toast.error('No se pudo guardar')}>
        Fallar
      </button>
    </>
  );
}

const renderWithProvider = () =>
  render(
    <ToastProvider>
      <SaveButton />
    </ToastProvider>,
  );

describe('ToastProvider + useToast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('muestra el aviso y se puede cerrar', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByRole('status')).toHaveTextContent('Guardado correctamente');

    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByText('Guardado correctamente')).not.toBeInTheDocument();
  });

  it('los errores se anuncian como alerta', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Fallar' }));

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar');
  });

  it('desaparece solo después de unos segundos', () => {
    vi.useFakeTimers();
    renderWithProvider();

    act(() => screen.getByRole('button', { name: 'Guardar' }).click());
    expect(screen.getByText('Guardado correctamente')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(5000));
    expect(screen.queryByText('Guardado correctamente')).not.toBeInTheDocument();
  });
});
