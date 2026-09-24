import FormField from '@/shared/components/FormField/FormField';
import { classNames } from '@/shared/utils/classNames';
import './Select.css';

// options: [{ value, label }]
export default function Select({
  label,
  hint,
  error,
  required,
  id,
  options,
  placeholder = 'Selecciona una opción',
  className,
  ...rest
}) {
  return (
    <FormField label={label} hint={hint} error={error} required={required} id={id}>
      {({ id: selectId, describedBy, invalid }) => (
        <select
          id={selectId}
          className={classNames('form-control', 'select', className)}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}
