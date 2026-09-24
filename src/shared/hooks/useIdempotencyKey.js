import { useCallback, useRef } from 'react';
import { randomId } from '@/shared/utils/randomId';

// Da la misma clave mientras se reintenta el mismo envío (ej. se cayó el internet).
// Si los datos cambian se genera otra clave; después de guardar con éxito se libera con release().
export function useIdempotencyKey() {
  const current = useRef({ key: null, payload: null });

  const keyFor = useCallback((payload) => {
    const serialized = JSON.stringify(payload);
    if (current.current.payload !== serialized) {
      current.current = { key: randomId(), payload: serialized };
    }
    return current.current.key;
  }, []);

  const release = useCallback(() => {
    current.current = { key: null, payload: null };
  }, []);

  return { keyFor, release };
}
