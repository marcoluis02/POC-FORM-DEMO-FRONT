import { useCallback, useEffect, useRef, useState } from 'react';

// Archivo elegido en el navegador con una URL temporal para verlo antes de subirlo.
// La URL se libera al cambiar de archivo, al quitarlo o al salir de la pantalla.
export function useLocalFilePreview() {
  const [preview, setPreview] = useState(null);
  const urlRef = useRef(null);

  const replaceUrl = useCallback((nextUrl) => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = nextUrl;
  }, []);

  const select = useCallback(
    (file) => {
      const url = URL.createObjectURL(file);
      replaceUrl(url);
      setPreview({ file, url });
    },
    [replaceUrl],
  );

  const clear = useCallback(() => {
    replaceUrl(null);
    setPreview(null);
  }, [replaceUrl]);

  useEffect(() => () => replaceUrl(null), [replaceUrl]);

  return { file: preview?.file ?? null, url: preview?.url ?? null, select, clear };
}
