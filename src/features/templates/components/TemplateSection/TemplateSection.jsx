import { ChevronDownIcon, ChevronUpIcon, DeleteIcon } from 'lucide-animated';
import Button from '@/shared/components/Button/Button';
import AnimatedIcon from '@/shared/components/AnimatedIcon/AnimatedIcon';
import Input from '@/shared/components/Input/Input';
import FieldEditor from '../FieldEditor/FieldEditor';
import { errorPaths } from '../../domain/templateErrors';
import { MOVE_DIRECTION } from '../../domain/templateEditorReducer';
import { TEMPLATE_LIMITS } from '../../domain/templateSchema';
import './TemplateSection.css';

const FIELD_ERROR_KEYS = ['label', 'type', 'unit', 'options'];

function fieldErrors(errors, sectionIndex, fieldIndex) {
  const mapped = Object.fromEntries(
    FIELD_ERROR_KEYS.map((key) => [key, errors[errorPaths.field(sectionIndex, fieldIndex, key)]]),
  );
  // Si Zod marca options.0.value, etc., se muestra junto al bloque de opciones
  if (!mapped.options) {
    const prefix = `${errorPaths.field(sectionIndex, fieldIndex, 'options')}.`;
    mapped.options = Object.entries(errors).find(([path]) => path.startsWith(prefix))?.[1];
  }
  return mapped;
}

export default function TemplateSection({
  section,
  index,
  isFirst,
  isLast,
  canRemove,
  errors,
  disabled = false,
  onTitleChange,
  onMove,
  onRemove,
  onAddField,
  onFieldChange,
  onFieldMove,
  onFieldRemove,
}) {
  const number = index + 1;
  const titleId = `section-${section.uid}-heading`;
  const sectionError = errors[errorPaths.sectionFields(index)] ?? errors[errorPaths.section(index)];
  const canAddField = section.fields.length < TEMPLATE_LIMITS.maxFieldsPerSection;

  return (
    <section className="template-section card" aria-labelledby={titleId}>
      <div className="template-section__header">
        <div className="template-section__header-row">
          <h3 id={titleId} className="template-section__heading">
            <span className="template-section__index">{number}</span>
            <span className="template-section__name">Sección {number}</span>
          </h3>
          <span className="template-section__count">{section.fields.length} preguntas</span>
        </div>
        <div className="template-section__title">
          <Input
            label="Nombre de la sección"
            placeholder="Escribe el nombre de la sección"
            value={section.title}
            maxLength={TEMPLATE_LIMITS.titleMaxLength}
            error={errors[errorPaths.sectionTitle(index)]}
            disabled={disabled}
            onChange={(event) => onTitleChange(event.target.value)}
          />
          <div className="template-section__actions">
            <Button
              variant="ghost"
              size="sm"
              className="template-section__icon"
              onClick={() => onMove(MOVE_DIRECTION.UP)}
              disabled={disabled || isFirst}
              aria-label={`Subir sección ${number}`}
            >
              <AnimatedIcon icon={ChevronUpIcon} size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="template-section__icon"
              onClick={() => onMove(MOVE_DIRECTION.DOWN)}
              disabled={disabled || isLast}
              aria-label={`Bajar sección ${number}`}
            >
              <AnimatedIcon icon={ChevronDownIcon} size={16} />
            </Button>
            {canRemove && (
              <Button
                variant="ghost-danger"
                size="sm"
                className="template-section__icon"
                onClick={onRemove}
                disabled={disabled}
                aria-label={`Eliminar sección ${number}`}
              >
                <AnimatedIcon icon={DeleteIcon} size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {sectionError && (
        <p className="template-section__error" role="alert">
          {sectionError}
        </p>
      )}

      <ol className="template-section__fields">
        {section.fields.map((field, fieldIndex) => (
          <FieldEditor
            key={field.uid}
            field={field}
            number={fieldIndex + 1}
            sectionNumber={number}
            isFirst={fieldIndex === 0}
            isLast={fieldIndex === section.fields.length - 1}
            canRemove={section.fields.length > 1}
            errors={fieldErrors(errors, index, fieldIndex)}
            disabled={disabled}
            onChange={(changes) => onFieldChange(field.uid, changes)}
            onMove={(direction) => onFieldMove(field.uid, direction)}
            onRemove={() => onFieldRemove(field.uid, fieldIndex + 1)}
          />
        ))}
      </ol>

      {canAddField && (
        <Button variant="secondary" onClick={onAddField} disabled={disabled}>
          + Agregar pregunta
        </Button>
      )}
    </section>
  );
}
