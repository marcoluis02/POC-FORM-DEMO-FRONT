import { renderHook, act } from '@testing-library/react';
import { useDraftAutosave } from '../hooks/useDraftAutosave';

describe('useDraftAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('espera el delay y luego llama onSave una sola vez', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ payloadKey }) =>
        useDraftAutosave({
          enabled: true,
          delayMs: 1500,
          payloadKey,
          canSave: true,
          onSave,
        }),
      { initialProps: { payloadKey: 'a' } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1499);
    });
    expect(onSave).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(onSave).toHaveBeenCalledTimes(1);

    // Si cambia el payload, reinicia la espera
    onSave.mockClear();
    rerender({ payloadKey: 'b' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('no guarda si canSave es false', async () => {
    const onSave = vi.fn();

    renderHook(() =>
      useDraftAutosave({
        enabled: true,
        delayMs: 500,
        payloadKey: 'x',
        canSave: false,
        onSave,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(onSave).not.toHaveBeenCalled();
  });

  it('si el payload cambia durante un save, guarda el payload más reciente al terminar', async () => {
    let finishFirstSave;
    const savedPayloads = [];
    const firstSave = vi.fn(
      () =>
        new Promise((resolve) => {
          savedPayloads.push('a');
          finishFirstSave = resolve;
        }),
    );
    const secondSave = vi.fn(async () => {
      savedPayloads.push('b');
    });

    const { rerender } = renderHook(
      ({ payloadKey, onSave }) =>
        useDraftAutosave({
          enabled: true,
          delayMs: 1500,
          payloadKey,
          canSave: true,
          onSave,
        }),
      { initialProps: { payloadKey: 'a', onSave: firstSave } },
    );

    // Arranca el primer guardado con A.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(firstSave).toHaveBeenCalledTimes(1);

    // Llega B mientras A sigue pendiente. El hook debe conservar lo último.
    rerender({ payloadKey: 'b', onSave: secondSave });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(secondSave).not.toHaveBeenCalled();

    // Cuando termina A, se ejecuta B con el callback más reciente.
    await act(async () => {
      finishFirstSave();
      await Promise.resolve();
    });

    expect(secondSave).toHaveBeenCalledTimes(1);
    expect(savedPayloads).toEqual(['a', 'b']);
  });
});
