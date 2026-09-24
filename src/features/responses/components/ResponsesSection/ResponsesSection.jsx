import { useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/app/router/routes';
import Button from '@/shared/components/Button/Button';
import EmptyState from '@/shared/components/EmptyState/EmptyState';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import Loader from '@/shared/components/Loader/Loader';
import { useToast } from '@/shared/components/Toast/useToast';
import { useCreateResponse } from '../../hooks/useCreateResponse';
import { useResponsesList } from '../../hooks/useResponsesList';
import ResponseListItem from '../ResponseListItem/ResponseListItem';
import StartResponseModal from '../StartResponseModal/StartResponseModal';
import './ResponsesSection.css';

function ResponsesList({ templateId }) {
  const {
    data: responses,
    isPending,
    isError,
    error,
    refetch,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useResponsesList(templateId);

  if (isPending) return <Loader label="Cargando formularios llenados..." />;
  if (isError && !responses) {
    return (
      <ErrorState
        title="No pudimos cargar los formularios llenados"
        message={error.message}
        onRetry={() => refetch()}
        retrying={isRefetching}
      />
    );
  }
  if (responses.length === 0) {
    return (
      <EmptyState
        title="Todavía no se ha llenado ningún formulario"
        message='Presiona "Llenar formulario" para contestar el primero.'
      />
    );
  }

  return (
    <>
      <ul className="responses-section__items">
        {responses.map((response) => (
          <ResponseListItem key={response.id} response={response} />
        ))}
      </ul>
      {isFetchNextPageError && (
        <p className="responses-section__error" role="alert">
          {error.message}
        </p>
      )}
      {hasNextPage && (
        <div className="responses-section__more">
          <Button variant="secondary" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Ver más formularios
          </Button>
        </div>
      )}
    </>
  );
}

// Formularios llenados con esta plantilla y el botón para empezar uno nuevo
export default function ResponsesSection({ templateId, latestVersion }) {
  const navigate = useNavigate();
  const toast = useToast();
  const createResponse = useCreateResponse(templateId);
  const [askingName, setAskingName] = useState(false);

  const handleStart = async (name) => {
    let created;
    try {
      created = await createResponse.mutateAsync(name);
    } catch (error) {
      toast.error(error.message);
      return;
    }
    setAskingName(false);
    toast.success('Formulario creado. Ya puedes contestarlo.');
    navigate(paths.responseDetail(created.id));
  };

  return (
    <section className="card responses-section" aria-labelledby="responses-section-title">
      <div className="responses-section__header">
        <h2 id="responses-section-title" className="responses-section__title">
          Formularios llenados
        </h2>
        <Button onClick={() => setAskingName(true)} disabled={createResponse.isPending}>
          + Llenar formulario
        </Button>
      </div>
      <ResponsesList templateId={templateId} />
      <StartResponseModal
        key={askingName ? 'open' : 'closed'}
        open={askingName}
        latestVersion={latestVersion}
        loading={createResponse.isPending}
        onCancel={() => setAskingName(false)}
        onConfirm={handleStart}
      />
    </section>
  );
}
