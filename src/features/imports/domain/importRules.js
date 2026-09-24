import { env } from '@/app/config/env';

// Filtro del selector de archivos (solo UI). El backend revisa el contenido real del archivo.
// Las extensiones van también porque algunos navegadores no reportan el tipo (file.type vacío).
export const DOCUMENT_UPLOAD = Object.freeze({
  accept: 'image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf',
  maxSizeMb: env.maxUploadMb,
  maxPdfPages: env.maxPdfPages,
  pdfType: 'application/pdf',
});

export function isPdf(mimeType) {
  return mimeType === DOCUMENT_UPLOAD.pdfType;
}
