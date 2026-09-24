import { validateFile } from '@/shared/utils/fileValidation';

const MB = 1024 * 1024;
const NOT_ALLOWED = 'Este tipo de archivo no está permitido.';

const makeFile = (name, type, sizeBytes = 10) =>
  new File([new Uint8Array(sizeBytes)], name, { type });

describe('validateFile', () => {
  describe('extensión', () => {
    it('acepta la extensión sin importar mayúsculas', () => {
      expect(validateFile(makeFile('doc.PDF', ''), { accept: '.pdf' })).toBeNull();
      expect(validateFile(makeFile('foto.JpG', ''), { accept: '.jpg' })).toBeNull();
    });

    it('rechaza una extensión que no está en la lista', () => {
      expect(validateFile(makeFile('foto.jpeg', ''), { accept: '.jpg,.png' })).toBe(NOT_ALLOWED);
    });

    it('revisa solo el final del nombre', () => {
      expect(validateFile(makeFile('reporte.pdf.exe', ''), { accept: '.pdf' })).toBe(NOT_ALLOWED);
    });

    it('sirve de respaldo cuando el navegador no da el tipo', () => {
      const accept = 'application/pdf,.pdf';
      expect(validateFile(makeFile('doc.pdf', ''), { accept })).toBeNull();
    });
  });

  describe('MIME', () => {
    it('acepta el tipo exacto', () => {
      expect(validateFile(makeFile('a.png', 'image/png'), { accept: 'image/png' })).toBeNull();
    });

    it('acepta cualquier imagen con image/*', () => {
      expect(validateFile(makeFile('a.webp', 'image/webp'), { accept: 'image/*' })).toBeNull();
    });

    it('image/* no deja pasar un PDF', () => {
      expect(validateFile(makeFile('a.pdf', 'application/pdf'), { accept: 'image/*' })).toBe(
        NOT_ALLOWED,
      );
    });

    it('rechaza un tipo distinto aunque se parezca', () => {
      expect(validateFile(makeFile('a.png', 'image/png'), { accept: 'image/jpeg' })).toBe(
        NOT_ALLOWED,
      );
    });

    it('sin tipo y solo con reglas MIME se rechaza', () => {
      expect(validateFile(makeFile('archivo', ''), { accept: 'image/png' })).toBe(NOT_ALLOWED);
    });

    it('sin accept deja pasar cualquier tipo', () => {
      expect(validateFile(makeFile('nota.txt', 'text/plain'))).toBeNull();
    });
  });

  describe('tamaño', () => {
    it('acepta un archivo que pesa justo el límite', () => {
      expect(validateFile(makeFile('a.jpg', 'image/jpeg', MB), { maxSizeMb: 1 })).toBeNull();
    });

    it('rechaza un byte arriba del límite', () => {
      expect(validateFile(makeFile('a.jpg', 'image/jpeg', MB + 1), { maxSizeMb: 1 })).toBe(
        'El archivo pesa más de 1 MB. Elige uno más ligero.',
      );
    });

    it('sin maxSizeMb no hay límite', () => {
      expect(validateFile(makeFile('a.jpg', 'image/jpeg', 3 * MB))).toBeNull();
    });

    it('primero avisa del tipo y después del tamaño', () => {
      const file = makeFile('nota.txt', 'text/plain', 3 * MB);
      expect(validateFile(file, { accept: 'image/*', maxSizeMb: 1 })).toBe(NOT_ALLOWED);
    });
  });

  it('es solo ayuda visual: un archivo renombrado pasa aquí y el backend es quien lo rechaza', () => {
    const renamed = makeFile('virus.pdf', 'application/pdf');
    expect(validateFile(renamed, { accept: 'application/pdf' })).toBeNull();
  });
});
