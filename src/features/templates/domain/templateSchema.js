// Espejo del contrato FormDefinition del backend (app/dto/form_definition.py).
// El backend siempre vuelve a validar; esto solo detecta errores antes de renderizar o enviar.
import { z } from '@/shared/lib/zod';
import { FIELD_TYPE_VALUES, supportsOptions, supportsUnit } from './fieldTypes';

export const TEMPLATE_LIMITS = Object.freeze({
  titleMaxLength: 200,
  labelMaxLength: 300,
  unitMaxLength: 20,
  optionValueMaxLength: 100,
  optionLabelMaxLength: 200,
  minOptions: 2,
  maxOptions: 30,
  maxSections: 50,
  maxFieldsPerSection: 200,
});

const SECTION_ID_PATTERN = /^s_\d{3,6}$/;
const FIELD_ID_PATTERN = /^f_\d{3,6}$/;

const sectionIdSchema = z.string().regex(SECTION_ID_PATTERN, { error: 'Id de sección inválido.' });
const fieldIdSchema = z.string().regex(FIELD_ID_PATTERN, { error: 'Id de campo inválido.' });
const positionSchema = z.number().int().min(1);

const emptyTextToNull = (value) =>
  typeof value === 'string' && value.trim() === '' ? null : value;

const emptyOptionsToNull = (value) => (value == null || value.length === 0 ? null : value);

const fieldOptionSchema = z.strictObject({
  value: z
    .string()
    .trim()
    .min(1, { error: 'El valor de la opción no puede estar vacío.' })
    .max(TEMPLATE_LIMITS.optionValueMaxLength),
  label: z
    .string()
    .trim()
    .min(1, { error: 'El texto de la opción no puede estar vacío.' })
    .max(TEMPLATE_LIMITS.optionLabelMaxLength),
});

const fieldShape = {
  type: z.enum(FIELD_TYPE_VALUES, { error: 'Tipo de campo no soportado.' }),
  label: z
    .string()
    .trim()
    .min(1, { error: 'La pregunta no puede estar vacía.' })
    .max(TEMPLATE_LIMITS.labelMaxLength),
  required: z.boolean().default(false),
  position: positionSchema,
  allow_evidence: z.boolean().default(false),
  unit: z.preprocess(
    emptyTextToNull,
    z.string().trim().max(TEMPLATE_LIMITS.unitMaxLength).nullish(),
  ),
  options: z.preprocess(emptyOptionsToNull, z.array(fieldOptionSchema).nullish()),
};

function findRepeated(values) {
  const seen = new Set();
  const repeated = new Set();
  values.forEach((value) => (seen.has(value) ? repeated.add(value) : seen.add(value)));
  return [...repeated];
}

function buildFieldSchema(idSchema) {
  return z
    .strictObject({ id: idSchema, ...fieldShape })
    .superRefine((field, ctx) => {
      if (field.unit != null && !supportsUnit(field.type)) {
        ctx.addIssue({
          code: 'custom',
          message: 'La unidad solo aplica a campos de tipo número.',
          path: ['unit'],
        });
      }

      if (supportsOptions(field.type)) {
        if (field.options == null) {
          ctx.addIssue({
            code: 'custom',
            message: 'Las preguntas de lista necesitan al menos 2 opciones.',
            path: ['options'],
          });
          return;
        }
        if (field.options.length < TEMPLATE_LIMITS.minOptions) {
          ctx.addIssue({
            code: 'custom',
            message: `Las preguntas de lista necesitan al menos ${TEMPLATE_LIMITS.minOptions} opciones.`,
            path: ['options'],
          });
        }
        if (field.options.length > TEMPLATE_LIMITS.maxOptions) {
          ctx.addIssue({
            code: 'custom',
            message: `Una pregunta de lista no puede tener más de ${TEMPLATE_LIMITS.maxOptions} opciones.`,
            path: ['options'],
          });
        }
        const repeated = findRepeated(field.options.map((option) => option.value));
        if (repeated.length > 0) {
          ctx.addIssue({
            code: 'custom',
            message: `Hay opciones con el mismo valor: ${repeated.join(', ')}.`,
            path: ['options'],
          });
        }
      } else if (field.options != null) {
        ctx.addIssue({
          code: 'custom',
          message: 'Las opciones solo aplican a preguntas de tipo lista (select).',
          path: ['options'],
        });
      }
    });
}

function buildSectionSchema(idSchema, fieldSchema) {
  return z
    .strictObject({
      id: idSchema,
      title: z
        .string()
        .trim()
        .min(1, { error: 'La sección necesita un título.' })
        .max(TEMPLATE_LIMITS.titleMaxLength),
      position: positionSchema,
      fields: z
        .array(fieldSchema)
        .min(1, { error: 'La sección necesita al menos un campo.' })
        .max(TEMPLATE_LIMITS.maxFieldsPerSection),
    })
    .superRefine((section, ctx) => {
      if (findRepeated(section.fields.map((field) => field.position)).length > 0) {
        ctx.addIssue({
          code: 'custom',
          message: `La sección "${section.title}" tiene campos con la misma posición.`,
          path: ['fields'],
        });
      }
    });
}

function buildFormSchema(sectionSchema) {
  return z
    .strictObject({
      schema_version: z.literal(1),
      title: z
        .string()
        .trim()
        .min(1, { error: 'El formulario necesita un título.' })
        .max(TEMPLATE_LIMITS.titleMaxLength),
      sections: z
        .array(sectionSchema)
        .min(1, { error: 'El formulario necesita al menos una sección.' })
        .max(TEMPLATE_LIMITS.maxSections),
    })
    .superRefine((form, ctx) => {
      if (findRepeated(form.sections.map((section) => section.position)).length > 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Hay secciones con la misma posición.',
          path: ['sections'],
        });
      }

      const repeatedSections = findRepeated(form.sections.map((s) => s.id).filter(Boolean));
      if (repeatedSections.length > 0) {
        ctx.addIssue({
          code: 'custom',
          message: `Hay secciones con el mismo id: ${repeatedSections.join(', ')}.`,
          path: ['sections'],
        });
      }

      const repeatedFields = findRepeated(
        form.sections.flatMap((s) => s.fields.map((f) => f.id)).filter(Boolean),
      );
      if (repeatedFields.length > 0) {
        ctx.addIssue({
          code: 'custom',
          message: `Hay campos con el mismo id: ${repeatedFields.join(', ')}.`,
          path: ['sections'],
        });
      }
    });
}

// Lo que se manda al crear: los ids son opcionales porque el backend genera los que falten
export const formDefinitionInputSchema = buildFormSchema(
  buildSectionSchema(sectionIdSchema.optional(), buildFieldSchema(fieldIdSchema.optional())),
);

// Lo que regresa el backend: todas las secciones y campos ya tienen id
export const formDefinitionSchema = buildFormSchema(
  buildSectionSchema(sectionIdSchema, buildFieldSchema(fieldIdSchema)),
);

// Regresa { ok, definition, errors } con errores listos para mostrar: [{ path, message }]
function validateWith(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, definition: result.data, errors: [] };
  const errors = result.error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
  return { ok: false, definition: null, errors };
}

export const validateFormDefinition = (data) => validateWith(formDefinitionSchema, data);

export const validateFormDefinitionInput = (data) => validateWith(formDefinitionInputSchema, data);
