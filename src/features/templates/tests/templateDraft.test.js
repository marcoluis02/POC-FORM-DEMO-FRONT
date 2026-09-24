import { FIELD_TYPES } from '../domain/fieldTypes';
import { draftFromDefinition, draftToPayload } from '../domain/templateDraft';
import {
  EDITOR_ACTIONS,
  MOVE_DIRECTION,
  templateEditorReducer,
} from '../domain/templateEditorReducer';
import { validateFormDefinitionInput } from '../domain/templateSchema';
import maintenanceTemplate from './fixtures/maintenanceTemplate.json';

const reduce = (draft, ...actions) => actions.reduce(templateEditorReducer, draft);

describe('templateDraft', () => {
  it('convierte la definición en borrador y de regreso sin perder datos', () => {
    const payload = draftToPayload(draftFromDefinition(maintenanceTemplate));

    expect(payload).toEqual(maintenanceTemplate);
  });

  it('ordena por posición al abrir una definición', () => {
    const unordered = structuredClone(maintenanceTemplate);
    unordered.sections[0].fields.reverse();

    const draft = draftFromDefinition(unordered);

    expect(draft.sections[0].fields.map((field) => field.id)).toEqual(['f_001', 'f_002']);
  });

  it('deja posiciones consecutivas después de mover y eliminar', () => {
    let draft = draftFromDefinition(maintenanceTemplate);
    const sectionUid = draft.sections[0].uid;
    draft = reduce(draft, { type: EDITOR_ACTIONS.ADD_FIELD, sectionUid });
    const [first, , third] = draft.sections[0].fields;

    draft = reduce(
      draft,
      {
        type: EDITOR_ACTIONS.MOVE_FIELD,
        sectionUid,
        fieldUid: third.uid,
        direction: MOVE_DIRECTION.UP,
      },
      { type: EDITOR_ACTIONS.REMOVE_FIELD, sectionUid, fieldUid: first.uid },
    );
    const payload = draftToPayload(draft);

    expect(payload.sections[0].fields.map((field) => field.position)).toEqual([1, 2]);
    expect(payload.sections[0].fields[0].id).toBeUndefined();
    expect(payload.sections[0].fields[1].id).toBe('f_002');
  });

  it('solo manda la unidad en campos de número', () => {
    let draft = draftFromDefinition(maintenanceTemplate);
    const sectionUid = draft.sections[0].uid;
    const numberField = draft.sections[0].fields[1];

    draft = reduce(draft, {
      type: EDITOR_ACTIONS.UPDATE_FIELD,
      sectionUid,
      fieldUid: numberField.uid,
      changes: { type: FIELD_TYPES.SHORT_TEXT },
    });

    expect(draftToPayload(draft).sections[0].fields[1]).not.toHaveProperty('unit');
  });

  it('un borrador nuevo sin llenar no pasa la validación', () => {
    const draft = reduce(draftFromDefinition(maintenanceTemplate), {
      type: EDITOR_ACTIONS.RESET,
      draft: { title: '', sections: [{ uid: 'x', title: '', fields: [] }] },
    });

    const result = validateFormDefinitionInput(draftToPayload(draft));

    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.path)).toEqual(
      expect.arrayContaining(['title', 'sections.0.title', 'sections.0.fields']),
    );
  });
});
