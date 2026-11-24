import { useEffect, useId, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RotateCcw } from 'lucide-react';

interface MobileSplashProps {
  isDataReady: boolean;
  onComplete: () => void;
  onRetry: () => void;
}

const APPLE_EASE: [number, number, number, number] = [0.28, 0.11, 0.32, 1];

export function MobileSplash({ isDataReady, onComplete, onRetry }: MobileSplashProps) {
  const shouldReduceMotion = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const [minElapsed, setMinElapsed] = useState(false);
  const [waitingTooLong, setWaitingTooLong] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const minMs = shouldReduceMotion ? 450 : 2000;
    const pulseMs = 2500;
    const timeoutMs = 8000;

    const minTimer = window.setTimeout(() => setMinElapsed(true), minMs);
    const pulseTimer = window.setTimeout(() => setWaitingTooLong(true), pulseMs);
    const failTimer = window.setTimeout(() => setTimedOut(true), timeoutMs);

    return () => {
      window.clearTimeout(minTimer);
      window.clearTimeout(pulseTimer);
      window.clearTimeout(failTimer);
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (isDataReady && minElapsed && !exiting && !timedOut) {
      setExiting(true);
      const finishMs = shouldReduceMotion ? 300 : 580;
      const doneTimer = window.setTimeout(() => {
        onComplete();
      }, finishMs);
      return () => window.clearTimeout(doneTimer);
    }
  }, [isDataReady, minElapsed, exiting, timedOut, shouldReduceMotion, onComplete]);

  const handleRetryClick = () => {
    setTimedOut(false);
    setWaitingTooLong(false);
    setMinElapsed(false);
    onRetry();
    window.setTimeout(() => setMinElapsed(true), shouldReduceMotion ? 450 : 2000);
    window.setTimeout(() => setTimedOut(true), 8000);
  };

  const bookGradL = `splashBookL-${uid}`;
  const bookGradR = `splashBookR-${uid}`;
  const pageGradL = `splashPageL-${uid}`;
  const pageGradR = `splashPageR-${uid}`;
  const coinGrad = `splashCoin-${uid}`;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: exiting ? 0 : 1 }}
      transition={{ duration: shouldReduceMotion ? 0.3 : 0.45, ease: APPLE_EASE }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#f5f5f7] dark:bg-black px-6 select-none overflow-hidden"
      role="status"
      aria-live="polite"
      aria-label="Cargando FINDI"
    >
      {/* Center Emerald Glow (0 - 0.4s fade in, pulses once around 1.4s) */}
      <motion.div
        aria-hidden="true"
        initial={shouldReduceMotion ? { opacity: 0.45 } : { opacity: 0, scale: 0.82 }}
        animate={
          shouldReduceMotion
            ? { opacity: exiting ? 0 : 0.45 }
            : exiting
              ? { opacity: 0, scale: 0.7 }
              : {
                  opacity: [0, 0.48, 0.72, 0.48],
                  scale: [0.82, 1, 1.14, 1],
                }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.3 }
            : exiting
              ? { duration: 0.4, ease: APPLE_EASE }
              : {
                  duration: 1.9,
                  times: [0, 0.22, 0.74, 1],
                  ease: APPLE_EASE,
                }
        }
        className="pointer-events-none absolute h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.34)_0%,rgba(16,185,129,0)_72%)]"
      />

      {/* Logo Assembly (transitions smoothly toward top-left bar on exit) */}
      <motion.div
        layoutId="findi-brand-logo"
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 1, scale: 1, x: 0, y: 0 }}
        animate={
          shouldReduceMotion
            ? { opacity: exiting ? 0 : 1 }
            : exiting
              ? {
                  scale: 0.29,
                  x: '-38vw',
                  y: '-43vh',
                  opacity: 0.2,
                }
              : { scale: 1, x: 0, y: 0, opacity: 1 }
        }
        transition={{
          duration: shouldReduceMotion ? 0.3 : 0.56,
          ease: APPLE_EASE,
        }}
        className="relative flex items-center justify-center will-change-transform"
        style={{ perspective: 700 }}
      >
        <div className="relative h-[120px] w-[120px]">
          {/* Animated Coin rising from between pages with $ symbol (1.2 - 1.9s) */}
          <motion.svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            className="absolute inset-0 overflow-visible"
            initial={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 34, scale: 0.85, rotateY: -35 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : waitingTooLong && !isDataReady && !timedOut
                  ? {
                      opacity: 1,
                      y: 0,
                      scale: [1, 1.07, 1],
                      rotateY: 0,
                    }
                  : {
                      opacity: [0, 1, 1, 1],
                      y: [34, -5, 2, 0],
                      scale: [0.85, 1.04, 0.99, 1],
                      rotateY: [-35, 12, 0, 0],
                    }
            }
            transition={
              shouldReduceMotion
                ? { duration: 0.3 }
                : waitingTooLong && !isDataReady && !timedOut
                  ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                  : {
                      delay: 1.15,
                      duration: 0.72,
                      times: [0, 0.55, 0.8, 1],
                      ease: APPLE_EASE,
                    }
            }
          >
            <defs>
              <linearGradient id={coinGrad} x1="36" y1="10" x2="84" y2="58" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#047857" />
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
              opacity="0.75"
            />
            <path
              d="M52.5 40.5L60 21.5L67.5 40.5"
              stroke="#FFFFFF"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M54.5 36C57.5 34 62.5 32.5 66.5 30"
              stroke="#FFFFFF"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <text
              x="60"
              y="48"
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize="10"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              $
            </text>
          </motion.svg>

          {/* Left Book Wing opening from spine (0.3 - 1.4s) */}
          <motion.svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            className="absolute inset-0 overflow-visible"
            style={{ transformOrigin: '60px 76px' }}
            initial={shouldReduceMotion ? { rotateY: 0, opacity: 1 } : { rotateY: 82, opacity: 0.4 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.3,
              duration: shouldReduceMotion ? 0.3 : 1.05,
              ease: APPLE_EASE,
            }}
          >
            <defs>
              <linearGradient id={bookGradL} x1="12" y1="36" x2="60" y2="106" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id={pageGradL} x1="42" y1="44" x2="42" y2="94" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#A7F3D0" />
              </linearGradient>
            </defs>
            <path
              d="M14 48C14 45.8 15.8 44 18 44H22V86C22 87.5 23.1 88.8 24.6 89.1L56.5 96.2C57.8 96.5 59 96.6 60 96.6V107C58.1 107 56.4 105.6 55.2 103.5L18.1 95C15.7 94.5 14 92.4 14 90V48Z"
              fill={`url(#${bookGradL})`}
            />
            <path
              d="M25 43C36 43 50 47 59 56V93C49 87 36 85 25 85V43Z"
              fill={`url(#${pageGradL})`}
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M32 54H48"
              stroke="#059669"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.75"
            />
          </motion.svg>

          {/* Right Book Wing opening from spine (0.3 - 1.4s) */}
          <motion.svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            className="absolute inset-0 overflow-visible"
            style={{ transformOrigin: '60px 76px' }}
            initial={shouldReduceMotion ? { rotateY: 0, opacity: 1 } : { rotateY: -82, opacity: 0.4 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.3,
              duration: shouldReduceMotion ? 0.3 : 1.05,
              ease: APPLE_EASE,
            }}
          >
            <defs>
              <linearGradient id={bookGradR} x1="60" y1="36" x2="108" y2="106" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#065F46" />
              </linearGradient>
              <linearGradient id={pageGradR} x1="78" y1="44" x2="78" y2="94" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#A7F3D0" />
              </linearGradient>
            </defs>
            <path
              d="M60 96.6C61 96.6 62.2 96.5 63.5 96.2L95.4 89.1C96.9 88.8 98 87.5 98 86V44H102C104.2 44 106 45.8 106 48V90C106 92.4 104.3 94.5 101.9 95L64.8 103.5C63.6 105.6 61.9 107 60 107V96.6Z"
              fill={`url(#${bookGradR})`}
            />
            <path
              d="M95 43C84 43 70 47 61 56V93C71 87 84 85 95 85V43Z"
              fill={`url(#${pageGradR})`}
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M72 54H88"
              stroke="#059669"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.75"
            />
          </motion.svg>

          {/* Center Spine Anchor */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 120 120"
            fill="none"
            className="pointer-events-none absolute inset-0"
          >
            <path
              d="M59 56V94M61 56V94"
              stroke="#065F46"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </motion.div>

      {/* Status text or timeout retry */}
      {!timedOut ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ duration: 0.3, delay: shouldReduceMotion ? 0 : 0.25 }}
          className="mt-6 text-xs font-medium tracking-wide text-[#6e6e73] dark:text-[#86868b]"
        >
          Cargando tus datos…
        </motion.p>
      ) : (
        <div className="mt-6 max-w-xs text-center space-y-3">
          <p className="text-sm text-[#EF4444]">
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
    </motion.div>
  );
}
