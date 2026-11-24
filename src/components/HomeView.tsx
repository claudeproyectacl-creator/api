import { useState, type RefObject } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  PiggyBank,
  Plus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { AppSettings, Category, SavingsGoal, Transaction } from '../types/finance';
import { computeGoalMetrics, computeMonthlySummary } from '../utils/analytics';
import {
  formatDateES,
  formatEUR,
  formatMonthLabel,
  formatPercentES,
  shiftMonthKey,
} from '../utils/format';
import { useCountUp } from '../hooks/useCountUp';
import { FindiLogo } from './FindiLogo';
import { CategoryIcon } from './CategoryIcon';
import { HomeSkeleton } from './HomeSkeleton';

interface HomeViewProps {
  transactions: Transaction[];
  categories: Category[];
  goals: SavingsGoal[];
  settings: AppSettings;
  selectedMonth: string;
  celebrateCoin: boolean;
  isLoading?: boolean;
  heroRef: RefObject<HTMLDivElement | null>;
  onChangeMonth: (nextMonth: string) => void;
  onAddTransaction: () => void;
  onNavigateTab: (tab: 'inicio' | 'movimientos' | 'ahorro' | 'asistente') => void;
}

const APPLE_EASE: [number, number, number, number] = [0.28, 0.11, 0.32, 1];

