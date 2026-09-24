import { useState } from 'react';
import Button from '@/shared/components/Button/Button';
import { useConfirm } from '@/shared/components/ConfirmModal/useConfirm';
import DocumentPreview from '@/shared/components/DocumentPreview/DocumentPreview';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import FileUploader from '@/shared/components/FileUploader/FileUploader';
import StoredDocument from '@/shared/components/StoredDocument/StoredDocument';
import { useToast } from '@/shared/components/Toast/useToast';
import { DOCUMENT_UPLOAD, isPdf } from '@/shared/domain/documentUpload';
import './OriginalDocumentViewer.css';

const UPLOAD_HINT = `Opcional. Sube la foto o el PDF del formato en papel (JPG, PNG, WEBP o PDF, máximo ${DOCUMENT_UPLOAD.maxSizeMb} MB y ${DOCUMENT_UPLOAD.maxPdfPages} páginas). Se guarda junto con la plantilla.`;

// Foto o PDF del formato en papel junto al editor.
// file/fileUrl: archivo elegido que aún no se sube. storedImportId: documento ya guardado de la plantilla.
export default function OriginalDocumentViewer({
  file,
  fileUrl,
  storedImportId,
  onSelect,
  onClear,
  disabled = false,
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const [replacing, setReplacing] = useState(false);
  const [failedUrl, setFailedUrl] = useState(null);

  const showUploader = !file && (!storedImportId || replacing);

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
          Documento original
        </h2>
        {file && (
          <Button variant="secondary" size="sm" onClick={handleClear} disabled={disabled}>
            Quitar archivo
          </Button>
        )}
        {!file && storedImportId && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setReplacing((current) => !current)}
            disabled={disabled}
          >
            {replacing ? 'No reemplazar' : 'Reemplazar archivo'}
          </Button>
        )}
      </div>

      {file && (
        <>
          <p className="original-viewer__notice text-small" role="status">
            Archivo nuevo: se guardará al guardar la plantilla.
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
