import Button from '@/shared/components/Button/Button';
import Modal from '@/shared/components/Modal/Modal';
import './ConfirmModal.css';

// tone: primary | danger (danger para acciones como eliminar)
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Sí, continuar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="confirm-modal__message">{message}</p>}
    </Modal>
  );
}
