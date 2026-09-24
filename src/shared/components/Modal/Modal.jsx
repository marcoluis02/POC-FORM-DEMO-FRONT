import { useEffect, useEffectEvent, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getFocusableElements, keepFocusInside } from '@/shared/utils/focusTrap';
import './Modal.css';

// Modal único de la app: portal, fondo oscuro, Escape para cerrar y foco atrapado adentro.
export default function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  closeOnBackdrop = true,
  closeLabel = 'Cerrar',
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const handleClose = useEffectEvent(() => onClose?.());

  useEffect(() => {
    if (!open) return undefined;

    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (getFocusableElements(dialog)[0] ?? dialog).focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        handleClose();
      } else if (event.key === 'Tab') {
        keepFocusInside(event, dialog);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (event) => {
    if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
  };

  return createPortal(
    <div className="modal__backdrop" onMouseDown={handleBackdropClick}>
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
          {onClose && (
            <button
              type="button"
              className="modal__close"
              onClick={onClose}
              aria-label={closeLabel}
            >
              ×
            </button>
          )}
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
