import { useContext } from 'react';
import { ConfirmContext } from './ConfirmContext';

// Uso: const confirm = useConfirm(); if (await confirm({ title, message })) { ... }
export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm debe usarse dentro de ConfirmProvider.');
  return confirm;
}
