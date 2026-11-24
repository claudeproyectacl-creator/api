import { motion, useReducedMotion } from 'motion/react';

interface FindiLogoProps {
  variant?: 'hero' | 'compact';
  celebrateCoin?: boolean;
  className?: string;
}

const APPLE_EASE: [number, number, number, number] = [0.28, 0.11, 0.32, 1];

export function FindiLogo({
  variant = 'hero',
  celebrateCoin = false,
  className = '',
}: FindiLogoProps) {
  const shouldReduceMotion = useReducedMotion();
  const isHero = variant === 'hero';
  const size = isHero ? 104 : 34;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {isHero && (
        <motion.div
          aria-hidden="true"
          initial={shouldReduceMotion ? { opacity: 0.35 } : { opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.45, scale: 1 }}
          transition={{ duration: 0.75, ease: APPLE_EASE }}
          className="pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.28)_0%,rgba(16,185,129,0)_70%)]"
        />
      )}

      <motion.div
        initial={shouldReduceMotion || !isHero ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: APPLE_EASE }}
        className="relative flex items-center justify-center"
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Logotipo de FINDI: libro abierto con moneda verde"
          className="overflow-visible"
        >
          <defs>
            <linearGradient id="findiBookGrad" x1="12" y1="36" x2="108" y2="106" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="55%" stopColor="#059669" />
              <stop offset="100%" stopColor="#065F46" />
            </linearGradient>
            <linearGradient id="findiCoinGrad" x1="36" y1="10" x2="84" y2="58" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="findiPageGrad" x1="60" y1="44" x2="60" y2="94" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ECFDF5" />
              <stop offset="100%" stopColor="#A7F3D0" />
            </linearGradient>
          </defs>

          {/* Open Book Base */}
          <g>
            {/* Outer cover */}
            <path
              d="M14 48C14 45.8 15.8 44 18 44H22V86C22 87.5 23.1 88.8 24.6 89.1L56.5 96.2C58.8 96.7 61.2 96.7 63.5 96.2L95.4 89.1C96.9 88.8 98 87.5 98 86V44H102C104.2 44 106 45.8 106 48V90C106 92.4 104.3 94.5 101.9 95L64.8 103.5C63.6 105.6 61.9 107 60 107C58.1 107 56.4 105.6 55.2 103.5L18.1 95C15.7 94.5 14 92.4 14 90V48Z"
              fill="url(#findiBookGrad)"
            />
            {/* Left page */}
            <path
              d="M25 43C36 43 50 47 59 56V93C49 87 36 85 25 85V43Z"
              fill="url(#findiPageGrad)"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Right page */}
            <path
              d="M95 43C84 43 70 47 61 56V93C71 87 84 85 95 85V43Z"
              fill="url(#findiPageGrad)"
              stroke="#059669"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            {/* Center spine notch */}
            <path
              d="M59 56V94M61 56V94"
              stroke="#065F46"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Subtle page horizon bars */}
            <path
              d="M32 54H48M72 54H88"
              stroke="#059669"
              strokeWidth="2.4"
              strokeLinecap="round"
              opacity="0.7"
            />
          </g>

          {/* Animated Emerald Coin */}
          <motion.g
            style={{ transformOrigin: '60px 35px' }}
            initial={
              shouldReduceMotion || !isHero
                ? { y: 0, opacity: 1 }
                : { y: -22, opacity: 0, scale: 0.92 }
            }
            animate={
              celebrateCoin && !shouldReduceMotion
                ? { y: 0, opacity: 1, scale: 1, rotateY: [0, 360] }
                : { y: 0, opacity: 1, scale: 1, rotateY: 0 }
            }
            transition={
              celebrateCoin
                ? { duration: 0.8, ease: APPLE_EASE }
                : { duration: 0.65, delay: isHero ? 0.12 : 0, ease: APPLE_EASE }
            }
          >
            <circle
              cx="60"
              cy="35"
              r="22"
              fill="url(#findiCoinGrad)"
              stroke="#ECFDF5"
              strokeWidth="2.2"
            />
            <circle
              cx="60"
              cy="35"
              r="17.5"
              stroke="#A7F3D0"
              strokeWidth="1.2"
              opacity="0.65"
            />
            {/* Stylized A peak + Euro cue */}
            <path
              d="M52.5 41L60 22L67.5 41"
              stroke="#ECFDF5"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M54.5 36.5C57.5 34.5 62.5 33 66.5 30.5"
              stroke="#ECFDF5"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <text
              x="60"
              y="47"
              textAnchor="middle"
              fill="#ECFDF5"
              fontSize="8.5"
              fontWeight="700"
              fontFamily="Inter, sans-serif"
            >
              €
            </text>
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
}
