import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Loader from '@/shared/components/Loader/Loader';
import './LoaderModal.css';

export default function LoaderModal({ open, label = 'Cargando...' }) {
  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="loader-modal" role="dialog" aria-modal="true" aria-label={label}>
      <div className="loader-modal__card">
        <Loader label={label} />
      </div>
    </div>,
    document.body,
  );
}
