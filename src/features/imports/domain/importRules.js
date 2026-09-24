import { env } from '@/app/config/env';

// Los mismos tipos que acepta el backend (los revisa por el contenido del archivo)
export const DOCUMENT_UPLOAD = Object.freeze({
  accept: 'image/jpeg,image/png,image/webp,application/pdf',
  maxSizeMb: env.maxUploadMb,
  pdfType: 'application/pdf',
});

export function isPdf(mimeType) {
  return mimeType === DOCUMENT_UPLOAD.pdfType;
}
