import { useCallback, useRef, useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { ConfirmContext } from './ConfirmContext';

// Muestra una sola confirmación a la vez. confirm() regresa una promesa: true si acepta, false si cancela.
export default function ConfirmProvider({ children }) {
  const [request, setRequest] = useState(null);
  const requestRef = useRef(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        requestRef.current?.resolve(false);
        const next = { ...options, resolve };
        requestRef.current = next;
        setRequest(next);
      }),
    [],
  );

  const close = useCallback((accepted) => {
    requestRef.current?.resolve(accepted);
    requestRef.current = null;
    setRequest(null);
  }, []);

  return (
    <ConfirmContext value={confirm}>
      {children}
      <ConfirmModal
        open={Boolean(request)}
        title={request?.title}
        message={request?.message}
        confirmLabel={request?.confirmLabel}
        cancelLabel={request?.cancelLabel}
        tone={request?.tone}
        onConfirm={() => close(true)}
        onCancel={() => close(false)}
      />
    </ConfirmContext>
  );
}
