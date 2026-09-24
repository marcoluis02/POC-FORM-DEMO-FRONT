import Button from '@/shared/components/Button/Button';
import Checkbox from '@/shared/components/Checkbox/Checkbox';
import Input from '@/shared/components/Input/Input';
import Select from '@/shared/components/Select/Select';
import { FIELD_TYPE_OPTIONS, supportsUnit } from '../../domain/fieldTypes';
import { TEMPLATE_LIMITS } from '../../domain/templateSchema';
import { MOVE_DIRECTION } from '../../domain/templateEditorReducer';
import './FieldEditor.css';

// Una pregunta del formulario. errors: { label, type, unit } con el mensaje de cada dato.
export default function FieldEditor({
  field,
  number,
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

  return (
    <li className="field-editor">
      <div className="field-editor__header">
        <span className="field-editor__number">Pregunta {number}</span>
        <div className="field-editor__actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMove(MOVE_DIRECTION.UP)}
            disabled={disabled || isFirst}
            aria-label={`Subir pregunta ${number}`}
          >
            ↑ Subir
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMove(MOVE_DIRECTION.DOWN)}
            disabled={disabled || isLast}
            aria-label={`Bajar pregunta ${number}`}
          >
            ↓ Bajar
          </Button>
          {canRemove && (
            <Button
              variant="ghost-danger"
              size="sm"
              onClick={onRemove}
              disabled={disabled}
              aria-label={`Eliminar pregunta ${number}`}
            >
              Eliminar
            </Button>
          )}
        </div>
      </div>

      <Input
        label="Pregunta"
        placeholder="Ej. ¿Se limpió el filtro?"
        value={field.label}
        maxLength={TEMPLATE_LIMITS.labelMaxLength}
        error={errors.label}
        disabled={disabled}
        required
        onChange={(event) => onChange({ label: event.target.value })}
      />

      <div className="field-editor__grid">
        <Select
          label="Tipo de respuesta"
          options={FIELD_TYPE_OPTIONS}
          placeholder=""
          value={field.type}
          error={errors.type}
          disabled={disabled}
          onChange={(event) => onChange({ type: event.target.value })}
        />
        {showUnit && (
          <Input
            label="Unidad (opcional)"
            hint="Ej. °F, kg, psi"
            value={field.unit}
            maxLength={TEMPLATE_LIMITS.unitMaxLength}
            error={errors.unit}
            disabled={disabled}
            onChange={(event) => onChange({ unit: event.target.value })}
          />
        )}
      </div>

      <div className="field-editor__options">
        <Checkbox
          label="Es obligatoria"
          checked={field.required}
          disabled={disabled}
          onChange={(event) => onChange({ required: event.target.checked })}
        />
        <Checkbox
          label="Permitir foto de evidencia"
          checked={field.allow_evidence}
          disabled={disabled}
          onChange={(event) => onChange({ allow_evidence: event.target.checked })}
        />
      </div>
    </li>
  );
}
