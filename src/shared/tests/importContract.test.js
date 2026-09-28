import { importWarningMessage, parseImportResponse } from '@/shared/domain/importContract';
import { IMPORT_STATUS, canReviewImport, shouldPollImport } from '@/shared/domain/importStatus';

const base = {
  id: '880de87b-9acd-4acf-a14e-27327668e66e',
  warnings: [],
  draft_json: null,
};

describe('contrato de importación', () => {
  it.each([IMPORT_STATUS.RECEIVED, IMPORT_STATUS.PROCESSING, IMPORT_STATUS.FAILED])(
    'acepta el estado %s sin draft',
    (status) => {
      expect(parseImportResponse({ ...base, status }).status).toBe(status);
    },
  );

  it('acepta requires_review solo cuando existe draft_json', () => {
    const parsed = parseImportResponse({
      ...base,
      status: IMPORT_STATUS.REQUIRES_REVIEW,
      draft_json: {
        schema_version: 1,
        title: 'Checklist',
        sections: [],
      },
    });

    expect(parsed.draft_json.title).toBe('Checklist');
  });

  it('acepta warnings estructurados del backend y warnings de texto', () => {
    const parsed = parseImportResponse({
      ...base,
      status: IMPORT_STATUS.PROCESSING,
      warnings: [
        { code: 'ambiguous', message: 'Pregunta ambigua', field_id: 'f_001' },
        'Revisar encabezado',
      ],
    });

    expect(importWarningMessage(parsed.warnings[0])).toBe('Pregunta ambigua');
    expect(importWarningMessage(parsed.warnings[1])).toBe('Revisar encabezado');
  });

  it('acepta estimated_cost serializado como número decimal', () => {
    const parsed = parseImportResponse({
      ...base,
      status: IMPORT_STATUS.PROCESSING,
      estimated_cost: '0.00125',
    });

    expect(parsed.estimated_cost).toBe(0.00125);
  });

  it('rechaza requires_review sin draft_json', () => {
    expect(() =>
      parseImportResponse({ ...base, status: IMPORT_STATUS.REQUIRES_REVIEW }),
    ).toThrow();
  });

  it('rechaza estados desconocidos', () => {
    expect(() => parseImportResponse({ ...base, status: 'completed' })).toThrow();
  });

  it('define con precisión cuándo hacer polling y cuándo permitir revisión', () => {
    expect(shouldPollImport(IMPORT_STATUS.RECEIVED)).toBe(true);
    expect(shouldPollImport(IMPORT_STATUS.PROCESSING)).toBe(true);
    expect(shouldPollImport(IMPORT_STATUS.REQUIRES_REVIEW)).toBe(false);
    expect(shouldPollImport(IMPORT_STATUS.FAILED)).toBe(false);
    expect(canReviewImport(IMPORT_STATUS.REQUIRES_REVIEW)).toBe(true);
    expect(canReviewImport(IMPORT_STATUS.PROCESSING)).toBe(false);
  });
});
