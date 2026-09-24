import { ROUTES } from '@/app/router/routes';
import Button from '@/shared/components/Button/Button';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import EmptyState from '@/shared/components/EmptyState/EmptyState';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import Loader from '@/shared/components/Loader/Loader';
import TemplateListItem from '../../components/TemplateListItem/TemplateListItem';
import { useTemplatesList } from '../../hooks/useTemplatesList';
import './TemplatesListPage.css';

function TemplatesListContent() {
  const {
    data: templates,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useTemplatesList();

  if (isPending) return <Loader label="Cargando plantillas..." fullPage />;
  if (isError && !templates) {
    return (
      <ErrorState
        title="No pudimos cargar las plantillas"
        message={error.message}
        onRetry={() => refetch()}
        retrying={isRefetching}
      />
    );
  }

  if (templates.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay plantillas"
        message="Crea la primera para poder llenar formularios."
        action={<ButtonLink to={ROUTES.templateNew}>+ Crear plantilla</ButtonLink>}
      />
    );
  }

  return (
    <>
      <ul className="templates-list__items">
        {templates.map((template) => (
          <TemplateListItem key={template.id} template={template} />
        ))}
      </ul>
      {isFetchNextPageError && (
        <p className="templates-list__error" role="alert">
          {error.message}
        </p>
      )}
      {hasNextPage && (
        <div className="templates-list__more">
          <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Ver más plantillas
          </Button>
        </div>
      )}
    </>
  );
}

export default function TemplatesListPage() {
  return (
    <div className="templates-list">
      <header className="templates-list__header">
        <div className="stack">
          <h1>Plantillas</h1>
          <p className="text-secondary">Toca una plantilla para ver sus preguntas o editarla.</p>
        </div>
        <ButtonLink to={ROUTES.templateNew} size="lg">
          + Crear plantilla
        </ButtonLink>
      </header>
      <TemplatesListContent />
    </div>
  );
}
