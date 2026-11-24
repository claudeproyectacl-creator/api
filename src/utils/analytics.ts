import type { Category, SavingsGoal, Transaction } from '../types/finance';
import { getMonthKey, shiftMonthKey } from './format';

export interface CategoryBreakdownItem {
  category: Category;
  total: number;
  percentage: number;
  count: number;
}

export interface MonthlySummary {
  monthKey: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  previousMonthKey: string;
  previousExpenses: number;
  previousIncome: number;
  previousHasData: boolean;
  expenseDiffEur: number;
  expenseDiffPercent: number | null;
  categoryBreakdown: CategoryBreakdownItem[];
}

export function computeMonthlySummary(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string
): MonthlySummary {
  const currentTxs = transactions.filter((t) => getMonthKey(t.date) === monthKey);
  const previousMonthKey = shiftMonthKey(monthKey, -1);
  const prevTxs = transactions.filter((t) => getMonthKey(t.date) === previousMonthKey);

  let totalIncome = 0;
  let totalExpenses = 0;
  const byCategory = new Map<string, { total: number; count: number }>();

  for (const tx of currentTxs) {
    if (tx.type === 'ingreso') {
      totalIncome += tx.amount;
    } else {
      totalExpenses += tx.amount;
      const prev = byCategory.get(tx.categoryId) ?? { total: 0, count: 0 };
      byCategory.set(tx.categoryId, {
        total: Math.round((prev.total + tx.amount) * 100) / 100,
        count: prev.count + 1,
      });
    }
  }

  totalIncome = Math.round(totalIncome * 100) / 100;
  totalExpenses = Math.round(totalExpenses * 100) / 100;
  const balance = Math.round((totalIncome - totalExpenses) * 100) / 100;

  let previousIncome = 0;
  let previousExpenses = 0;
  for (const tx of prevTxs) {
    if (tx.type === 'ingreso') {
      previousIncome += tx.amount;
    } else {
      previousExpenses += tx.amount;
    }
  }
  previousIncome = Math.round(previousIncome * 100) / 100;
  previousExpenses = Math.round(previousExpenses * 100) / 100;

  const expenseDiffEur = Math.round((totalExpenses - previousExpenses) * 100) / 100;
  const expenseDiffPercent =
    previousExpenses > 0
      ? Math.round(((totalExpenses - previousExpenses) / previousExpenses) * 1000) / 10
      : null;

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const fallbackCategory: Category =
    categories.find((c) => c.id === 'cat-otros') ?? {
      id: 'cat-otros',
      name: 'Otros',
      icon: 'tag',
      color: '#94A3B8',
      isCustom: false,
      createdAt: '',
    };

  const categoryBreakdown: CategoryBreakdownItem[] = [];
  for (const [catId, stats] of byCategory.entries()) {
    const cat = categoryMap.get(catId) ?? fallbackCategory;
    const percentage =
      totalExpenses > 0 ? Math.round((stats.total / totalExpenses) * 1000) / 10 : 0;
    categoryBreakdown.push({
      category: cat,
      total: stats.total,
      percentage,
      count: stats.count,
    });
  }

  categoryBreakdown.sort((a, b) => b.total - a.total);

  return {
    monthKey,
    totalIncome,
    totalExpenses,
    balance,
    transactionCount: currentTxs.length,
    previousMonthKey,
    previousExpenses,
    previousIncome,
    previousHasData: prevTxs.length > 0,
    expenseDiffEur,
    expenseDiffPercent,
    categoryBreakdown,
  };
}

export interface GoalProgressMetrics {
  remainingAmount: number;
  percentage: number;
  monthsRemaining: number;
  monthlyNeeded: number;
  isCompleted: boolean;
  isPastDeadline: boolean;
}

export function computeGoalMetrics(goal: SavingsGoal): GoalProgressMetrics {
  const remainingAmount = Math.max(0, Math.round((goal.targetAmount - goal.savedAmount) * 100) / 100);
  const rawPct = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
  const percentage = Math.min(100, Math.round(rawPct * 10) / 10);
  const isCompleted = goal.savedAmount >= goal.targetAmount && goal.targetAmount > 0;

  const now = new Date();
  const [yStr, mStr, dStr] = goal.deadline.split('-');
  const endY = Number(yStr);
  const endM = Number(mStr) - 1;
  const endD = Number(dStr);
  const deadlineDate = new Date(endY, endM, endD, 23, 59, 59);
  const isPastDeadline = deadlineDate.getTime() < now.getTime() && !isCompleted;

  let monthsDiff = (endY - now.getFullYear()) * 12 + (endM - now.getMonth());
  if (endD >= now.getDate()) {
    monthsDiff += 1;
  }
  const monthsRemaining = Math.max(1, monthsDiff);
  const monthlyNeeded = isCompleted
    ? 0
    : Math.round((remainingAmount / monthsRemaining) * 100) / 100;

  return {
    remainingAmount,
    percentage,
    monthsRemaining,
    monthlyNeeded,
    isCompleted,
    isPastDeadline,
  };
}
