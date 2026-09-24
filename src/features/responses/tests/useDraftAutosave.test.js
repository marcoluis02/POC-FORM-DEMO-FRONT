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

  it('si el payload cambia durante un save, vuelve a guardar al terminar', async () => {
    let finishFirstSave;
    const onSave = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirstSave = resolve;
          }),
      )
      .mockResolvedValueOnce(undefined);

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

    // Arranca el primer guardado
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(onSave).toHaveBeenCalledTimes(1);

    // El usuario sigue escribiendo mientras el primero aún no termina
    rerender({ payloadKey: 'b' });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    // El segundo intento queda en cola; no pisa al que sigue en curso
    expect(onSave).toHaveBeenCalledTimes(1);

    // Al terminar el primero, se guarda el último payload pendiente
    await act(async () => {
      finishFirstSave();
      await Promise.resolve();
    });
    expect(onSave).toHaveBeenCalledTimes(2);
  });
});
