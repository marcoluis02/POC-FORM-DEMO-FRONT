// Rutas de error iguales a las del backend y Zod: "title", "sections.0.title", "sections.0.fields.1.label"
export const errorPaths = Object.freeze({
  title: 'title',
  section: (sectionIndex) => `sections.${sectionIndex}`,
  sectionTitle: (sectionIndex) => `sections.${sectionIndex}.title`,
  sectionFields: (sectionIndex) => `sections.${sectionIndex}.fields`,
  field: (sectionIndex, fieldIndex, key) => `sections.${sectionIndex}.fields.${fieldIndex}.${key}`,
});

const LOCATION_PATTERN = /^sections\.(\d+)(?:\.fields\.(\d+))?/;

// Deja un solo mensaje por ruta (el primero) para mostrarlo junto al dato
export function groupErrorsByPath(errors) {
  const grouped = {};
  errors.forEach(({ path, message }) => {
    if (!(path in grouped)) grouped[path] = message;
  });
  return grouped;
}

// Convierte los details del 422 del backend al mismo formato que usa Zod
export function errorsFromApiDetails(details) {
  return details.map((detail) => ({ path: detail.field_id ?? '', message: detail.message }));
}

// Dice en palabras dónde está el error. Ej: "Sección 1, pregunta 2: La pregunta no puede estar vacía."
export function describeError({ path, message }) {
  if (path === errorPaths.title) return `Nombre del formulario: ${message}`;
  const match = LOCATION_PATTERN.exec(path);
  if (!match) return message;
  const [, sectionIndex, fieldIndex] = match;
  const section = `Sección ${Number(sectionIndex) + 1}`;
  return fieldIndex === undefined
    ? `${section}: ${message}`
    : `${section}, pregunta ${Number(fieldIndex) + 1}: ${message}`;
}
