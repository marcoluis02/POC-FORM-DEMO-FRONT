// Mismos tipos que el backend (app/domain/field_types.py)
export const FIELD_TYPES = Object.freeze({
  CHECKBOX: 'checkbox',
  YES_NO_NA: 'yes_no_na',
  SELECT: 'select',
  SHORT_TEXT: 'short_text',
  LONG_TEXT: 'long_text',
  NUMBER: 'number',
  DATE: 'date',
  PHOTO: 'photo',
  SIGNATURE_PLACEHOLDER: 'signature_placeholder',
});

export const FIELD_TYPE_VALUES = Object.freeze(Object.values(FIELD_TYPES));

export const FIELD_TYPE_LABELS = Object.freeze({
  [FIELD_TYPES.CHECKBOX]: 'Casilla (marcar)',
  [FIELD_TYPES.YES_NO_NA]: 'Sí / No / No aplica',
  [FIELD_TYPES.SELECT]: 'Lista de opciones',
  [FIELD_TYPES.SHORT_TEXT]: 'Texto corto',
  [FIELD_TYPES.LONG_TEXT]: 'Texto largo',
  [FIELD_TYPES.NUMBER]: 'Número',
  [FIELD_TYPES.DATE]: 'Fecha',
  [FIELD_TYPES.PHOTO]: 'Foto',
  [FIELD_TYPES.SIGNATURE_PLACEHOLDER]: 'Firma',
});

export const FIELD_TYPE_OPTIONS = Object.freeze(
  FIELD_TYPE_VALUES.map((value) => ({ value, label: FIELD_TYPE_LABELS[value] })),
);

// Solo los campos de número aceptan unidad (°F, kg, psi...)
const UNIT_FIELD_TYPES = new Set([FIELD_TYPES.NUMBER]);

// Solo "select" lleva lista de opciones (Sí/No/NA tiene las suyas fijas)
const OPTION_FIELD_TYPES = new Set([FIELD_TYPES.SELECT]);

export function supportsUnit(type) {
  return UNIT_FIELD_TYPES.has(type);
}

export function supportsOptions(type) {
  return OPTION_FIELD_TYPES.has(type);
}

export function createEmptyOption() {
  return { value: '', label: '' };
}
