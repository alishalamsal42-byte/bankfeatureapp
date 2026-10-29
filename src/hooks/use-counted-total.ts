import { useEffect, useRef, useState } from 'react';
export function useCountedTotal(target: number) {
  const [value, setValue] = useState(target);
  const previous = useRef(target);
  useEffect(() => {
    const start = previous.current;
    previous.current = target;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(target); return; }
    let frame = 0;
    const started = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / 700);
      setValue(start + (target - start) * (1 - (1 - progress) ** 3));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}
