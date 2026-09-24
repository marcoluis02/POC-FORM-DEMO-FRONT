import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import ConfirmProvider from '@/shared/components/ConfirmModal/ConfirmProvider';
import { useConfirm } from '@/shared/components/ConfirmModal/useConfirm';

function DeleteButton() {
  const confirm = useConfirm();
  const [result, setResult] = useState('sin respuesta');

  const handleClick = async () => {
    const accepted = await confirm({
      title: '¿Eliminar campo?',
      message: 'Esta acción no se puede deshacer.',
      confirmLabel: 'Sí, eliminar',
      tone: 'danger',
    });
    setResult(accepted ? 'aceptó' : 'canceló');
  };

  return (
    <>
      <button type="button" onClick={handleClick}>
        Eliminar
      </button>
      <p>{result}</p>
    </>
  );
}

const renderWithProvider = () =>
  render(
    <ConfirmProvider>
      <DeleteButton />
    </ConfirmProvider>,
  );

describe('ConfirmProvider + useConfirm', () => {
  it('regresa true cuando el usuario confirma', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByRole('dialog', { name: '¿Eliminar campo?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }));

    expect(await screen.findByText('aceptó')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('regresa false cuando el usuario cancela', async () => {
    const user = userEvent.setup();
    renderWithProvider();

    await user.click(screen.getByRole('button', { name: 'Eliminar' }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(await screen.findByText('canceló')).toBeInTheDocument();
  });
});
