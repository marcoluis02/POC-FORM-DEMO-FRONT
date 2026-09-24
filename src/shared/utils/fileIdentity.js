// Datos que identifican a un archivo sin leerlo completo (sirve para la clave de idempotencia)
export function fileIdentity(file) {
  return { name: file.name, size: file.size, type: file.type, lastModified: file.lastModified };
}
