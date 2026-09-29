import { useState } from 'react';
import { ArrowLeftIcon, EyeIcon, SquarePenIcon } from 'lucide-animated';
import { useParams, useSearchParams } from 'react-router';
import { ROUTES, paths } from '@/app/router/routes';
import StoredDocument from '@/shared/components/StoredDocument/StoredDocument';
import ResponsesSection from '@/features/responses/components/ResponsesSection/ResponsesSection';
import AnimatedIcon from '@/shared/components/AnimatedIcon/AnimatedIcon';
import Badge from '@/shared/components/Badge/Badge';
import Button from '@/shared/components/Button/Button';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import LoaderModal from '@/shared/components/LoaderModal/LoaderModal';
import Modal from '@/shared/components/Modal/Modal';
import Select from '@/shared/components/Select/Select';
import { formatDateTime } from '@/shared/utils/formatDate';
import TemplateDefinitionView from '../../components/TemplateDefinitionView/TemplateDefinitionView';
import TemplateLoadError from '../../components/TemplateLoadError/TemplateLoadError';
import { TEMPLATE_STATUS, TEMPLATE_STATUS_LABELS } from '../../domain/templateStatus';
import { useTemplate } from '../../hooks/useTemplate';
import { useTemplateVersion } from '../../hooks/useTemplateVersion';
import { useAnimatedIcon } from '@/shared/hooks/useAnimatedIcon';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import './TemplateDetailPage.css';

const COMPACT_QUERY = '(max-width: 63.99rem)';
const DETAIL_TABS = Object.freeze({
  CONTENT: 'content',
  FORMS: 'forms',
});

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
  const viewIcon = useAnimatedIcon();

  return (
    <section className="template-detail__original" aria-labelledby="template-original-title">
      <div className="template-detail__original-header">
        <h2 id="template-original-title" className="template-detail__original-title">
          Documento original
        </h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
          onMouseEnter={viewIcon.onMouseEnter}
          onMouseLeave={viewIcon.onMouseLeave}
          onFocus={viewIcon.onFocus}
          onBlur={viewIcon.onBlur}
        >
          <AnimatedIcon icon={EyeIcon} iconRef={viewIcon.ref} size={16} />
          Ver documento original
        </Button>
      </div>
      <Modal
        open={open}
        wide
        title="Documento original"
        className="template-detail__document-modal"
        onClose={() => setOpen(false)}
      >
        <StoredDocument importId={importId} />
      </Modal>
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
  const compact = useMediaQuery(COMPACT_QUERY);
  const backIcon = useAnimatedIcon();
  const editIcon = useAnimatedIcon();
  const [tab, setTab] = useState(DETAIL_TABS.CONTENT);
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

  if (templateQuery.isPending) return <LoaderModal open label="Cargando la plantilla..." />;
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
    return <LoaderModal open label={`Cargando la versión ${selectedVersion}...`} />;
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
        <ButtonLink
          className="template-detail__back"
          to={ROUTES.templates}
          variant="ghost"
          size="sm"
          onMouseEnter={backIcon.onMouseEnter}
          onMouseLeave={backIcon.onMouseLeave}
          onFocus={backIcon.onFocus}
          onBlur={backIcon.onBlur}
        >
          <AnimatedIcon icon={ArrowLeftIcon} iconRef={backIcon.ref} size={16} />
          Volver a plantillas
        </ButtonLink>
      </div>
      <header className="template-detail__header">
        <div className="template-detail__intro">
          <div className="template-detail__badges">
            <Badge tone={template.status === TEMPLATE_STATUS.ACTIVE ? 'success' : 'neutral'}>
              {TEMPLATE_STATUS_LABELS[template.status] ?? template.status}
            </Badge>
            <Badge tone="info">Versión {selectedVersion}</Badge>
          </div>
          <h1>{template.name}</h1>
          <p className="template-detail__dates">
            Creada: {formatDateTime(template.created_at)} · Última actualización:{' '}
            {formatDateTime(template.updated_at)}
          </p>
        </div>
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
          <ButtonLink
            className="template-detail__edit"
            variant="secondary"
            to={paths.templateEdit(template.id)}
            onMouseEnter={editIcon.onMouseEnter}
            onMouseLeave={editIcon.onMouseLeave}
            onFocus={editIcon.onFocus}
            onBlur={editIcon.onBlur}
          >
            <AnimatedIcon icon={SquarePenIcon} iconRef={editIcon.ref} size={16} />
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

      {compact && (
        <div className="template-detail__tabs" role="tablist" aria-label="Detalle de la plantilla">
          <button
            type="button"
            role="tab"
            id="template-tab-content"
            className={tab === DETAIL_TABS.CONTENT ? 'template-detail__tab template-detail__tab--active' : 'template-detail__tab'}
            aria-selected={tab === DETAIL_TABS.CONTENT}
            aria-controls="template-panel-content"
            onClick={() => setTab(DETAIL_TABS.CONTENT)}
          >
            Contenido
          </button>
          <button
            type="button"
            role="tab"
            id="template-tab-forms"
            className={tab === DETAIL_TABS.FORMS ? 'template-detail__tab template-detail__tab--active' : 'template-detail__tab'}
            aria-selected={tab === DETAIL_TABS.FORMS}
            aria-controls="template-panel-forms"
            onClick={() => setTab(DETAIL_TABS.FORMS)}
          >
            Formularios
          </button>
        </div>
      )}

      <div className="template-detail__columns">
        <div
          className="template-detail__primary"
          id="template-panel-content"
          role={compact ? 'tabpanel' : undefined}
          aria-labelledby={compact ? 'template-tab-content' : undefined}
          hidden={compact && tab !== DETAIL_TABS.CONTENT}
        >
          <VersionContent version={versionRecord} />
        </div>
        <div
          className="template-detail__forms"
          id="template-panel-forms"
          role={compact ? 'tabpanel' : undefined}
          aria-labelledby={compact ? 'template-tab-forms' : undefined}
          hidden={compact && tab !== DETAIL_TABS.FORMS}
        >
          <ResponsesSection
            templateId={template.id}
            templateVersionId={versionRecord.id}
            version={versionRecord.version}
          />
        </div>
      </div>
    </div>
  );
}
