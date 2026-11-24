import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeftRight,
  Bot,
  Home,
  PiggyBank,
  Plus,
  Settings,
} from 'lucide-react';
import type {
  AppSettings,
  Category,
  CategoryIconKey,
  FindiDataStore,
  ProposedAssistantAction,
  SavingsGoal,
  Transaction,
  TransactionType,
} from './types/finance';
import {
  formatEUR,
  getCurrentMonthKey,
  getTodayISO,
  isValidISODate,
} from './utils/format';
import {
  clearAllUserData,
  generateId,
  loadStore,
  saveStore,
} from './utils/storage';
import { FindiLogo } from './components/FindiLogo';
import { HomeView } from './components/HomeView';
import { TransactionsView } from './components/TransactionsView';
import { SavingsView } from './components/SavingsView';
import { AssistantView } from './components/AssistantView';
import { TransactionModal } from './components/TransactionModal';
import { SettingsModal } from './components/SettingsModal';

type TabKey = 'inicio' | 'movimientos' | 'ahorro' | 'asistente';

const NAV_ITEMS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'inicio', label: 'Inicio', icon: Home },
  { key: 'movimientos', label: 'Movimientos', icon: ArrowLeftRight },
  { key: 'ahorro', label: 'Ahorro', icon: PiggyBank },
  { key: 'asistente', label: 'Asistente', icon: Bot },
];

