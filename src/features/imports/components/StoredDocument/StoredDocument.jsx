import { useState } from 'react';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import Loader from '@/shared/components/Loader/Loader';
import { isPdf } from '../../domain/importRules';
import { useImport } from '../../hooks/useImport';
import DocumentPreview from '../DocumentPreview/DocumentPreview';

// Documento ya guardado en el servidor. Si la URL firmada venció, "Intentar de nuevo" pide una nueva.
export default function StoredDocument({ importId }) {
  const importQuery = useImport(importId);
  const [brokenUrl, setBrokenUrl] = useState(null);

  if (importQuery.isPending) return <Loader label="Cargando el documento original..." />;

  const retry = () => importQuery.refetch();
  if (importQuery.isError) {
    return (
      <ErrorState
        title="No pudimos cargar el documento original"
        message={importQuery.error.message}
        onRetry={retry}
        retrying={importQuery.isFetching}
      />
    );
  }

  const stored = importQuery.data;
  if (brokenUrl === stored.original_url) {
    return (
      <ErrorState
        title="No pudimos mostrar el documento"
        message="El enlace pudo haber vencido. Presiona el botón para cargarlo otra vez."
        onRetry={retry}
        retrying={importQuery.isFetching}
      />
    );
  }

  return (
    <DocumentPreview
      url={stored.original_url}
      name={stored.original_filename}
      pdf={isPdf(stored.mime_type)}
      onError={() => setBrokenUrl(stored.original_url)}
    />
  );
}
