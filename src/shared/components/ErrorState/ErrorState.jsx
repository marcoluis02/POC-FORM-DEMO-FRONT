import Button from '@/shared/components/Button/Button';
import './ErrorState.css';

export default function ErrorState({
  title = 'Algo salió mal',
  message,
  onRetry,
  retryLabel = 'Intentar de nuevo',
  retrying = false,
}) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon" aria-hidden="true">
        !
      </span>
      <div className="error-state__content">
        <h3 className="error-state__title">{title}</h3>
        {message && <p className="error-state__message">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} loading={retrying}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
