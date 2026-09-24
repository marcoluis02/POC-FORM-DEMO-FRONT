import { FIELD_TYPE_VALUES } from '../domain/fieldTypes';
import { validateFormDefinition, validateFormDefinitionInput } from '../domain/templateSchema';
import maintenanceTemplate from './fixtures/maintenanceTemplate.json';

const buildTemplate = () => structuredClone(maintenanceTemplate);
const firstField = (template) => template.sections[0].fields[0];

describe('templateSchema (contrato FormDefinition)', () => {
  it('acepta el fixture acordado con backend', () => {
    const result = validateFormDefinition(buildTemplate());

    expect(result.ok).toBe(true);
    expect(result.definition.sections[0].fields[1].unit).toBe('°F');
  });

  it('acepta todos los tipos soportados', () => {
    const template = buildTemplate();
    const sampleOptions = [
      { value: 'a', label: 'Opción A' },
      { value: 'b', label: 'Opción B' },
    ];
    template.sections[0].fields = FIELD_TYPE_VALUES.map((type, index) => ({
      ...firstField(template),
      id: `f_${String(index + 1).padStart(3, '0')}`,
      type,
      position: index + 1,
      unit: null,
      options: type === 'select' ? sampleOptions : null,
    }));

    expect(validateFormDefinition(template).ok).toBe(true);
  });

  it('exige opciones en preguntas de lista', () => {
    const template = buildTemplate();
    firstField(template).type = 'select';
    firstField(template).unit = null;
    delete firstField(template).options;

    const result = validateFormDefinition(template);

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual({
      path: 'sections.0.fields.0.options',
      message: 'Las preguntas de lista necesitan al menos 2 opciones.',
    });
  });

  it('rechaza opciones en un campo que no es lista', () => {
    const template = buildTemplate();
    firstField(template).options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ];

    const result = validateFormDefinition(template);

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual({
      path: 'sections.0.fields.0.options',
      message: 'Las opciones solo aplican a preguntas de tipo lista (select).',
    });
  });

  it('rechaza un tipo no soportado', () => {
    const template = buildTemplate();
    firstField(template).type = 'dropdown';

    const result = validateFormDefinition(template);

    expect(result.ok).toBe(false);
    expect(result.errors[0].message).toBe('Tipo de campo no soportado.');
  });

  it('rechaza unidad en un campo que no es número', () => {
    const template = buildTemplate();
    firstField(template).unit = 'kg';

    const result = validateFormDefinition(template);

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual({
      path: 'sections.0.fields.0.unit',
      message: 'La unidad solo aplica a campos de tipo número.',
    });
  });

  it('convierte una unidad vacía en null', () => {
    const template = buildTemplate();
    template.sections[0].fields[1].unit = '   ';

    expect(validateFormDefinition(template).definition.sections[0].fields[1].unit).toBeNull();
  });

  it('pone required y allow_evidence en false si no vienen', () => {
    const template = buildTemplate();
    delete firstField(template).required;
    delete firstField(template).allow_evidence;

    const field = validateFormDefinition(template).definition.sections[0].fields[0];

    expect(field.required).toBe(false);
    expect(field.allow_evidence).toBe(false);
  });

  it('rechaza ids de campo repetidos', () => {
    const template = buildTemplate();
    template.sections[0].fields[1].id = 'f_001';

    const result = validateFormDefinition(template);

    expect(result.ok).toBe(false);
    expect(result.errors[0].message).toContain('mismo id');
  });

  it('rechaza posiciones repetidas dentro de una sección', () => {
    const template = buildTemplate();
    template.sections[0].fields[1].position = 1;

    expect(validateFormDefinition(template).errors[0].message).toContain('misma posición');
  });

  it('rechaza llaves desconocidas', () => {
    const template = buildTemplate();
    firstField(template).color = 'rojo';

    expect(validateFormDefinition(template).ok).toBe(false);
  });

  it('rechaza un formulario sin secciones', () => {
    const template = buildTemplate();
    template.sections = [];

    expect(validateFormDefinition(template).ok).toBe(false);
  });

  it('el input permite ids vacíos pero la definición confirmada no', () => {
    const template = buildTemplate();
    template.sections.forEach((section) => {
      delete section.id;
      section.fields.forEach((field) => delete field.id);
    });

    expect(validateFormDefinitionInput(template).ok).toBe(true);
    expect(validateFormDefinition(template).ok).toBe(false);
  });
});
