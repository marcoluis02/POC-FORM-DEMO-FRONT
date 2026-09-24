import { ROUTES } from '@/app/router/routes';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import EmptyState from '@/shared/components/EmptyState/EmptyState';
import ErrorState from '@/shared/components/ErrorState/ErrorState';

const NOT_FOUND_STATUSES = new Set([404, 422]);

// 404 o id mal escrito en la URL: el formulario no existe. Otro error: se puede reintentar.
export default function ResponseLoadError({ error, onRetry, retrying }) {
  if (NOT_FOUND_STATUSES.has(error.status)) {
    return (
      <EmptyState
        title="No encontramos este formulario"
        message="Revisa que el enlace esté completo o regresa a las plantillas."
        action={<ButtonLink to={ROUTES.templates}>Ir a plantillas</ButtonLink>}
      />
    );
  }

  return (
    <ErrorState
      title="No pudimos cargar el formulario"
      message={error.message}
      onRetry={onRetry}
      retrying={retrying}
    />
  );
}
