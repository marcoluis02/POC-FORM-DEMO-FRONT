import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import Badge from '@/shared/components/Badge/Badge';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import DocumentPreview from '@/shared/components/DocumentPreview/DocumentPreview';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import Loader from '@/shared/components/Loader/Loader';
import { isPdf } from '@/shared/domain/documentUpload';
import { IMPORT_STATUS } from '@/shared/domain/importStatus';
import { useImport } from '@/shared/hooks/useImport';
import './ImportStatusPage.css';

const STATUS_COPY = Object.freeze({
  [IMPORT_STATUS.RECEIVED]: {
    title: 'Documento recibido',
    message: 'Preparando el análisis del documento...',
  },
  [IMPORT_STATUS.PROCESSING]: {
    title: 'Analizando documento',
    message: 'La IA está identificando secciones, preguntas y tipos de campo. Si el proveedor tarda o está ocupado, el servidor reintenta automáticamente sin crear otra importación.',
  },
});

export default function ImportStatusPage() {
  const { importId } = useParams();
  const navigate = useNavigate();
  const importQuery = useImport(importId, { poll: true });
  const imported = importQuery.data;

  useEffect(() => {
    if (imported?.status === IMPORT_STATUS.REQUIRES_REVIEW) {
      navigate(`${ROUTES.templateNew}?importId=${encodeURIComponent(imported.id)}`, { replace: true });
    }
  }, [imported?.id, imported?.status, navigate]);

  if (importQuery.isPending) return <Loader label="Cargando la importación..." fullPage />;

  if (importQuery.isError) {
    return (
      <section className="import-status-page">
        <ErrorState
          title="No pudimos consultar el documento"
          message={importQuery.error.message}
          onRetry={() => importQuery.refetch()}
          retrying={importQuery.isFetching}
        />
      </section>
    );
  }

  if (imported.status === IMPORT_STATUS.FAILED) {
    return (
      <section className="import-status-page stack">
        <header className="stack">
          <p className="import-status-page__eyebrow">Digitalización</p>
          <h1>No pudimos convertir este documento</h1>
        </header>
        <ErrorState
          title="La importación necesita otro intento"
          message={
            imported.error_message ||
            'No fue posible obtener un formulario utilizable. Prueba con otro archivo o una foto más clara.'
          }
        />
        <div>
          <ButtonLink to={ROUTES.importNew} size="lg">
            Subir otro archivo
          </ButtonLink>
        </div>
      </section>
    );
  }

  if (imported.status === IMPORT_STATUS.REQUIRES_REVIEW) {
    return <Loader label="Abriendo la revisión..." fullPage />;
  }

  const copy = STATUS_COPY[imported.status] ?? STATUS_COPY[IMPORT_STATUS.RECEIVED];
  const tone = imported.status === IMPORT_STATUS.PROCESSING ? 'info' : 'neutral';

  return (
    <section className="import-status-page stack">
      <header className="stack">
        <div className="import-status-page__title-row">
          <div>
            <p className="import-status-page__eyebrow">Digitalización</p>
            <h1>{copy.title}</h1>
          </div>
          <Badge tone={tone}>
            {imported.status === IMPORT_STATUS.PROCESSING ? 'Procesando' : 'Recibido'}
          </Badge>
        </div>
        <p className="text-secondary">{copy.message}</p>
      </header>

      <article className="card stack import-status-page__card">
        <Loader
          label={
            imported.status === IMPORT_STATUS.PROCESSING
              ? 'Analizando documento...'
              : 'Preparando análisis...'
          }
        />
        {imported.original_filename && (
          <p className="text-secondary import-status-page__filename">{imported.original_filename}</p>
        )}
        {imported.original_url && imported.original_filename && imported.mime_type && (
          <div className="import-status-page__preview">
            <DocumentPreview
              url={imported.original_url}
              name={imported.original_filename}
              pdf={isPdf(imported.mime_type)}
            />
          </div>
        )}
      </article>

      <p className="text-secondary text-small">
        Puedes dejar esta pantalla abierta. En cuanto termine el análisis se abrirá la revisión.
      </p>
    </section>
  );
}
