import type { AppSettings, Category, FindiDataStore, SavingsGoal, Transaction } from '../types/finance';

const STORAGE_KEY = 'findi_student_tracker_v1';
const CHAT_STORAGE_KEY = 'findi_assistant_history_v1';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-comida',
    name: 'Comida',
    icon: 'utensils',
    color: '#10B981',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-transporte',
    name: 'Transporte',
    icon: 'bus',
    color: '#38BDF8',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-ocio',
    name: 'Ocio',
    icon: 'gamepad',
    color: '#A78BFA',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-ropa',
    name: 'Ropa',
    icon: 'shirt',
    color: '#F472B6',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-estudios',
    name: 'Estudios',
    icon: 'book',
    color: '#FBBF24',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-suscripciones',
    name: 'Suscripciones',
    icon: 'repeat',
    color: '#FB923C',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-otros',
    name: 'Otros',
    icon: 'tag',
    color: '#94A3B8',
    isCustom: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  monthlyLimit: null,
  theme: 'dark',
};

export function createEmptyStore(): FindiDataStore {
  return {
    version: 1,
    transactions: [],
    categories: [...DEFAULT_CATEGORIES],
    goals: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function loadStore(): FindiDataStore {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyStore();

    const parsed = JSON.parse(raw) as Partial<FindiDataStore>;
    const categories: Category[] =
      Array.isArray(parsed.categories) && parsed.categories.length > 0
        ? parsed.categories
        : [...DEFAULT_CATEGORIES];

    const transactions: Transaction[] = Array.isArray(parsed.transactions)
      ? parsed.transactions.filter(
          (t): t is Transaction =>
            typeof t === 'object' &&
            t !== null &&
            typeof t.id === 'string' &&
            (t.type === 'gasto' || t.type === 'ingreso') &&
            typeof t.amount === 'number' &&
            Number.isFinite(t.amount) &&
            t.amount > 0 &&
            typeof t.date === 'string' &&
            typeof t.categoryId === 'string'
        )
      : [];

    const goals: SavingsGoal[] = Array.isArray(parsed.goals)
      ? parsed.goals.filter(
          (g): g is SavingsGoal =>
            typeof g === 'object' &&
            g !== null &&
            typeof g.id === 'string' &&
            typeof g.name === 'string' &&
            typeof g.targetAmount === 'number' &&
            typeof g.savedAmount === 'number' &&
            typeof g.deadline === 'string'
        )
      : [];

    const settings: AppSettings = {
      userName: typeof parsed.settings?.userName === 'string' ? parsed.settings.userName : '',
      monthlyLimit:
        typeof parsed.settings?.monthlyLimit === 'number' && parsed.settings.monthlyLimit > 0
          ? parsed.settings.monthlyLimit
          : null,
      theme: parsed.settings?.theme === 'light' ? 'light' : 'dark',
    };

    return {
      version: 1,
      transactions,
      categories,
      goals,
      settings,
    };
  } catch {
    return createEmptyStore();
  }
}

export function saveStore(store: FindiDataStore): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage quota or privacy mode fallback
  }
}

export function clearAllUserData(): FindiDataStore {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch {
    // Ignore storage removal errors
  }
  const fresh = createEmptyStore();
  saveStore(fresh);
  return fresh;
}

export { CHAT_STORAGE_KEY };
