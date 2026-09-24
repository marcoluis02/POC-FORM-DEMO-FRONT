import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import { env } from '@/app/config/env';
import { paths } from '@/app/router/routes';
import { useTemplateVersion } from '@/features/templates/hooks/useTemplateVersion';
import Badge from '@/shared/components/Badge/Badge';
import Button from '@/shared/components/Button/Button';
import ButtonLink from '@/shared/components/ButtonLink/ButtonLink';
import { useConfirm } from '@/shared/components/ConfirmModal/useConfirm';
import ErrorState from '@/shared/components/ErrorState/ErrorState';
import ErrorSummary from '@/shared/components/ErrorSummary/ErrorSummary';
import Input from '@/shared/components/Input/Input';
import Loader from '@/shared/components/Loader/Loader';
import { useToast } from '@/shared/components/Toast/useToast';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import { formatDateTime } from '@/shared/utils/formatDate';
import DynamicForm from '../../components/DynamicForm/DynamicForm';
import ResponseLoadError from '../../components/ResponseLoadError/ResponseLoadError';
import ResponseStatusBadge from '../../components/ResponseStatusBadge/ResponseStatusBadge';
import {
  ANSWER_LIMITS,
  answersFromValues,
  answersToValues,
  cleanResponseName,
  errorsFromApiDetails,
  errorSummary,
  validateAnswers,
  validateResponseName,
} from '../../domain/answerRules';
import { RESPONSE_STATUS } from '../../domain/responseStatus';
import { useDraftAutosave } from '../../hooks/useDraftAutosave';
import {
  useDeleteAttachment,
  useRefreshResponse,
  useUploadAttachment,
} from '../../hooks/useResponseAttachments';
import { useResponse } from '../../hooks/useResponse';
import { useSaveResponse, useSubmitResponse } from '../../hooks/useSaveResponse';
import './ResponseFillPage.css';

const ALREADY_SUBMITTED_CODE = 'response_already_submitted';
const NAME_ERROR_KEY = 'name';

function hasErrors(errors) {
  return Object.keys(errors).length > 0;
}

function withoutKey(object, key) {
  if (!(key in object)) return object;
  const { [key]: _removed, ...rest } = object;
  return rest;
}

function snapshot(name, values) {
  return JSON.stringify({ name: cleanResponseName(name), values });
}

function buildDraftBody(name, values) {
  const nameProblem = validateResponseName(name);
  if (nameProblem) return null;
  return { name: cleanResponseName(name), values };
}

