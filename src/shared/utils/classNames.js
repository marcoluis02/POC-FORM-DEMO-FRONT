// Junta clases CSS ignorando las vacías: classNames('a', false && 'b', 'c') => 'a c'
export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}
