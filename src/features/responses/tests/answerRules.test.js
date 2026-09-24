import {
  ANSWER_LIMITS,
  ANSWER_MESSAGES,
  allFields,
  answersFromValues,
  answersToValues,
  errorsFromApiDetails,
  errorSummary,
  validateAnswers,
} from '../domain/answerRules';
import definition from './fixtures/inspectionDefinition.json';

const PHOTO = { id: 'a-1', field_id: 'f_007' };
const COMPLETE = { f_001: 'yes', f_003: true, f_004: 'Juan' };

describe('answerRules', () => {
  it('ordena secciones y preguntas por posición', () => {
    expect(allFields(definition).map((field) => field.id)).toEqual([
      'f_001',
      'f_002',
      'f_003',
      'f_004',
      'f_005',
      'f_006',
      'f_007',
      'f_008',
    ]);
  });

  it('convierte lo escrito a lo que espera el backend', () => {
    const answers = {
      f_001: 'no',
      f_002: '72.5',
      f_003: false,
      f_004: '  Ana  ',
      f_005: '   ',
      f_006: '2026-09-24',
    };

    expect(answersToValues(definition, answers)).toEqual({
      f_001: 'no',
      f_002: 72.5,
      f_003: false,
      f_004: 'Ana',
      f_006: '2026-09-24',
    });
  });

  it('muestra los números del backend como texto en los controles', () => {
    expect(answersFromValues({ f_002: 0, f_001: 'yes' })).toEqual({ f_002: '0', f_001: 'yes' });
  });

  it('al guardar borrador no exige obligatorias', () => {
    expect(validateAnswers(definition, {}, [])).toEqual({});
  });

  it('al enviar marca todas las obligatorias que faltan menos la firma', () => {
    const errors = validateAnswers(definition, { f_003: false }, [], { requireAll: true });

    expect(errors).toEqual({
      f_001: ANSWER_MESSAGES.required,
      f_003: ANSWER_MESSAGES.checkboxRequired,
      f_004: ANSWER_MESSAGES.required,
      f_007: ANSWER_MESSAGES.photoRequired,
    });
  });

  it('con todo contestado y la foto subida no hay errores', () => {
    expect(validateAnswers(definition, COMPLETE, [PHOTO], { requireAll: true })).toEqual({});
  });

  it('revisa números y largo de textos aunque sea borrador', () => {
    const errors = validateAnswers(
      definition,
      {
        f_002: String(ANSWER_LIMITS.numberMaxAbs * 10),
        f_004: 'a'.repeat(ANSWER_LIMITS.shortTextMaxLength + 1),
      },
      [],
    );

    expect(errors.f_002).toBe(ANSWER_MESSAGES.numberTooBig);
    expect(errors.f_004).toBe(ANSWER_MESSAGES.textTooLong(ANSWER_LIMITS.shortTextMaxLength));
  });

  it('pasa los errores del backend a cada pregunta', () => {
    const details = [
      { code: 'required', message: 'Esta pregunta es obligatoria.', field_id: 'f_004' },
      { code: 'other', message: 'Sin pregunta', field_id: null },
    ];

    expect(errorsFromApiDetails(details)).toEqual({ f_004: 'Esta pregunta es obligatoria.' });
  });

  it('el resumen usa el texto de la pregunta en el orden del formulario', () => {
    const summary = errorSummary(definition, { f_007: 'Agrega al menos una foto.', f_001: 'X' });

    expect(summary).toEqual([
      '¿Se limpió el filtro?: X',
      'Foto del equipo: Agrega al menos una foto.',
    ]);
  });
});
