import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export function useCountUp(target: number, durationMs = 600): number {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(target);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(target);
      return;
    }

    let rafId = 0;
    const startValue = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Ease out cubic matching Apple settling curve
      const eased = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (target - startValue) * eased;
      setDisplayValue(progress >= 1 ? target : nextValue);
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs, shouldReduceMotion]);

  return displayValue;
}
