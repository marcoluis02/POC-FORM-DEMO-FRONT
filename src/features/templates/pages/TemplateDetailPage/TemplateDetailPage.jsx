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

// La versión se guarda en la URL (?version=1) para que al recargar se vea la misma
function pickVersion(requested, latestVersion) {
  const version = Number(requested);
  return Number.isInteger(version) && version >= 1 && version <= latestVersion
    ? version
    : latestVersion;
}

// El documento se pide al backend solo cuando el usuario lo quiere ver
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

// Cada versión tiene su propio documento original (o ninguno)
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

function OldVersionContent({ templateId, version }) {
  const versionQuery = useTemplateVersion(templateId, version);

  if (versionQuery.isPending) return <Loader label={`Cargando la versión ${version}...`} />;
  if (versionQuery.isError) {
    return (
      <ErrorState
        title={`No pudimos cargar la versión ${version}`}
        message={versionQuery.error.message}
        onRetry={() => versionQuery.refetch()}
        retrying={versionQuery.isFetching}
      />
    );
  }

  return (
    <>
      <p className="template-detail__notice" role="status">
        Estás viendo la versión {version}, que ya no es la actual. Solo se puede consultar.
      </p>
      <VersionContent version={versionQuery.data} />
    </>
  );
}

export default function TemplateDetailPage() {
  const { templateId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const templateQuery = useTemplate(templateId);

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

  const template = templateQuery.data;
  const latestVersion = template.latest_version;
  const selectedVersion = pickVersion(searchParams.get(VERSION_PARAM), latestVersion);
  const isLatest = selectedVersion === latestVersion;

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
            <Badge tone="info">Versión {latestVersion}</Badge>
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

      <ResponsesSection templateId={template.id} latestVersion={latestVersion} />

      {isLatest ? (
        <VersionContent version={template.current_version} />
      ) : (
        <OldVersionContent templateId={template.id} version={selectedVersion} />
      )}
    </div>
  );
}
