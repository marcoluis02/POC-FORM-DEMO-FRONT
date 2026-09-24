// Reglas para contestar un formulario. Son una ayuda para el usuario: el backend
// (app/services/answer_validator.py) vuelve a revisar todo y es quien decide.
import { env } from '@/app/config/env';
import { FIELD_TYPES } from '@/features/templates/domain/fieldTypes';
import { TEMPLATE_LIMITS } from '@/features/templates/domain/templateSchema';
import { byPosition } from '@/shared/utils/byPosition';

// Mismos límites que app/domain/answer_rules.py y el nombre del llenado (TITLE_MAX_LENGTH del back)
export const ANSWER_LIMITS = Object.freeze({
  shortTextMaxLength: 500,
  longTextMaxLength: 5000,
  numberMaxAbs: 1_000_000_000_000,
  responseNameMaxLength: TEMPLATE_LIMITS.titleMaxLength,
});

export const YES_NO_NA_OPTIONS = Object.freeze([
  { value: 'yes', label: 'Sí' },
  { value: 'no', label: 'No' },
  { value: 'na', label: 'No aplica' },
]);

// Filtro del selector de fotos (solo UI). El backend revisa el contenido real.
export const PHOTO_UPLOAD = Object.freeze({
  accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
  maxSizeMb: env.maxUploadMb,
  maxPerField: env.maxPhotosPerField,
});

export const ANSWER_MESSAGES = Object.freeze({
  required: 'Esta pregunta es obligatoria.',
  checkboxRequired: 'Debes marcar esta casilla.',
  photoRequired: 'Agrega al menos una foto.',
  invalidNumber: 'Escribe solo números.',
  numberTooBig: 'El número es demasiado grande.',
  invalidSelect: 'Elige una de las opciones de la lista.',
  textTooLong: (max) => `La respuesta no puede pasar de ${max} caracteres.`,
  nameRequired: 'Escribe un nombre para este formulario.',
});

export function cleanResponseName(name) {
  return typeof name === 'string' ? name.trim() : '';
}

export function validateResponseName(name) {
  const cleaned = cleanResponseName(name);
  if (!cleaned) return ANSWER_MESSAGES.nameRequired;
  if (cleaned.length > ANSWER_LIMITS.responseNameMaxLength) {
    return ANSWER_MESSAGES.textTooLong(ANSWER_LIMITS.responseNameMaxLength);
  }
  return null;
}

const TEXT_LIMITS = {
  [FIELD_TYPES.SHORT_TEXT]: ANSWER_LIMITS.shortTextMaxLength,
  [FIELD_TYPES.LONG_TEXT]: ANSWER_LIMITS.longTextMaxLength,
};

// Foto y firma no llevan valor escrito: la foto se sube aparte y la firma es "próximamente"
const NO_VALUE_TYPES = new Set([FIELD_TYPES.PHOTO, FIELD_TYPES.SIGNATURE_PLACEHOLDER]);

export function acceptsPhotos(field) {
  return field.type === FIELD_TYPES.PHOTO || field.allow_evidence;
}

// Secciones y preguntas en el orden de la plantilla
export function orderedSections(definition) {
  return [...definition.sections].sort(byPosition).map((section) => ({
    ...section,
    fields: [...section.fields].sort(byPosition),
  }));
}

export function allFields(definition) {
  return orderedSections(definition).flatMap((section) => section.fields);
}

// Lo que viene del backend -> lo que se muestra en los controles (los números como texto)
export function answersFromValues(values) {
  return Object.fromEntries(
    Object.entries(values).map(([fieldId, value]) => [
      fieldId,
      typeof value === 'number' ? String(value) : value,
    ]),
  );
}

function toValue(field, answer) {
  if (answer === undefined || answer === null) return null;
  if (field.type === FIELD_TYPES.CHECKBOX) return answer === true;
  if (typeof answer !== 'string') return answer;
  const text = answer.trim();
  if (text === '') return null;
  return field.type === FIELD_TYPES.NUMBER ? Number(text) : text;
}

// Lo que el usuario escribió -> lo que se manda al backend. Lo vacío no se manda.
export function answersToValues(definition, answers) {
  const values = {};
  for (const field of allFields(definition)) {
    if (NO_VALUE_TYPES.has(field.type)) continue;
    const value = toValue(field, answers[field.id]);
    if (value !== null) values[field.id] = value;
  }
  return values;
}

function formatProblem(field, value) {
  if (field.type === FIELD_TYPES.NUMBER && value !== undefined) {
    if (!Number.isFinite(value)) return ANSWER_MESSAGES.invalidNumber;
    if (Math.abs(value) > ANSWER_LIMITS.numberMaxAbs) return ANSWER_MESSAGES.numberTooBig;
  }
  if (field.type === FIELD_TYPES.SELECT && value !== undefined) {
    const allowed = new Set((field.options ?? []).map((option) => option.value));
    if (!allowed.has(value)) return ANSWER_MESSAGES.invalidSelect;
  }
  const maxLength = TEXT_LIMITS[field.type];
  if (maxLength && typeof value === 'string' && value.length > maxLength) {
    return ANSWER_MESSAGES.textTooLong(maxLength);
  }
  return null;
}

function requiredProblem(field, value, photoCount) {
  if (!field.required || field.type === FIELD_TYPES.SIGNATURE_PLACEHOLDER) return null;
  if (field.type === FIELD_TYPES.PHOTO)
    return photoCount > 0 ? null : ANSWER_MESSAGES.photoRequired;
  if (field.type === FIELD_TYPES.CHECKBOX)
    return value === true ? null : ANSWER_MESSAGES.checkboxRequired;
  return value === undefined ? ANSWER_MESSAGES.required : null;
}

function photoCountByField(attachments) {
  const counts = {};
  for (const attachment of attachments) {
    counts[attachment.field_id] = (counts[attachment.field_id] ?? 0) + 1;
  }
  return counts;
}

// Regresa { fieldId: mensaje }. Con requireAll (al enviar) también revisa las obligatorias.
export function validateAnswers(definition, answers, attachments, { requireAll = false } = {}) {
  const values = answersToValues(definition, answers);
  const photos = photoCountByField(attachments);
  const errors = {};
  for (const field of allFields(definition)) {
    const value = values[field.id];
    const problem =
      formatProblem(field, value) ??
      (requireAll ? requiredProblem(field, value, photos[field.id] ?? 0) : null);
    if (problem) errors[field.id] = problem;
  }
  return errors;
}

// Errores 422 del backend -> { fieldId: mensaje }
export function errorsFromApiDetails(details) {
  return Object.fromEntries(
    details.filter((item) => item.field_id).map((item) => [item.field_id, item.message]),
  );
}

// Mensajes para el resumen de arriba: "Pregunta: mensaje", en el orden del formulario
export function errorSummary(definition, errors) {
  return allFields(definition)
    .filter((field) => errors[field.id])
    .map((field) => `${field.label}: ${errors[field.id]}`);
}
