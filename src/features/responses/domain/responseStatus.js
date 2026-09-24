export const RESPONSE_STATUS = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
});

export const RESPONSE_STATUS_LABELS = Object.freeze({
  [RESPONSE_STATUS.DRAFT]: 'Borrador',
  [RESPONSE_STATUS.SUBMITTED]: 'Enviado',
});

// Color del Badge de cada estado
export const RESPONSE_STATUS_TONES = Object.freeze({
  [RESPONSE_STATUS.DRAFT]: 'warning',
  [RESPONSE_STATUS.SUBMITTED]: 'success',
});
