import { useSyncExternalStore } from 'react';

function mediaOf(query) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(query);
}

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const media = mediaOf(query);
      if (!media) return () => {};
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => Boolean(mediaOf(query)?.matches),
    () => false,
  );
}
