import { useEffect, useRef, useState } from "react";

export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const frameRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number.isFinite(target) ? target : 0;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(from + (to - from) * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}
