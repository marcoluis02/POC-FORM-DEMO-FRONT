import { useNavigate } from 'react-router';
import Button from '@/shared/components/Button/Button';
import EmptyState from '@/shared/components/EmptyState/EmptyState';
import { ROUTES } from '@/app/router/routes';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <EmptyState
      title="Esta página no existe"
      message="Revisa la dirección o regresa al inicio."
      action={<Button onClick={() => navigate(ROUTES.home)}>Ir al inicio</Button>}
    />
  );
}
