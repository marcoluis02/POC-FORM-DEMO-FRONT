import { useId } from 'react';
import { classNames } from '@/shared/utils/classNames';
import './FormField.css';

// Envoltura común de los campos: etiqueta, ayuda y error con sus ids para accesibilidad.
// children recibe { id, describedBy, invalid } para conectarlos al control.
export default function FormField({
  label,
  hint,
  error,
  required = false,
  requiredMark = 'badge',
  labelHidden = false,
  id,
  children,
}) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={classNames('form-field', labelHidden && 'form-field--label-hidden')}>
      <label htmlFor={fieldId} className={classNames('form-field__label', labelHidden && 'visually-hidden')}>
        {label}
        {required && requiredMark === 'asterisk' && (
          <span className="form-field__asterisk" aria-hidden="true">
            *
          </span>
        )}
        {required && requiredMark !== 'asterisk' && <span className="form-field__required">Obligatorio</span>}
      </label>
      {hint && (
        <p id={hintId} className="form-field__hint">
          {hint}
        </p>
      )}
      {children({ id: fieldId, describedBy, invalid: Boolean(error) })}
      {error && (
        <p id={errorId} className="form-field__error">
          {error}
        </p>
      )}
    </div>
  );
}
