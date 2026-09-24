import { useCreateImport } from '@/shared/hooks/useCreateImport';
import { useCreateTemplate } from './useCreateTemplate';
import { useCreateTemplateVersion } from './useCreateTemplateVersion';

// Sin templateId crea la plantilla (v1); con templateId crea la siguiente versión.
// Si hay archivo, primero se sube el documento original y luego se guarda la plantilla ligada a él.
export function useSaveTemplate(templateId) {
  const createImport = useCreateImport();
  const createTemplate = useCreateTemplate();
  const createVersion = useCreateTemplateVersion(templateId);
  const saveDefinition = templateId ? createVersion : createTemplate;

  const save = async ({ definition, file }) => {
    const sourceImportId = file ? (await createImport.mutateAsync(file)).id : undefined;
    return saveDefinition.mutateAsync({ definition, sourceImportId });
  };

  return { save, isPending: createImport.isPending || saveDefinition.isPending };
}
