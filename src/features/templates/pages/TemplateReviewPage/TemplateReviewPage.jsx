import { useCallback, useMemo, useReducer, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { ROUTES, paths } from '@/app/router/routes';
import Button from '@/shared/components/Button/Button';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import { useConfirm } from '@/shared/components/ConfirmModal/useConfirm';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import ErrorSummary from '@/shared/components/ErrorSummary/ErrorSummary';
import Loader from '@/shared/components/Loader/Loader';
import LoaderModal from '@/shared/components/LoaderModal/LoaderModal';
import { importWarningMessage } from '@/shared/domain/importContract';
import { IMPORT_STATUS } from '@/shared/domain/importStatus';
import { useImport } from '@/shared/hooks/useImport';
import { useToast } from '@/shared/components/Toast/useToast';
import { useLocalFilePreview } from '@/shared/hooks/useLocalFilePreview';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
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
import { validateFormDefinition, validateFormDefinitionInput } from '../../domain/templateSchema';
import { TEMPLATE_SAVE_PHASE, useSaveTemplate } from '../../hooks/useSaveTemplate';
import { useTemplate } from '../../hooks/useTemplate';
import './TemplateReviewPage.css';

function initialDraftFor({ template, sourceImport }) {
  if (template) return draftFromDefinition(template.current_version.definition);
  if (sourceImport) return draftFromDefinition(sourceImport.draft_json);
  return createEmptyDraft();
}

const FILE_NOTE = ' También se guardará el documento original que elegiste.';
const IMPORT_NOTE = ' La plantilla quedará ligada al documento original que generó esta propuesta.';
const SOURCE_IMPORT_NOT_READY = 'source_import_not_ready';

const MOBILE_QUERY = '(max-width: 720px)';
const MOBILE_STEP_COUNT = 3;
const NAME_STEP = 0;
const PHOTO_STEP = 1;
const CONTENT_STEP = 2;
const MOBILE_STEP_TITLES = ['Nombre del formulario (obligatorio)', 'Foto (opcional)', 'Contenido'];
const TITLE_REQUIRED = 'El formulario necesita un título.';

function stepOfFirstError(errors) {
  if (errors.some((error) => error.path === 'title')) return NAME_STEP;
  return CONTENT_STEP;
}

const SAVE_LOADER_LABEL = Object.freeze({
  [TEMPLATE_SAVE_PHASE.UPLOADING_DOCUMENT]: 'Subiendo el documento...',
  [TEMPLATE_SAVE_PHASE.PROCESSING_DOCUMENT]: 'Procesando el documento...',
  [TEMPLATE_SAVE_PHASE.SAVING_DEFINITION]: 'Guardando la plantilla...',
});

function saveConfirmation(template, { hasFile, hasSourceImport }) {
  const fileNote = hasFile ? FILE_NOTE : hasSourceImport ? IMPORT_NOTE : '';
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

function ImportWarnings({ warnings }) {
  if (!warnings?.length) return null;
  return (
    <section className="template-review__warnings" aria-labelledby="ai-warnings-title">
      <h2 id="ai-warnings-title">Revisa estos puntos detectados por la IA</h2>
      <ul>
        {warnings.map((warning, index) => (
          <li key={`${typeof warning === 'string' ? warning : warning.code || 'warning'}-${index}`}>
            {importWarningMessage(warning)}
          </li>
        ))}
      </ul>
    </section>
  );
}

function TemplateReviewWorkspace({ template, sourceImport = null }) {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const summaryRef = useRef(null);
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [step, setStep] = useState(NAME_STEP);
  const isNew = !template;
  const fromAi = Boolean(sourceImport);

  const [draft, dispatch] = useReducer(
    templateEditorReducer,
    { template, sourceImport },
    initialDraftFor,
  );
  const [initialPayload] = useState(() => JSON.stringify(draftToPayload(draft)));
  const [errors, setErrors] = useState([]);
  const [sourceImportProblem, setSourceImportProblem] = useState('');
  const saveTemplate = useSaveTemplate(template?.id);
  const original = useLocalFilePreview();

  const hasChanges = useMemo(
    () => Boolean(original.file) || JSON.stringify(draftToPayload(draft)) !== initialPayload,
    [draft, initialPayload, original.file],
  );
  const { allowNextNavigation } = useUnsavedChangesGuard(hasChanges);
  const errorsByPath = useMemo(() => groupErrorsByPath(errors), [errors]);
  const summaryMessages = useMemo(() => [...new Set(errors.map(describeError))], [errors]);

  // Si ya hubo un intento de guardado con errores, cada edición vuelve a validar
  // el borrador resultante para retirar solo los errores que el usuario ya corrigió.
  // Se hace desde el evento (no desde un effect) para evitar renders en cascada.
  const dispatchDraft = useCallback(
    (action) => {
      const nextDraft = templateEditorReducer(draft, action);
      dispatch(action);
      setSourceImportProblem('');
      setErrors((current) => {
        if (current.length === 0) return current;
        const result = validateFormDefinitionInput(draftToPayload(nextDraft));
        return result.ok ? [] : result.errors;
      });
    },
    [draft],
  );

  const safeStep = Math.min(step, MOBILE_STEP_COUNT - 1);

  const goToStep = (next) => {
    setStep(Math.min(Math.max(next, 0), MOBILE_STEP_COUNT - 1));
    window.scrollTo({ top: 0 });
  };

  const goNext = () => {
    if (safeStep === NAME_STEP && !draft.title.trim()) {
      setErrors([{ path: 'title', message: TITLE_REQUIRED }]);
      return;
    }
    goToStep(safeStep + 1);
  };

  const showErrors = (nextErrors) => {
    setErrors(nextErrors);
    if (mobile) goToStep(stepOfFirstError(nextErrors));
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
    setSourceImportProblem('');

    if (
      !(await confirm(
        saveConfirmation(template, {
          hasFile: Boolean(original.file),
          hasSourceImport: Boolean(sourceImport?.id),
        }),
      ))
    ) {
      return;
    }

    let saved;
    try {
      saved = await saveTemplate.save({
        definition: result.definition,
        file: original.file,
        sourceImportId: sourceImport?.id,
      });
    } catch (error) {
      if (error.code === SOURCE_IMPORT_NOT_READY && sourceImport?.id) {
        setSourceImportProblem(error.message);
        return;
      }
      if (error.isValidationError) {
        showErrors(errorsFromApiDetails(error.details));
      }
      toast.error(error.message);
      return;
    }
    toast.success(isNew ? 'Plantilla creada.' : `Versión ${saved.latest_version} guardada.`);
    allowNextNavigation();
    navigate(paths.templateDetail(saved.id));
  };

  const storedImportId = sourceImport?.id ?? template?.current_version.source_import_id;

  return (
    <div className="template-review">
      <header className="template-review__header">
        <div className="stack">
          <p className="template-review__eyebrow">
            <Link to={ROUTES.templates}>Plantillas</Link>
            <span aria-hidden="true"> / </span>
            {fromAi ? 'Propuesta' : isNew ? 'Nueva plantilla' : 'Editar'}
          </p>
          <h1>
            {fromAi
              ? 'Revisa la plantilla generada'
              : isNew
                ? draft.title.trim()
                  ? `Nueva plantilla: ${draft.title.trim()}`
                  : 'Nueva plantilla'
                : `Editar: ${template.name}`}
          </h1>
          <p className="text-secondary">
            {fromAi
              ? 'Ajusta la propuesta y guarda.'
              : isNew
                ? 'Arma las secciones y guarda.'
                : `Al guardar se crea la versión ${template.latest_version + 1}.`}
          </p>
        </div>
        {!isNew && <span className="template-review__version">Versión {template.latest_version}</span>}
      </header>

      <ImportWarnings warnings={sourceImport?.warnings} />

      {saveTemplate.phase === TEMPLATE_SAVE_PHASE.PROCESSING_DOCUMENT && (
        <section className="template-review__save-status" role="status">
          <strong>Documento subido. Terminando de procesarlo…</strong>
          <p>
            La plantilla se guardará automáticamente en cuanto el documento esté listo. No
            necesitas presionar Guardar otra vez.
          </p>
        </section>
      )}

      {sourceImportProblem && (
        <section className="template-review__import-problem" role="alert">
          <div>
            <strong>El documento todavía no está listo para confirmarse.</strong>
            <p>{sourceImportProblem}</p>
          </div>
          <ButtonLink variant="secondary" to={paths.importDetail(sourceImport.id)}>
            Revisar procesamiento
          </ButtonLink>
        </section>
      )}

      <ErrorSummary
        ref={summaryRef}
        title={`Hay ${summaryMessages.length} dato(s) por revisar`}
        messages={summaryMessages}
      />

      {mobile && (
        <div className="template-review__steps">
          <p className="template-review__steps-label">
            Paso {safeStep + 1} de {MOBILE_STEP_COUNT} · {MOBILE_STEP_TITLES[safeStep]}
          </p>
          <div className="template-review__steps-track">
            <div
              className="template-review__steps-fill"
              style={{ '--step-progress': `${((safeStep + 1) / MOBILE_STEP_COUNT) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="template-review__layout">
        <div className="template-review__original" hidden={mobile && safeStep !== PHOTO_STEP}>
          <OriginalDocumentViewer
            file={original.file}
            fileUrl={original.url}
            storedImportId={storedImportId}
            onSelect={original.select}
            onClear={original.clear}
            disabled={saveTemplate.isPending}
            allowReplace={!fromAi}
          />
        </div>
        <div className="template-review__editor" hidden={mobile && safeStep === PHOTO_STEP}>
          <TemplateEditor
            draft={draft}
            dispatch={dispatchDraft}
            errors={errorsByPath}
            disabled={saveTemplate.isPending}
            showDetails={!mobile || safeStep === NAME_STEP}
            showSections={!mobile || safeStep === CONTENT_STEP}
          />
        </div>
      </div>

      <LoaderModal
        open={saveTemplate.isPending}
        label={SAVE_LOADER_LABEL[saveTemplate.phase] ?? 'Guardando la plantilla...'}
      />
      <footer className={mobile ? 'template-review__footer template-review__footer--steps' : 'template-review__footer'}>
        {!isNew && !hasChanges && (
          <p className="template-review__hint">Haz algún cambio para guardar una nueva versión.</p>
        )}
        <div className="template-review__footer-actions">
          {mobile && safeStep > NAME_STEP ? (
            <Button variant="secondary" size="lg" onClick={() => goToStep(safeStep - 1)}>
              Anterior
            </Button>
          ) : (
            <ButtonLink
              variant="secondary"
              size="lg"
              to={isNew ? ROUTES.templates : paths.templateDetail(template.id)}
            >
              Cancelar
            </ButtonLink>
          )}
          {mobile && safeStep < CONTENT_STEP ? (
            <Button size="lg" onClick={goNext}>
              Siguiente
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleSave}
              disabled={saveTemplate.isPending || (!isNew && !hasChanges)}
            >
              {isNew ? 'Guardar plantilla' : 'Guardar nueva versión'}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}

// Sin templateId crea una plantilla nueva; ?importId carga el borrador generado por IA.
// Con templateId edita la última versión existente.
export default function TemplateReviewPage() {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const importId = !templateId ? searchParams.get('importId') : null;
  const templateQuery = useTemplate(templateId);
  const importQuery = useImport(importId, { poll: true });

  if (templateId) {
    if (templateQuery.isPending) return <LoaderModal open label="Cargando la plantilla..." />;
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

  if (!importId) return <TemplateReviewWorkspace key="new" template={null} />;
  if (importQuery.isPending) return <Loader label="Cargando la propuesta de IA..." fullPage />;
  if (importQuery.isError) {
    return (
      <ErrorState
        title="No pudimos cargar la propuesta"
        message={importQuery.error.message}
        onRetry={() => importQuery.refetch()}
        retrying={importQuery.isFetching}
      />
    );
  }

  const imported = importQuery.data;
  if (imported.status === IMPORT_STATUS.FAILED) {
    return (
      <ErrorState
        title="No pudimos generar una propuesta"
        message={imported.error_message || 'Prueba con otro documento o crea la plantilla manualmente.'}
      />
    );
  }
  if (imported.status !== IMPORT_STATUS.REQUIRES_REVIEW) {
    return <Loader label="El documento todavía se está procesando..." fullPage />;
  }

  const draftResult = validateFormDefinition(imported.draft_json);
  if (!draftResult.ok) {
    return (
      <ErrorState
        title="La propuesta recibida no es válida"
        message="El backend devolvió un borrador que no cumple el contrato de formulario. Vuelve a procesar el documento."
      />
    );
  }

  const sourceImport = { ...imported, draft_json: draftResult.definition };
  return (
    <TemplateReviewWorkspace
      key={`import-${sourceImport.id}`}
      template={null}
      sourceImport={sourceImport}
    />
  );
}
