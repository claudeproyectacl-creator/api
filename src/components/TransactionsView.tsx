import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { Category, Transaction, TransactionType } from '../types/finance';
import { formatDateES, formatEUR, formatMonthLabel, getMonthKey } from '../utils/format';
import { CategoryIcon } from './CategoryIcon';
import { ConfirmModal } from './ConfirmModal';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: string;
  onAddNew: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

const APPLE_EASE: [number, number, number, number] = [0.28, 0.11, 0.32, 1];

export function TransactionsView({
  transactions,
  categories,
  selectedMonth,
  onAddNew,
  onEdit,
  onDelete,
}: TransactionsViewProps) {
  const shouldReduceMotion = useReducedMotion();

  const [monthFilter, setMonthFilter] = useState<string>(selectedMonth);
  const [typeFilter, setTypeFilter] = useState<'todos' | TransactionType>('todos');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const availableMonths = useMemo(() => {
    const keys = new Set<string>([selectedMonth]);
    for (const tx of transactions) {
      keys.add(getMonthKey(tx.date));
    }
    return Array.from(keys).sort((a, b) => b.localeCompare(a));
  }, [transactions, selectedMonth]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...transactions]
      .filter((tx) => {
        if (monthFilter !== 'todos' && getMonthKey(tx.date) !== monthFilter) return false;
        if (typeFilter !== 'todos' && tx.type !== typeFilter) return false;
        if (categoryFilter !== 'todas' && tx.categoryId !== categoryFilter) return false;
        if (q) {
          const catName = categoryMap.get(tx.categoryId)?.name.toLowerCase() ?? '';
          const noteMatch = tx.note.toLowerCase().includes(q);
          if (!noteMatch && !catName.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  }, [transactions, monthFilter, typeFilter, categoryFilter, searchQuery, categoryMap]);

  const totals = useMemo(() => {
    let income = 0;
    let expenses = 0;
    for (const tx of filtered) {
      if (tx.type === 'ingreso') income += tx.amount;
      else expenses += tx.amount;
    }
    return {
      income: Math.round(income * 100) / 100,
      expenses: Math.round(expenses * 100) / 100,
      net: Math.round((income - expenses) * 100) / 100,
    };
  }, [filtered]);

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
            Movimientos
          </h1>
          <p className="mt-1 text-sm text-[#6e6e73] dark:text-[#86868b]">
            Registra, filtra y edita tus gastos e ingresos en euros.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#059669] active:scale-[0.97] transition-transform whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo movimiento
        </button>
      </motion.div>

      {/* Filtros */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: APPLE_EASE }}
        className="rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] p-5 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Tipo */}
          <div className="grid grid-cols-3 gap-1 rounded-full bg-[#f5f5f7] dark:bg-black p-1 border border-black/8 dark:border-[#333336]">
            {(['todos', 'gasto', 'ingreso'] as const).map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setTypeFilter(val)}
                className={`min-h-[38px] rounded-full text-xs font-medium transition-colors ${
                  typeFilter === val
                    ? 'bg-[#10B981] text-white'
                    : 'text-[#6e6e73] dark:text-[#86868b]'
                }`}
              >
                {val === 'todos' ? 'Todos' : val === 'gasto' ? 'Gastos' : 'Ingresos'}
              </button>
            ))}
          </div>

          {/* Mes */}
          <select
            aria-label="Filtrar por mes"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="min-h-[46px] rounded-full bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#10B981]"
          >
            <option value="todos">Todos los meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>

          {/* Categoría */}
          <select
            aria-label="Filtrar por categoría"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-h-[46px] rounded-full bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 px-4 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#10B981]"
          >
            <option value="todas">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Buscar */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nota o categoría..."
              className="w-full min-h-[46px] rounded-full bg-[#f5f5f7] dark:bg-black/60 border border-black/15 dark:border-[#6e6e73]/60 pl-10 pr-4 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] focus:outline-none focus:border-[#10B981]"
            />
          </div>
        </div>

        {/* Resumen filtrado */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/8 dark:border-[#333336] text-xs text-[#6e6e73] dark:text-[#86868b]">
          <span>
            {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
          </span>
          <div className="flex flex-wrap items-center gap-4 tabular-nums">
            <span>
              Ingresos: <strong className="text-[#10B981]">{formatEUR(totals.income)}</strong>
            </span>
            <span>
              Gastos: <strong className="text-[#EF4444]">{formatEUR(totals.expenses)}</strong>
            </span>
            <span>
              Balance:{' '}
              <strong
                className={
                  totals.net < 0 ? 'text-[#EF4444]' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
                }
              >
                {formatEUR(totals.net)}
              </strong>
            </span>
          </div>
        </div>
      </motion.section>

      {/* Listado */}
      <motion.section
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.14, ease: APPLE_EASE }}
        className="rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] overflow-hidden"
      >
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
              No hay movimientos que coincidan
            </p>
            <p className="mt-1 text-sm text-[#6e6e73] dark:text-[#86868b]">
              {transactions.length === 0
                ? 'Empieza registrando tu primer gasto o ingreso real.'
                : 'Prueba cambiando el mes, la categoría o el texto de búsqueda.'}
            </p>
            <button
              type="button"
              onClick={onAddNew}
              className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#10B981] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#059669] active:scale-[0.97]"
            >
              <Plus className="w-4 h-4" />
              Añadir movimiento
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-black/8 dark:divide-[#333336]">
            {filtered.map((tx) => {
              const cat = categoryMap.get(tx.categoryId);
              return (
                <li
                  key={tx.id}
                  className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: `${cat?.color ?? '#94A3B8'}22`,
                        color: cat?.color ?? '#94A3B8',
                      }}
                    >
                      <CategoryIcon icon={cat?.icon ?? 'tag'} className="w-4 h-4" />
                    </span>

                    <div className="min-w-0">
                      <p className="truncate text-sm sm:text-base font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {tx.note || cat?.name || 'Movimiento'}
                      </p>
                      <p className="truncate text-xs text-[#6e6e73] dark:text-[#86868b]">
                        {cat?.name ?? 'Otros'} · {formatDateES(tx.date)} ·{' '}
                        {tx.type === 'gasto' ? 'Gasto' : 'Ingreso'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span
                      className={`text-sm sm:text-base font-semibold tabular-nums ${
                        tx.type === 'gasto' ? 'text-[#EF4444]' : 'text-[#10B981]'
                      }`}
                    >
                      {tx.type === 'gasto' ? '-' : '+'}
                      {formatEUR(tx.amount)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onEdit(tx)}
                      aria-label={`Editar movimiento ${tx.note || cat?.name || ''}`}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#6e6e73] dark:text-[#86868b] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTxToDelete(tx)}
                      aria-label={`Eliminar movimiento ${tx.note || cat?.name || ''}`}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#6e6e73] dark:text-[#86868b] hover:bg-[#EF4444]/10 hover:text-[#EF4444]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </motion.section>

      <ConfirmModal
        open={txToDelete !== null}
        title="¿Eliminar movimiento?"
        description={
          txToDelete
            ? `Vas a eliminar ${txToDelete.type === 'gasto' ? 'el gasto' : 'el ingreso'} de ${formatEUR(
                txToDelete.amount
              )} del ${formatDateES(txToDelete.date)}. Esta acción actualizará tus totales.`
            : ''
        }
        confirmLabel="Eliminar"
        onCancel={() => setTxToDelete(null)}
        onConfirm={() => {
          if (txToDelete) {
            onDelete(txToDelete.id);
          }
          setTxToDelete(null);
        }}
      />
    </div>
  );
}
