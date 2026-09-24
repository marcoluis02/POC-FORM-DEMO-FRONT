import { validateFile } from '@/shared/utils/fileValidation';

const makeFile = (name, type, sizeBytes = 10) =>
  new File([new Uint8Array(sizeBytes)], name, { type });

describe('validateFile', () => {
  it('acepta imágenes cuando accept es image/*', () => {
    expect(validateFile(makeFile('foto.jpg', 'image/jpeg'), { accept: 'image/*' })).toBeNull();
  });

  it('acepta por extensión y por tipo exacto', () => {
    const accept = '.pdf,image/png';
    expect(validateFile(makeFile('doc.PDF', ''), { accept })).toBeNull();
    expect(validateFile(makeFile('a.png', 'image/png'), { accept })).toBeNull();
  });

  it('rechaza tipos no permitidos', () => {
    expect(validateFile(makeFile('nota.txt', 'text/plain'), { accept: 'image/*' })).toBe(
      'Este tipo de archivo no está permitido.',
    );
  });

  it('rechaza archivos más pesados que el límite', () => {
    const bigFile = makeFile('foto.jpg', 'image/jpeg', 2 * 1024 * 1024);
    expect(validateFile(bigFile, { maxSizeMb: 1 })).toContain('más de 1 MB');
  });
});
