const BYTES_PER_MB = 1024 * 1024;

// accept usa el mismo formato que <input accept>: "image/*,application/pdf,.jpg"
function matchesAccept(file, accept) {
  if (!accept) return true;
  const fileName = file.name.toLowerCase();
  const fileType = (file.type || '').toLowerCase();

  return accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
    .some((rule) => {
      if (rule.startsWith('.')) return fileName.endsWith(rule);
      if (rule.endsWith('/*')) return fileType.startsWith(rule.slice(0, -1));
      return fileType === rule;
    });
}

// Solo es ayuda visual para avisar rápido al usuario. No garantiza nada:
// file.type y el nombre los puede cambiar cualquiera. El backend revisa el archivo real
// (tipo por su contenido, tamaño y páginas del PDF) y es quien decide si se acepta.
// Regresa un mensaje entendible si el archivo no sirve, o null si todo está bien.
export function validateFile(file, { accept, maxSizeMb } = {}) {
  if (!matchesAccept(file, accept)) {
    return 'Este tipo de archivo no está permitido.';
  }
  if (maxSizeMb && file.size > maxSizeMb * BYTES_PER_MB) {
    return `El archivo pesa más de ${maxSizeMb} MB. Elige uno más ligero.`;
  }
  return null;
}
