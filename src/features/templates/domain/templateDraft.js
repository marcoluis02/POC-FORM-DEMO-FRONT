// El borrador es lo que el usuario edita en pantalla. Cada sección y campo lleva un uid local
// para las keys de React; las posiciones no se guardan: salen del orden de la lista al enviar.
import { randomId } from '@/shared/utils/randomId';
import { FIELD_TYPES, supportsUnit } from './fieldTypes';

export const SCHEMA_VERSION = 1;

export function createEmptyField() {
  return {
    uid: randomId(),
    id: undefined,
    type: FIELD_TYPES.SHORT_TEXT,
    label: '',
    required: false,
    allow_evidence: false,
    unit: '',
  };
}

export function createEmptySection() {
  return { uid: randomId(), id: undefined, title: '', fields: [createEmptyField()] };
}

export function createEmptyDraft() {
  return { title: '', sections: [createEmptySection()] };
}

const byPosition = (a, b) => a.position - b.position;

export function draftFromDefinition(definition) {
  return {
    title: definition.title,
    sections: [...definition.sections].sort(byPosition).map((section) => ({
      uid: randomId(),
      id: section.id,
      title: section.title,
      fields: [...section.fields].sort(byPosition).map((field) => ({
        uid: randomId(),
        id: field.id,
        type: field.type,
        label: field.label,
        required: field.required,
        allow_evidence: field.allow_evidence,
        unit: field.unit ?? '',
      })),
    })),
  };
}

function fieldToPayload(field, index) {
  const unit = supportsUnit(field.type) ? field.unit.trim() : '';
  return {
    ...(field.id && { id: field.id }),
    type: field.type,
    label: field.label,
    required: field.required,
    position: index + 1,
    allow_evidence: field.allow_evidence,
    ...(unit && { unit }),
  };
}

// Payload listo para POST /templates o POST /templates/{id}/versions
export function draftToPayload(draft) {
  return {
    schema_version: SCHEMA_VERSION,
    title: draft.title,
    sections: draft.sections.map((section, index) => ({
      ...(section.id && { id: section.id }),
      title: section.title,
      position: index + 1,
      fields: section.fields.map(fieldToPayload),
    })),
  };
}
