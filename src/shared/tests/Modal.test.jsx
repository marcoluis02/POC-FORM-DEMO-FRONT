import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from '@/shared/components/Modal/Modal';

describe('Modal', () => {
  it('no muestra nada si está cerrado', () => {
    render(<Modal open={false} title="Título" onClose={() => {}} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra el diálogo accesible y pone el foco adentro', () => {
    render(
      <Modal open title="Confirmar" onClose={() => {}}>
        <button type="button">Aceptar</button>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Confirmar' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toContainElement(document.activeElement);
  });

  it('se cierra con Escape, con la X y al tocar el fondo', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Modal open title="Aviso" onClose={onClose} />);

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    await user.click(document.querySelector('.modal__backdrop'));

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('mantiene el foco dentro al presionar Tab', async () => {
    const user = userEvent.setup();
    render(
      <Modal
        open
        title="Aviso"
        onClose={() => {}}
        footer={<button type="button">Último</button>}
      />,
    );

    const closeButton = screen.getByRole('button', { name: 'Cerrar' });
    const lastButton = screen.getByRole('button', { name: 'Último' });
    expect(closeButton).toHaveFocus();

    await user.tab();
    expect(lastButton).toHaveFocus();
    await user.tab();
    expect(closeButton).toHaveFocus();
  });
});
