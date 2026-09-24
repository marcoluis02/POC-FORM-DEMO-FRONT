import { renderHook } from '@testing-library/react';
import { useIdempotencyKey } from '@/shared/hooks/useIdempotencyKey';

describe('useIdempotencyKey', () => {
  it('repite la clave si se reintenta con los mismos datos', () => {
    const { result } = renderHook(() => useIdempotencyKey());

    const first = result.current.keyFor({ title: 'A' });
    const retry = result.current.keyFor({ title: 'A' });

    expect(retry).toBe(first);
  });

  it('genera otra clave si los datos cambian', () => {
    const { result } = renderHook(() => useIdempotencyKey());

    const first = result.current.keyFor({ title: 'A' });
    const changed = result.current.keyFor({ title: 'B' });

    expect(changed).not.toBe(first);
  });

  it('genera otra clave después de guardar con éxito', () => {
    const { result } = renderHook(() => useIdempotencyKey());

    const first = result.current.keyFor({ title: 'A' });
    result.current.release();

    expect(result.current.keyFor({ title: 'A' })).not.toBe(first);
  });
});
