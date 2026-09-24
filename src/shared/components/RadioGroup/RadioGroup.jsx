import { useId } from 'react';
import { classNames } from '@/shared/utils/classNames';
import '@/shared/components/FormField/FormField.css';
import './RadioGroup.css';

// Opciones grandes tipo botón para elegir una sola. Usa la etiqueta y errores de FormField.
// options: [{ value, label }]
export default function RadioGroup({
  label,
  hint,
  error,
  required = false,
  options,
  value,
  disabled = false,
  onChange,
}) {
  const groupId = useId();
  const hintId = hint ? `${groupId}-hint` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;

  return (
    <fieldset
      className="radio-group"
      aria-invalid={Boolean(error)}
      aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
    >
      <legend className="form-field__label">
        {label}
        {required && <span className="form-field__required">Obligatorio</span>}
      </legend>
      {hint && (
        <p id={hintId} className="form-field__hint">
          {hint}
        </p>
      )}
      <div className="radio-group__options">
        {options.map((option) => (
          <label
            key={option.value}
            className={classNames(
              'radio-group__option',
              value === option.value && 'radio-group__option--selected',
              disabled && 'radio-group__option--disabled',
            )}
          >
            <input
              type="radio"
              className="visually-hidden"
              name={groupId}
              value={option.value}
              checked={value === option.value}
              disabled={disabled}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className="form-field__error">
          {error}
        </p>
      )}
    </fieldset>
  );
}
