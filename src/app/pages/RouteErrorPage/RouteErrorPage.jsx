import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import './RouteErrorPage.css';

// Se muestra si una pantalla truena al renderizar, en lugar de dejar la página en blanco
export default function RouteErrorPage() {
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="route-error-page">
      <ErrorState
        title="Esta pantalla tuvo un problema"
        message="Recarga la página. Si el problema sigue, avisa al equipo de soporte."
        retryLabel="Recargar página"
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}