export default function App() {
  const shouldReduceMotion = useReducedMotion();

  const [store, setStore] = useState<FindiDataStore>(() => loadStore());
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKey());

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [celebrateCoin, setCelebrateCoin] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const heroRef = useRef<HTMLDivElement | null>(null);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (store.settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [store.settings.theme]);

  // Persist store on every change
  useEffect(() => {
    saveStore(store);
  }, [store]);

  // Track scroll for hero-to-topbar logo docking on Inicio
  useEffect(() => {
    const handleScroll = () => {
      if (activeTab !== 'inicio') {
        setScrolledPastHero(true);
        return;
      }
      setScrolledPastHero(window.scrollY > 110);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeTab]);

  // Scroll to top when changing tabs
  const handleNavigate = (tab: TabKey) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  };

  const triggerCoinCelebration = () => {
    setCelebrateCoin(true);
    setTimeout(() => setCelebrateCoin(false), 1600);
  };

  const handleSaveTransaction = (payload: {
    id?: string;
    type: TransactionType;
    amount: number;
    date: string;
    categoryId: string;
    note: string;
  }) => {
    setStore((prev) => {
      if (payload.id) {
        return {
          ...prev,
          transactions: prev.transactions.map((t) =>
            t.id === payload.id
              ? {
                  ...t,
                  type: payload.type,
                  amount: payload.amount,
                  date: payload.date,
                  categoryId: payload.categoryId,
                  note: payload.note,
                }
              : t
          ),
        };
      }

      const nextTx: Transaction = {
        id: generateId(),
        type: payload.type,
        amount: payload.amount,
        date: payload.date,
        categoryId: payload.categoryId,
        note: payload.note,
        createdAt: new Date().toISOString(),
      };
      return {
        ...prev,
        transactions: [nextTx, ...prev.transactions],
      };
    });

    setSelectedMonth(payload.date.slice(0, 7));
  };

  const handleDeleteTransaction = (id: string) => {
    setStore((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  const handleCreateCategory = (payload: {
    name: string;
    icon: CategoryIconKey;
    color: string;
  }): Category => {
    const created: Category = {
      id: `cat-${generateId().slice(0, 8)}`,
      name: payload.name,
      icon: payload.icon,
      color: payload.color,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    setStore((prev) => ({
      ...prev,
      categories: [...prev.categories, created],
    }));
    return created;
  };

  const handleCreateGoal = (payload: {
    name: string;
    targetAmount: number;
    deadline: string;
    isPrimary: boolean;
  }) => {
    const created: SavingsGoal = {
      id: generateId(),
      name: payload.name,
      targetAmount: payload.targetAmount,
      savedAmount: 0,
      deadline: payload.deadline,
      isPrimary: payload.isPrimary || store.goals.length === 0,
      createdAt: new Date().toISOString(),
    };
    setStore((prev) => ({
      ...prev,
      goals: [
        ...prev.goals.map((g) =>
          created.isPrimary ? { ...g, isPrimary: false } : g
        ),
        created,
      ],
    }));
  };

  const handleUpdateGoal = (updated: SavingsGoal) => {
    setStore((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id === updated.id) return updated;
        return updated.isPrimary ? { ...g, isPrimary: false } : g;
      }),
    }));
  };

  const handleAdjustGoalFunds = (goalId: string, delta: number) => {
    let hitCompleted = false;
    setStore((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const nextSaved = Math.max(0, Math.round((g.savedAmount + delta) * 100) / 100);
        if (g.savedAmount < g.targetAmount && nextSaved >= g.targetAmount) {
          hitCompleted = true;
        }
        return { ...g, savedAmount: nextSaved };
      }),
    }));

    if (hitCompleted) {
      triggerCoinCelebration();
    }
  };

  const handleSetPrimaryGoal = (goalId: string) => {
    setStore((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => ({
        ...g,
        isPrimary: g.id === goalId,
      })),
    }));
  };

  const handleDeleteGoal = (goalId: string) => {
    setStore((prev) => {
      const remaining = prev.goals.filter((g) => g.id !== goalId);
      if (remaining.length > 0 && !remaining.some((g) => g.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true };
      }
      return {
        ...prev,
        goals: remaining,
      };
    });
  };

  const handleUpdateSettings = (next: AppSettings) => {
    setStore((prev) => ({
      ...prev,
      settings: next,
    }));
  };

  const handleResetAllData = () => {
    const fresh = clearAllUserData();
    setStore(fresh);
    setSelectedMonth(getCurrentMonthKey());
    setActiveTab('inicio');
  };

  const handleExecuteProposedAction = (action: ProposedAssistantAction): string => {
    if (action.type === 'create_transaction') {
      const amount = typeof action.amount === 'number' ? Math.round(action.amount * 100) / 100 : 0;
      if (amount <= 0) return 'No se pudo registrar el movimiento: el importe no es válido.';

      const txType: TransactionType = action.transactionType === 'ingreso' ? 'ingreso' : 'gasto';
      const txDate = action.date && isValidISODate(action.date) ? action.date : getTodayISO();
      const matchedCat =
        store.categories.find(
          (c) => c.name.toLowerCase() === (action.categoryName ?? '').trim().toLowerCase()
        ) ??
        store.categories.find((c) => c.id === 'cat-otros') ??
        store.categories[0];

      handleSaveTransaction({
        type: txType,
        amount,
        date: txDate,
        categoryId: matchedCat.id,
        note: action.note ?? '',
      });
      return `Listo: he registrado el ${txType} de ${formatEUR(amount)} en ${matchedCat.name}.`;
    }

    if (action.type === 'add_goal_funds') {
      const amount = typeof action.amount === 'number' ? Math.round(action.amount * 100) / 100 : 0;
      const targetGoal =
        store.goals.find((g) => g.id === action.goalId) ??
        store.goals.find(
          (g) => g.name.toLowerCase() === (action.goalName ?? '').trim().toLowerCase()
        ) ??
        store.goals.find((g) => g.isPrimary) ??
        store.goals[0];

      if (!targetGoal || amount <= 0) {
        return 'No encontré el objetivo o el importe no era válido.';
      }
      handleAdjustGoalFunds(targetGoal.id, amount);
      return `He añadido ${formatEUR(amount)} a tu objetivo «${targetGoal.name}».`;
    }

    if (action.type === 'delete_transaction' && action.transactionId) {
      const exists = store.transactions.some((t) => t.id === action.transactionId);
      if (!exists) return 'No encontré ese movimiento para eliminarlo.';
      handleDeleteTransaction(action.transactionId);
      return 'Movimiento eliminado correctamente.';
    }

    return 'No se realizó ninguna modificación.';
  };

  const hasCompletedGoal = store.goals.some(
    (g) => g.targetAmount > 0 && g.savedAmount >= g.targetAmount
  );

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] dark:bg-black dark:text-[#f5f5f7] transition-colors duration-300">
      {/* Top Bar (3-zone contract) */}
      <header className="sticky top-0 z-30 h-14 border-b border-black/8 dark:border-[#282828] bg-[#f5f5f7]/85 dark:bg-[#0e0e0e]/85 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-8 px-4 sm:px-6">
          {/* Zone 1: Brand mark (docks smoothly on scroll) */}
          <button
            type="button"
            onClick={() => handleNavigate('inicio')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] rounded-full pr-2"
          >
            <motion.div
              animate={{
                opacity: scrolledPastHero ? 1 : 0.9,
                scale: scrolledPastHero ? 1 : 0.92,
              }}
              transition={{ duration: 0.25, ease: [0.28, 0.11, 0.32, 1] }}
              className="flex items-center"
            >
              <FindiLogo
                variant="compact"
                celebrateCoin={celebrateCoin || (hasCompletedGoal && activeTab === 'ahorro')}
              />
            </motion.div>
            <span className="text-base font-semibold tracking-[-0.02em] text-[#1d1d1f] dark:text-[#f5f5f7]">
              FINDI
            </span>
          </button>

          {/* Zone 2: Desktop Navigation (4 links) */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-7 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleNavigate(item.key)}
                  className={`relative py-2 whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'text-[#10B981]'
                      : 'text-[#6e6e73] dark:text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Settings + Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Abrir ajustes"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[#6e6e73] dark:text-[#86868b] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#1d1d1f] dark:hover:text-[#f5f5f7] transition-colors"
            >
              <Settings className="w-5 h-5" strokeWidth={1.75} />
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingTx(null);
                setTxModalOpen(true);
              }}
              className="hidden sm:inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-[#10B981] px-4 py-2 text-xs font-semibold text-white hover:bg-[#059669] active:scale-[0.97] transition-transform whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nuevo gasto
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 pt-4 pb-24 md:pb-12">
        {activeTab === 'inicio' && (
          <HomeView
            transactions={store.transactions}
            categories={store.categories}
            goals={store.goals}
            settings={store.settings}
            selectedMonth={selectedMonth}
            celebrateCoin={celebrateCoin}
            heroRef={heroRef}
            onChangeMonth={setSelectedMonth}
            onAddTransaction={() => {
              setEditingTx(null);
              setTxModalOpen(true);
            }}
            onNavigateTab={handleNavigate}
          />
        )}

        {activeTab === 'movimientos' && (
          <TransactionsView
            transactions={store.transactions}
            categories={store.categories}
            selectedMonth={selectedMonth}
            onAddNew={() => {
              setEditingTx(null);
              setTxModalOpen(true);
            }}
            onEdit={(tx) => {
              setEditingTx(tx);
              setTxModalOpen(true);
            }}
            onDelete={handleDeleteTransaction}
          />
        )}

        {activeTab === 'ahorro' && (
          <SavingsView
            goals={store.goals}
            onCreateGoal={handleCreateGoal}
            onUpdateGoal={handleUpdateGoal}
            onAdjustFunds={handleAdjustGoalFunds}
            onSetPrimary={handleSetPrimaryGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === 'asistente' && (
          <AssistantView
            transactions={store.transactions}
            categories={store.categories}
            goals={store.goals}
            settings={store.settings}
            selectedMonth={selectedMonth}
            onExecuteProposedAction={handleExecuteProposedAction}
          />
        )}
      </main>

      {/* Floating Quick-Add Button (+) */}
      <button
        type="button"
        onClick={() => {
          setEditingTx(null);
          setTxModalOpen(true);
        }}
        aria-label="Añadir gasto rápido"
        className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981] text-white hover:bg-[#059669] active:scale-[0.95] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      >
        <Plus className="w-6 h-6" strokeWidth={2.25} />
      </button>

      {/* Mobile Bottom Navigation (4 tabs) */}
      <nav
        aria-label="Navegación inferior"
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 border-t border-black/10 dark:border-[#282828] bg-[#f5f5f7]/95 dark:bg-[#0e0e0e]/95 backdrop-blur-md"
      >
        <div className="grid h-full grid-cols-4 items-center">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavigate(item.key)}
                className={`flex min-h-[44px] flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                  active
                    ? 'text-[#10B981]'
                    : 'text-[#6e6e73] dark:text-[#86868b]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.2 : 1.75} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals */}
      <TransactionModal
        open={txModalOpen}
        categories={store.categories}
        initialTransaction={editingTx}
        defaultType="gasto"
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        onCreateCategory={handleCreateCategory}
      />

      <SettingsModal
        open={settingsOpen}
        store={store}
        onClose={() => setSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
        onResetAllData={handleResetAllData}
      />
    </div>
  );
}
