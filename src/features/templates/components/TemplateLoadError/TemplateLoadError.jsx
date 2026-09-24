import { ROUTES } from '@/app/router/routes';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import EmptyState from '@/shared/components/EmptyState/EmptyState';
import ErrorState from '@/shared/components/ErrorState/ErrorState';

const NOT_FOUND_STATUSES = new Set([404, 422]);

// 404 o id mal escrito en la URL: la plantilla no existe. Otro error: se puede reintentar.
export default function TemplateLoadError({ error, onRetry, retrying }) {
  if (NOT_FOUND_STATUSES.has(error.status)) {
    return (
      <EmptyState
        title="No encontramos esta plantilla"
        message="Revisa que el enlace esté completo o regresa al inicio."
        action={<ButtonLink to={ROUTES.home}>Ir al inicio</ButtonLink>}
      />
    );
  }

  return (
    <ErrorState
      title="No pudimos cargar la plantilla"
      message={error.message}
      onRetry={onRetry}
      retrying={retrying}
    />
  );
}
