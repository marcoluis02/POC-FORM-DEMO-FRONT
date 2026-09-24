import { useId, useState } from 'react';
import Button from '@/shared/components/Button/Button';
import Input from '@/shared/components/Input/Input';
import Modal from '@/shared/components/Modal/Modal';
import { ANSWER_LIMITS, cleanResponseName, validateResponseName } from '../../domain/answerRules';
import './StartResponseModal.css';

// Pide el nombre del llenado antes de crear el borrador.
// El padre remonta el modal (key) cada vez que se abre para limpiar el texto.
export default function StartResponseModal({
  open,
  latestVersion,
  loading = false,
  onCancel,
  onConfirm,
}) {
  const formId = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const problem = validateResponseName(name);
    if (problem) {
      setError(problem);
      return;
    }
    onConfirm(cleanResponseName(name));
  };

  return (
    <Modal
      open={open}
      title="¿Llenar un formulario nuevo?"
      onClose={loading ? undefined : onCancel}
      closeOnBackdrop={!loading}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={loading}>
            Sí, empezar
          </Button>
        </>
      }
    >
      <form id={formId} className="start-response-modal" onSubmit={handleSubmit}>
        <p className="start-response-modal__message">
          Se va a crear un borrador con la versión {latestVersion} de esta plantilla. Ponle un
          nombre para reconocerlo en el listado.
        </p>
        <Input
          label="Nombre de este llenado"
          placeholder="Ej. Visita tienda Centro"
          value={name}
          maxLength={ANSWER_LIMITS.responseNameMaxLength}
          error={error}
          required
          autoFocus
          disabled={loading}
          onChange={(event) => {
            setName(event.target.value);
            setError('');
          }}
        />
      </form>
    </Modal>
  );
}
