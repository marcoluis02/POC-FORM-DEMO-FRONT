export const IMPORT_STATUS = Object.freeze({
  RECEIVED: 'received',
  PROCESSING: 'processing',
  REQUIRES_REVIEW: 'requires_review',
  FAILED: 'failed',
});

export const IMPORT_STATUS_LABELS = Object.freeze({
  [IMPORT_STATUS.RECEIVED]: 'Recibido',
  [IMPORT_STATUS.PROCESSING]: 'Procesando',
  [IMPORT_STATUS.REQUIRES_REVIEW]: 'Listo para revisar',
  [IMPORT_STATUS.FAILED]: 'Falló',
});
