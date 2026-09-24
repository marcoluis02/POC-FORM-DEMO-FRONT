import { useState } from 'react';
import Button from '@/shared/components/Button/Button';
import FileUploader from '@/shared/components/FileUploader/FileUploader';
import Loader from '@/shared/components/Loader/Loader';
import { PHOTO_UPLOAD } from '../../domain/answerRules';
import '@/shared/components/FormField/FormField.css';
import './PhotoField.css';

function PhotoThumb({ attachment, readOnly, disabled, onDelete, onUrlExpired }) {
  const [broken, setBroken] = useState(false);

  return (
    <li className="photo-field__item">
      {broken ? (
        <div className="photo-field__broken">
          <span className="text-small">La foto no cargó.</span>
          <Button variant="secondary" size="sm" onClick={onUrlExpired}>
            Cargar otra vez
          </Button>
        </div>
      ) : (
        <a href={attachment.url} target="_blank" rel="noreferrer" className="photo-field__link">
          <img
            src={attachment.url}
            alt={`Foto: ${attachment.filename}`}
            className="photo-field__image"
            onError={() => setBroken(true)}
          />
        </a>
      )}
      <span className="photo-field__name text-small">{attachment.filename}</span>
      {!readOnly && (
        <Button
          variant="ghost-danger"
          size="sm"
          disabled={disabled}
          onClick={() => onDelete(attachment)}
        >
          Quitar foto
        </Button>
      )}
    </li>
  );
}

// Fotos de una pregunta: la pregunta tipo "Foto" o la evidencia de otra pregunta
export default function PhotoField({
  label,
  hint,
  required = false,
  error,
  attachments,
  readOnly = false,
  uploading = false,
  disabled = false,
  onUpload,
  onDelete,
  onUrlExpired,
}) {
  const canAddMore = attachments.length < PHOTO_UPLOAD.maxPerField;

  return (
    <div className="photo-field">
      <p className="form-field__label">
        {label}
        {required && <span className="form-field__required">Obligatorio</span>}
      </p>
      {hint && <p className="form-field__hint">{hint}</p>}

      {attachments.length > 0 ? (
        <ul className="photo-field__list">
          {attachments.map((attachment) => (
            // key incluye la URL: si llega una nueva, la miniatura se vuelve a intentar
            <PhotoThumb
              key={`${attachment.id}-${attachment.url}`}
              attachment={attachment}
              readOnly={readOnly}
              disabled={disabled}
              onDelete={onDelete}
              onUrlExpired={onUrlExpired}
            />
          ))}
        </ul>
      ) : (
        readOnly && <p className="text-secondary text-small">Sin fotos.</p>
      )}

      {!readOnly && uploading && <Loader label="Subiendo foto..." />}
      {!readOnly && !uploading && canAddMore && (
        <FileUploader
          accept={PHOTO_UPLOAD.accept}
          maxSizeMb={PHOTO_UPLOAD.maxSizeMb}
          capture="environment"
          buttonText="Tomar o elegir foto"
          hint={`JPG, PNG o WEBP de hasta ${PHOTO_UPLOAD.maxSizeMb} MB. Máximo ${PHOTO_UPLOAD.maxPerField} fotos.`}
          disabled={disabled}
          onSelect={onUpload}
        />
      )}
      {!readOnly && !canAddMore && (
        <p className="text-secondary text-small">
          Ya tienes {PHOTO_UPLOAD.maxPerField} fotos. Quita una para agregar otra.
        </p>
      )}
      {error && <p className="form-field__error">{error}</p>}
    </div>
  );
}
