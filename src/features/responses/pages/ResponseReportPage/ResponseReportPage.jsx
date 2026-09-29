import { useMemo } from "react";
import { ArrowLeftIcon, FileStackIcon } from "lucide-animated";
import { useParams } from "react-router";
import { paths } from "@/app/router/routes";
import { useTemplateVersion } from "@/features/templates/hooks/useTemplateVersion";
import AnimatedIcon from "@/shared/components/AnimatedIcon/AnimatedIcon";
import Badge from "@/shared/components/Badge/Badge";
import ButtonLink from "@/shared/components/ButtonLink/ButtonLink";
import { useAnimatedIcon } from "@/shared/hooks/useAnimatedIcon";
import ErrorState from "@/shared/components/ErrorState/ErrorState";
import Loader from "@/shared/components/Loader/Loader";
import { formatDateTime } from "@/shared/utils/formatDate";
import ResponseLoadError from "../../components/ResponseLoadError/ResponseLoadError";
import ResponseReportField from "../../components/ResponseReportField/ResponseReportField";
import ResponseStatusBadge from "../../components/ResponseStatusBadge/ResponseStatusBadge";
import { orderedSections } from "../../domain/answerRules";
import { RESPONSE_STATUS } from "../../domain/responseStatus";
import { useResponse } from "../../hooks/useResponse";
import "./ResponseReportPage.css";

const NO_ATTACHMENTS = [];

function attachmentsByField(attachments) {
  const grouped = {};
  for (const attachment of attachments) {
    (grouped[attachment.field_id] ??= []).push(attachment);
  }
  return grouped;
}

function ResponseReport({ response, definition, onRefreshUrls }) {
  const sections = useMemo(() => orderedSections(definition), [definition]);
  const attachments = useMemo(
    () => attachmentsByField(response.attachments ?? []),
    [response.attachments],
  );
  const submitted = response.status === RESPONSE_STATUS.SUBMITTED;
  const backIcon = useAnimatedIcon();
  const templateIcon = useAnimatedIcon();

  return (
    <div className="response-report">
      <div className="response-report__top-actions">
        <ButtonLink
          to={paths.responseDetail(response.id)}
          variant="ghost"
          size="sm"
          onMouseEnter={backIcon.onMouseEnter}
          onMouseLeave={backIcon.onMouseLeave}
          onFocus={backIcon.onFocus}
          onBlur={backIcon.onBlur}
        >
          <AnimatedIcon icon={ArrowLeftIcon} iconRef={backIcon.ref} size={16} />
          {submitted ? "Ver formulario" : "Volver a contestar"}
        </ButtonLink>
        <ButtonLink
          to={paths.templateDetail(response.template_id)}
          variant="ghost"
          size="sm"
          onMouseEnter={templateIcon.onMouseEnter}
          onMouseLeave={templateIcon.onMouseLeave}
          onFocus={templateIcon.onFocus}
          onBlur={templateIcon.onBlur}
        >
          <AnimatedIcon icon={FileStackIcon} iconRef={templateIcon.ref} size={16} />
          Ver plantilla
        </ButtonLink>
      </div>

      <header className="card response-report__header">
        <div className="response-report__title-row">
          <div>
            <p className="response-report__eyebrow">Reporte de demostración</p>
            <h1>{response.name}</h1>
          </div>
          <div className="response-report__badges">
            <ResponseStatusBadge status={response.status} />
            <Badge tone="info">Versión {response.version}</Badge>
          </div>
        </div>
        <p className="text-secondary">
          Plantilla: <strong>{definition.title}</strong>
        </p>
        <p className="text-secondary text-small">
          Creado: {formatDateTime(response.created_at)}
          {submitted
            ? ` · Enviado: ${formatDateTime(response.submitted_at)}`
            : ` · Último guardado: ${formatDateTime(response.updated_at)}`}
        </p>
        <p
          className={
            submitted
              ? "response-report__notice response-report__notice--submitted"
              : "response-report__notice"
          }
          role="status"
        >
          {submitted
            ? "Este reporte corresponde a la versión exacta con la que se envió el formulario."
            : "Este reporte corresponde a un borrador. Las preguntas pendientes aparecen como “Sin contestar”."}
        </p>
      </header>

      {sections.map((section) => (
        <section
          key={section.id}
          className="card response-report__section"
          aria-labelledby={`report-section-${section.id}`}
        >
          <h2 id={`report-section-${section.id}`}>{section.title}</h2>
          <div className="response-report__fields">
            {section.fields.map((field) => (
              <ResponseReportField
                key={field.id}
                field={field}
                value={response.values?.[field.id]}
                attachments={attachments[field.id] ?? NO_ATTACHMENTS}
                onUrlExpired={onRefreshUrls}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function ResponseReportPage() {
  const { responseId } = useParams();
  const responseQuery = useResponse(responseId);
  const response = responseQuery.data;
  // El reporte siempre carga la versión congelada en la respuesta; nunca latest_version.
  const versionQuery = useTemplateVersion(
    response?.template_id,
    response?.version,
  );

  if (responseQuery.isPending)
    return <Loader label="Cargando el reporte..." fullPage />;
  if (responseQuery.isError) {
    return (
      <ResponseLoadError
        error={responseQuery.error}
        onRetry={() => responseQuery.refetch()}
        retrying={responseQuery.isFetching}
      />
    );
  }

  if (versionQuery.isPending)
    return <Loader label="Cargando la versión del formulario..." fullPage />;
  if (versionQuery.isError) {
    return (
      <ErrorState
        title="No pudimos cargar la versión usada en este reporte"
        message={versionQuery.error.message}
        onRetry={() => versionQuery.refetch()}
        retrying={versionQuery.isFetching}
      />
    );
  }

  return (
    <ResponseReport
      response={response}
      definition={versionQuery.data.definition}
      onRefreshUrls={() => responseQuery.refetch()}
    />
  );
}
