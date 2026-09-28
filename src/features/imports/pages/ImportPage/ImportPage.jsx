import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { paths } from '@/app/router/routes';
import Button from '@/shared/components/Button/Button';
import DocumentPreview from '@/shared/components/DocumentPreview/DocumentPreview';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import FileUploader from '@/shared/components/FileUploader/FileUploader';
import { DOCUMENT_CAPTURE, DOCUMENT_UPLOAD, isPdf } from '@/shared/domain/documentUpload';
import { useCreateImport } from '@/shared/hooks/useCreateImport';
import { useLocalFilePreview } from '@/shared/hooks/useLocalFilePreview';
import './ImportPage.css';

const UPLOAD_HINT = `JPG, PNG o PDF. Máximo ${DOCUMENT_UPLOAD.maxSizeMb} MB y ${DOCUMENT_UPLOAD.maxPdfPages} páginas por PDF.`;
const CAMERA_HINT = 'En celular intentará abrir la cámara trasera. También puedes elegir una foto existente.';

export default function ImportPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const modo = params.get('modo');
  const preview = useLocalFilePreview();
  const createImport = useCreateImport();
  const [submitError, setSubmitError] = useState(null);

  const selectFile = (file) => {
    createImport.reset();
    setSubmitError(null);
    preview.select(file);
  };

  const clearFile = () => {
    createImport.reset();
    setSubmitError(null);
    preview.clear();
  };

  const handleAnalyze = async () => {
    if (!preview.file || createImport.isPending) return;
    setSubmitError(null);
    try {
      const created = await createImport.mutateAsync(preview.file);
      navigate(paths.importDetail(created.id));
    } catch (error) {
      setSubmitError(error);
    }
  };

  return (
    <section className="import-page stack">
      <header className="stack import-page__header">
        <h1>{modo === 'foto' ? 'Tomar foto' : 'Subir documento'}</h1>
        <p className="text-secondary">Después se abre el análisis.</p>
      </header>

      {!preview.file ? (
        <div className="import-page__choices" aria-label="Opciones para cargar el documento">
          <article className="card stack import-page__choice">
            <div>
              <h2>Subir archivo</h2>
              <p className="text-secondary">
                Usa un documento guardado en tu computadora o en tu teléfono.
              </p>
            </div>
            <FileUploader
              label="Subir archivo"
              accept={DOCUMENT_UPLOAD.accept}
              maxSizeMb={DOCUMENT_UPLOAD.maxSizeMb}
              hint={UPLOAD_HINT}
              buttonText="Elegir JPG, PNG o PDF"
              onSelect={selectFile}
            />
          </article>

          <article className="card stack import-page__choice">
            <div>
              <h2>Tomar foto</h2>
              <p className="text-secondary">
                Para una captura nueva desde el teléfono, usa de preferencia la cámara trasera.
              </p>
            </div>
            <FileUploader
              label="Tomar foto"
              accept={DOCUMENT_CAPTURE.accept}
              capture={DOCUMENT_CAPTURE.capture}
              maxSizeMb={DOCUMENT_UPLOAD.maxSizeMb}
              hint={CAMERA_HINT}
              buttonText="Abrir cámara"
              onSelect={selectFile}
            />
          </article>
        </div>
      ) : (
        <article className="card stack import-page__preview" aria-labelledby="selected-file-title">
          <div className="import-page__preview-header">
            <div>
              <p className="import-page__eyebrow">Documento seleccionado</p>
              <h2 id="selected-file-title">{preview.file.name}</h2>
            </div>
            <Button variant="secondary" onClick={clearFile} disabled={createImport.isPending}>
              Elegir otro archivo
            </Button>
          </div>

          <DocumentPreview
            url={preview.url}
            name={preview.file.name}
            pdf={isPdf(preview.file.type)}
            onError={clearFile}
          />

          <p className="import-page__ready" role="status">
            Documento listo para analizar.
          </p>

          {submitError && (
            <ErrorState
              title="No pudimos subir el documento"
              message={submitError.message}
              onRetry={handleAnalyze}
              retryLabel="Intentar de nuevo"
              retrying={createImport.isPending}
            />
          )}

          <div className="import-page__actions">
            <Button
              size="lg"
              fullWidth
              onClick={handleAnalyze}
              loading={createImport.isPending}
            >
              Analizar documento
            </Button>
          </div>
        </article>
      )}
    </section>
  );
}
