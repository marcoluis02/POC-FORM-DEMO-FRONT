import { useMemo, useReducer, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ROUTES, paths } from '@/app/router/routes';
import Button from '@/shared/components/Button/Button';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import { useConfirm } from '@/shared/components/ConfirmModal/useConfirm';
import ErrorSummary from '@/shared/components/ErrorSummary/ErrorSummary';
import Loader from '@/shared/components/Loader/Loader';
import { useToast } from '@/shared/components/Toast/useToast';
import { useLocalFilePreview } from '@/shared/hooks/useLocalFilePreview';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import OriginalDocumentViewer from '../../components/OriginalDocumentViewer/OriginalDocumentViewer';
import TemplateEditor from '../../components/TemplateEditor/TemplateEditor';
import TemplateLoadError from '../../components/TemplateLoadError/TemplateLoadError';
import { createEmptyDraft, draftFromDefinition, draftToPayload } from '../../domain/templateDraft';
import { templateEditorReducer } from '../../domain/templateEditorReducer';
import {
  describeError,
  errorsFromApiDetails,
  groupErrorsByPath,
} from '../../domain/templateErrors';
import { validateFormDefinitionInput } from '../../domain/templateSchema';
import { useSaveTemplate } from '../../hooks/useSaveTemplate';
import { useTemplate } from '../../hooks/useTemplate';
import './TemplateReviewPage.css';

function initialDraftFor(template) {
  return template ? draftFromDefinition(template.current_version.definition) : createEmptyDraft();
}

const FILE_NOTE = ' También se guardará el documento original que elegiste.';

function saveConfirmation(template, hasFile) {
  const fileNote = hasFile ? FILE_NOTE : '';
  if (!template) {
    return {
      title: '¿Guardar la plantilla?',
      message: `Se va a crear la plantilla con su versión 1 y ya se podrá usar para llenar formularios.${fileNote}`,
      confirmLabel: 'Sí, guardar',
    };
  }
  return {
    title: `¿Guardar como versión ${template.latest_version + 1}?`,
    message: `La versión ${template.latest_version} no se modifica. Los formularios ya llenados con ella siguen igual.${fileNote}`,
    confirmLabel: 'Sí, guardar versión',
  };
}

function TemplateReviewWorkspace({ template }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const summaryRef = useRef(null);
  const isNew = !template;

  const [draft, dispatch] = useReducer(templateEditorReducer, template, initialDraftFor);
  const [initialPayload] = useState(() => JSON.stringify(draftToPayload(draft)));
  const [errors, setErrors] = useState([]);
  const saveTemplate = useSaveTemplate(template?.id);
  const original = useLocalFilePreview();

  const hasChanges = useMemo(
    () => Boolean(original.file) || JSON.stringify(draftToPayload(draft)) !== initialPayload,
    [draft, initialPayload, original.file],
  );
  const { allowNextNavigation } = useUnsavedChangesGuard(hasChanges);
  const errorsByPath = useMemo(() => groupErrorsByPath(errors), [errors]);
  const summaryMessages = useMemo(() => [...new Set(errors.map(describeError))], [errors]);

  const showErrors = (nextErrors) => {
    setErrors(nextErrors);
    // Espera a que se pinte el resumen para llevar el foco ahí
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const handleSave = async () => {
    const result = validateFormDefinitionInput(draftToPayload(draft));
    if (!result.ok) {
      showErrors(result.errors);
      toast.error('Revisa los datos marcados en rojo antes de guardar.');
      return;
    }
    setErrors([]);

    if (!(await confirm(saveConfirmation(template, Boolean(original.file))))) return;

    let saved;
    try {
      saved = await saveTemplate.save({ definition: result.definition, file: original.file });
    } catch (error) {
      if (error.isValidationError) showErrors(errorsFromApiDetails(error.details));
      toast.error(error.message);
      return;
    }
    toast.success(isNew ? 'Plantilla creada.' : `Versión ${saved.latest_version} guardada.`);
    allowNextNavigation();
    navigate(paths.templateDetail(saved.id));
  };

  return (
    <div className="template-review">
      <header className="stack">
        <h1>{isNew ? 'Nueva plantilla' : `Editar: ${template.name}`}</h1>
        <p className="text-secondary">
          {isNew
            ? 'Escribe el nombre del formulario, agrega las secciones y las preguntas. Al terminar, presiona "Guardar plantilla".'
            : `Estás editando la versión ${template.latest_version}. Al guardar se crea la versión ${template.latest_version + 1}.`}
        </p>
      </header>

      <ErrorSummary
        ref={summaryRef}
        title={`Hay ${summaryMessages.length} dato(s) por revisar`}
        messages={summaryMessages}
      />

      <div className="template-review__layout">
        <div className="template-review__original">
          <OriginalDocumentViewer
            file={original.file}
            fileUrl={original.url}
            storedImportId={template?.current_version.source_import_id}
            onSelect={original.select}
            onClear={original.clear}
            disabled={saveTemplate.isPending}
          />
        </div>
        <div className="template-review__editor">
          <TemplateEditor
            draft={draft}
            dispatch={dispatch}
            errors={errorsByPath}
            disabled={saveTemplate.isPending}
          />
        </div>
      </div>

      <footer className="template-review__footer">
        {!isNew && !hasChanges && (
          <p className="text-secondary text-small">
            Haz algún cambio para guardar una nueva versión.
          </p>
        )}
        <div className="template-review__footer-actions">
          <ButtonLink
            variant="secondary"
            size="lg"
            to={isNew ? ROUTES.templates : paths.templateDetail(template.id)}
          >
            Cancelar
          </ButtonLink>
          <Button
            size="lg"
            onClick={handleSave}
            loading={saveTemplate.isPending}
            disabled={!isNew && !hasChanges}
          >
            {isNew ? 'Guardar plantilla' : 'Guardar nueva versión'}
          </Button>
        </div>
      </footer>
    </div>
  );
}

// Sin templateId crea una plantilla nueva; con templateId edita la última versión
export default function TemplateReviewPage() {
  const { templateId } = useParams();
  const templateQuery = useTemplate(templateId);

  if (!templateId) return <TemplateReviewWorkspace key="new" template={null} />;
  if (templateQuery.isPending) return <Loader label="Cargando la plantilla..." fullPage />;
  if (templateQuery.isError) {
    return (
      <TemplateLoadError
        error={templateQuery.error}
        onRetry={() => templateQuery.refetch()}
        retrying={templateQuery.isFetching}
      />
    );
  }

  const template = templateQuery.data;
  return <TemplateReviewWorkspace key={template.current_version.id} template={template} />;
}
