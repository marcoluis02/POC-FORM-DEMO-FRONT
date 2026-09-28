import { useState } from "react";
import { FIELD_TYPES } from "@/features/templates/domain/fieldTypes";
import Button from "@/shared/components/Button/Button";
import Badge from "@/shared/components/Badge/Badge";
import { REPORT_NO_EVIDENCE, reportAnswer } from "../../domain/reportValue";
import "./ResponseReportField.css";

function ReportPhoto({ attachment, onUrlExpired }) {
  const [broken, setBroken] = useState(false);

  if (broken) {
    return (
      <li className="response-report-field__photo response-report-field__photo--broken">
        <span className="text-small">La foto no cargó o el enlace venció.</span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setBroken(false);
            onUrlExpired?.();
          }}
        >
          Actualizar foto
        </Button>
      </li>
    );
  }

  return (
    <li className="response-report-field__photo">
      <a
        href={attachment.url}
        target="_blank"
        rel="noreferrer"
        className="response-report-field__photo-link"
      >
        <img
          src={attachment.url}
          alt={`Evidencia: ${attachment.filename}`}
          className="response-report-field__photo-image"
          onError={() => setBroken(true)}
        />
      </a>
      <span className="response-report-field__photo-name text-small">
        {attachment.filename}
      </span>
    </li>
  );
}

function AttachmentList({ attachments, onUrlExpired }) {
  if (attachments.length === 0) return null;
  return (
    <ul
      className="response-report-field__photos"
      aria-label="Evidencias adjuntas"
    >
      {attachments.map((attachment) => (
        <ReportPhoto
          key={`${attachment.id}-${attachment.url}`}
          attachment={attachment}
          onUrlExpired={onUrlExpired}
        />
      ))}
    </ul>
  );
}

export default function ResponseReportField({
  field,
  value,
  attachments,
  onUrlExpired,
}) {
  const answer = reportAnswer(field, value, attachments.length);
  const hasSeparateEvidence =
    field.type !== FIELD_TYPES.PHOTO && field.allow_evidence;

  return (
    <article className="response-report-field">
      <div className="response-report-field__heading">
        <h3>{field.label}</h3>
        {field.required && <Badge tone="neutral">Obligatorio</Badge>}
      </div>

      <div className="response-report-field__answer">
        <span className="response-report-field__answer-label">Respuesta</span>
        <p
          className={
            answer.unanswered ? "response-report-field__empty" : undefined
          }
        >
          {answer.text}
        </p>
      </div>

      {field.type === FIELD_TYPES.PHOTO && (
        <AttachmentList attachments={attachments} onUrlExpired={onUrlExpired} />
      )}

      {hasSeparateEvidence && (
        <div className="response-report-field__evidence">
          <span className="response-report-field__answer-label">
            Evidencia asociada
          </span>
          {attachments.length > 0 ? (
            <AttachmentList
              attachments={attachments}
              onUrlExpired={onUrlExpired}
            />
          ) : (
            <p className="response-report-field__empty">{REPORT_NO_EVIDENCE}</p>
          )}
        </div>
      )}
    </article>
  );
}
