// El backend usa este header para no crear dos veces lo mismo si el envío se repite
export function idempotencyHeaders(idempotencyKey) {
  return idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
}
