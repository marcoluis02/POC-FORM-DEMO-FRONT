import { ROUTES } from '@/app/router/routes';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import EmptyState from '@/shared/components/EmptyState/EmptyState';
import './InspectionsPage.css';

export default function InspectionsPage() {
  return (
    <section className="inspections-page">
      <header className="stack">
        <h1>Inspecciones / Registros</h1>
        <p className="text-secondary">Los formularios llenados están dentro de cada plantilla.</p>
      </header>
      <EmptyState
        title="Abre una plantilla"
        message="Ahí puedes empezar un formulario o ver los que ya se enviaron."
        action={<ButtonLink to={ROUTES.templates}>Ver plantillas</ButtonLink>}
      />
    </section>
  );
}
