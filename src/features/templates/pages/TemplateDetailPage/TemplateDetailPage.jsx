import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { ROUTES, paths } from '@/app/router/routes';
import StoredDocument from '@/shared/components/StoredDocument/StoredDocument';
import ResponsesSection from '@/features/responses/components/ResponsesSection/ResponsesSection';
import Badge from '@/shared/components/Badge/Badge';
import Button from '@/shared/components/Button/Button';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import Loader from '@/shared/components/Loader/Loader';
import Select from '@/shared/components/Select/Select';
import { formatDateTime } from '@/shared/utils/formatDate';
import TemplateDefinitionView from '../../components/TemplateDefinitionView/TemplateDefinitionView';
import TemplateLoadError from '../../components/TemplateLoadError/TemplateLoadError';
import { TEMPLATE_STATUS, TEMPLATE_STATUS_LABELS } from '../../domain/templateStatus';
import { useTemplate } from '../../hooks/useTemplate';
import { useTemplateVersion } from '../../hooks/useTemplateVersion';
import './TemplateDetailPage.css';

const VERSION_PARAM = 'version';

function versionOptions(latestVersion) {
  return Array.from({ length: latestVersion }, (_, index) => {
    const version = latestVersion - index;
    return {
      value: String(version),
      label: version === latestVersion ? `Versión ${version} (actual)` : `Versión ${version}`,
    };
  });
}

function pickVersion(requested, latestVersion) {
  const version = Number(requested);
  return Number.isInteger(version) && version >= 1 && version <= latestVersion
    ? version
    : latestVersion;
}

function OriginalDocumentSection({ importId }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="card template-detail__original" aria-labelledby="template-original-title">
      <div className="template-detail__original-header">
        <h2 id="template-original-title" className="template-detail__original-title">
          Documento original
        </h2>
        <Button variant="secondary" size="sm" onClick={() => setOpen((current) => !current)}>
          {open ? 'Ocultar documento' : 'Ver documento original'}
        </Button>
      </div>
      {open && <StoredDocument importId={importId} />}
    </section>
  );
}

function VersionContent({ version }) {
  return (
    <>
      {version.source_import_id && (
        <OriginalDocumentSection
          key={version.source_import_id}
          importId={version.source_import_id}
        />
      )}
      <TemplateDefinitionView definition={version.definition} />
    </>
  );
}

export default function TemplateDetailPage() {
  const { templateId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const templateQuery = useTemplate(templateId);
  const template = templateQuery.data;
  const latestVersion = template?.latest_version ?? null;
  const selectedVersion = latestVersion
    ? pickVersion(searchParams.get(VERSION_PARAM), latestVersion)
    : null;
  const isLatest = Boolean(latestVersion && selectedVersion === latestVersion);
  const selectedVersionQuery = useTemplateVersion(templateId, selectedVersion, {
    enabled: Boolean(selectedVersion && !isLatest),
  });

  if (templateQuery.isPending) return <Loader label="Cargando la plantilla..." fullPage />;
  if (templateQuery.isError) {
    return (
      <TemplateLoadError
        error={templateQuery.error}
        onRetry={() => templateQuery.refetch()}
        retrying={templateQuery.isFetching}
      />
    );
  }

  if (!isLatest && selectedVersionQuery.isPending) {
    return <Loader label={`Cargando la versión ${selectedVersion}...`} fullPage />;
  }
  if (!isLatest && selectedVersionQuery.isError) {
    return (
      <ErrorState
        title={`No pudimos cargar la versión ${selectedVersion}`}
        message={selectedVersionQuery.error.message}
        onRetry={() => selectedVersionQuery.refetch()}
        retrying={selectedVersionQuery.isFetching}
      />
    );
  }

  const versionRecord = isLatest ? template.current_version : selectedVersionQuery.data;

  const handleVersionChange = (event) => {
    const version = Number(event.target.value);
    setSearchParams(version === latestVersion ? {} : { [VERSION_PARAM]: String(version) }, {
      replace: true,
    });
  };

  return (
    <div className="template-detail">
      <div>
        <ButtonLink to={ROUTES.templates} variant="ghost" size="sm">
          ← Volver a plantillas
        </ButtonLink>
      </div>
      <header className="card template-detail__header">
        <div className="template-detail__title-row">
          <h1>{template.name}</h1>
          <div className="template-detail__badges">
            <Badge tone={template.status === TEMPLATE_STATUS.ACTIVE ? 'success' : 'neutral'}>
              {TEMPLATE_STATUS_LABELS[template.status] ?? template.status}
            </Badge>
            <Badge tone="info">Versión {selectedVersion}</Badge>
          </div>
        </div>
        <p className="text-secondary text-small">
          Creada: {formatDateTime(template.created_at)} · Última actualización:{' '}
          {formatDateTime(template.updated_at)}
        </p>
        <div className="template-detail__toolbar">
          {latestVersion > 1 && (
            <div className="template-detail__version">
              <Select
                label="Ver versión"
                options={versionOptions(latestVersion)}
                placeholder=""
                value={String(selectedVersion)}
                onChange={handleVersionChange}
              />
            </div>
          )}
          <ButtonLink variant="secondary" to={paths.templateEdit(template.id)}>
            Editar plantilla
          </ButtonLink>
        </div>
      </header>

      {!isLatest && (
        <p className="template-detail__notice" role="status">
          Estás viendo la versión {selectedVersion}. Si empiezas un formulario desde aquí, quedará
          ligado a esta versión exacta aunque después exista una versión más nueva.
        </p>
      )}

      <ResponsesSection
        templateId={template.id}
        templateVersionId={versionRecord.id}
        version={versionRecord.version}
      />

      <VersionContent version={versionRecord} />
    </div>
  );
}
