import FormField from '@/shared/components/FormField/FormField';
import { classNames } from '@/shared/utils/classNames';
import './Input.css';

export default function Input({ label, hint, error, required, id, unit, className, ...rest }) {
  return (
    <FormField label={label} hint={hint} error={error} required={required} id={id}>
      {({ id: inputId, describedBy, invalid }) => (
        <div className={classNames('input', unit && 'input--with-unit')}>
          <input
            id={inputId}
            className={classNames('form-control', className)}
            aria-invalid={invalid}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            {...rest}
          />
          {unit && <span className="input__unit">{unit}</span>}
        </div>
      )}
    </FormField>
  );
}
