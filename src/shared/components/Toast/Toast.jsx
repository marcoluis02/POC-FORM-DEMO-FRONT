import { useEffect } from 'react';
import { classNames } from '@/shared/utils/classNames';

// tone: success | error | info
export default function Toast({ id, tone, message, durationMs, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), durationMs);
    return () => clearTimeout(timer);
  }, [id, durationMs, onClose]);

  return (
    <div
      className={classNames('toast', `toast--${tone}`)}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <p className="toast__message">{message}</p>
      <button
        type="button"
        className="toast__close"
        onClick={() => onClose(id)}
        aria-label="Cerrar aviso"
      >
        ×
      </button>
    </div>
  );
}
