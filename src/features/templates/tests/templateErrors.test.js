import { describeError, errorsFromApiDetails, groupErrorsByPath } from '../domain/templateErrors';

describe('templateErrors', () => {
  it('describe en palabras dónde está el error', () => {
    expect(describeError({ path: 'title', message: 'Falta.' })).toBe(
      'Nombre del formulario: Falta.',
    );
    expect(describeError({ path: 'sections.0.title', message: 'Falta.' })).toBe(
      'Sección 1: Falta.',
    );
    expect(describeError({ path: 'sections.1.fields.2.label', message: 'Falta.' })).toBe(
      'Sección 2, pregunta 3: Falta.',
    );
    expect(describeError({ path: '', message: 'Error general.' })).toBe('Error general.');
  });

  it('convierte los errores 422 del backend al formato del editor', () => {
    const details = [
      { code: 'enum', message: 'Tipo inválido', field_id: 'sections.0.fields.0.type' },
      { code: 'x', message: 'General', field_id: null },
    ];

    expect(errorsFromApiDetails(details)).toEqual([
      { path: 'sections.0.fields.0.type', message: 'Tipo inválido' },
      { path: '', message: 'General' },
    ]);
  });

  it('deja el primer mensaje de cada ruta', () => {
    const grouped = groupErrorsByPath([
      { path: 'title', message: 'Primero' },
      { path: 'title', message: 'Segundo' },
    ]);

    expect(grouped).toEqual({ title: 'Primero' });
  });
});
