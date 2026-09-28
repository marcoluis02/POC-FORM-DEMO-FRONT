import { ROUTES } from '@/app/router/routes';
import Badge from '@/shared/components/Badge/Badge';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import Loader from '@/shared/components/Loader/Loader';
import { useApiHealth } from '@/shared/hooks/useApiHealth';
import './HomePage.css';

function ServerStatus() {
  const { isPending, isError, error, refetch, isFetching } = useApiHealth();

  if (isPending) return <Loader label="Revisando la conexión con el servidor..." fullPage />;

  if (isError) {
    return (
      <ErrorState
        title="No pudimos conectar con el servidor"
        message={error.message}
        onRetry={() => refetch()}
        retrying={isFetching}
      />
    );
  }

  return (
    <div className="home-page__status">
      <Badge tone="success">Conectado</Badge>
      <p>El servidor y la base de datos están funcionando.</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <section className="home-page stack">
      <header className="stack">
        <h1>Formularios digitales</h1>
        <p className="text-secondary">
          Aquí vas a crear plantillas de revisión y llenar formularios desde tu computadora o
          celular.
        </p>
      </header>
      <article className="card stack" aria-labelledby="digitalize-title">
        <h2 id="digitalize-title" className="home-page__card-title">
          Digitalizar un formato
        </h2>
        <p className="text-secondary">
          Sube un PDF o una foto, o toma una foto desde el celular para preparar una plantilla.
        </p>
        <div className="row">
          <ButtonLink to={ROUTES.importNew} size="lg">
            Digitalizar documento
          </ButtonLink>
        </div>
      </article>

      <article className="card stack" aria-labelledby="templates-title">
        <h2 id="templates-title" className="home-page__card-title">
          Plantillas
        </h2>
        <p className="text-secondary">
          También puedes crear una plantilla manual o consultar las que ya existen.
        </p>
        <div className="row">
          <ButtonLink to={ROUTES.templateNew} size="lg">
            + Crear plantilla
          </ButtonLink>
          <ButtonLink to={ROUTES.templates} variant="secondary" size="lg">
            Ver plantillas
          </ButtonLink>
        </div>
      </article>
      <article className="card stack" aria-labelledby="server-status-title">
        <h2 id="server-status-title" className="home-page__card-title">
          Estado del sistema
        </h2>
        <ServerStatus />
      </article>
    </section>
  );
}