function ResponseWorkspace({ response, definition }) {
  const confirm = useConfirm();
  const toast = useToast();
  const summaryRef = useRef(null);

  const [name, setName] = useState(response.name);
  const [answers, setAnswers] = useState(() => answersFromValues(response.values));
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    snapshot(response.name, answersToValues(definition, answersFromValues(response.values))),
  );
  const [errors, setErrors] = useState({});

  const saveDraft = useSaveResponse(response.id);
  const submit = useSubmitResponse(response.id);
  const uploadPhoto = useUploadAttachment(response.id);
  const deletePhoto = useDeleteAttachment(response.id);
  const refreshResponse = useRefreshResponse(response.id);

  const isSubmitted = response.status === RESPONSE_STATUS.SUBMITTED;
  const values = useMemo(() => answersToValues(definition, answers), [definition, answers]);
  const payloadKey = snapshot(name, values);
  const hasChanges = !isSubmitted && payloadKey !== savedSnapshot;
  const draftBody = useMemo(() => buildDraftBody(name, values), [name, values]);
  const answersOkForDraft = !hasErrors(
    validateAnswers(definition, answers, response.attachments, { requireAll: false }),
  );
  const canAutosave = Boolean(draftBody) && answersOkForDraft && hasChanges;
  const { allowNextNavigation } = useUnsavedChangesGuard(hasChanges);
  const fieldSummary = useMemo(() => errorSummary(definition, errors), [definition, errors]);
  const summary = useMemo(
    () => (errors[NAME_ERROR_KEY] ? [errors[NAME_ERROR_KEY], ...fieldSummary] : fieldSummary),
    [errors, fieldSummary],
  );
  const saving = saveDraft.isPending || submit.isPending;
  const photoBusy = uploadPhoto.isPending || deletePhoto.isPending;

  const showErrors = (nextErrors) => {
    setErrors(nextErrors);
    // Espera a que se pinte el resumen para llevar el foco ahí
    requestAnimationFrame(() => summaryRef.current?.focus());
  };

  const handleApiError = (error) => {
    if (error.isValidationError && error.details.length > 0) {
      showErrors(errorsFromApiDetails(error.details));
    }
    // Alguien más ya lo envió: se recarga para mostrarlo como enviado
    if (error.code === ALREADY_SUBMITTED_CODE) refreshResponse();
    toast.error(error.message);
  };

  const persistDraft = async (body) => {
    try {
      await saveDraft.mutateAsync(body);
    } catch (error) {
      handleApiError(error);
      return false;
    }
    // Marca lo que realmente se mandó (por si el usuario siguió escribiendo)
    setSavedSnapshot(snapshot(body.name, body.values));
    return true;
  };

  useDraftAutosave({
    enabled: !isSubmitted && !submit.isPending && !photoBusy,
    delayMs: env.draftAutosaveMs,
    payloadKey,
    canSave: canAutosave && !saveDraft.isPending,
    onSave: () => {
      const body = buildDraftBody(name, values);
      if (!body) return undefined;
      return persistDraft(body);
    },
  });

  const handleAnswerChange = (fieldId, value) => {
    setAnswers((current) => ({ ...current, [fieldId]: value }));
    setErrors((current) => withoutKey(current, fieldId));
  };

  const handleNameChange = (event) => {
    setName(event.target.value);
    setErrors((current) => withoutKey(current, NAME_ERROR_KEY));
  };

  const validateBeforeSend = ({ requireAll }) => {
    const nameProblem = validateResponseName(name);
    const answerProblems = validateAnswers(definition, answers, response.attachments, {
      requireAll,
    });
    const nextErrors = nameProblem
      ? { ...answerProblems, [NAME_ERROR_KEY]: nameProblem }
      : answerProblems;
    if (hasErrors(nextErrors)) {
      showErrors(nextErrors);
      return null;
    }
    return { name: cleanResponseName(name), values };
  };

  const handleSubmit = async () => {
    const body = validateBeforeSend({ requireAll: true });
    if (!body) {
      toast.error('Faltan datos por completar. Revisa lo marcado en rojo.');
      return;
    }
    const accepted = await confirm({
      title: '¿Enviar el formulario?',
      message: 'Después de enviarlo ya no se podrá cambiar.',
      confirmLabel: 'Sí, enviar',
    });
    if (!accepted) return;

    try {
      await submit.mutateAsync(body);
    } catch (error) {
      handleApiError(error);
      return;
    }
    setSavedSnapshot(snapshot(body.name, body.values));
    setErrors({});
    allowNextNavigation();
    toast.success('Formulario enviado.');
  };

  const handleUpload = async (field, file) => {
    const accepted = await confirm({
      title: '¿Subir esta foto?',
      message: `Se va a guardar "${file.name}" en la pregunta "${field.label}".`,
      confirmLabel: 'Sí, subir',
    });
    if (!accepted) return;

    try {
      await uploadPhoto.mutateAsync({ fieldId: field.id, file });
    } catch (error) {
      handleApiError(error);
      return;
    }
    setErrors((current) => withoutKey(current, field.id));
    toast.success('Foto guardada.');
  };

  const handleDelete = async (attachment) => {
    const accepted = await confirm({
      title: '¿Quitar esta foto?',
      message: `Se va a quitar "${attachment.filename}" del formulario.`,
      confirmLabel: 'Sí, quitar',
      tone: 'danger',
    });
    if (!accepted) return;

    try {
      await deletePhoto.mutateAsync(attachment.id);
    } catch (error) {
      handleApiError(error);
      return;
    }
    toast.success('Foto quitada.');
  };

  const saveStatus = (() => {
    if (saveDraft.isPending) return 'Guardando...';
    if (hasChanges) return 'Tienes cambios sin guardar. Se guardarán solos en un momento.';
    return 'Todo está guardado.';
  })();

  return (
    <div className="response-fill">
      <div>
        <ButtonLink to={paths.templateDetail(response.template_id)} variant="ghost" size="sm">
          ← Volver a la plantilla
        </ButtonLink>
      </div>

      <header className="card response-fill__header">
        <div className="response-fill__title-row">
          <h1>{isSubmitted ? response.name : 'Contestar formulario'}</h1>
          <div className="response-fill__badges">
            <ResponseStatusBadge status={response.status} />
            <Badge tone="info">Versión {response.version}</Badge>
          </div>
        </div>
        <p className="text-secondary text-small">
          Plantilla: {definition.title} · Empezado: {formatDateTime(response.created_at)}
          {isSubmitted
            ? ` · Enviado: ${formatDateTime(response.submitted_at)}`
            : ` · Último guardado: ${formatDateTime(response.updated_at)}`}
        </p>
        {isSubmitted ? (
          <p className="response-fill__notice" role="status">
            Este formulario ya fue enviado. Solo se puede consultar.
          </p>
        ) : (
          <>
            <Input
              label="Nombre de este llenado"
              hint="Así aparecerá en el listado de formularios llenados."
              value={name}
              maxLength={ANSWER_LIMITS.responseNameMaxLength}
              error={errors[NAME_ERROR_KEY]}
              required
              disabled={saving || photoBusy}
              onChange={handleNameChange}
            />
            <p className="text-secondary">
              Contesta las preguntas. El borrador se guarda solo al dejar de escribir. Las fotos se
              guardan en cuanto las subes.
            </p>
          </>
        )}
      </header>

      <ErrorSummary
        ref={summaryRef}
        title={`Hay ${summary.length} pregunta(s) por revisar`}
        messages={summary}
      />

      <DynamicForm
        definition={definition}
        answers={answers}
        errors={errors}
        attachments={response.attachments}
        readOnly={isSubmitted}
        onAnswerChange={handleAnswerChange}
        photoActions={{
          uploadingFieldId: uploadPhoto.isPending ? uploadPhoto.variables?.fieldId : null,
          disabled: saving || photoBusy,
          onUpload: handleUpload,
          onDelete: handleDelete,
          onUrlExpired: refreshResponse,
        }}
      />

      {!isSubmitted && (
        <footer className="response-fill__footer">
          <p className="text-secondary text-small" aria-live="polite">
            {saveStatus}
          </p>
          <div className="response-fill__footer-actions">
            <Button
              size="lg"
              onClick={handleSubmit}
              loading={submit.isPending}
              disabled={saveDraft.isPending || photoBusy}
            >
              Enviar formulario
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function ResponseFillPage() {
  const { responseId } = useParams();
  const responseQuery = useResponse(responseId);
  const response = responseQuery.data;
  // La definición sale de la versión con la que se empezó el formulario (queda en caché para siempre)
  const versionQuery = useTemplateVersion(response?.template_id, response?.version);

  if (responseQuery.isPending) return <Loader label="Cargando el formulario..." fullPage />;
  if (responseQuery.isError) {
    return (
      <ResponseLoadError
        error={responseQuery.error}
        onRetry={() => responseQuery.refetch()}
        retrying={responseQuery.isFetching}
      />
    );
  }
  if (versionQuery.isPending) return <Loader label="Cargando las preguntas..." fullPage />;
  if (versionQuery.isError) {
    return (
      <ErrorState
        title="No pudimos cargar las preguntas del formulario"
        message={versionQuery.error.message}
        onRetry={() => versionQuery.refetch()}
        retrying={versionQuery.isFetching}
      />
    );
  }

  return (
    <ResponseWorkspace
      key={response.id}
      response={response}
      definition={versionQuery.data.definition}
    />
  );
}
