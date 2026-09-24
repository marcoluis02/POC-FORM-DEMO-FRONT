import { useId, useState } from 'react';
import { classNames } from '@/shared/utils/classNames';
import { validateFile } from '@/shared/utils/fileValidation';
import './FileUploader.css';

// capture="environment" abre la cámara trasera en celulares
export default function FileUploader({
  label,
  hint,
  accept,
  maxSizeMb,
  capture,
  disabled = false,
  error,
  onSelect,
  onReject,
  buttonText = 'Elegir archivo',
}) {
  const inputId = useId();
  const [fileName, setFileName] = useState('');
  const [rejection, setRejection] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const shownError = error || rejection;

  const handleFile = (file) => {
    if (!file) return;
    const problem = validateFile(file, { accept, maxSizeMb });
    if (problem) {
      setRejection(problem);
      setFileName('');
      onReject?.(problem);
      return;
    }
    setRejection('');
    setFileName(file.name);
    onSelect(file);
  };

  const handleChange = (event) => {
    handleFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    if (!disabled) handleFile(event.dataTransfer.files?.[0]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (!disabled) setDragActive(true);
  };

  return (
    <div className="file-uploader">
      {label && <span className="file-uploader__label">{label}</span>}
      <label
        htmlFor={inputId}
        className={classNames(
          'file-uploader__zone',
          dragActive && 'file-uploader__zone--active',
          disabled && 'file-uploader__zone--disabled',
          shownError && 'file-uploader__zone--error',
        )}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <input
          id={inputId}
          type="file"
          className="visually-hidden"
          accept={accept}
          capture={capture}
          disabled={disabled}
          aria-label={label || buttonText}
          aria-invalid={Boolean(shownError)}
          onChange={handleChange}
        />
        <span className="file-uploader__button">{buttonText}</span>
        <span className="file-uploader__text">{fileName || 'o arrastra el archivo aquí'}</span>
      </label>
      {hint && <p className="file-uploader__hint">{hint}</p>}
      {shownError && (
        <p className="file-uploader__error" role="alert">
          {shownError}
        </p>
      )}
    </div>
  );
}
