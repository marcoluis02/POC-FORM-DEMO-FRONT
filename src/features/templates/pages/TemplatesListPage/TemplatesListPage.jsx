import { useState } from 'react';
import { PlusIcon } from 'lucide-animated';
import Button from '@/shared/components/Button/Button';
import AnimatedIcon from '@/shared/components/AnimatedIcon/AnimatedIcon';
import EmptyState from '@/shared/components/EmptyState/EmptyState';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import LoaderModal from '@/shared/components/LoaderModal/LoaderModal';
import { useAnimatedIcon } from '@/shared/hooks/useAnimatedIcon';
import CreateTemplateChoice from '../../components/CreateTemplateChoice/CreateTemplateChoice';
import TemplateListItem from '../../components/TemplateListItem/TemplateListItem';
import { useTemplatesList } from '../../hooks/useTemplatesList';
import './TemplatesListPage.css';

function CreateTemplateButton({ onClick, className }) {
  const plus = useAnimatedIcon();
  return (
    <Button
      className={className}
      aria-label="+ Crear plantilla"
      onClick={onClick}
      onMouseEnter={plus.onMouseEnter}
      onMouseLeave={plus.onMouseLeave}
      onFocus={plus.onFocus}
      onBlur={plus.onBlur}
    >
      <AnimatedIcon icon={PlusIcon} iconRef={plus.ref} size={18} />
      Crear plantilla
    </Button>
  );
}

function TemplatesListContent({ onCreate, templates, list }) {
  const [query, setQuery] = useState('');
  const normalized = query.trim().toLowerCase();
  const visible = templates.filter(
    (template) => !normalized || template.name.toLowerCase().includes(normalized),
  );
  if (templates.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay plantillas"
        message="Crea la primera para poder llenar formularios."
        action={<CreateTemplateButton onClick={onCreate} />}
      />
    );
  }

  return (
    <>
      <div className="templates-list__toolbar">
        <input
          className="templates-list__search"
          type="search"
          value={query}
          placeholder="Buscar por título..."
          aria-label="Buscar por título"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {visible.length === 0 ? (
        <EmptyState title="Sin coincidencias" message="Prueba con otro título." />
      ) : (
        <ul className="templates-list__items">
          {visible.map((template) => (
            <TemplateListItem key={template.id} template={template} />
          ))}
        </ul>
      )}

      {list.isFetchNextPageError && (
        <p className="templates-list__error" role="alert">
          {list.error.message}
        </p>
      )}
      {list.hasNextPage && (
        <div className="templates-list__more">
          <Button variant="secondary" onClick={() => list.fetchNextPage()} loading={list.isFetchingNextPage}>
            Ver más plantillas
          </Button>
        </div>
      )}
    </>
  );
}

export default function TemplatesListPage() {
  const [choiceOpen, setChoiceOpen] = useState(false);
  const openChoice = () => setChoiceOpen(true);
  const list = useTemplatesList();

  return (
    <div className="templates-list">
      <header className="templates-list__header">
        <div className="templates-list__intro">
          <p className="templates-list__eyebrow">Inicio</p>
          <h1 className="templates-list__title">Tus plantillas</h1>
          <p className="templates-list__subtitle">Elige una para llenarla, o crea otra.</p>
        </div>
        <CreateTemplateButton className="templates-list__create" onClick={openChoice} />
      </header>

      <LoaderModal open={list.isPending} label="Cargando plantillas..." />
      {list.isError && !list.data && (
        <ErrorState
          title="No pudimos cargar las plantillas"
          message={list.error.message}
          onRetry={() => list.refetch()}
          retrying={list.isRefetching}
        />
      )}
      {list.data && <TemplatesListContent onCreate={openChoice} templates={list.data} list={list} />}
      <CreateTemplateChoice open={choiceOpen} onClose={() => setChoiceOpen(false)} />
    </div>
  );
}
