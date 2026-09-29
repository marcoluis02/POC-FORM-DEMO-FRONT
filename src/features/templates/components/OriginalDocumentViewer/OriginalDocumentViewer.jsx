import { useState } from 'react';
import { FilePenLineIcon, RefreshCcwIcon, XIcon } from 'lucide-animated';
import AnimatedIcon from '@/shared/components/AnimatedIcon/AnimatedIcon';
import Button from '@/shared/components/Button/Button';
import { useConfirm } from '@/shared/components/ConfirmModal/useConfirm';
import DocumentPreview from '@/shared/components/DocumentPreview/DocumentPreview';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import FileUploader from '@/shared/components/FileUploader/FileUploader';
import StoredDocument from '@/shared/components/StoredDocument/StoredDocument';
import { useToast } from '@/shared/components/Toast/useToast';
import { useAnimatedIcon } from '@/shared/hooks/useAnimatedIcon';
import { DOCUMENT_UPLOAD, isPdf } from '@/shared/domain/documentUpload';
import './OriginalDocumentViewer.css';

const UPLOAD_HINT = `JPG, PNG o PDF. Máximo ${DOCUMENT_UPLOAD.maxSizeMb} MB.`;

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Foto o PDF del formato en papel junto al editor.
// file/fileUrl: archivo elegido que aún no se sube. storedImportId: documento ya guardado de la plantilla.
export default function OriginalDocumentViewer({
  file,
  fileUrl,
  storedImportId,
  onSelect,
  onClear,
  disabled = false,
  allowReplace = true,
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const replaceIcon = useAnimatedIcon();
  const [replacing, setReplacing] = useState(false);
  const [failedUrl, setFailedUrl] = useState(null);

  const showUploader = !file && (!storedImportId || (allowReplace && replacing));

  const handleSelect = (selected) => {
    setReplacing(false);
    onSelect(selected);
  };

  const handleClear = async () => {
    const accepted = await confirm({
      title: '¿Quitar el archivo?',
      message: storedImportId
        ? 'Se seguirá usando el documento que ya estaba guardado.'
        : 'La plantilla se guardará sin documento original.',
      confirmLabel: 'Sí, quitar',
      tone: 'danger',
    });
    if (!accepted) return;
    onClear();
    toast.success('Archivo quitado.');
  };

  return (
    <section className="original-viewer card" aria-labelledby="original-viewer-title">
      <div className="original-viewer__header">
        <h2 id="original-viewer-title" className="original-viewer__title">
          Documento de referencia
        </h2>
        {!file && storedImportId && allowReplace && (
          <Button
            variant={replacing ? 'ghost-danger' : 'ghost'}
            size="sm"
            className="original-viewer__replace"
            onClick={() => setReplacing((current) => !current)}
            disabled={disabled}
            aria-label={replacing ? 'No reemplazar' : 'Reemplazar archivo'}
            onMouseEnter={replaceIcon.onMouseEnter}
            onMouseLeave={replaceIcon.onMouseLeave}
            onFocus={replaceIcon.onFocus}
            onBlur={replaceIcon.onBlur}
          >
            <AnimatedIcon
              icon={replacing ? XIcon : RefreshCcwIcon}
              iconRef={replaceIcon.ref}
              size={16}
            />
          </Button>
        )}
      </div>

      {file && (
        <>
          <div className="original-viewer__file">
            <AnimatedIcon icon={FilePenLineIcon} size={22} />
            <div className="original-viewer__file-text">
              <p className="original-viewer__filename">{file.name}</p>
              <p className="original-viewer__meta">{formatSize(file.size)}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="original-viewer__remove"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Quitar archivo"
            >
              <AnimatedIcon icon={XIcon} size={16} />
            </Button>
          </div>
          <p className="original-viewer__notice text-small" role="status">
            Se guarda junto con la plantilla.
          </p>
          {failedUrl === fileUrl ? (
            <ErrorState
              title="No pudimos mostrar este archivo"
              message="Puede estar dañado o en un formato que el navegador no reconoce."
              onRetry={onClear}
              retryLabel="Elegir otro archivo"
            />
          ) : (
            <DocumentPreview
              url={fileUrl}
              name={file.name}
              pdf={isPdf(file.type)}
              onError={() => setFailedUrl(fileUrl)}
            />
          )}
        </>
      )}

      {showUploader && (
        <FileUploader
          accept={DOCUMENT_UPLOAD.accept}
          maxSizeMb={DOCUMENT_UPLOAD.maxSizeMb}
          hint={UPLOAD_HINT}
          buttonText="Elegir foto o PDF"
          disabled={disabled}
          onSelect={handleSelect}
        />
      )}

      {!file && !showUploader && <StoredDocument importId={storedImportId} />}
    </section>
  );
}