export function HomeView({
  transactions,
  categories,
  goals,
  settings,
  selectedMonth,
  celebrateCoin,
  isLoading = false,
  heroRef,
  onChangeMonth,
  onAddTransaction,
  onNavigateTab,
}: HomeViewProps) {
  const shouldReduceMotion = useReducedMotion();
  const [chartMode, setChartMode] = useState<'barras' | 'circular'>('barras');

  const { scrollY } = useScroll();
  const heroLogoScale = useTransform(scrollY, [0, 24, 180], [1, 1, 0.72]);
  const heroLogoOpacity = useTransform(scrollY, [0, 24, 180], [1, 1, 0.15]);
  const heroLogoY = useTransform(scrollY, [0, 24, 180], [0, 0, -18]);

  const summary = computeMonthlySummary(transactions, categories, selectedMonth);
  const animatedBalance = useCountUp(isLoading ? 0 : summary.balance, 650);
  const animatedIncome = useCountUp(isLoading ? 0 : summary.totalIncome, 550);
  const animatedExpenses = useCountUp(isLoading ? 0 : summary.totalExpenses, 550);

  const primaryGoal = goals.find((g) => g.isPrimary) ?? goals[0] ?? null;
  const primaryGoalMetrics = primaryGoal ? computeGoalMetrics(primaryGoal) : null;
  const animatedGoalSaved = useCountUp(isLoading ? 0 : primaryGoal?.savedAmount ?? 0, 600);

  if (isLoading) {
    return <HomeSkeleton />;
  }

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const recentMonthTxs = [...transactions]
    .filter((t) => t.date.startsWith(selectedMonth))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  // Budget limit status
  const limit = settings.monthlyLimit;
  const limitPercent = limit && limit > 0 ? (summary.totalExpenses / limit) * 100 : null;
  const isNearLimit = limitPercent !== null && limitPercent >= 80 && limitPercent < 100;
  const isOverLimit = limitPercent !== null && limitPercent >= 100;

  // Donut chart segments math
  const donutRadius = 56;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let cumulativeFraction = 0;

  return (
    <div className="space-y-5 pb-8">
      {/* Hero Brand Stage */}
      <section
        ref={heroRef}
        className="relative flex flex-col items-center text-center pt-2 pb-3 md:pt-4 md:pb-5"
      >
        <motion.div
          style={
            shouldReduceMotion
              ? undefined
              : {
                  scale: heroLogoScale,
                  opacity: heroLogoOpacity,
                  y: heroLogoY,
                }
          }
          className="will-change-transform"
        >
          <FindiLogo variant="hero" celebrateCoin={celebrateCoin} />
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: APPLE_EASE }}
          className="mt-3 max-w-2xl"
        >
          <p className="text-xs font-medium tracking-wide text-[#10B981]">
            Student Expense Tracker
          </p>
          <h1 className="mt-1 text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[#1d1d1f] dark:text-[#f5f5f7] [text-wrap:balance]">
            {settings.userName ? `Hola, ${settings.userName}` : 'Tu dinero, claro'}
          </h1>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-[#6e6e73] dark:text-[#86868b]">
            <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Sant Vicenç dels Horts</span>
            <span aria-hidden="true">·</span>
            <span>Control real en euros</span>
          </p>
        </motion.div>
      </section>

      {/* Selector de mes */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15, ease: APPLE_EASE }}
        className="flex items-center justify-between rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] px-4 py-3"
      >
        <button
          type="button"
          onClick={() => onChangeMonth(shiftMonthKey(selectedMonth, -1))}
          aria-label="Mes anterior"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.97] transition-transform"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <p className="text-base sm:text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
            {formatMonthLabel(selectedMonth)}
          </p>
          <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">
            {summary.transactionCount === 0
              ? 'Sin movimientos este mes'
              : `${summary.transactionCount} ${summary.transactionCount === 1 ? 'movimiento' : 'movimientos'}`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onChangeMonth(shiftMonthKey(selectedMonth, 1))}
          aria-label="Mes siguiente"
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.97] transition-transform"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Grid principal: Saldo + Ingresos/Gastos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Saldo del mes */}
        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: APPLE_EASE }}
          className="lg:col-span-7 rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-[#6e6e73] dark:text-[#86868b]">
                Saldo del mes
              </h2>
              <button
                type="button"
                onClick={onAddTransaction}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#10B981] px-4 py-2 text-xs font-semibold text-white hover:bg-[#059669] active:scale-[0.97] transition-transform whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Añadir movimiento
              </button>
            </div>

            <p
              className={`mt-4 text-4xl sm:text-6xl font-semibold tracking-[-0.03em] tabular-nums ${
                summary.balance < 0
                  ? 'text-[#EF4444]'
                  : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
              }`}
            >
              {formatEUR(animatedBalance)}
            </p>

            {/* Comparación con el mes anterior */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#6e6e73] dark:text-[#86868b]">
              {!summary.previousHasData && summary.totalExpenses === 0 ? (
                <span>
                  Registra tus primeros gastos o ingresos para ver la evolución respecto a{' '}
                  {formatMonthLabel(summary.previousMonthKey).toLowerCase()}.
                </span>
              ) : !summary.previousHasData ? (
                <span>
                  Sin datos registrados en {formatMonthLabel(summary.previousMonthKey).toLowerCase()}{' '}
                  para comparar.
                </span>
              ) : summary.expenseDiffEur === 0 ? (
                <span>
                  Mismo gasto que en {formatMonthLabel(summary.previousMonthKey).toLowerCase()} (
                  {formatEUR(summary.previousExpenses)}).
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  {summary.expenseDiffEur > 0 ? (
                    <TrendingUp className="w-4 h-4 text-[#EF4444] shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-[#10B981] shrink-0" />
                  )}
                  <span>
                    Has gastado{' '}
                    <strong
                      className={
                        summary.expenseDiffEur > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'
                      }
                    >
                      {summary.expenseDiffEur > 0 ? '+' : ''}
                      {formatEUR(summary.expenseDiffEur)}
                      {summary.expenseDiffPercent !== null
                        ? ` (${summary.expenseDiffEur > 0 ? '+' : ''}${formatPercentES(summary.expenseDiffPercent)})`
                        : ''}
                    </strong>{' '}
                    que en {formatMonthLabel(summary.previousMonthKey).toLowerCase()}.
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* Ingresos y Gastos */}
          <div className="mt-7 grid grid-cols-2 gap-4 pt-6 border-t border-black/8 dark:border-[#333336]">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#6e6e73] dark:text-[#86868b]">
                <ArrowUpRight className="w-4 h-4 text-[#10B981]" />
                <span>Ingresos</span>
              </div>
              <p className="mt-1.5 text-2xl sm:text-3xl font-semibold tabular-nums text-[#10B981]">
                {formatEUR(animatedIncome)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-[#6e6e73] dark:text-[#86868b]">
                <ArrowDownRight className="w-4 h-4 text-[#EF4444]" />
                <span>Gastos</span>
              </div>
              <p className="mt-1.5 text-2xl sm:text-3xl font-semibold tabular-nums text-[#EF4444]">
                {formatEUR(animatedExpenses)}
              </p>
            </div>
          </div>

          {/* Aviso de límite de gasto mensual */}
          {limit !== null && limitPercent !== null && (
            <div className="mt-6 pt-5 border-t border-black/8 dark:border-[#333336]">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-medium text-[#6e6e73] dark:text-[#86868b]">
                  Límite mensual ({formatEUR(limit)})
                </span>
                <span
                  className={`font-semibold tabular-nums ${
                    isOverLimit
                      ? 'text-[#EF4444]'
                      : isNearLimit
                        ? 'text-[#FBBF24]'
                        : 'text-[#10B981]'
                  }`}
                >
                  {formatPercentES(limitPercent)}
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-black">
                <div
                  className={`h-full origin-left rounded-full transition-transform duration-500 ${
                    isOverLimit
                      ? 'bg-[#EF4444]'
                      : isNearLimit
                        ? 'bg-[#FBBF24]'
                        : 'bg-[#10B981]'
                  }`}
                  style={{ transform: `scaleX(${Math.min(1, limitPercent / 100)})` }}
                />
              </div>
              {(isNearLimit || isOverLimit) && (
                <p
                  className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                    isOverLimit ? 'text-[#EF4444]' : 'text-[#FBBF24]'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {isOverLimit
                    ? `Has superado tu límite mensual en ${formatEUR(summary.totalExpenses - limit)}.`
                    : `Te estás acercando a tu límite mensual: te quedan ${formatEUR(limit - summary.totalExpenses)}.`}
                </p>
              )}
            </div>
          )}
        </motion.section>

        {/* Objetivo de ahorro principal + acceso rápido */}
        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease: APPLE_EASE }}
          className="lg:col-span-5 rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] p-6 sm:p-8 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-[#6e6e73] dark:text-[#86868b]">
              Objetivo principal
            </h2>
            <button
              type="button"
              onClick={() => onNavigateTab('ahorro')}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#10B981] hover:underline py-1"
            >
              Ver objetivos
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {primaryGoal && primaryGoalMetrics ? (
            <div className="mt-4 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                  {primaryGoal.name}
                </p>
                <p className="mt-1 text-xs text-[#6e6e73] dark:text-[#86868b]">
                  Fecha límite: {formatDateES(primaryGoal.deadline)}
                  {primaryGoalMetrics.isCompleted ? ' · Completado' : ''}
                </p>

                <div className="mt-5 flex items-baseline justify-between gap-2">
                  <span className="text-3xl font-semibold tabular-nums text-[#10B981]">
                    {formatEUR(animatedGoalSaved)}
                  </span>
                  <span className="text-sm tabular-nums text-[#6e6e73] dark:text-[#86868b]">
                    de {formatEUR(primaryGoal.targetAmount)}
                  </span>
                </div>

                <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-black/10 dark:bg-black">
                  <motion.div
                    initial={shouldReduceMotion ? false : { scaleX: 0 }}
                    animate={{ scaleX: primaryGoalMetrics.percentage / 100 }}
                    transition={{ duration: 0.7, ease: APPLE_EASE }}
                    className="h-full origin-left rounded-full bg-[#10B981]"
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-black/8 dark:border-[#333336] text-xs">
                <div>
                  <span className="text-[#6e6e73] dark:text-[#86868b]">Conseguido</span>
                  <p className="mt-0.5 text-base font-semibold tabular-nums text-[#1d1d1f] dark:text-[#f5f5f7]">
                    {formatPercentES(primaryGoalMetrics.percentage)}
                  </p>
                </div>
                <div>
                  <span className="text-[#6e6e73] dark:text-[#86868b]">
                    {primaryGoalMetrics.isCompleted ? 'Estado' : 'Necesitas al mes'}
                  </span>
                  <p className="mt-0.5 text-base font-semibold tabular-nums text-[#1d1d1f] dark:text-[#f5f5f7]">
                    {primaryGoalMetrics.isCompleted
                      ? 'Conseguido'
                      : formatEUR(primaryGoalMetrics.monthlyNeeded)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="my-auto py-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#10B981]/15 text-[#10B981]">
                <PiggyBank className="w-6 h-6" />
              </div>
              <p className="mt-3 text-base font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">
                Aún no tienes objetivos de ahorro
              </p>
              <p className="mt-1 text-xs text-[#6e6e73] dark:text-[#86868b]">
                Crea una meta como un viaje, unas zapatillas o tu matrícula y calcula cuánto
                apartar cada mes.
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('ahorro')}
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#10B981] px-5 py-2 text-xs font-semibold text-white hover:bg-[#059669] active:scale-[0.97]"
              >
                Crear objetivo
              </button>
            </div>
          )}
        </motion.section>
      </div>

      {/* Gráfico de gastos por categoría + Últimos movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: APPLE_EASE }}
          className="lg:col-span-7 rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                Gastos por categoría
              </h2>
              <p className="text-xs text-[#6e6e73] dark:text-[#86868b]">
                Distribución real de {formatMonthLabel(selectedMonth).toLowerCase()}
              </p>
            </div>

            <div className="inline-flex rounded-full bg-[#f5f5f7] dark:bg-black p-1 border border-black/8 dark:border-[#333336]">
              <button
                type="button"
                onClick={() => setChartMode('barras')}
                className={`min-h-[36px] rounded-full px-3.5 text-xs font-medium transition-colors ${
                  chartMode === 'barras'
                    ? 'bg-[#10B981] text-white'
                    : 'text-[#6e6e73] dark:text-[#86868b]'
                }`}
              >
                Barras
              </button>
              <button
                type="button"
                onClick={() => setChartMode('circular')}
                className={`min-h-[36px] rounded-full px-3.5 text-xs font-medium transition-colors ${
                  chartMode === 'circular'
                    ? 'bg-[#10B981] text-white'
                    : 'text-[#6e6e73] dark:text-[#86868b]'
                }`}
              >
                Circular
              </button>
            </div>
          </div>

          {summary.categoryBreakdown.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                No hay gastos registrados en {formatMonthLabel(selectedMonth).toLowerCase()}
              </p>
              <p className="mt-1 text-xs text-[#6e6e73] dark:text-[#86868b]">
                Cuando añadas gastos verás aquí en qué se va tu dinero.
              </p>
              <button
                type="button"
                onClick={onAddTransaction}
                className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-black/15 dark:border-[#6e6e73] px-5 py-2 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-black/5 dark:hover:bg-white/5"
              >
                <Plus className="w-4 h-4 text-[#10B981]" />
                Registrar primer gasto
              </button>
            </div>
          ) : chartMode === 'barras' ? (
            <div className="mt-6 space-y-4">
              {summary.categoryBreakdown.map((item) => (
                <div key={item.category.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: `${item.category.color}22`,
                          color: item.category.color,
                        }}
                      >
                        <CategoryIcon icon={item.category.icon} className="w-4 h-4" />
                      </span>
                      <span className="truncate font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {item.category.name}
                      </span>
                      <span className="text-xs text-[#6e6e73] dark:text-[#86868b] shrink-0">
                        · {item.count}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 shrink-0 tabular-nums">
                      <span className="font-semibold text-[#EF4444]">
                        {formatEUR(item.total)}
                      </span>
                      <span className="text-xs text-[#6e6e73] dark:text-[#86868b] w-14 text-right">
                        {formatPercentES(item.percentage)}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/8 dark:bg-black">
                    <motion.div
                      initial={shouldReduceMotion ? false : { scaleX: 0 }}
                      animate={{ scaleX: item.percentage / 100 }}
                      transition={{ duration: 0.65, ease: APPLE_EASE }}
                      className="h-full origin-left rounded-full"
                      style={{ backgroundColor: item.category.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-col sm:flex-row items-center gap-8">
              <div className="relative flex items-center justify-center shrink-0">
                <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r={donutRadius}
                    fill="none"
                    stroke="currentColor"
                    className="text-black/8 dark:text-black"
                    strokeWidth="22"
                  />
                  {summary.categoryBreakdown.map((item) => {
                    const fraction = summary.totalExpenses > 0 ? item.total / summary.totalExpenses : 0;
                    const dashLength = fraction * donutCircumference;
                    const dashOffset = -cumulativeFraction * donutCircumference;
                    cumulativeFraction += fraction;
                    return (
                      <circle
                        key={item.category.id}
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        fill="none"
                        stroke={item.category.color}
                        strokeWidth="22"
                        strokeDasharray={`${dashLength} ${donutCircumference}`}
                        strokeDashoffset={dashOffset}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                  <span className="text-[11px] text-[#6e6e73] dark:text-[#86868b]">Total</span>
                  <span className="text-sm font-semibold tabular-nums text-[#EF4444]">
                    {formatEUR(summary.totalExpenses)}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2.5">
                {summary.categoryBreakdown.map((item) => (
                  <div
                    key={item.category.id}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.category.color }}
                      />
                      <span className="truncate text-[#1d1d1f] dark:text-[#f5f5f7]">
                        {item.category.name}
                      </span>
                    </div>
                    <span className="tabular-nums text-xs text-[#6e6e73] dark:text-[#86868b] shrink-0">
                      {formatEUR(item.total)} · {formatPercentES(item.percentage)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* Últimos movimientos del mes */}
        <motion.section
          initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: APPLE_EASE }}
          className="lg:col-span-5 rounded-[28px] bg-white dark:bg-[#1d1d1f] border border-black/8 dark:border-[#333336] p-6 sm:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
                Actividad reciente
              </h2>
              <button
                type="button"
                onClick={() => onNavigateTab('movimientos')}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#10B981] hover:underline py-1"
              >
                Ver todo
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentMonthTxs.length === 0 ? (
              <p className="mt-6 text-sm text-[#6e6e73] dark:text-[#86868b]">
                Todavía no hay movimientos en {formatMonthLabel(selectedMonth).toLowerCase()}.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-black/8 dark:divide-[#333336]">
                {recentMonthTxs.map((tx) => {
                  const cat = categoryMap.get(tx.categoryId);
                  return (
                    <li key={tx.id} className="flex items-center justify-between gap-3 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                          style={{
                            backgroundColor: `${cat?.color ?? '#94A3B8'}22`,
                            color: cat?.color ?? '#94A3B8',
                          }}
                        >
                          <CategoryIcon icon={cat?.icon ?? 'tag'} className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                            {tx.note || cat?.name || 'Movimiento'}
                          </p>
                          <p className="truncate text-xs text-[#6e6e73] dark:text-[#86868b]">
                            {cat?.name ?? 'Otros'} · {formatDateES(tx.date)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          tx.type === 'gasto' ? 'text-[#EF4444]' : 'text-[#10B981]'
                        }`}
                      >
                        {tx.type === 'gasto' ? '-' : '+'}
                        {formatEUR(tx.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
