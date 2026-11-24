import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.28, 0.11, 0.32, 1] }}
        className="w-full max-w-md rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/10 dark:border-[#333336] p-6"
      >
        <div className="flex items-start gap-3">
          {destructive && (
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EF4444]/15 text-[#EF4444]">
              <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3
              id="confirm-modal-title"
              className="text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]"
            >
              {title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[#6e6e73] dark:text-[#86868b]">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-full border border-black/15 dark:border-[#6e6e73] px-5 py-2.5 text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] transition-transform active:scale-[0.97] hover:bg-black/5 dark:hover:bg-white/5 whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-[44px] rounded-full px-5 py-2.5 text-sm font-medium text-white transition-transform active:scale-[0.97] whitespace-nowrap ${
              destructive
                ? 'bg-[#EF4444] hover:bg-[#DC2626]'
                : 'bg-[#10B981] hover:bg-[#059669]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
