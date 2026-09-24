import FormField from '@/shared/components/FormField/FormField';
import { classNames } from '@/shared/utils/classNames';
import './Textarea.css';

export default function Textarea({ label, hint, error, required, id, className, ...rest }) {
  return (
    <FormField label={label} hint={hint} error={error} required={required} id={id}>
      {({ id: textareaId, describedBy, invalid }) => (
        <textarea
          id={textareaId}
          className={classNames('form-control', 'textarea', className)}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          {...rest}
        />
      )}
    </FormField>
  );
}
