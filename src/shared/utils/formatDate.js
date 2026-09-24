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
