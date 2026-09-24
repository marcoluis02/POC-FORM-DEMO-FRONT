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
  endpoints: Object.freeze({
    health: readRequired('VITE_ENDPOINT_HEALTH'),
  }),
});
