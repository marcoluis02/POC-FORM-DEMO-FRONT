// Único lugar donde se lee import.meta.env. Si falta una variable la app no arranca.

function readRequired(name) {
  const value = import.meta.env[name];
  if (value === undefined || String(value).trim() === '') {
    throw new Error(`Falta la variable ${name} en el archivo .env del front.`);
  }
  return String(value).trim();
}

function readPositiveNumber(name) {
  const value = Number(readRequired(name));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`La variable ${name} debe ser un número mayor a 0.`);
  }
  return value;
}

export const env = Object.freeze({
  apiUrl: readRequired('VITE_API_URL').replace(/\/+$/, ''),
  apiTimeoutMs: readPositiveNumber('VITE_API_TIMEOUT_MS'),
  uploadTimeoutMs: readPositiveNumber('VITE_UPLOAD_TIMEOUT_MS'),
  maxUploadMb: readPositiveNumber('VITE_MAX_UPLOAD_MB'),
  maxPdfPages: readPositiveNumber('VITE_MAX_PDF_PAGES'),
  endpoints: Object.freeze({
    health: readRequired('VITE_ENDPOINT_HEALTH'),
    templates: readRequired('VITE_ENDPOINT_TEMPLATES'),
    templateDetail: readRequired('VITE_ENDPOINT_TEMPLATE_DETAIL'),
    templateVersions: readRequired('VITE_ENDPOINT_TEMPLATE_VERSIONS'),
    templateVersionDetail: readRequired('VITE_ENDPOINT_TEMPLATE_VERSION_DETAIL'),
    imports: readRequired('VITE_ENDPOINT_IMPORTS'),
    importDetail: readRequired('VITE_ENDPOINT_IMPORT_DETAIL'),
  }),
});
