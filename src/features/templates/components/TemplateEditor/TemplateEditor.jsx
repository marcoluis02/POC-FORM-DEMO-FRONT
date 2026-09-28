import Button from '@/shared/components/Button/Button';
import Input from '@/shared/components/Input/Input';
import { useConfirm } from '@/shared/components/ConfirmModal/useConfirm';
import { useToast } from '@/shared/components/Toast/useToast';
import TemplateSection from '../TemplateSection/TemplateSection';
import { errorPaths } from '../../domain/templateErrors';
import { EDITOR_ACTIONS } from '../../domain/templateEditorReducer';
import { TEMPLATE_LIMITS } from '../../domain/templateSchema';
import './TemplateEditor.css';

// Editor completo de la plantilla. Recibe el borrador y el dispatch del reducer;
// errors es un objeto { ruta: mensaje } (ver templateErrors.js).
export default function TemplateEditor({
  draft,
  dispatch,
  errors = {},
  disabled = false,
  showDetails = true,
  showSections = true,
  sectionIndex = null,
  onSectionAdded,
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const canAddSection = draft.sections.length < TEMPLATE_LIMITS.maxSections;

  const removeSection = async (section, number) => {
    const accepted = await confirm({
      title: `¿Eliminar la sección ${number}?`,
      message: `Se quitarán también sus ${section.fields.length} pregunta(s).`,
      confirmLabel: 'Sí, eliminar',
      tone: 'danger',
    });
    if (!accepted) return;
    dispatch({ type: EDITOR_ACTIONS.REMOVE_SECTION, sectionUid: section.uid });
    toast.success('Sección eliminada.');
  };

  const removeField = async (sectionUid, fieldUid, number) => {
    const accepted = await confirm({
      title: `¿Eliminar la pregunta ${number}?`,
      message: 'Esta pregunta ya no aparecerá en el formulario.',
      confirmLabel: 'Sí, eliminar',
      tone: 'danger',
    });
    if (!accepted) return;
    dispatch({ type: EDITOR_ACTIONS.REMOVE_FIELD, sectionUid, fieldUid });
    toast.success('Pregunta eliminada.');
  };

  const questionCount = draft.sections.reduce((total, section) => total + section.fields.length, 0);
  const visibleSections = !showSections
    ? []
    : sectionIndex == null
      ? draft.sections.map((section, index) => ({ section, index }))
      : draft.sections[sectionIndex]
        ? [{ section: draft.sections[sectionIndex], index: sectionIndex }]
        : [];

  return (
    <div className="template-editor">
      {showDetails && (
      <div className="card template-editor__intro">
        <div className="template-editor__head">
          <h2>Estructura del formulario</h2>
          <p>
            {draft.sections.length} secciones · {questionCount} preguntas
          </p>
        </div>
        <Input
          label="Nombre del formulario"
          placeholder="Ej. Revisión de mantenimiento"
          value={draft.title}
          maxLength={TEMPLATE_LIMITS.titleMaxLength}
          error={errors[errorPaths.title]}
          disabled={disabled}
          required
          requiredMark="asterisk"
          onChange={(event) =>
            dispatch({ type: EDITOR_ACTIONS.SET_TITLE, title: event.target.value })
          }
        />
      </div>
      )}

      {visibleSections.map(({ section, index }) => (
        <TemplateSection
          key={section.uid}
          section={section}
          index={index}
          isFirst={index === 0}
          isLast={index === draft.sections.length - 1}
          canRemove={draft.sections.length > 1}
          errors={errors}
          disabled={disabled}
          onTitleChange={(title) =>
            dispatch({
              type: EDITOR_ACTIONS.UPDATE_SECTION,
              sectionUid: section.uid,
              changes: { title },
            })
          }
          onMove={(direction) =>
            dispatch({ type: EDITOR_ACTIONS.MOVE_SECTION, sectionUid: section.uid, direction })
          }
          onRemove={() => removeSection(section, index + 1)}
          onAddField={() => dispatch({ type: EDITOR_ACTIONS.ADD_FIELD, sectionUid: section.uid })}
          onFieldChange={(fieldUid, changes) =>
            dispatch({
              type: EDITOR_ACTIONS.UPDATE_FIELD,
              sectionUid: section.uid,
              fieldUid,
              changes,
            })
          }
          onFieldMove={(fieldUid, direction) =>
            dispatch({
              type: EDITOR_ACTIONS.MOVE_FIELD,
              sectionUid: section.uid,
              fieldUid,
              direction,
            })
          }
          onFieldRemove={(fieldUid, number) => removeField(section.uid, fieldUid, number)}
        />
      ))}

      {canAddSection && visibleSections.length > 0 && (
        <Button
          variant="secondary"
          onClick={() => {
            const nextIndex = draft.sections.length;
            dispatch({ type: EDITOR_ACTIONS.ADD_SECTION });
            onSectionAdded?.(nextIndex);
          }}
          disabled={disabled}
        >
          + Agregar sección
        </Button>
      )}
    </div>
  );
}
