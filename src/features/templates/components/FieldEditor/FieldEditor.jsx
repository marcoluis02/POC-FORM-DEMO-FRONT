import { ChevronDownIcon, ChevronUpIcon, DeleteIcon } from 'lucide-animated';
import Button from '@/shared/components/Button/Button';
import AnimatedIcon from '@/shared/components/AnimatedIcon/AnimatedIcon';
import Checkbox from '@/shared/components/Checkbox/Checkbox';
import Input from '@/shared/components/Input/Input';
import Select from '@/shared/components/Select/Select';
import {
  FIELD_TYPE_OPTIONS,
  answerPreview,
  createEmptyOption,
  supportsOptions,
  supportsUnit,
} from '../../domain/fieldTypes';
import { TEMPLATE_LIMITS } from '../../domain/templateSchema';
import { MOVE_DIRECTION } from '../../domain/templateEditorReducer';
import './FieldEditor.css';

// Una pregunta del formulario. errors: { label, type, unit, options } con el mensaje de cada dato.
export default function FieldEditor({
  field,
  number,
  sectionNumber,
  isFirst,
  isLast,
  canRemove,
  errors = {},
  disabled = false,
  onChange,
  onMove,
  onRemove,
}) {
  const showUnit = supportsUnit(field.type);
  const showChoices = supportsOptions(field.type);
  const choices = field.options ?? [];
  const canAddChoice = choices.length < TEMPLATE_LIMITS.maxOptions;
  const canRemoveChoice = choices.length > TEMPLATE_LIMITS.minOptions;

  function updateChoice(index, changes) {
    onChange({
      options: choices.map((option, optionIndex) =>
        optionIndex === index ? { ...option, ...changes } : option,
      ),
    });
  }

  function addChoice() {
    if (!canAddChoice) return;
    onChange({ options: [...choices, createEmptyOption()] });
  }

  function removeChoice(index) {
    if (!canRemoveChoice) return;
    onChange({ options: choices.filter((_, optionIndex) => optionIndex !== index) });
  }

  return (
    <li className="field-editor">
      <div className="field-editor__write">
        <span className="field-editor__index">
          {sectionNumber}.{number}
        </span>
        <div className="field-editor__question">
          <Input
            label="Pregunta"
            placeholder="Escribe la pregunta"
            value={field.label}
            maxLength={TEMPLATE_LIMITS.labelMaxLength}
            error={errors.label}
            disabled={disabled}
            onChange={(event) => onChange({ label: event.target.value })}
          />
        </div>
        <div className="field-editor__actions">
          <Button
            variant="ghost"
            size="sm"
            className="field-editor__icon"
            onClick={() => onMove(MOVE_DIRECTION.UP)}
            disabled={disabled || isFirst}
            aria-label={`Subir pregunta ${number}`}
          >
            <AnimatedIcon icon={ChevronUpIcon} size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="field-editor__icon"
            onClick={() => onMove(MOVE_DIRECTION.DOWN)}
            disabled={disabled || isLast}
            aria-label={`Bajar pregunta ${number}`}
          >
            <AnimatedIcon icon={ChevronDownIcon} size={16} />
          </Button>
          {canRemove && (
            <Button
              variant="ghost-danger"
              size="sm"
              className="field-editor__icon"
              onClick={onRemove}
              disabled={disabled}
              aria-label={`Eliminar pregunta ${number}`}
            >
              <AnimatedIcon icon={DeleteIcon} size={16} />
            </Button>
          )}
        </div>
      </div>
      <div className="field-editor__meta">
        <div className="field-editor__type">
          <Select
            label="Tipo de respuesta"
            options={FIELD_TYPE_OPTIONS}
            placeholder=""
            value={field.type}
            error={errors.type}
            disabled={disabled}
            onChange={(event) => onChange({ type: event.target.value })}
          />
        </div>
        <div className="field-editor__required-line">
          <Checkbox
            className="field-editor__required"
            label="Obligatorio"
            checked={field.required}
            disabled={disabled}
            onChange={(event) => onChange({ required: event.target.checked })}
          />
        </div>
        <Checkbox
          className="field-editor__evidence"
          label="Permitir foto de evidencia"
          checked={Boolean(field.allow_evidence)}
          disabled={disabled}
          onChange={(event) => onChange({ allow_evidence: event.target.checked })}
        />
      </div>

      <p className="field-editor__preview" aria-hidden="true">
        {answerPreview(field.type)}
      </p>

      {showUnit && (
        <div className="field-editor__grid">
          <Input
            label="Unidad (opcional)"
            hint="Ej. °F, kg, psi"
            value={field.unit}
            maxLength={TEMPLATE_LIMITS.unitMaxLength}
            error={errors.unit}
            disabled={disabled}
            onChange={(event) => onChange({ unit: event.target.value })}
          />
        </div>
      )}

      {showChoices && (
        <div className="field-editor__choices">
          <div className="field-editor__choices-header">
            <span className="field-editor__choices-title">Opciones de la lista</span>
            {canAddChoice && (
              <Button
                variant="ghost"
                size="sm"
                onClick={addChoice}
                disabled={disabled}
                aria-label={`Agregar opción a la pregunta ${number}`}
              >
                + Agregar opción
              </Button>
            )}
          </div>
          {errors.options && (
            <p className="field-editor__choices-error" role="alert">
              {errors.options}
            </p>
          )}
          <ol className="field-editor__choices-list">
            {choices.map((option, index) => (
              <li key={index} className="field-editor__choice">
                <Input
                  label={`Opción ${index + 1}`}
                  placeholder="Ej. Bueno"
                  value={option.label}
                  maxLength={TEMPLATE_LIMITS.optionLabelMaxLength}
                  disabled={disabled}
                  required
                  onChange={(event) => {
                    const text = event.target.value;
                    updateChoice(index, { label: text, value: text });
                  }}
                />
                {canRemoveChoice && (
                  <Button
                    variant="ghost-danger"
                    size="sm"
                    onClick={() => removeChoice(index)}
                    disabled={disabled}
                    aria-label={`Eliminar opción ${index + 1} de la pregunta ${number}`}
                  >
                    Quitar
                  </Button>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

    </li>
  );
}
