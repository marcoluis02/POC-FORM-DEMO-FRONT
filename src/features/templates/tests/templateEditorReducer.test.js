import { FIELD_TYPES } from '../domain/fieldTypes';
import { createEmptyDraft } from '../domain/templateDraft';
import {
  EDITOR_ACTIONS,
  MOVE_DIRECTION,
  templateEditorReducer,
} from '../domain/templateEditorReducer';

const reduce = (draft, ...actions) => actions.reduce(templateEditorReducer, draft);

describe('templateEditorReducer', () => {
  it('agrega y reordena secciones', () => {
    let draft = reduce(createEmptyDraft(), { type: EDITOR_ACTIONS.ADD_SECTION });
    const [first, second] = draft.sections;

    draft = reduce(draft, {
      type: EDITOR_ACTIONS.MOVE_SECTION,
      sectionUid: second.uid,
      direction: MOVE_DIRECTION.UP,
    });

    expect(draft.sections.map((section) => section.uid)).toEqual([second.uid, first.uid]);
  });

  it('no mueve fuera de los límites', () => {
    const draft = createEmptyDraft();
    const [section] = draft.sections;

    const next = reduce(draft, {
      type: EDITOR_ACTIONS.MOVE_SECTION,
      sectionUid: section.uid,
      direction: MOVE_DIRECTION.UP,
    });

    expect(next).toBe(draft);
  });

  it('no deja borrar la única sección ni la única pregunta', () => {
    const draft = createEmptyDraft();
    const [section] = draft.sections;

    const next = reduce(
      draft,
      { type: EDITOR_ACTIONS.REMOVE_SECTION, sectionUid: section.uid },
      {
        type: EDITOR_ACTIONS.REMOVE_FIELD,
        sectionUid: section.uid,
        fieldUid: section.fields[0].uid,
      },
    );

    expect(next.sections).toHaveLength(1);
    expect(next.sections[0].fields).toHaveLength(1);
  });

  it('borra la unidad cuando el campo deja de ser número', () => {
    const draft = createEmptyDraft();
    const [section] = draft.sections;
    const fieldUid = section.fields[0].uid;

    const next = reduce(
      draft,
      {
        type: EDITOR_ACTIONS.UPDATE_FIELD,
        sectionUid: section.uid,
        fieldUid,
        changes: { type: FIELD_TYPES.NUMBER, unit: '°F' },
      },
      {
        type: EDITOR_ACTIONS.UPDATE_FIELD,
        sectionUid: section.uid,
        fieldUid,
        changes: { type: FIELD_TYPES.DATE },
      },
    );

    expect(next.sections[0].fields[0].unit).toBe('');
  });

  it('avisa si llega una acción desconocida', () => {
    expect(() => templateEditorReducer(createEmptyDraft(), { type: 'otra' })).toThrow();
  });
});
