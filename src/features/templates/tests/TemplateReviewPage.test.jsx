import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createImport, getImport } from '@/features/imports/api/importsApi';
import { ApiError } from '@/shared/api/ApiError';
import { renderWithRouter } from '@/shared/tests/renderWithRouter';
import { createTemplate, createTemplateVersion, getTemplate } from '../api/templatesApi';
import TemplateReviewPage from '../pages/TemplateReviewPage/TemplateReviewPage';
import maintenanceTemplate from './fixtures/maintenanceTemplate.json';

vi.mock('@/features/imports/api/importsApi', () => ({
  createImport: vi.fn(),
  getImport: vi.fn(),
}));

vi.mock('../api/templatesApi', () => ({
  listTemplates: vi.fn(),
  getTemplate: vi.fn(),
  getTemplateVersion: vi.fn(),
  createTemplate: vi.fn(),
  createTemplateVersion: vi.fn(),
}));

const TEMPLATE_ID = '97787fca-eee7-4b42-92fd-b1d8c59062e3';

function savedTemplate(version = 1, definition = maintenanceTemplate, sourceImportId = null) {
  return {
    id: TEMPLATE_ID,
    name: definition.title,
    status: 'active',
    latest_version: version,
    created_at: '2026-09-24T18:22:17Z',
    updated_at: '2026-09-24T18:22:17Z',
    current_version: {
      id: `version-${version}`,
      template_id: TEMPLATE_ID,
      version,
      definition,
      source_import_id: sourceImportId,
      created_at: '2026-09-24T18:22:17Z',
    },
  };
}

function renderReview(initialPath) {
  return renderWithRouter(
    [
      { path: '/templates', element: <p>Listado</p> },
      { path: '/templates/new', element: <TemplateReviewPage /> },
      { path: '/templates/:templateId/edit', element: <TemplateReviewPage /> },
      { path: '/templates/:templateId', element: <p>Detalle de la plantilla</p> },
    ],
    { initialPath },
  );
}

async function fillNewTemplate(user) {
  await user.type(screen.getByLabelText(/Nombre del formulario/), 'Revisión de mantenimiento');
  await user.type(screen.getByLabelText(/Nombre de la sección/), 'General');
  await user.type(screen.getByLabelText(/^Pregunta/), '¿Se limpió el filtro?');
  await user.selectOptions(screen.getByLabelText('Tipo de respuesta'), 'yes_no_na');
  await user.click(screen.getByLabelText('Es obligatoria'));
}

