import { useEffect, useRef } from 'react';

// Guarda solo cuando el usuario deja de cambiar el borrador por delayMs.
// Si llega otro cambio mientras aún guarda, al terminar se vuelve a guardar lo último.
export function useDraftAutosave({ enabled, delayMs, payloadKey, canSave, onSave }) {
  const onSaveRef = useRef(onSave);
  const enabledRef = useRef(enabled);
  const canSaveRef = useRef(canSave);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    canSaveRef.current = canSave;
  }, [canSave]);

  useEffect(() => {
    if (!enabled || !canSave || !payloadKey) return undefined;

    const runSave = () => {
      if (savingRef.current) {
        // Ya hay un guardado en curso: al terminar se procesa lo último
        queuedRef.current = true;
        return;
      }

      savingRef.current = true;
      Promise.resolve(onSaveRef.current())
        .catch(() => undefined)
        .finally(() => {
          savingRef.current = false;
          if (!queuedRef.current) return;
          queuedRef.current = false;
          if (enabledRef.current && canSaveRef.current) runSave();
        });
    };

    const timer = setTimeout(runSave, delayMs);
    return () => clearTimeout(timer);
  }, [enabled, canSave, delayMs, payloadKey]);
}
