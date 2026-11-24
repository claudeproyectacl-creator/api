import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';
import { auth, googleProvider } from '../services/firebase';
import { FindiLogo } from './FindiLogo';

interface AuthScreenProps {
  hideHeaderLogo?: boolean;
  onContinueLocal: () => void;
}

type AuthMode = 'login' | 'register' | 'reset';

const APPLE_EASE: [number, number, number, number] = [0.28, 0.11, 0.32, 1];

function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/invalid-email':
      return 'Introduce un correo electrónico con formato válido.';
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta registrada con este correo.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos seguidos. Espera unos minutos e inténtalo de nuevo.';
    case 'auth/operation-not-allowed':
      return 'El acceso con correo y contraseña aún no está activado en Firebase Console (Authentication > Sign-in method).';
    case 'auth/unauthorized-domain':
      return 'Este dominio no está autorizado en Firebase Authentication (Settings > Authorized domains).';
    case 'auth/popup-closed-by-user':
      return 'Has cerrado la ventana de acceso con Google antes de completar el inicio de sesión.';
    case 'auth/popup-blocked':
      return 'El navegador bloqueó la ventana de Google. Permite las ventanas emergentes e inténtalo de nuevo.';
    default:
      return 'No se pudo completar el acceso. Inténtalo de nuevo.';
  }
}

export function AuthScreen({ hideHeaderLogo = false, onContinueLocal }: AuthScreenProps) {
  const shouldReduceMotion = useReducedMotion();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [shakeCount, setShakeCount] = useState(0);

  const triggerError = (msg: string) => {
    setError(msg);
    setInfoMessage('');
    if (!shouldReduceMotion) {
      setShakeCount((c) => c + 1);
    }
  };

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setError('');
    setInfoMessage('');

    const cleanEmail = email.trim();
    if (!validateEmail(cleanEmail)) {
      triggerError('Introduce un correo electrónico válido.');
      return;
    }

    if (mode !== 'reset' && password.length < 6) {
      triggerError('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
      } else if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        try {
          await sendEmailVerification(cred.user);
        } catch {
          // Ignore verification email rate errors
        }
      } else {
        await sendPasswordResetEmail(auth, cleanEmail);
        setInfoMessage(
          'Te hemos enviado un correo para restablecer tu contraseña. Revisa también la carpeta de spam.'
        );
      }
    } catch (err) {
      triggerError(mapFirebaseAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || googleLoading) return;
    setError('');
    setInfoMessage('');
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      triggerError(mapFirebaseAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const titleText =
    mode === 'login'
      ? 'Inicia sesión'
      : mode === 'register'
        ? 'Crea tu cuenta'
        : 'Recuperar acceso';

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f7] text-[#1d1d1f] dark:bg-black dark:text-[#f5f5f7] px-4 py-5 sm:py-8">
      {/* Top-left circular X close button */}
      <div className="mx-auto w-full max-w-md flex items-center justify-between">
        <button
          type="button"
          onClick={onContinueLocal}
          aria-label="Cerrar y continuar sin cuenta"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-[#1d1d1f] border border-black/10 dark:border-[#333336] text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.97] transition-transform"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div
            data-findi-header-logo="true"
            className={hideHeaderLogo ? 'opacity-0' : 'opacity-100'}
          >
            <FindiLogo variant="compact" />
          </div>
          <span className="text-sm font-semibold tracking-tight">FINDI</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center py-6">
        <motion.div
          key={shakeCount}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          animate={
            shakeCount > 0 && !shouldReduceMotion
              ? { opacity: 1, y: 0, x: [0, -8, 8, -5, 5, 0] }
              : { opacity: 1, y: 0, x: 0 }
          }
          transition={{ duration: shakeCount > 0 ? 0.36 : 0.45, ease: APPLE_EASE }}
          className="w-full max-w-md rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/10 dark:border-[#333336] p-6 sm:p-8"
        >
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7]">
            {titleText}
          </h1>
          <p className="mt-1.5 text-sm text-[#6e6e73] dark:text-[#86868b]">
            {mode === 'reset'
              ? 'Introduce tu correo y te enviaremos un enlace para cambiar tu contraseña.'
              : 'Guarda tus gastos y objetivos de forma privada en tu cuenta.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1.5 pl-1"
              >
                Tu correo
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="nombre@correo.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                className="w-full min-h-[52px] rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] transition-[border-color,box-shadow] duration-200 focus:outline-none focus:border-2 focus:border-[#065F46] dark:focus:border-[#059669]"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1.5 pl-1"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full min-h-[52px] rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 pl-4 pr-12 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] transition-[border-color,box-shadow] duration-200 focus:outline-none focus:border-2 focus:border-[#065F46] dark:focus:border-[#059669]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-[#6e6e73] dark:text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition-colors"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {showPassword ? (
                        <motion.span
                          key="eye-off"
                          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.75 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.75 }}
                          transition={{ duration: 0.14 }}
                          className="flex items-center justify-center"
                        >
                          <EyeOff className="w-4 h-4" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="eye"
                          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.75 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.75 }}
                          transition={{ duration: 0.14 }}
                          className="flex items-center justify-center"
                        >
                          <Eye className="w-4 h-4" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm font-medium text-[#EF4444]">
                {error}
              </p>
            )}

            {infoMessage && (
              <p role="status" className="text-sm font-medium text-[#10B981]">
                {infoMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full min-h-[50px] rounded-full bg-[#10B981] px-6 py-3 text-sm font-semibold text-[#022C22] hover:bg-[#34D399] disabled:opacity-60 active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {mode === 'login'
                  ? 'Entrar'
                  : mode === 'register'
                    ? 'Crear cuenta'
                    : 'Enviar enlace'}
              </span>
            </button>
          </form>

          {/* Secondary auth links */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs">
            {mode === 'login' ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setError('');
                    setInfoMessage('');
                  }}
                  className="py-1.5 underline text-[#6e6e73] dark:text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]"
                >
                  ¿Problemas para entrar?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setInfoMessage('');
                  }}
                  className="py-1.5 font-medium text-[#10B981] hover:underline"
                >
                  Crear cuenta
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setInfoMessage('');
                }}
                className="py-1.5 font-medium text-[#10B981] hover:underline"
              >
                Volver a iniciar sesión
              </button>
            )}
          </div>

          {/* Google + Continue without account */}
          <div className="mt-6 pt-6 border-t border-black/10 dark:border-[#333336] space-y-4">
            <p className="text-center text-xs text-[#6e6e73] dark:text-[#86868b]">
              O inicia sesión con
            </p>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="w-full min-h-[48px] rounded-full border border-black/15 dark:border-[#6e6e73] bg-[#f5f5f7] dark:bg-black/40 px-5 py-2.5 text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-60 active:scale-[0.97] transition-transform flex items-center justify-center gap-2.5"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
              )}
              <span>Continuar con Google</span>
            </button>

            <div className="pt-2 text-center space-y-1">
              <button
                type="button"
                onClick={onContinueLocal}
                className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:text-[#10B981] transition-colors"
              >
                Continuar sin cuenta
              </button>
              <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">
                Tus datos se guardarán solo en este dispositivo
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