describe('TemplateReviewPage', () => {
  it('no manda nada al backend si faltan datos y dice qué corregir', async () => {
    const user = userEvent.setup();
    renderReview('/templates/new');

    await user.click(screen.getByRole('button', { name: 'Guardar plantilla' }));

    const summary = await screen.findByRole('heading', { name: /dato\(s\) por revisar/ });
    expect(summary).toBeInTheDocument();
    expect(
      screen.getByText('Nombre del formulario: El formulario necesita un título.'),
    ).toBeInTheDocument();
    expect(createTemplate).not.toHaveBeenCalled();
  });

  it('al corregir un dato se quita su error sin tener que guardar de nuevo', async () => {
    const user = userEvent.setup();
    renderReview('/templates/new');

    await user.click(screen.getByRole('button', { name: 'Guardar plantilla' }));
    expect(
      await screen.findByText('Nombre del formulario: El formulario necesita un título.'),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Nombre del formulario/), 'FFF');

    await waitFor(() => {
      expect(
        screen.queryByText('Nombre del formulario: El formulario necesita un título.'),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /dato\(s\) por revisar/ })).toBeInTheDocument();
    expect(
      screen.getByText('Sección 1: La sección necesita un título.'),
    ).toBeInTheDocument();
  });

  it('crea la plantilla después de confirmar y abre su detalle', async () => {
    const user = userEvent.setup();
    createTemplate.mockResolvedValue(savedTemplate());
    const { router } = renderReview('/templates/new');

    await fillNewTemplate(user);
    await user.click(screen.getByRole('button', { name: 'Guardar plantilla' }));
    const dialog = await screen.findByRole('dialog', { name: '¿Guardar la plantilla?' });
    await user.click(within(dialog).getByRole('button', { name: 'Sí, guardar' }));

    expect(await screen.findByText('Detalle de la plantilla')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/templates/${TEMPLATE_ID}`);
    expect(screen.getByText('Plantilla creada.')).toBeInTheDocument();

    const [payload, options] = createTemplate.mock.calls[0];
    expect(payload).toMatchObject({
      schema_version: 1,
      title: 'Revisión de mantenimiento',
      sections: [
        {
          title: 'General',
          position: 1,
          fields: [
            { type: 'yes_no_na', label: '¿Se limpió el filtro?', required: true, position: 1 },
          ],
        },
      ],
    });
    expect(options.idempotencyKey).toEqual(expect.any(String));
  });

  it('si el usuario cancela la confirmación no se guarda', async () => {
    const user = userEvent.setup();
    renderReview('/templates/new');

    await fillNewTemplate(user);
    await user.click(screen.getByRole('button', { name: 'Guardar plantilla' }));
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));

    expect(createTemplate).not.toHaveBeenCalled();
  });

  it('muestra junto al dato el error 422 del backend', async () => {
    const user = userEvent.setup();
    createTemplate.mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'invalid_request',
        message: 'Los datos enviados no son válidos.',
        details: [{ code: 'x', message: 'Texto muy largo', field_id: 'sections.0.title' }],
      }),
    );
    renderReview('/templates/new');

    await fillNewTemplate(user);
    await user.click(screen.getByRole('button', { name: 'Guardar plantilla' }));
    await user.click(await screen.findByRole('button', { name: 'Sí, guardar' }));

    expect(await screen.findByText('Sección 1: Texto muy largo')).toBeInTheDocument();
    expect(screen.getByText('Texto muy largo')).toBeInTheDocument();
    expect(screen.getByText('Los datos enviados no son válidos.')).toBeInTheDocument();
  });

  it('pide confirmación antes de eliminar una pregunta', async () => {
    const user = userEvent.setup();
    renderReview('/templates/new');

    await user.click(screen.getByRole('button', { name: '+ Agregar pregunta' }));
    expect(screen.getAllByLabelText(/^Pregunta/)).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'Eliminar pregunta 2' }));
    await user.click(await screen.findByRole('button', { name: 'Sí, eliminar' }));

    await waitFor(() => expect(screen.getAllByLabelText(/^Pregunta/)).toHaveLength(1));
    expect(screen.getByText('Pregunta eliminada.')).toBeInTheDocument();
  });

  it('avisa antes de salir con cambios sin guardar', async () => {
    const user = userEvent.setup();
    const { router } = renderReview('/templates/new');

    await user.type(screen.getByLabelText(/Nombre del formulario/), 'Algo');
    await user.click(screen.getByRole('link', { name: 'Cancelar' }));

    expect(await screen.findByRole('dialog', { name: '¿Salir sin guardar?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Seguir editando' }));
    expect(router.state.location.pathname).toBe('/templates/new');
  });

  it('al editar guarda una nueva versión con los ids existentes', async () => {
    const user = userEvent.setup();
    getTemplate.mockResolvedValue(savedTemplate(1));
    createTemplateVersion.mockResolvedValue(savedTemplate(2));
    renderReview(`/templates/${TEMPLATE_ID}/edit`);

    const saveButton = await screen.findByRole('button', { name: 'Guardar nueva versión' });
    expect(saveButton).toBeDisabled();

    const title = screen.getByLabelText(/Nombre del formulario/);
    await user.clear(title);
    await user.type(title, 'Revisión v2');
    await user.click(saveButton);
    await user.click(await screen.findByRole('button', { name: 'Sí, guardar versión' }));

    expect(await screen.findByText('Versión 2 guardada.')).toBeInTheDocument();
    const [templateId, payload] = createTemplateVersion.mock.calls[0];
    expect(templateId).toBe(TEMPLATE_ID);
    expect(payload.title).toBe('Revisión v2');
    expect(payload.sections[0].fields.map((field) => field.id)).toEqual(['f_001', 'f_002']);
  });

  describe('documento original', () => {
    const photo = new File(['foto'], 'revision.png', { type: 'image/png' });
    const IMPORT_ID = '5d1f4a7e-2b9c-4c55-8f0e-1a2b3c4d5e6f';

    beforeEach(() => {
      URL.createObjectURL = vi.fn(() => 'blob:vista-previa');
      URL.revokeObjectURL = vi.fn();
    });

    it('sube el archivo primero y guarda la plantilla ligada a él', async () => {
      const user = userEvent.setup();
      createImport.mockResolvedValue({ id: IMPORT_ID, original_url: 'https://s3.test/x' });
      createTemplate.mockResolvedValue(savedTemplate(1, maintenanceTemplate, IMPORT_ID));
      renderReview('/templates/new');

      await fillNewTemplate(user);
      await user.upload(screen.getByLabelText('Elegir foto o PDF'), photo);
      expect(screen.getByRole('img', { name: 'Documento original: revision.png' })).toHaveAttribute(
        'src',
        'blob:vista-previa',
      );

      await user.click(screen.getByRole('button', { name: 'Guardar plantilla' }));
      const dialog = await screen.findByRole('dialog', { name: '¿Guardar la plantilla?' });
      expect(
        within(dialog).getByText(/También se guardará el documento original/),
      ).toBeInTheDocument();
      await user.click(within(dialog).getByRole('button', { name: 'Sí, guardar' }));

      expect(await screen.findByText('Detalle de la plantilla')).toBeInTheDocument();
      const [uploaded, uploadOptions] = createImport.mock.calls[0];
      expect(uploaded).toBe(photo);
      expect(uploadOptions.idempotencyKey).toEqual(expect.any(String));
      expect(createTemplate.mock.calls[0][1].sourceImportId).toBe(IMPORT_ID);
    });

    it('si no se pudo subir el archivo no crea la plantilla y avisa', async () => {
      const user = userEvent.setup();
      createImport.mockRejectedValue(
        new ApiError({
          status: 503,
          code: 'storage_unavailable',
          message: 'El guardado de archivos todavía no está configurado en el servidor.',
        }),
      );
      renderReview('/templates/new');

      await fillNewTemplate(user);
      await user.upload(screen.getByLabelText('Elegir foto o PDF'), photo);
      await user.click(screen.getByRole('button', { name: 'Guardar plantilla' }));
      await user.click(await screen.findByRole('button', { name: 'Sí, guardar' }));

      expect(
        await screen.findByText(
          'El guardado de archivos todavía no está configurado en el servidor.',
        ),
      ).toBeInTheDocument();
      expect(createTemplate).not.toHaveBeenCalled();
    });

    it('al editar muestra el documento guardado y permite reemplazarlo', async () => {
      const user = userEvent.setup();
      getTemplate.mockResolvedValue(savedTemplate(1, maintenanceTemplate, IMPORT_ID));
      getImport.mockResolvedValue({
        id: IMPORT_ID,
        original_filename: 'viejo.png',
        mime_type: 'image/png',
        original_url: 'https://s3.test/viejo.png',
      });
      renderReview(`/templates/${TEMPLATE_ID}/edit`);

      expect(
        await screen.findByRole('img', { name: 'Documento original: viejo.png' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Guardar nueva versión' })).toBeDisabled();

      await user.click(screen.getByRole('button', { name: 'Reemplazar archivo' }));
      await user.upload(screen.getByLabelText('Elegir foto o PDF'), photo);

      expect(
        screen.getByRole('img', { name: 'Documento original: revision.png' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Guardar nueva versión' })).toBeEnabled();
    });
  });

  it('muestra que la plantilla no existe si el backend responde 404', async () => {
    getTemplate.mockRejectedValue(new ApiError({ status: 404, code: 'not_found', message: 'x' }));
    renderReview(`/templates/${TEMPLATE_ID}/edit`);

    expect(await screen.findByText('No encontramos esta plantilla')).toBeInTheDocument();
  });
});
