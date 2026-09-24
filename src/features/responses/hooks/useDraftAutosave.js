import { useEffect, useRef } from 'react';

// Guarda solo cuando el usuario deja de cambiar el borrador por delayMs.
// No muestra confirmación ni toast: eso lo decide quien llama a onSave.
export function useDraftAutosave({ enabled, delayMs, payloadKey, canSave, onSave }) {
  const onSaveRef = useRef(onSave);
  const savingRef = useRef(false);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (!enabled || !canSave || !payloadKey) return undefined;

    const timer = setTimeout(() => {
      if (savingRef.current) return;
      savingRef.current = true;
      Promise.resolve(onSaveRef.current())
        .catch(() => undefined)
        .finally(() => {
          savingRef.current = false;
        });
    }, delayMs);

    return () => clearTimeout(timer);
  }, [enabled, canSave, delayMs, payloadKey]);
}
