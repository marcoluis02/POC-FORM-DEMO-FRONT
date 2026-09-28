import { z } from '@/shared/lib/zod';
import { IMPORT_STATUS } from '@/shared/domain/importStatus';

const importStatusSchema = z.enum([
  IMPORT_STATUS.RECEIVED,
  IMPORT_STATUS.PROCESSING,
  IMPORT_STATUS.REQUIRES_REVIEW,
  IMPORT_STATUS.FAILED,
]);

const draftSchema = z.record(z.string(), z.unknown());

const extractionWarningSchema = z.union([
  z.string(),
  z.object({
    code: z.string().optional(),
    message: z.string().min(1),
    field_id: z.string().nullable().optional(),
  }),
]);

// Contrato de lectura compartido con GET/POST /poc/imports.
// Los campos de métricas pueden ser null mientras el worker no termina.
export const importResponseSchema = z
  .object({
    id: z.string().min(1),
    status: importStatusSchema,
    original_filename: z.string().min(1).optional(),
    mime_type: z.string().min(1).optional(),
    page_count: z.number().int().positive().nullable().optional(),
    warnings: z.array(extractionWarningSchema).default([]),
    draft_json: draftSchema.nullable().default(null),
    processing_started_at: z.string().nullable().optional(),
    processing_finished_at: z.string().nullable().optional(),
    processing_ms: z.number().nonnegative().nullable().optional(),
    estimated_cost: z.coerce.number().nonnegative().nullable().optional(),
    detected_fields_count: z.number().int().nonnegative().nullable().optional(),
    corrections_count: z.number().int().nonnegative().nullable().optional(),
    error_code: z.string().nullable().optional(),
    error_message: z.string().nullable().optional(),
    original_url: z.string().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === IMPORT_STATUS.REQUIRES_REVIEW && value.draft_json == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['draft_json'],
        message: 'Una importación lista para revisar debe incluir draft_json.',
      });
    }
  });

export function parseImportResponse(payload) {
  return importResponseSchema.parse(payload);
}

export function importWarningMessage(warning) {
  return typeof warning === 'string' ? warning : warning.message;
}
