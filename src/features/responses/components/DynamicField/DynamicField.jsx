import { FIELD_TYPES } from '@/features/templates/domain/fieldTypes';
import Checkbox from '@/shared/components/Checkbox/Checkbox';
import Input from '@/shared/components/Input/Input';
import RadioGroup from '@/shared/components/RadioGroup/RadioGroup';
import Textarea from '@/shared/components/Textarea/Textarea';
import { ANSWER_LIMITS, YES_NO_NA_OPTIONS } from '../../domain/answerRules';
import PhotoField from '../PhotoField/PhotoField';
import SignaturePlaceholderField from '../SignaturePlaceholderField/SignaturePlaceholderField';
import './DynamicField.css';

function AnswerControl({ field, value, error, disabled, onChange }) {
  const common = { label: field.label, required: field.required, error, disabled };

  switch (field.type) {
    case FIELD_TYPES.YES_NO_NA:
      return (
        <RadioGroup {...common} options={YES_NO_NA_OPTIONS} value={value} onChange={onChange} />
      );
    case FIELD_TYPES.SELECT:
      return (
        <RadioGroup
          {...common}
          options={field.options ?? []}
          value={value}
          onChange={onChange}
        />
      );
    case FIELD_TYPES.CHECKBOX:
      return (
        <Checkbox
          label={field.label}
          hint={field.required ? 'Obligatorio: debes marcar esta casilla.' : undefined}
          error={error}
          disabled={disabled}
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
      );
    case FIELD_TYPES.NUMBER:
      return (
        <Input
          {...common}
          type="number"
          inputMode="decimal"
          step="any"
          unit={field.unit}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case FIELD_TYPES.DATE:
      return (
        <Input
          {...common}
          type="date"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    case FIELD_TYPES.LONG_TEXT:
      return (
        <Textarea
          {...common}
          maxLength={ANSWER_LIMITS.longTextMaxLength}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
    default:
      return (
        <Input
          {...common}
          maxLength={ANSWER_LIMITS.shortTextMaxLength}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value)}
        />
      );
  }
}

// Una pregunta del formulario. photos: { list, uploading, disabled, onUpload, onDelete, onUrlExpired }
export default function DynamicField({ field, value, error, readOnly, photos, onChange }) {
  const disabled = readOnly || photos.disabled;
  const photoProps = {
    attachments: photos.list,
    readOnly,
    uploading: photos.uploading,
    disabled,
    onUpload: (file) => photos.onUpload(field, file),
    onDelete: photos.onDelete,
    onUrlExpired: photos.onUrlExpired,
  };

  if (field.type === FIELD_TYPES.SIGNATURE_PLACEHOLDER) {
    return <SignaturePlaceholderField label={field.label} />;
  }
  if (field.type === FIELD_TYPES.PHOTO) {
    return (
      <PhotoField {...photoProps} label={field.label} required={field.required} error={error} />
    );
  }

  return (
    <div className="dynamic-field">
      <AnswerControl
        field={field}
        value={value}
        error={error}
        disabled={disabled}
        onChange={(next) => onChange(field.id, next)}
      />
      {field.allow_evidence && (
        <div className="dynamic-field__evidence">
          <PhotoField
            {...photoProps}
            label="Foto de evidencia"
            hint="Opcional. Toma una foto que muestre lo que contestaste."
          />
        </div>
      )}
    </div>
  );
}
