export type TransactionType = 'gasto' | 'ingreso';

export type CategoryIconKey =
  | 'utensils'
  | 'bus'
  | 'gamepad'
  | 'shirt'
  | 'book'
  | 'repeat'
  | 'tag'
  | 'coffee'
  | 'music'
  | 'heart'
  | 'home'
  | 'laptop'
  | 'plane'
  | 'wallet';

export interface Category {
  id: string;
  name: string;
  icon: CategoryIconKey;
  color: string;
  isCustom: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string; // YYYY-MM-DD
  categoryId: string;
  note: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string; // YYYY-MM-DD
  isPrimary: boolean;
  createdAt: string;
}

export interface AppSettings {
  userName: string;
  monthlyLimit: number | null;
  theme: 'dark' | 'light';
}

export interface FindiDataStore {
  version: number;
  transactions: Transaction[];
  categories: Category[];
  goals: SavingsGoal[];
  settings: AppSettings;
}

export interface ProposedAssistantAction {
  type: 'create_transaction' | 'add_goal_funds' | 'delete_transaction';
  transactionType?: TransactionType;
  amount?: number;
  categoryName?: string;
  date?: string;
  note?: string;
  goalId?: string;
  goalName?: string;
  transactionId?: string;
  summaryLabel?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  proposedAction?: ProposedAssistantAction | null;
  actionStatus?: 'pending' | 'confirmed' | 'cancelled';
  isError?: boolean;
}
