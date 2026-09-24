export const API_ERROR_CODES = Object.freeze({
  NETWORK: 'network_error',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown_error',
});

const MESSAGE_BY_STATUS = {
  400: 'La solicitud no es válida.',
  404: 'No encontramos lo que buscas.',
  409: 'Esta información cambió mientras trabajabas. Recarga e intenta de nuevo.',
  422: 'Hay datos que debes revisar.',
  429: 'Hiciste demasiadas solicitudes seguidas. Espera un momento e intenta de nuevo.',
  503: 'El servidor está ocupado en este momento. Intenta de nuevo en unos segundos.',
};

const GENERIC_MESSAGE = 'Ocurrió un error inesperado. Intenta de nuevo.';
const NETWORK_MESSAGE = 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
const TIMEOUT_MESSAGE = 'El servidor tardó demasiado en responder. Intenta de nuevo.';

// Todos los errores HTTP de la app tienen esta misma forma
export class ApiError extends Error {
  constructor({ status, code, message, details = [] }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isValidationError() {
    return this.status === 422;
  }

  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }

  static fromResponse(status, payload) {
    const body = payload?.error;
    return new ApiError({
      status,
      code: body?.code ?? API_ERROR_CODES.UNKNOWN,
      message: body?.message ?? MESSAGE_BY_STATUS[status] ?? GENERIC_MESSAGE,
      details: Array.isArray(body?.details) ? body.details : [],
    });
  }

  static fromNetworkFailure(error) {
    const isTimeout = error?.name === 'TimeoutError';
    return new ApiError({
      status: 0,
      code: isTimeout ? API_ERROR_CODES.TIMEOUT : API_ERROR_CODES.NETWORK,
      message: isTimeout ? TIMEOUT_MESSAGE : NETWORK_MESSAGE,
    });
  }
}
