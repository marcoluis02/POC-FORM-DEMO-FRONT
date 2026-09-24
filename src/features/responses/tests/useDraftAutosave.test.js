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
});
