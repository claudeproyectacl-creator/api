import { useEffect, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import type { Category, CategoryIconKey, Transaction, TransactionType } from '../types/finance';
import { getTodayISO, isValidISODate, parseSpanishAmount } from '../utils/format';
import { AVAILABLE_CATEGORY_ICONS, CategoryIcon } from './CategoryIcon';

interface TransactionModalProps {
  open: boolean;
  categories: Category[];
  initialTransaction?: Transaction | null;
  defaultType?: TransactionType;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    type: TransactionType;
    amount: number;
    date: string;
    categoryId: string;
    note: string;
  }) => void;
  onCreateCategory: (payload: { name: string; icon: CategoryIconKey; color: string }) => Category;
}

const CUSTOM_COLORS = [
  '#10B981',
  '#38BDF8',
  '#A78BFA',
  '#F472B6',
  '#FBBF24',
  '#FB923C',
  '#2DD4BF',
];

export function TransactionModal({
  open,
  categories,
  initialTransaction,
  defaultType = 'gasto',
  onClose,
  onSave,
  onCreateCategory,
}: TransactionModalProps) {
  const shouldReduceMotion = useReducedMotion();

  const [type, setType] = useState<TransactionType>(defaultType);
  const [amountRaw, setAmountRaw] = useState('');
  const [date, setDate] = useState(getTodayISO());
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Custom category inline creator
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState<CategoryIconKey>('coffee');
  const [newCatColor, setNewCatColor] = useState(CUSTOM_COLORS[0]);
  const [newCatError, setNewCatError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    setShowNewCat(false);
    setNewCatName('');
    setNewCatError('');

    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmountRaw(initialTransaction.amount.toFixed(2).replace('.', ','));
      setDate(initialTransaction.date);
      setCategoryId(initialTransaction.categoryId);
      setNote(initialTransaction.note);
    } else {
      setType(defaultType);
      setAmountRaw('');
      setDate(getTodayISO());
      setCategoryId(categories[0]?.id ?? '');
      setNote('');
    }
  }, [open, initialTransaction, defaultType, categories]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseSpanishAmount(amountRaw);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Introduce un importe válido mayor que 0 €.');
      return;
    }
    if (!isValidISODate(date)) {
      setError('Selecciona una fecha válida.');
      return;
    }
    if (!categoryId || !categories.some((c) => c.id === categoryId)) {
      setError('Selecciona una categoría obligatoria.');
      return;
    }

    onSave({
      id: initialTransaction?.id,
      type,
      amount: parsedAmount,
      date,
      categoryId,
      note: note.trim(),
    });
    onClose();
  };

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setNewCatError('Escribe un nombre para la categoría.');
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setNewCatError('Ya existe una categoría con ese nombre.');
      return;
    }
    const created = onCreateCategory({
      name: trimmed,
      icon: newCatIcon,
      color: newCatColor,
    });
    setCategoryId(created.id);
    setShowNewCat(false);
    setNewCatName('');
    setNewCatError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/75 backdrop-blur-sm md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tx-modal-title"
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.28, 0.11, 0.32, 1] }}
        className="w-full md:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-[28px] md:rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/10 dark:border-[#333336] p-6"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-black/15 dark:bg-white/20 md:hidden" />

        <div className="flex items-center justify-between gap-4">
          <h2
            id="tx-modal-title"
            className="text-xl font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]"
          >
            {initialTransaction ? 'Editar movimiento' : 'Nuevo movimiento'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#6e6e73] dark:text-[#86868b] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
          {/* Tipo segmented control */}
          <div className="grid grid-cols-2 gap-1.5 rounded-full bg-[#f5f5f7] dark:bg-black p-1 border border-black/5 dark:border-[#333336]">
            <button
              type="button"
              onClick={() => setType('gasto')}
              className={`min-h-[44px] rounded-full text-sm font-medium transition-all ${
                type === 'gasto'
                  ? 'bg-[#EF4444] text-white'
                  : 'text-[#6e6e73] dark:text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
              }`}
            >
              Gasto
            </button>
            <button
              type="button"
              onClick={() => setType('ingreso')}
              className={`min-h-[44px] rounded-full text-sm font-medium transition-all ${
                type === 'ingreso'
                  ? 'bg-[#10B981] text-white'
                  : 'text-[#6e6e73] dark:text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
              }`}
            >
              Ingreso
            </button>
          </div>

          {/* Importe y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="tx-amount"
                className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1.5"
              >
                Importe (€) *
              </label>
              <input
                id="tx-amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amountRaw}
                onChange={(e) => {
                  setAmountRaw(e.target.value);
                  setError('');
                }}
                className="w-full min-h-[48px] rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-lg font-semibold tabular-nums text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/30"
              />
            </div>

            <div>
              <label
                htmlFor="tx-date"
                className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1.5"
              >
                Fecha *
              </label>
              <input
                id="tx-date"
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setError('');
                }}
                className="w-full min-h-[48px] rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/30"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#6e6e73] dark:text-[#86868b]">
                Categoría *
              </span>
              <button
                type="button"
                onClick={() => setShowNewCat((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#10B981] hover:underline py-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {showNewCat ? 'Cerrar nueva categoría' : 'Crear categoría'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => {
                const selected = categoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(cat.id);
                      setError('');
                    }}
                    className={`flex min-h-[44px] items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm font-medium transition-all active:scale-[0.97] ${
                      selected
                        ? 'border-[#10B981] bg-[#10B981]/15 text-[#1d1d1f] dark:text-[#f5f5f7]'
                        : 'border-black/10 dark:border-[#333336] bg-[#f5f5f7] dark:bg-black/40 text-[#6e6e73] dark:text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                    }`}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${cat.color}22`, color: cat.color }}
                    >
                      <CategoryIcon icon={cat.icon} className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Inline custom category creator */}
            {showNewCat && (
              <div className="mt-3 rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/10 dark:border-[#333336] p-4 space-y-3">
                <p className="text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Nueva categoría personalizada
                </p>
                <input
                  type="text"
                  placeholder="Ej. Paga, Gimnasio, Apuntes..."
                  maxLength={24}
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    setNewCatError('');
                  }}
                  className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#1d1d1f] border border-black/15 dark:border-[#6e6e73]/60 px-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#10B981]"
                />

                <div>
                  <span className="block text-[11px] text-[#6e6e73] dark:text-[#86868b] mb-1.5">
                    Icono
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_CATEGORY_ICONS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        title={item.label}
                        onClick={() => setNewCatIcon(item.key)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                          newCatIcon === item.key
                            ? 'border-[#10B981] bg-[#10B981]/20 text-[#10B981]'
                            : 'border-black/10 dark:border-[#333336] text-[#6e6e73] dark:text-[#86868b]'
                        }`}
                      >
                        <CategoryIcon icon={item.key} className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    {CUSTOM_COLORS.map((col) => (
                      <button
                        key={col}
                        type="button"
                        aria-label={`Color ${col}`}
                        onClick={() => setNewCatColor(col)}
                        className={`h-6 w-6 rounded-full transition-transform ${
                          newCatColor === col ? 'scale-110 ring-2 ring-white ring-offset-1 ring-offset-black' : ''
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCategory}
                    className="min-h-[40px] rounded-full bg-[#10B981] px-4 py-2 text-xs font-semibold text-white hover:bg-[#059669] active:scale-[0.97]"
                  >
                    Añadir
                  </button>
                </div>

                {newCatError && <p className="text-xs text-[#EF4444]">{newCatError}</p>}
              </div>
            )}
          </div>

          {/* Nota opcional */}
          <div>
            <label
              htmlFor="tx-note"
              className="block text-xs font-medium text-[#6e6e73] dark:text-[#86868b] mb-1.5"
            >
              Nota (opcional)
            </label>
            <input
              id="tx-note"
              type="text"
              maxLength={120}
              placeholder="Ej. Bocadillo en el instituto, T-Jove, Spotify..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full min-h-[48px] rounded-2xl bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] focus:outline-none focus:border-[#10B981] focus:ring-2 focus:ring-[#10B981]/30"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-[#EF4444]">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[46px] rounded-full border border-black/15 dark:border-[#6e6e73] px-5 py-2.5 text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.97]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[46px] rounded-full bg-[#10B981] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#059669] active:scale-[0.97] transition-transform"
            >
              {initialTransaction ? 'Guardar cambios' : 'Guardar movimiento'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
