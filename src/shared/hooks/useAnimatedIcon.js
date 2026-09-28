import { useRef } from 'react';

export function useAnimatedIcon() {
  const ref = useRef(null);
  const play = () => ref.current?.startAnimation();
  const stop = () => ref.current?.stopAnimation();
  return {
    ref,
    onMouseEnter: play,
    onMouseLeave: stop,
    onFocus: play,
    onBlur: stop,
  };
}

export function animatedIconEvents(...refs) {
  const play = () => {
    refs.forEach((ref) => ref.current?.startAnimation());
  };
  const stop = () => {
    refs.forEach((ref) => ref.current?.stopAnimation());
  };
  return {
    onMouseEnter: play,
    onMouseLeave: stop,
    onFocus: play,
    onBlur: stop,
  };
}
