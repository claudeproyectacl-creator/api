import { useEffect, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Cloud,
  Download,
  FileJson,
  FileSpreadsheet,
  HardDrive,
  LogIn,
  LogOut,
  MapPin,
  Moon,
  Play,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import type { AppSettings, FindiDataStore } from '../types/finance';
import {
  exportStoreAsJSON,
  exportTransactionsAsCSV,
  parseSpanishAmount,
} from '../utils/format';
import { ConfirmModal } from './ConfirmModal';

interface SettingsModalProps {
  open: boolean;
  store: FindiDataStore;
  userEmail: string | null;
  isAuthenticated: boolean;
  onClose: () => void;
  onUpdateSettings: (next: AppSettings) => void;
  onResetAllData: () => void;
  onSignOut: () => void;
  onOpenLogin: () => void;
  onReplaySplash: () => void;
}

export function SettingsModal({
  open,
  store,
  userEmail,
  isAuthenticated,
  onClose,
  onUpdateSettings,
  onResetAllData,
  onSignOut,
  onOpenLogin,
  onReplaySplash,
}: SettingsModalProps) {
  const shouldReduceMotion = useReducedMotion();

  const [userName, setUserName] = useState(store.settings.userName);
  const [limitRaw, setLimitRaw] = useState(
    store.settings.monthlyLimit ? store.settings.monthlyLimit.toFixed(2).replace('.', ',') : ''
  );
  const [theme, setTheme] = useState<'dark' | 'light'>(store.settings.theme);
  const [error, setError] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmWipeOpen, setConfirmWipeOpen] = useState(false);
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setUserName(store.settings.userName);
    setLimitRaw(
      store.settings.monthlyLimit ? store.settings.monthlyLimit.toFixed(2).replace('.', ',') : ''
    );
    setTheme(store.settings.theme);
    setError('');
    setSavedNotice(false);
  }, [open, store.settings]);

  if (!open) return null;

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    let parsedLimit: number | null = null;
    if (limitRaw.trim().length > 0) {
      const val = parseSpanishAmount(limitRaw);
      if (!Number.isFinite(val) || val <= 0) {
        setError('El límite de gasto mensual debe ser mayor que 0 € o dejarse vacío.');
        return;
      }
      parsedLimit = val;
    }

    onUpdateSettings({
      userName: userName.trim(),
      monthlyLimit: parsedLimit,
      theme,
    });
    setError('');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/75 backdrop-blur-sm md:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.28, 0.11, 0.32, 1] }}
          className="w-full md:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[28px] md:rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/10 dark:border-[#333336] p-6"
        >
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20 md:hidden" />

          <div className="flex items-center justify-between gap-4">
            <div>
              <h2
                id="settings-modal-title"
                className="text-xl font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]"
              >
                Ajustes
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#6e6e73] dark:text-[#86868b]">
                <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
                Sant Vicenç dels Horts · Barcelona
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar ajustes"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#6e6e73] dark:text-[#86868b] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="settings-name"
                className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1.5"
              >
                Tu nombre (opcional)
              </label>
              <input
                id="settings-name"
                type="text"
                maxLength={40}
                placeholder="Ej. Paula, Marc..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full min-h-[48px] rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] focus:outline-none focus:border-[#10B981]"
              />
            </div>

            <div>
              <label
                htmlFor="settings-limit"
                className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1.5"
              >
                Objetivo de gasto mensual máximo (€, opcional)
              </label>
              <input
                id="settings-limit"
                type="text"
                inputMode="decimal"
                placeholder="Ej. 250,00"
                value={limitRaw}
                onChange={(e) => {
                  setLimitRaw(e.target.value);
                  setError('');
                }}
                className="w-full min-h-[48px] rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-sm tabular-nums text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] focus:outline-none focus:border-[#10B981]"
              />
              <p className="mt-1.5 text-xs text-[#6e6e73] dark:text-[#86868b]">
                Te avisaremos en Inicio cuando te acerques al 80 % o superes este límite.
              </p>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-2">
                Apariencia
              </span>
              <div className="grid grid-cols-2 gap-2 rounded-full bg-[#f5f5f7] dark:bg-black p-1 border border-black/5 dark:border-[#333336]">
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    onUpdateSettings({ ...store.settings, theme: 'dark' });
                  }}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-[#1d1d1f] text-white border border-[#333336]'
                      : 'text-[#6e6e73] dark:text-[#86868b]'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  Modo oscuro
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    onUpdateSettings({ ...store.settings, theme: 'light' });
                  }}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-white text-[#1d1d1f] border border-black/10'
                      : 'text-[#6e6e73] dark:text-[#86868b]'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Modo claro
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReplaySplash();
                }}
                className="mt-2.5 flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full border border-black/15 dark:border-[#6e6e73] px-4 py-2 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.97] transition-transform"
              >
                <Play className="w-3.5 h-3.5 text-[#10B981]" />
                Ver animación de carga
              </button>
            </div>

            {error && <p className="text-sm font-medium text-[#EF4444]">{error}</p>}
            {savedNotice && (
              <p className="text-sm font-medium text-[#10B981]">
                {isAuthenticated
                  ? 'Ajustes guardados y sincronizados en tu cuenta.'
                  : 'Ajustes guardados en este dispositivo.'}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[46px] rounded-full bg-[#10B981] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#059669] active:scale-[0.97] transition-transform"
            >
              Guardar ajustes
            </button>
          </form>

          {/* Cuenta y sincronización */}
          <div className="mt-7 pt-6 border-t border-black/10 dark:border-[#333336] space-y-3">
            <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              Cuenta y sincronización
            </h3>
            {isAuthenticated ? (
              <div className="rounded-2xl bg-[#f5f5f7] dark:bg-black/50 border border-black/10 dark:border-[#333336] p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#10B981]/15 text-[#10B981]">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Sesión iniciada
                    </p>
                    <p className="truncate text-xs text-[#6e6e73] dark:text-[#86868b]">
                      {userEmail || 'Cuenta sincronizada en la nube'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmSignOutOpen(true)}
                  className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full border border-black/15 dark:border-[#6e6e73] px-4 py-2 text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.97] transition-transform"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <div className="rounded-2xl bg-[#f5f5f7] dark:bg-black/50 border border-black/10 dark:border-[#333336] p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-[#6e6e73] dark:text-[#86868b]">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                      Modo local (sin cuenta)
                    </p>
                    <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">
                      Tus datos se guardan solo en este dispositivo.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLogin();
                  }}
                  className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full bg-[#10B981]/15 border border-[#10B981]/30 px-4 py-2 text-xs font-semibold text-[#10B981] hover:bg-[#10B981]/25 active:scale-[0.97] transition-transform"
                >
                  <LogIn className="w-4 h-4" />
                  Iniciar sesión / Crear cuenta
                </button>
              </div>
            )}
          </div>

          {/* Exportar y privacidad */}
          <div className="mt-7 pt-6 border-t border-black/10 dark:border-[#333336] space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                Tus datos y copias de seguridad
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#6e6e73] dark:text-[#86868b]">
                {isAuthenticated
                  ? 'Tus datos están sincronizados en tu cuenta. También puedes descargar una copia en CSV o JSON cuando quieras.'
                  : 'Tus movimientos y objetivos se guardan únicamente en este navegador. Exporta una copia cuando quieras.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => exportTransactionsAsCSV(store)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-black/15 dark:border-[#6e6e73] px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.97]"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#10B981]" />
                Exportar CSV
                <Download className="w-3.5 h-3.5 opacity-70" />
              </button>
              <button
                type="button"
                onClick={() => exportStoreAsJSON(store)}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-black/15 dark:border-[#6e6e73] px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.97]"
              >
                <FileJson className="w-4 h-4 text-[#10B981]" />
                Exportar JSON
                <Download className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setConfirmWipeOpen(true)}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-full border border-[#EF4444]/40 bg-[#EF4444]/10 px-4 py-2.5 text-xs font-semibold text-[#EF4444] hover:bg-[#EF4444]/20 active:scale-[0.97]"
            >
              <Trash2 className="w-4 h-4" />
              Borrar todos los datos personales
            </button>
          </div>
        </motion.div>
      </div>

      <ConfirmModal
        open={confirmSignOutOpen}
        title="¿Cerrar sesión?"
        description="Saldrás de tu cuenta en este dispositivo. Tus datos seguirán guardados de forma segura en la nube para cuando vuelvas a entrar."
        confirmLabel="Cerrar sesión"
        cancelLabel="Seguir conectado"
        destructive={false}
        onCancel={() => setConfirmSignOutOpen(false)}
        onConfirm={() => {
          setConfirmSignOutOpen(false);
          onClose();
          onSignOut();
        }}
      />

      <ConfirmModal
        open={confirmWipeOpen}
        title="¿Borrar todos tus datos?"
        description={
          isAuthenticated
            ? 'Se eliminarán permanentemente todos tus movimientos, categorías personalizadas, objetivos de ahorro, ajustes e historial del asistente tanto de tu cuenta en la nube como de este dispositivo. Esta acción no se puede deshacer.'
            : 'Se eliminarán permanentemente todos tus movimientos, categorías personalizadas, objetivos de ahorro, ajustes e historial del asistente en este dispositivo. Esta acción no se puede deshacer.'
        }
        confirmLabel="Sí, borrar todo"
        onCancel={() => setConfirmWipeOpen(false)}
        onConfirm={() => {
          onResetAllData();
          setConfirmWipeOpen(false);
          onClose();
        }}
      />
    </>
  );
}
