import { classNames } from '@/shared/utils/classNames';
import './Loader.css';

// Loader único de la app. size="sm" se usa dentro de botones; fullPage ocupa toda la pantalla.
export default function Loader({ label = 'Cargando...', size = 'md', fullPage = false }) {
  return (
    <div
      className={classNames('loader', `loader--${size}`, fullPage && 'loader--page')}
      role="status"
      aria-live="polite"
    >
      <span
        className={classNames('loader__spinner', `loader__spinner--${size}`)}
        aria-hidden="true"
      />
      <span className={size === 'sm' ? 'visually-hidden' : 'loader__label'}>{label}</span>
    </div>
  );
}
