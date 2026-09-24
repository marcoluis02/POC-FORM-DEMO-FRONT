import { useCallback, useMemo, useRef, useState } from 'react';
import Toast from './Toast';
import { ToastContext } from './ToastContext';
import './Toast.css';

const MAX_VISIBLE = 3;
const DURATION_MS = { success: 4000, info: 4000, error: 7000 };

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((tone, message) => {
    nextId.current += 1;
    const toast = { id: nextId.current, tone, message, durationMs: DURATION_MS[tone] };
    setToasts((current) => [...current, toast].slice(-MAX_VISIBLE));
  }, []);

  const api = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
      info: (message) => show('info', message),
    }),
    [show],
  );

  return (
    <ToastContext value={api}>
      {children}
      <div className="toast-viewport">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={dismiss} />
        ))}
      </div>
    </ToastContext>
  );
}
