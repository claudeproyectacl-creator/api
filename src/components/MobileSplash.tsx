import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { FINDI_LOGO_COLORS, FINDI_LOGO_PATHS } from './FindiLogo';

interface MobileSplashProps {
  isDataReady: boolean;
  onExitStart?: () => void;
  onComplete: () => void;
  onRetry: () => void;
}

interface DockTransform {
  x: number;
  y: number;
  scale: number;
}

const APPLE_EASE: [number, number, number, number] = [0.28, 0.11, 0.32, 1];

export function MobileSplash({
  isDataReady,
  onExitStart,
  onComplete,
  onRetry,
}: MobileSplashProps) {
  const shouldReduceMotion = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const splashLogoRef = useRef<HTMLDivElement | null>(null);

  const [attemptId, setAttemptId] = useState(0);
  const [minElapsed, setMinElapsed] = useState(false);
  const [waitingTooLong, setWaitingTooLong] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [dockTransform, setDockTransform] = useState<DockTransform | null>(null);

  // Manage sequence timers cleanly on mount, retry, and unmount
  useEffect(() => {
    const minMs = shouldReduceMotion ? 320 : 2000;
    const pulseMs = 2050;
    const timeoutMs = 8000;

    const minTimer = window.setTimeout(() => setMinElapsed(true), minMs);
    const pulseTimer = window.setTimeout(() => setWaitingTooLong(true), pulseMs);
    const failTimer = window.setTimeout(() => setTimedOut(true), timeoutMs);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(pulseTimer);
      window.clearTimeout(failTimer);
    };
  }, [attemptId, shouldReduceMotion]);

  // Trigger real dock flight when data is ready and min duration elapsed
  useEffect(() => {
    if (!isDataReady || !minElapsed || exiting || timedOut) return;

    if (!shouldReduceMotion && splashLogoRef.current) {
      const targetEl = document.querySelector(
        '[data-findi-header-logo="true"]'
      ) as HTMLElement | null;

      if (targetEl) {
        const sourceRect = splashLogoRef.current.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        if (sourceRect.width > 0 && targetRect.width > 0) {
          const sourceCenterX = sourceRect.left + sourceRect.width / 2;
          const sourceCenterY = sourceRect.top + sourceRect.height / 2;
          const targetCenterX = targetRect.left + targetRect.width / 2;
          const targetCenterY = targetRect.top + targetRect.height / 2;

          setDockTransform({
            x: targetCenterX - sourceCenterX,
            y: targetCenterY - sourceCenterY,
            scale: targetRect.width / sourceRect.width,
          });
        }
      }
    }

    setExiting(true);
    onExitStart?.();
  }, [isDataReady, minElapsed, exiting, timedOut, shouldReduceMotion, onExitStart]);

  // Finish splash cleanly once exit animation settles
  useEffect(() => {
    if (!exiting) return;
    const finishMs = shouldReduceMotion ? 300 : 660;
    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, finishMs);
    return () => window.clearTimeout(doneTimer);
  }, [exiting, shouldReduceMotion, onComplete]);

  const handleRetryClick = () => {
    setTimedOut(false);
    setWaitingTooLong(false);
    setMinElapsed(false);
    setExiting(false);
    setDockTransform(null);
    setAttemptId((prev) => prev + 1);
    onRetry();
  };

  const bookGradL = `splashBookL-${uid}`;
  const bookGradR = `splashBookR-${uid}`;
  const pageGradL = `splashPageL-${uid}`;
  const pageGradR = `splashPageR-${uid}`;
  const coinGrad = `splashCoin-${uid}`;

  const logoExitTarget = shouldReduceMotion
    ? { opacity: 0 }
    : dockTransform
      ? {
          x: dockTransform.x,
          y: dockTransform.y,
          scale: dockTransform.scale,
          opacity: 1,
        }
      : {
          scale: 0.25,
          opacity: 0,
        };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none overflow-hidden pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1.5rem,env(safe-area-inset-left))] pr-[max(1.5rem,env(safe-area-inset-right))]"
      role="status"
      aria-live="polite"
      aria-label="Cargando FINDI"
    >
      {/* Clean backdrop that fades away during dock transition */}
      <motion.div
        aria-hidden="true"
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0.92 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{
          duration: shouldReduceMotion ? 0.3 : exiting ? 0.56 : 0.35,
          ease: APPLE_EASE,
        }}
        className="absolute inset-0 bg-[#f5f5f7] dark:bg-black"
      />

      {/* Center Emerald Glow (0 - 0.4s fade in, pulses once as coin rises) */}
      <motion.div
        aria-hidden="true"
        initial={shouldReduceMotion ? { opacity: 0.45 } : { opacity: 0, scale: 0.84 }}
        animate={
          shouldReduceMotion
            ? { opacity: exiting ? 0 : 0.45 }
            : exiting
              ? { opacity: 0, scale: 0.72 }
              : {
                  opacity: [0, 0.55, 0.8, 0.52],
                  scale: [0.84, 1, 1.15, 1],
                }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.3 }
            : exiting
              ? { duration: 0.42, ease: APPLE_EASE }
              : {
                  duration: 1.9,
                  times: [0, 0.22, 0.74, 1],
                  ease: APPLE_EASE,
                }
        }
        className="pointer-events-none absolute h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.34)_0%,rgba(16,185,129,0)_72%)]"
      />

      {/* Logo Assembly (~200px wide, travels accurately to header logo) */}
      <motion.div
        ref={splashLogoRef}
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 1, scale: 1, x: 0, y: 0 }}
        animate={
          exiting
            ? logoExitTarget
            : shouldReduceMotion
              ? { opacity: 1 }
              : { opacity: 1, scale: 1, x: 0, y: 0 }
        }
        transition={{
          duration: shouldReduceMotion ? 0.3 : exiting ? 0.65 : 0.3,
          ease: APPLE_EASE,
        }}
        className="relative z-10 flex items-center justify-center will-change-transform"
        style={{ perspective: 800 }}
      >
        <div className="relative h-[200px] w-[200px]">
          {/* Animated Coin rising from between pages with large, crisp $ (1.2 - 1.9s) */}
          <motion.svg
            width="200"
            height="200"
            viewBox="0 0 120 120"
            fill="none"
            className="absolute inset-0 overflow-visible"
            style={{ transformOrigin: '60px 35px' }}
            initial={
              shouldReduceMotion
                ? { opacity: 1, y: 0, scale: 1, rotateY: 0 }
                : { opacity: 0, y: 42, scale: 0.76, rotateY: 0 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1, y: 0, scale: 1, rotateY: 0 }
                : waitingTooLong && !isDataReady && !timedOut
                  ? {
                      opacity: 1,
                      y: 0,
                      scale: [1, 1.07, 1],
                      rotateY: 0,
                    }
                  : {
                      opacity: [0, 1, 1, 1],
                      y: [42, -7, 2, 0],
                      scale: [0.76, 1.07, 0.98, 1],
                      rotateY: [0, 210, 360, 360],
                    }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.3 }
                : waitingTooLong && !isDataReady && !timedOut
                  ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                  : {
                      delay: 1.18,
                      duration: 0.72,
                      times: [0, 0.56, 0.82, 1],
                      ease: APPLE_EASE,
                    }
            }
          >
            <defs>
              <linearGradient id={coinGrad} x1="36" y1="10" x2="84" y2="58" gradientUnits="userSpaceOnUse">
                {FINDI_LOGO_COLORS.coinStops.map((s) => (
                  <stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </linearGradient>
            </defs>
            <circle
              cx="60"
              cy="35"
              r="22"
              fill={`url(#${coinGrad})`}
              stroke="#FFFFFF"
              strokeWidth="2.2"
            />
            <circle
              cx="60"
              cy="35"
              r="17.5"
              stroke="#D1FAE5"
              strokeWidth="1.2"
              opacity="0.82"
            />
            <text
              x="60"
              y="36"
              dominantBaseline="central"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="26"
              fontWeight="700"
              fontFamily="Inter, system-ui, sans-serif"
            >
              $
            </text>
          </motion.svg>

          {/* Left Book Wing opening from spine (0.3 - 1.4s) */}
          <motion.svg
            width="200"
            height="200"
            viewBox="0 0 120 120"
            fill="none"
            className="absolute inset-0 overflow-visible"
            style={{ transformOrigin: '60px 76px' }}
            initial={shouldReduceMotion ? { rotateY: 0, opacity: 1 } : { rotateY: 85, opacity: 0.35 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.3,
              duration: shouldReduceMotion ? 0.3 : 1.08,
              ease: APPLE_EASE,
            }}
          >
            <defs>
              <linearGradient id={bookGradL} x1="12" y1="36" x2="60" y2="106" gradientUnits="userSpaceOnUse">
                {FINDI_LOGO_COLORS.leftCoverStops.map((s) => (
                  <stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </linearGradient>
              <linearGradient id={pageGradL} x1="42" y1="44" x2="42" y2="94" gradientUnits="userSpaceOnUse">
                {FINDI_LOGO_COLORS.pageStops.map((s) => (
                  <stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </linearGradient>
            </defs>
            <path d={FINDI_LOGO_PATHS.leftCover} fill={`url(#${bookGradL})`} />
            <path
              d={FINDI_LOGO_PATHS.leftPage}
              fill={`url(#${pageGradL})`}
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d={FINDI_LOGO_PATHS.leftPageLine}
              stroke="#059669"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.75"
            />
          </motion.svg>

          {/* Right Book Wing opening from spine (0.3 - 1.4s) */}
          <motion.svg
            width="200"
            height="200"
            viewBox="0 0 120 120"
            fill="none"
            className="absolute inset-0 overflow-visible"
            style={{ transformOrigin: '60px 76px' }}
            initial={shouldReduceMotion ? { rotateY: 0, opacity: 1 } : { rotateY: -85, opacity: 0.35 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.3,
              duration: shouldReduceMotion ? 0.3 : 1.08,
              ease: APPLE_EASE,
            }}
          >
            <defs>
              <linearGradient id={bookGradR} x1="60" y1="36" x2="108" y2="106" gradientUnits="userSpaceOnUse">
                {FINDI_LOGO_COLORS.rightCoverStops.map((s) => (
                  <stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </linearGradient>
              <linearGradient id={pageGradR} x1="78" y1="44" x2="78" y2="94" gradientUnits="userSpaceOnUse">
                {FINDI_LOGO_COLORS.pageStops.map((s) => (
                  <stop key={s.offset} offset={s.offset} stopColor={s.color} />
                ))}
              </linearGradient>
            </defs>
            <path d={FINDI_LOGO_PATHS.rightCover} fill={`url(#${bookGradR})`} />
            <path
              d={FINDI_LOGO_PATHS.rightPage}
              fill={`url(#${pageGradR})`}
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d={FINDI_LOGO_PATHS.rightPageLine}
              stroke="#059669"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.75"
            />
          </motion.svg>

          {/* Center Spine Anchor */}
          <svg
            width="200"
            height="200"
            viewBox="0 0 120 120"
            fill="none"
            className="pointer-events-none absolute inset-0"
          >
            <path
              d={FINDI_LOGO_PATHS.spine}
              stroke="#065F46"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </motion.div>

      {/* High-contrast loading label or timeout retry */}
      {!timedOut ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ duration: 0.28, delay: shouldReduceMotion ? 0 : 0.25 }}
          className="relative z-10 mt-8 text-sm font-medium tracking-wide text-[#3a3a3c] dark:text-[#d1d1d6]"
        >
          Cargando tus datos…
        </motion.p>
      ) : (
        <div className="relative z-10 mt-8 max-w-xs text-center space-y-3">
          <p className="text-sm font-medium text-[#EF4444]">
            No hemos podido cargar tus datos en este momento. Comprueba tu conexión.
          </p>
          <button
            type="button"
            onClick={handleRetryClick}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#10B981] px-6 py-2.5 text-sm font-semibold text-[#022C22] hover:bg-[#059669] hover:text-white active:scale-[0.97] transition-transform"
          >
            <RotateCcw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
