import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createImport } from '@/shared/api/importsApi';
import { ApiError } from '@/shared/api/ApiError';
import { renderWithRouter } from '@/shared/tests/renderWithRouter';
import ImportPage from '../pages/ImportPage/ImportPage';

vi.mock('@/shared/api/importsApi', () => ({
  createImport: vi.fn(),
  getImport: vi.fn(),
}));

const IMPORT_ID = '880de87b-9acd-4acf-a14e-27327668e66e';

function renderPage() {
  return renderWithRouter(
    [
      { path: '/imports/new', element: <ImportPage /> },
      { path: '/imports/:importId', element: <p>Procesando importación</p> },
    ],
    { initialPath: '/imports/new' },
  );
}

describe('ImportPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ofrece carga general y captura móvil con cámara trasera', () => {
    renderPage();

    const upload = screen.getByLabelText('Subir archivo');
    const camera = screen.getByLabelText('Tomar foto');

    expect(upload).toHaveAttribute(
      'accept',
      'image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf',
    );
    expect(upload).not.toHaveAttribute('capture');
    expect(camera).toHaveAttribute('accept', 'image/jpeg,image/png,.jpg,.jpeg,.png');
    expect(camera).toHaveAttribute('capture', 'environment');
  });

  it('muestra preview de una imagen elegida y permite cambiarla', async () => {
    const user = userEvent.setup();
    renderPage();
    const file = new File(['foto'], 'checklist.png', { type: 'image/png' });

    await user.upload(screen.getByLabelText('Subir archivo'), file);

    expect(screen.getByRole('heading', { name: 'checklist.png' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Documento original: checklist.png' })).toHaveAttribute(
      'src',
      'blob:preview',
    );
    expect(screen.getByText('Documento listo para analizar.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analizar documento' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Elegir otro archivo' }));
    expect(screen.getByLabelText('Subir archivo')).toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('crea el import con idempotency key y abre la pantalla de procesamiento', async () => {
    const user = userEvent.setup();
    const file = new File(['foto'], 'checklist.png', { type: 'image/png' });
    createImport.mockResolvedValue({ id: IMPORT_ID, status: 'received' });
    const { router } = renderPage();

    await user.upload(screen.getByLabelText('Subir archivo'), file);
    await user.click(screen.getByRole('button', { name: 'Analizar documento' }));

    expect(await screen.findByText('Procesando importación')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(`/imports/${IMPORT_ID}`);
    const [uploaded, options] = createImport.mock.calls[0];
    expect(uploaded).toBe(file);
    expect(options.idempotencyKey).toEqual(expect.any(String));
  });

  it('si POST /imports responde 422 conserva el archivo, muestra el error y no navega', async () => {
    const user = userEvent.setup();
    const file = new File(['pdf'], 'checklist.pdf', { type: 'application/pdf' });
    createImport.mockRejectedValue(
      new ApiError({
        status: 422,
        code: 'pdf_unreadable',
        message: 'No pudimos leer el PDF. Puede estar dañado.',
      }),
    );
    const { router } = renderPage();

    await user.upload(screen.getByLabelText('Subir archivo'), file);
    await user.click(screen.getByRole('button', { name: 'Analizar documento' }));

    expect(await screen.findByText('No pudimos leer el PDF. Puede estar dañado.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'checklist.pdf' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/imports/new');
  });

  it('reutiliza la idempotency key al reintentar la misma petición fallida', async () => {
    const user = userEvent.setup();
    const file = new File(['foto'], 'checklist.png', { type: 'image/png' });
    createImport
      .mockRejectedValueOnce(new ApiError({ status: 0, code: 'network_error', message: 'Sin red' }))
      .mockResolvedValueOnce({ id: IMPORT_ID, status: 'received' });
    renderPage();

    await user.upload(screen.getByLabelText('Subir archivo'), file);
    await user.click(screen.getByRole('button', { name: 'Analizar documento' }));
    await screen.findByText('Sin red');
    await user.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    await waitFor(() => expect(createImport).toHaveBeenCalledTimes(2));
    expect(createImport.mock.calls[1][1].idempotencyKey).toBe(
      createImport.mock.calls[0][1].idempotencyKey,
    );
  });

  it('rechaza archivos fuera del contrato antes de mostrar preview', () => {
    renderPage();
    const input = screen.getByLabelText('Subir archivo');
    const file = new File(['texto'], 'notas.txt', { type: 'text/plain' });

    fireEvent.change(input, { target: { files: [file] } });

    expect(screen.getByRole('alert')).toHaveTextContent('Este tipo de archivo no está permitido.');
    expect(screen.queryByText('Documento listo para analizar.')).not.toBeInTheDocument();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('la captura móvil no acepta PDF', () => {
    renderPage();
    const camera = screen.getByLabelText('Tomar foto');
    const pdf = new File(['pdf'], 'checklist.pdf', { type: 'application/pdf' });

    fireEvent.change(camera, { target: { files: [pdf] } });

    expect(screen.getByRole('alert')).toHaveTextContent('Este tipo de archivo no está permitido.');
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
