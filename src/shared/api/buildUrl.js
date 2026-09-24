// Arma la URL final: reemplaza {param} en la ruta y agrega el query string.
// Ejemplo: buildUrl(base, '/poc/templates/{id}', { id: 'abc' }, { page: 1 })

export function buildUrl(baseUrl, path, pathParams = {}, query = {}) {
  const resolvedPath = path.replace(/\{(\w+)\}/g, (_, name) => {
    const value = pathParams[name];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Falta el parámetro "${name}" para la ruta ${path}.`);
    }
    return encodeURIComponent(String(value));
  });

  const searchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return `${baseUrl}${resolvedPath}${queryString ? `?${queryString}` : ''}`;
}
