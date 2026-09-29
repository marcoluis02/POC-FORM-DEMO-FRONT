// El backend manda las fechas en UTC; aquí se muestran en la zona horaria del usuario
const dateTimeFormatter = new Intl.DateTimeFormat('es', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDateTime(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? '' : dateTimeFormatter.format(date);
}

export function formatRelativeTime(isoDate, now = new Date()) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const minutes = Math.round((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? 'hace 1 hora' : `hace ${hours} horas`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'ayer';
  return `hace ${days} días`;
}
