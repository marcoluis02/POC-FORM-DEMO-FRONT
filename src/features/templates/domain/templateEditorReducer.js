import { createEmptyOption, supportsOptions, supportsUnit } from './fieldTypes';
import { createEmptyField, createEmptySection } from './templateDraft';
import { TEMPLATE_LIMITS } from './templateSchema';

export const EDITOR_ACTIONS = Object.freeze({
  RESET: 'reset',
  SET_TITLE: 'set_title',
  ADD_SECTION: 'add_section',
  UPDATE_SECTION: 'update_section',
  REMOVE_SECTION: 'remove_section',
  MOVE_SECTION: 'move_section',
  ADD_FIELD: 'add_field',
  UPDATE_FIELD: 'update_field',
  REMOVE_FIELD: 'remove_field',
  MOVE_FIELD: 'move_field',
});

export const MOVE_DIRECTION = Object.freeze({ UP: -1, DOWN: 1 });

function moveItem(list, uid, direction) {
  const from = list.findIndex((item) => item.uid === uid);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

function updateSection(draft, sectionUid, update) {
  return {
    ...draft,
    sections: draft.sections.map((section) =>
      section.uid === sectionUid ? update(section) : section,
    ),
  };
}

function applyFieldChanges(field, changes) {
  const next = { ...field, ...changes };
  // Si el campo deja de ser número, la unidad ya no aplica
  if (!supportsUnit(next.type)) next.unit = '';
  // Si pasa a lista y no tiene opciones, arranca con 2 vacías; si deja de ser lista, se limpian
  if (supportsOptions(next.type)) {
    if (!next.options?.length) {
      next.options = [createEmptyOption(), createEmptyOption()];
    }
  } else {
    next.options = [];
  }
  return next;
}

export function templateEditorReducer(draft, action) {
  switch (action.type) {
    case EDITOR_ACTIONS.RESET:
      return action.draft;

    case EDITOR_ACTIONS.SET_TITLE:
      return { ...draft, title: action.title };

    case EDITOR_ACTIONS.ADD_SECTION:
      if (draft.sections.length >= TEMPLATE_LIMITS.maxSections) return draft;
      return { ...draft, sections: [...draft.sections, createEmptySection()] };

    case EDITOR_ACTIONS.UPDATE_SECTION:
      return updateSection(draft, action.sectionUid, (section) => ({
        ...section,
        ...action.changes,
      }));

    case EDITOR_ACTIONS.REMOVE_SECTION:
      if (draft.sections.length <= 1) return draft;
      return { ...draft, sections: draft.sections.filter((s) => s.uid !== action.sectionUid) };

    case EDITOR_ACTIONS.MOVE_SECTION: {
      const sections = moveItem(draft.sections, action.sectionUid, action.direction);
      return sections === draft.sections ? draft : { ...draft, sections };
    }

    case EDITOR_ACTIONS.ADD_FIELD:
      return updateSection(draft, action.sectionUid, (section) =>
        section.fields.length >= TEMPLATE_LIMITS.maxFieldsPerSection
          ? section
          : { ...section, fields: [...section.fields, createEmptyField()] },
      );

    case EDITOR_ACTIONS.UPDATE_FIELD:
      return updateSection(draft, action.sectionUid, (section) => ({
        ...section,
        fields: section.fields.map((field) =>
          field.uid === action.fieldUid ? applyFieldChanges(field, action.changes) : field,
        ),
      }));

    case EDITOR_ACTIONS.REMOVE_FIELD:
      return updateSection(draft, action.sectionUid, (section) =>
        section.fields.length <= 1
          ? section
          : { ...section, fields: section.fields.filter((f) => f.uid !== action.fieldUid) },
      );

    case EDITOR_ACTIONS.MOVE_FIELD:
      return updateSection(draft, action.sectionUid, (section) => ({
        ...section,
        fields: moveItem(section.fields, action.fieldUid, action.direction),
      }));

    default:
      throw new Error(`Acción desconocida en el editor: ${action.type}`);
  }
}
