import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import Badge from '@/shared/components/Badge/Badge';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import DocumentPreview from '@/shared/components/DocumentPreview/DocumentPreview';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import Loader from '@/shared/components/Loader/Loader';
import { isPdf } from '@/shared/domain/documentUpload';
import { importWarningMessage } from '@/shared/domain/importContract';
import { IMPORT_STATUS } from '@/shared/domain/importStatus';
import { useImport } from '@/shared/hooks/useImport';
import './ImportStatusPage.css';

const STATUS_COPY = Object.freeze({
  [IMPORT_STATUS.RECEIVED]: {
    title: 'Documento recibido',
    message: 'En cola.',
    loader: 'Preparando análisis...',
  },
  [IMPORT_STATUS.PROCESSING]: {
    title: 'Analizando documento',
    message: 'Identificando secciones y preguntas.',
    loader: 'Analizando documento...',
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
    const warnings = (imported.warnings ?? []).map(importWarningMessage).filter(Boolean);
    return (
      <section className="import-failure">
        <header className="import-failure__header">
          <p className="import-failure__kicker">La IA no pudo leer el documento</p>
          <h1>No pudimos convertir este documento</h1>
          <p className="import-failure__message">
            {imported.error_message || 'Intenta con otro archivo.'}
          </p>
        </header>

        <article className="import-failure__card">
          <div className="import-failure__file">
            <strong>{imported.original_filename}</strong>
            <span>
              {[
                imported.page_count ? `${imported.page_count} páginas` : null,
                isPdf(imported.mime_type) ? 'PDF' : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            {imported.original_url && (
              <a href={imported.original_url} target="_blank" rel="noreferrer">
                Ver archivo
              </a>
            )}
          </div>
          {warnings.length > 0 && (
            <ul className="import-failure__warnings">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
        </article>

        <div className="import-failure__actions">
          <ButtonLink to={ROUTES.importNew} size="lg">
            Subir otro archivo
          </ButtonLink>
          <ButtonLink to={ROUTES.templateNew} variant="secondary" size="lg">
            Crear plantilla manualmente
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
    <section className="import-status-page">
      <header className="import-status-page__title-row">
        <div>
          <h1>{copy.title}</h1>
          <p className="text-secondary">{copy.message}</p>
        </div>
        <Badge tone={tone}>
          {imported.status === IMPORT_STATUS.PROCESSING ? 'Procesando' : 'Recibido'}
        </Badge>
      </header>

      <div className="import-status-page__work">
        <article className="card import-status-page__preview">
          {imported.original_filename && (
            <p className="import-status-page__filename">{imported.original_filename}</p>
          )}
          {imported.original_url && imported.original_filename && imported.mime_type ? (
            <DocumentPreview
              url={imported.original_url}
              name={imported.original_filename}
              pdf={isPdf(imported.mime_type)}
            />
          ) : (
            <p className="text-secondary">Documento en proceso.</p>
          )}
        </article>

        <aside className="card stack import-status-page__status">
          <Loader label={copy.loader} />
          <p className="text-secondary text-small">Al terminar se abre la revisión.</p>
          <ButtonLink to={ROUTES.templates} variant="secondary">
            Volver a plantillas
          </ButtonLink>
        </aside>
      </div>
    </section>
  );
}
