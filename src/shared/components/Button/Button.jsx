import Loader from '@/shared/components/Loader/Loader';
import { classNames } from '@/shared/utils/classNames';
import './Button.css';

// variant: primary | secondary | danger | ghost | ghost-danger    size: sm | md | lg
export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  fullWidth = false,
  disabled = false,
  className,
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      className={classNames(
        'button',
        `button--${variant}`,
        `button--${size}`,
        fullWidth && 'button--full',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader size="sm" label="Procesando" />}
      <span>{children}</span>
    </button>
  );
}
