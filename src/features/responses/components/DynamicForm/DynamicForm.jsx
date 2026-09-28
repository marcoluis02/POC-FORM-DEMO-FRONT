import { useMemo } from "react";
import { orderedSections } from "../../domain/answerRules";
import DynamicField from "../DynamicField/DynamicField";
import "./DynamicForm.css";

const NO_PHOTOS = [];

function groupByField(attachments) {
  const groups = {};
  for (const attachment of attachments) {
    (groups[attachment.field_id] ??= []).push(attachment);
  }
  return groups;
}

// Arma el formulario a partir de la definición de la plantilla.
// photoActions: { uploadingFieldId, disabled, onUpload(field, file), onDelete(attachment), onUrlExpired }
export default function DynamicForm({
  definition,
  answers,
  errors,
  attachments,
  readOnly = false,
  photoActions,
  onAnswerChange,
}) {
  const sections = useMemo(() => orderedSections(definition), [definition]);
  const photosByField = useMemo(() => groupByField(attachments), [attachments]);

  return (
    <div className="dynamic-form">
      {sections.map((section, index) => (
        <section
          key={section.id}
          className="card dynamic-form__section"
          aria-labelledby={`answer-section-${section.id}`}
        >
          <div className="dynamic-form__heading">
            <span className="dynamic-form__index">{index + 1}</span>
            <h2
              id={`answer-section-${section.id}`}
              className="dynamic-form__section-title"
            >
              {section.title}
            </h2>
          </div>
          <ol className="dynamic-form__fields">
            {section.fields.map((field, fieldIndex) => (
              <li
                key={field.id}
                id={`field-${field.id}`}
                className="dynamic-form__field"
                tabIndex={errors[field.id] ? -1 : undefined}
                aria-invalid={errors[field.id] ? true : undefined}
              >
                <DynamicField
                  number={`${index + 1}.${fieldIndex + 1}`}
                  field={field}
                  value={answers[field.id]}
                  error={errors[field.id]}
                  readOnly={readOnly}
                  onChange={onAnswerChange}
                  photos={{
                    list: photosByField[field.id] ?? NO_PHOTOS,
                    uploading: photoActions.uploadingFieldId === field.id,
                    disabled: photoActions.disabled,
                    onUpload: photoActions.onUpload,
                    onDelete: photoActions.onDelete,
                    onUrlExpired: photoActions.onUrlExpired,
                  }}
                />
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
