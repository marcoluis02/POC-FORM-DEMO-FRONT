import { Link } from 'react-router';
import { classNames } from '@/shared/utils/classNames';
import '@/shared/components/Button/Button.css';

// Link con la misma apariencia que Button, para navegar entre pantallas
export default function ButtonLink({
  to,
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}) {
  return (
    <Link
      to={to}
      className={classNames('button', `button--${variant}`, `button--${size}`, className)}
      {...rest}
    >
      <span>{children}</span>
    </Link>
  );
}
