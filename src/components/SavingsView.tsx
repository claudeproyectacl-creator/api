import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  CheckCircle2,
  Minus,
  Pencil,
  PiggyBank,
  Plus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import type { SavingsGoal } from '../types/finance';
import { computeGoalMetrics } from '../utils/analytics';
import {
  formatDateES,
  formatEUR,
  formatPercentES,
  getTodayISO,
  isValidISODate,
  parseSpanishAmount,
} from '../utils/format';
import { ConfirmModal } from './ConfirmModal';

interface SavingsViewProps {
  goals: SavingsGoal[];
  onCreateGoal: (payload: {
    name: string;
    targetAmount: number;
    deadline: string;
    isPrimary: boolean;
  }) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  onAdjustFunds: (goalId: string, delta: number) => void;
  onSetPrimary: (goalId: string) => void;
  onDeleteGoal: (goalId: string) => void;
}

const APPLE_EASE: [number, number, number, number] = [0.28, 0.11, 0.32, 1];

export function SavingsView({
  goals,
  onCreateGoal,
  onUpdateGoal,
  onAdjustFunds,
  onSetPrimary,
  onDeleteGoal,
}: SavingsViewProps) {
  const shouldReduceMotion = useReducedMotion();

  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [name, setName] = useState('');
  const [targetRaw, setTargetRaw] = useState('');
  const [deadline, setDeadline] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [formError, setFormError] = useState('');

  // Add/withdraw modal state
  const [fundsModal, setFundsModal] = useState<{
    goal: SavingsGoal;
    mode: 'add' | 'withdraw';
  } | null>(null);
  const [fundsRaw, setFundsRaw] = useState('');
  const [fundsError, setFundsError] = useState('');

  const [goalToDelete, setGoalToDelete] = useState<SavingsGoal | null>(null);

  const openCreateForm = () => {
    setEditingGoal(null);
    setName('');
    setTargetRaw('');
    setDeadline('');
    setIsPrimary(goals.length === 0);
    setFormError('');
    setFormOpen(true);
  };

  const openEditForm = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetRaw(goal.targetAmount.toFixed(2).replace('.', ','));
    setDeadline(goal.deadline);
    setIsPrimary(goal.isPrimary);
    setFormError('');
    setFormOpen(true);
  };

  const handleSaveGoal = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Escribe un nombre para tu objetivo.');
      return;
    }
    const targetAmount = parseSpanishAmount(targetRaw);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setFormError('La cantidad objetivo debe ser mayor que 0 €.');
      return;
    }
    if (!isValidISODate(deadline)) {
      setFormError('Selecciona una fecha límite válida.');
      return;
    }

    if (editingGoal) {
      onUpdateGoal({
        ...editingGoal,
        name: trimmed,
        targetAmount,
        deadline,
        isPrimary,
      });
    } else {
      onCreateGoal({
        name: trimmed,
        targetAmount,
        deadline,
        isPrimary,
      });
    }
    setFormOpen(false);
  };

  const handleFundsSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!fundsModal) return;
    const amount = parseSpanishAmount(fundsRaw);
    if (!Number.isFinite(amount) || amount <= 0) {
      setFundsError('Introduce una cantidad válida mayor que 0 €.');
      return;
    }
    if (fundsModal.mode === 'withdraw' && amount > fundsModal.goal.savedAmount) {
      setFundsError(
        `No puedes retirar más de lo que llevas ahorrado (${formatEUR(fundsModal.goal.savedAmount)}).`
      );
      return;
    }
    const delta = fundsModal.mode === 'add' ? amount : -amount;
    onAdjustFunds(fundsModal.goal.id, delta);
    setFundsModal(null);
    setFundsRaw('');
    setFundsError('');
  };

  const sortedGoals = [...goals].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return a.deadline.localeCompare(b.deadline);
  });

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: APPLE_EASE }}
        className="flex flex-wrap items-center justify-between gap-4 pt-2"
      >
        <div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            Ahorro
          </h1>
          <p className="mt-1 text-sm text-[#6e6e73] dark:text-[#86868b]">
            Marca metas concretas y descubre cuánto apartar al mes para llegar a tiempo.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#059669] active:scale-[0.97] transition-transform whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo objetivo
        </button>
      </motion.div>

      {sortedGoals.length === 0 ? (
        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: APPLE_EASE }}
          className="rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] p-10 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981]/15 text-[#10B981]">
            <PiggyBank className="w-7 h-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
            Empieza tu primer objetivo de ahorro
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#6e6e73] dark:text-[#86868b]">
            Por ejemplo: «Viaje de fin de curso, 300 € para junio» o «Portátil para clase». FINDI
            calculará automáticamente cuánto necesitas ahorrar cada mes.
          </p>
          <button
            type="button"
            onClick={openCreateForm}
            className="mt-6 inline-flex min-h-[46px] items-center gap-2 rounded-full bg-[#10B981] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#059669] active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" />
            Crear primer objetivo
          </button>
        </motion.section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sortedGoals.map((goal, idx) => {
            const metrics = computeGoalMetrics(goal);
            return (
              <motion.article
                key={goal.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: idx * 0.06, ease: APPLE_EASE }}
                className={`rounded-[28px] bg-white dark:bg-[#1d1d1f] border p-6 sm:p-7 flex flex-col justify-between ${
                  goal.isPrimary
                    ? 'border-[#10B981]/60'
                    : 'border-black/8 dark:border-[#333336]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-[#6e6e73] dark:text-[#86868b]">
                        {goal.isPrimary ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-[#10B981]">
                            <Star className="w-3.5 h-3.5 fill-[#10B981]" />
                            Objetivo principal
                          </span>
                        ) : (
                          <span>Objetivo secundario</span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>Límite {formatDateES(goal.deadline)}</span>
                      </div>

                      <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {goal.name}
                      </h2>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!goal.isPrimary && (
                        <button
                          type="button"
                          onClick={() => onSetPrimary(goal.id)}
                          title="Marcar como objetivo principal"
                          aria-label={`Marcar ${goal.name} como principal`}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#6e6e73] dark:text-[#86868b] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#10B981]"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openEditForm(goal)}
                        aria-label={`Editar ${goal.name}`}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#6e6e73] dark:text-[#86868b] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setGoalToDelete(goal)}
                        aria-label={`Eliminar ${goal.name}`}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#6e6e73] dark:text-[#86868b] hover:bg-[#EF4444]/10 hover:text-[#EF4444]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Cifras */}
                  <div className="mt-5 flex items-baseline justify-between gap-2">
                    <span className="text-3xl sm:text-4xl font-semibold tabular-nums text-[#10B981]">
                      {formatEUR(goal.savedAmount)}
                    </span>
                    <span className="text-sm tabular-nums text-[#6e6e73] dark:text-[#86868b]">
                      de {formatEUR(goal.targetAmount)}
                    </span>
                  </div>

                  {/* Barra de progreso animada */}
                  <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-black">
                    <motion.div
                      initial={shouldReduceMotion ? false : { scaleX: 0 }}
                      animate={{ scaleX: metrics.percentage / 100 }}
                      transition={{ duration: 0.7, ease: APPLE_EASE }}
                      className="h-full origin-left rounded-full bg-[#10B981]"
                    />
                  </div>

                  {/* Detalles calculados */}
                  <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-[#f5f5f7] dark:bg-black/50 p-4 text-xs">
                    <div>
                      <span className="text-[#6e6e73] dark:text-[#86868b]">Conseguido</span>
                      <p className="mt-1 text-sm sm:text-base font-semibold tabular-nums text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {formatPercentES(metrics.percentage)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#6e6e73] dark:text-[#86868b]">Falta</span>
                      <p className="mt-1 text-sm sm:text-base font-semibold tabular-nums text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {formatEUR(metrics.remainingAmount)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#6e6e73] dark:text-[#86868b]">
                        {metrics.isCompleted ? 'Estado' : 'Al mes'}
                      </span>
                      <p className="mt-1 text-sm sm:text-base font-semibold tabular-nums text-[#10B981]">
                        {metrics.isCompleted ? '100 %' : formatEUR(metrics.monthlyNeeded)}
                      </p>
                    </div>
                  </div>

                  {metrics.isCompleted ? (
                    <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#10B981]">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ¡Objetivo conseguido! Has alcanzado tu meta de ahorro.
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-[#6e6e73] dark:text-[#86868b]">
                      {metrics.isPastDeadline
                        ? `La fecha límite pasó: te faltan ${formatEUR(metrics.remainingAmount)}.`
                        : `Ahorrando ${formatEUR(metrics.monthlyNeeded)}/mes durante ${
                            metrics.monthsRemaining
                          } ${metrics.monthsRemaining === 1 ? 'mes' : 'meses'} llegarás a tiempo.`}
                    </p>
                  )}
                </div>

                {/* Acciones añadir / retirar */}
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-black/8 dark:border-[#333336]">
                  <button
                    type="button"
                    onClick={() => {
                      setFundsModal({ goal, mode: 'add' });
                      setFundsRaw('');
                      setFundsError('');
                    }}
                    className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-[#10B981] px-4 py-2 text-xs font-semibold text-white hover:bg-[#059669] active:scale-[0.97] transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                    Añadir dinero
                  </button>
                  <button
                    type="button"
                    disabled={goal.savedAmount <= 0}
                    onClick={() => {
                      setFundsModal({ goal, mode: 'withdraw' });
                      setFundsRaw('');
                      setFundsError('');
                    }}
                    className="flex-1 inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-black/15 dark:border-[#6e6e73] px-4 py-2 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.97]"
                  >
                    <Minus className="w-4 h-4" />
                    Retirar
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Objetivo */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/75 backdrop-blur-sm md:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="goal-modal-title"
        >
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: APPLE_EASE }}
            className="w-full md:max-w-md rounded-t-[28px] md:rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/10 dark:border-[#333336] p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <h2
                id="goal-modal-title"
                className="text-xl font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]"
              >
                {editingGoal ? 'Editar objetivo' : 'Nuevo objetivo de ahorro'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Cerrar"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#6e6e73] dark:text-[#86868b] hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGoal} className="mt-5 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="goal-name"
                  className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1.5"
                >
                  Nombre del objetivo *
                </label>
                <input
                  id="goal-name"
                  type="text"
                  maxLength={50}
                  placeholder="Ej. Viaje de fin de curso"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFormError('');
                  }}
                  className="w-full min-h-[48px] rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="goal-target"
                    className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1.5"
                  >
                    Cantidad objetivo (€) *
                  </label>
                  <input
                    id="goal-target"
                    type="text"
                    inputMode="decimal"
                    placeholder="300,00"
                    value={targetRaw}
                    onChange={(e) => {
                      setTargetRaw(e.target.value);
                      setFormError('');
                    }}
                    className="w-full min-h-[48px] rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-sm font-semibold tabular-nums text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#10B981]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="goal-deadline"
                    className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1.5"
                  >
                    Fecha límite *
                  </label>
                  <input
                    id="goal-deadline"
                    type="date"
                    min={getTodayISO()}
                    value={deadline}
                    onChange={(e) => {
                      setDeadline(e.target.value);
                      setFormError('');
                    }}
                    className="w-full min-h-[48px] rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#10B981]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 py-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="h-5 w-5 rounded accent-[#10B981]"
                />
                <span className="text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Mostrar como objetivo principal en Inicio
                </span>
              </label>

              {formError && <p className="text-sm font-medium text-[#EF4444]">{formError}</p>}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="min-h-[44px] rounded-full border border-black/15 dark:border-[#6e6e73] px-5 py-2 text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-full bg-[#10B981] px-6 py-2 text-sm font-semibold text-white hover:bg-[#059669] active:scale-[0.97]"
                >
                  {editingGoal ? 'Guardar cambios' : 'Crear objetivo'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modal Añadir / Retirar dinero */}
      {fundsModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/75 backdrop-blur-sm md:p-4"
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: APPLE_EASE }}
            className="w-full md:max-w-sm rounded-t-[28px] md:rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/10 dark:border-[#333336] p-6"
          >
            <h3 className="text-lg font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              {fundsModal.mode === 'add' ? 'Añadir dinero a' : 'Retirar dinero de'}{' '}
              {fundsModal.goal.name}
            </h3>
            <p className="mt-1 text-xs text-[#6e6e73] dark:text-[#86868b]">
              Ahorrado actualmente: {formatEUR(fundsModal.goal.savedAmount)} de{' '}
              {formatEUR(fundsModal.goal.targetAmount)}
            </p>

            <form onSubmit={handleFundsSubmit} className="mt-4 space-y-4" noValidate>
              <div>
                <label
                  htmlFor="funds-amount"
                  className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1.5"
                >
                  Cantidad (€)
                </label>
                <input
                  id="funds-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="20,00"
                  value={fundsRaw}
                  onChange={(e) => {
                    setFundsRaw(e.target.value);
                    setFundsError('');
                  }}
                  autoFocus
                  className="w-full min-h-[48px] rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-lg font-semibold tabular-nums text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#10B981]"
                />
              </div>

              {fundsError && <p className="text-xs font-medium text-[#EF4444]">{fundsError}</p>}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setFundsModal(null)}
                  className="min-h-[44px] rounded-full border border-black/15 dark:border-[#6e6e73] px-4 py-2 text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-full bg-[#10B981] px-5 py-2 text-sm font-semibold text-white hover:bg-[#059669] active:scale-[0.97]"
                >
                  {fundsModal.mode === 'add' ? 'Añadir' : 'Retirar'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        open={goalToDelete !== null}
        title="¿Eliminar objetivo de ahorro?"
        description={
          goalToDelete
            ? `Vas a eliminar el objetivo «${goalToDelete.name}». Esta acción no borra tus movimientos.`
            : ''
        }
        confirmLabel="Eliminar"
        onCancel={() => setGoalToDelete(null)}
        onConfirm={() => {
          if (goalToDelete) {
            onDeleteGoal(goalToDelete.id);
          }
          setGoalToDelete(null);
        }}
      />
    </div>
  );
}
