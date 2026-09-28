import { env } from '@/app/config/env';

// Filtros de UI. El backend valida MIME real, tamaño y páginas.
export const DOCUMENT_UPLOAD = Object.freeze({
  accept: 'image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf',
  maxSizeMb: env.maxUploadMb,
  maxPdfPages: env.maxPdfPages,
  pdfType: 'application/pdf',
});

export const DOCUMENT_CAPTURE = Object.freeze({
  accept: 'image/jpeg,image/png,.jpg,.jpeg,.png',
  capture: 'environment',
});

export function isPdf(mimeType) {
  return mimeType === DOCUMENT_UPLOAD.pdfType;
}
