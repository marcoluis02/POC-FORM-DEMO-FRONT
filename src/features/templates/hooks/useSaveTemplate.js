import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/ApiError';
import { getImport } from '@/shared/api/importsApi';
import { importKeys } from '@/shared/api/importKeys';
import { IMPORT_STATUS, shouldPollImport } from '@/shared/domain/importStatus';
import { useCreateImport } from '@/shared/hooks/useCreateImport';
import { IMPORT_POLL_INTERVAL_MS } from '@/shared/hooks/useImport';
import { useCreateTemplate } from './useCreateTemplate';
import { useCreateTemplateVersion } from './useCreateTemplateVersion';

const IMPORT_READY_TIMEOUT_MS = 120_000;

export const TEMPLATE_SAVE_PHASE = Object.freeze({
  UPLOADING_DOCUMENT: 'uploading_document',
  PROCESSING_DOCUMENT: 'processing_document',
  SAVING_DEFINITION: 'saving_definition',
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function importFailedError(imported) {
  return new ApiError({
    status: 422,
    code: imported.error_code ?? 'source_import_failed',
    message:
      imported.error_message ??
      'No fue posible procesar el documento nuevo. La plantilla todavía no se guardó.',
  });
}

function importWaitTimeoutError() {
  return new ApiError({
    status: 0,
    code: 'source_import_processing_timeout',
    message:
      'El documento sigue procesándose. La plantilla todavía no se guardó; espera unos segundos e intenta de nuevo.',
  });
}

// POST /poc/templates exige que source_import_id ya esté en requires_review.
// Cuando el usuario reemplaza/sube un original al guardar, el POST /imports devuelve received
// y el worker lo procesa de forma asíncrona. Esperamos aquí para que un solo click de Guardar
// complete upload -> procesamiento -> nueva versión, en vez de obligar al usuario a guardar dos veces.
async function waitUntilImportReady(initialImport, refreshImport) {
  let imported = initialImport;
  const deadline = Date.now() + IMPORT_READY_TIMEOUT_MS;

  while (shouldPollImport(imported.status)) {
    if (Date.now() >= deadline) throw importWaitTimeoutError();

    imported = await refreshImport(imported.id);
    if (shouldPollImport(imported.status)) {
      await delay(IMPORT_POLL_INTERVAL_MS);
    }
  }

  if (imported.status === IMPORT_STATUS.FAILED) throw importFailedError(imported);
  if (imported.status !== IMPORT_STATUS.REQUIRES_REVIEW) {
    throw new ApiError({
      status: 422,
      code: 'source_import_not_ready',
      message: 'La importación todavía no está lista para confirmarse.',
    });
  }

  return imported;
}

// Sin templateId crea la plantilla (v1); con templateId crea la siguiente versión.
// Para una revisión de IA sourceImportId ya existe y se reutiliza sin volver a subir el archivo.
// En creación/reemplazo manual con archivo local: sube el import, espera requires_review y luego
// guarda la definición ligada a ese import. Todo ocurre dentro del mismo click de Guardar.
export function useSaveTemplate(templateId) {
  const queryClient = useQueryClient();
  const createImport = useCreateImport();
  const createTemplate = useCreateTemplate();
  const createVersion = useCreateTemplateVersion(templateId);
  const saveDefinition = templateId ? createVersion : createTemplate;
  const [phase, setPhase] = useState(null);

  const refreshImport = async (importId) => {
    const imported = await getImport(importId);
    queryClient.setQueryData(importKeys.detail(importId), imported);
    return imported;
  };

  const save = async ({ definition, file, sourceImportId }) => {
    let resolvedImportId = sourceImportId;

    try {
      if (!resolvedImportId && file) {
        setPhase(TEMPLATE_SAVE_PHASE.UPLOADING_DOCUMENT);
        const createdImport = await createImport.mutateAsync(file);
        resolvedImportId = createdImport.id;

        if (createdImport.status !== IMPORT_STATUS.REQUIRES_REVIEW) {
          setPhase(TEMPLATE_SAVE_PHASE.PROCESSING_DOCUMENT);
          await waitUntilImportReady(createdImport, refreshImport);
        }
      }

      setPhase(TEMPLATE_SAVE_PHASE.SAVING_DEFINITION);
      return await saveDefinition.mutateAsync({ definition, sourceImportId: resolvedImportId });
    } finally {
      setPhase(null);
    }
  };

  return {
    save,
    phase,
    isPending: Boolean(phase) || createImport.isPending || saveDefinition.isPending,
  };
}
