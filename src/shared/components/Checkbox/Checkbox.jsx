import { useId } from 'react';
import { classNames } from '@/shared/utils/classNames';
import './Checkbox.css';

export default function Checkbox({ label, hint, error, id, className, ...rest }) {
  const autoId = useId();
  const checkboxId = id ?? autoId;
  const hintId = hint ? `${checkboxId}-hint` : undefined;
  const errorId = error ? `${checkboxId}-error` : undefined;

  return (
    <div className={classNames('checkbox', className)}>
      <label htmlFor={checkboxId} className="checkbox__row">
        <input
          id={checkboxId}
          type="checkbox"
          className="checkbox__input"
          aria-invalid={Boolean(error)}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          {...rest}
        />
        <span className="checkbox__label">{label}</span>
      </label>
      {hint && (
        <p id={hintId} className="checkbox__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="checkbox__error">
          {error}
        </p>
      )}
    </div>
  );
}
