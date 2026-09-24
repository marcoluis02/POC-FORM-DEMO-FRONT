import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router';
import { useConfirm } from '@/shared/components/ConfirmModal/useConfirm';

// Avisa antes de salir de la pantalla si hay cambios sin guardar.
// allowNextNavigation() se llama justo antes de navegar después de guardar con éxito.
export function useUnsavedChangesGuard(hasChanges) {
  const confirm = useConfirm();
  const allowRef = useRef(false);
  const askingRef = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChanges && !allowRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state !== 'blocked' || askingRef.current) return;
    askingRef.current = true;
    confirm({
      title: '¿Salir sin guardar?',
      message: 'Los cambios que hiciste se van a perder.',
      confirmLabel: 'Sí, salir',
      cancelLabel: 'Seguir editando',
      tone: 'danger',
    }).then((accepted) => {
      askingRef.current = false;
      if (accepted) blocker.proceed();
      else blocker.reset();
    });
  }, [blocker, confirm]);

  // Recargar o cerrar la pestaña: el navegador muestra su propio aviso
  useEffect(() => {
    if (!hasChanges) return undefined;
    const handleBeforeUnload = (event) => event.preventDefault();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return {
    allowNextNavigation: () => {
      allowRef.current = true;
    },
  };
}
