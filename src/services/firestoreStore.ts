import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type {
  AppSettings,
  Category,
  CategoryIconKey,
  FindiDataStore,
  SavingsGoal,
  Transaction,
} from '../types/finance';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../utils/storage';
import { db, handleFirestoreError, OperationType } from './firebase';

function toIsoString(val: unknown): string {
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function clampAmount(value: number): number {
  const rounded = Math.round(value * 100) / 100;
  return Math.min(1000000, Math.max(0.01, rounded));
}

export async function ensureUserAccountInitialized(uid: string): Promise<void> {
  const userPath = `users/${uid}`;
  const settingsPath = `users/${uid}/settings/preferences`;
  const categoriesPath = `users/${uid}/categories`;

  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const settingsRef = doc(db, 'users', uid, 'settings', 'preferences');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        ownerId: uid,
        userName: '',
        monthlyLimit: null,
        theme: DEFAULT_SETTINGS.theme,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const catsSnap = await getDocs(
      query(collection(db, 'users', uid, 'categories'), where('ownerId', '==', uid))
    );
    if (catsSnap.empty) {
      const batch = writeBatch(db);
      for (const cat of DEFAULT_CATEGORIES) {
        const catRef = doc(db, 'users', uid, 'categories', cat.id);
        batch.set(catRef, {
          id: cat.id,
          ownerId: uid,
          name: cat.name.slice(0, 32),
          icon: cat.icon,
          color: cat.color,
          isCustom: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
    }
  } catch (err) {
    const path = err instanceof Error && err.message.includes('preferences')
      ? settingsPath
      : err instanceof Error && err.message.includes('categories')
        ? categoriesPath
        : userPath;
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export interface CloudSubscriptionCallbacks {
  onTransactions: (items: Transaction[]) => void;
  onCategories: (items: Category[]) => void;
  onGoals: (items: SavingsGoal[]) => void;
  onSettings: (settings: AppSettings) => void;
  onInitialReady: () => void;
  onError: (err: Error) => void;
}

export function subscribeUserData(
  uid: string,
  callbacks: CloudSubscriptionCallbacks
): () => void {
  const readyFlags = {
    tx: false,
    cat: false,
    goal: false,
    settings: false,
  };
  let notifiedReady = false;

  const checkReady = () => {
    if (
      !notifiedReady &&
      readyFlags.tx &&
      readyFlags.cat &&
      readyFlags.goal &&
      readyFlags.settings
    ) {
      notifiedReady = true;
      callbacks.onInitialReady();
    }
  };

  const unsubs: Unsubscribe[] = [];

  const txPath = `users/${uid}/transactions`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'transactions'), where('ownerId', '==', uid)),
      (snap) => {
        const list: Transaction[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            type: data.type === 'ingreso' ? 'ingreso' : 'gasto',
            amount: Number(data.amount ?? 0),
            date: String(data.date ?? ''),
            categoryId: String(data.categoryId ?? 'cat-otros'),
            note: String(data.note ?? ''),
            createdAt: toIsoString(data.createdAt),
          };
        });
        callbacks.onTransactions(list);
        readyFlags.tx = true;
        checkReady();
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, txPath);
        } catch (wrapped) {
          callbacks.onError(wrapped as Error);
        }
      }
    )
  );

  const catPath = `users/${uid}/categories`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'categories'), where('ownerId', '==', uid)),
      (snap) => {
        const list: Category[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            name: String(data.name ?? 'Otros'),
            icon: (data.icon as CategoryIconKey) ?? 'tag',
            color: String(data.color ?? '#94A3B8'),
            isCustom: Boolean(data.isCustom),
            createdAt: toIsoString(data.createdAt),
          };
        });
        callbacks.onCategories(list.length > 0 ? list : [...DEFAULT_CATEGORIES]);
        readyFlags.cat = true;
        checkReady();
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, catPath);
        } catch (wrapped) {
          callbacks.onError(wrapped as Error);
        }
      }
    )
  );

  const goalsPath = `users/${uid}/goals`;
  unsubs.push(
    onSnapshot(
      query(collection(db, 'users', uid, 'goals'), where('ownerId', '==', uid)),
      (snap) => {
        const list: SavingsGoal[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id ?? d.id),
            name: String(data.name ?? ''),
            targetAmount: Number(data.targetAmount ?? 0),
            savedAmount: Number(data.savedAmount ?? 0),
            deadline: String(data.deadline ?? ''),
            isPrimary: Boolean(data.isPrimary),
            createdAt: toIsoString(data.createdAt),
          };
        });
        callbacks.onGoals(list);
        readyFlags.goal = true;
        checkReady();
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, goalsPath);
        } catch (wrapped) {
          callbacks.onError(wrapped as Error);
        }
      }
    )
  );

  const settingsPath = `users/${uid}/settings/preferences`;
  unsubs.push(
    onSnapshot(
      doc(db, 'users', uid, 'settings', 'preferences'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          callbacks.onSettings({
            userName: typeof data.userName === 'string' ? data.userName : '',
            monthlyLimit:
              typeof data.monthlyLimit === 'number' && data.monthlyLimit > 0
                ? data.monthlyLimit
                : null,
            theme: data.theme === 'light' ? 'light' : 'dark',
          });
        } else {
          callbacks.onSettings({ ...DEFAULT_SETTINGS });
        }
        readyFlags.settings = true;
        checkReady();
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.GET, settingsPath);
        } catch (wrapped) {
          callbacks.onError(wrapped as Error);
        }
      }
    )
  );

  return () => {
    for (const unsub of unsubs) {
      unsub();
    }
  };
}

export async function saveCloudTransaction(
  uid: string,
  tx: Transaction,
  isNew: boolean
): Promise<void> {
  const path = `users/${uid}/transactions/${tx.id}`;
  const ref = doc(db, 'users', uid, 'transactions', tx.id);
  try {
    if (isNew) {
      await setDoc(ref, {
        id: tx.id,
        ownerId: uid,
        type: tx.type,
        amount: clampAmount(tx.amount),
        date: tx.date,
        categoryId: tx.categoryId,
        note: tx.note.slice(0, 120),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        type: tx.type,
        amount: clampAmount(tx.amount),
        date: tx.date,
        categoryId: tx.categoryId,
        note: tx.note.slice(0, 120),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function deleteCloudTransaction(uid: string, txId: string): Promise<void> {
  const path = `users/${uid}/transactions/${txId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'transactions', txId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveCloudCategory(uid: string, cat: Category): Promise<void> {
  const path = `users/${uid}/categories/${cat.id}`;
  try {
    await setDoc(doc(db, 'users', uid, 'categories', cat.id), {
      id: cat.id,
      ownerId: uid,
      name: cat.name.slice(0, 32),
      icon: cat.icon.slice(0, 24),
      color: cat.color,
      isCustom: cat.isCustom,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function saveCloudGoal(
  uid: string,
  goal: SavingsGoal,
  otherGoalsToDemote: SavingsGoal[],
  isNew: boolean
): Promise<void> {
  const path = `users/${uid}/goals/${goal.id}`;
  try {
    const batch = writeBatch(db);
    const ref = doc(db, 'users', uid, 'goals', goal.id);
    const safeTarget = clampAmount(goal.targetAmount);
    const safeSaved = Math.min(1000000, Math.max(0, Math.round(goal.savedAmount * 100) / 100));

    if (isNew) {
      batch.set(ref, {
        id: goal.id,
        ownerId: uid,
        name: goal.name.slice(0, 60),
        targetAmount: safeTarget,
        savedAmount: safeSaved,
        deadline: goal.deadline,
        isPrimary: goal.isPrimary,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      batch.update(ref, {
        name: goal.name.slice(0, 60),
        targetAmount: safeTarget,
        savedAmount: safeSaved,
        deadline: goal.deadline,
        isPrimary: goal.isPrimary,
        updatedAt: serverTimestamp(),
      });
    }

    if (goal.isPrimary) {
      for (const other of otherGoalsToDemote) {
        if (other.id !== goal.id && other.isPrimary) {
          batch.update(doc(db, 'users', uid, 'goals', other.id), {
            isPrimary: false,
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function setCloudPrimaryGoal(
  uid: string,
  goalId: string,
  allGoals: SavingsGoal[]
): Promise<void> {
  const path = `users/${uid}/goals/${goalId}`;
  try {
    const batch = writeBatch(db);
    for (const g of allGoals) {
      const nextPrimary = g.id === goalId;
      if (g.isPrimary !== nextPrimary) {
        batch.update(doc(db, 'users', uid, 'goals', g.id), {
          isPrimary: nextPrimary,
          updatedAt: serverTimestamp(),
        });
      }
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function deleteCloudGoal(
  uid: string,
  goalId: string,
  nextPrimaryGoalId: string | null
): Promise<void> {
  const path = `users/${uid}/goals/${goalId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uid, 'goals', goalId));
    if (nextPrimaryGoalId) {
      batch.update(doc(db, 'users', uid, 'goals', nextPrimaryGoalId), {
        isPrimary: true,
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function saveCloudSettings(uid: string, settings: AppSettings): Promise<void> {
  const path = `users/${uid}/settings/preferences`;
  const ref = doc(db, 'users', uid, 'settings', 'preferences');
  try {
    const snap = await getDoc(ref);
    const payload = {
      userName: settings.userName.slice(0, 40),
      monthlyLimit:
        settings.monthlyLimit && settings.monthlyLimit > 0
          ? clampAmount(settings.monthlyLimit)
          : null,
      theme: settings.theme,
      updatedAt: serverTimestamp(),
    };
    if (snap.exists()) {
      await updateDoc(ref, payload);
    } else {
      await setDoc(ref, {
        ownerId: uid,
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function migrateLocalStoreToCloud(
  uid: string,
  localStore: FindiDataStore
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await ensureUserAccountInitialized(uid);
    const batch = writeBatch(db);

    for (const cat of localStore.categories) {
      if (cat.isCustom) {
        batch.set(doc(db, 'users', uid, 'categories', cat.id), {
          id: cat.id,
          ownerId: uid,
          name: cat.name.slice(0, 32),
          icon: cat.icon.slice(0, 24),
          color: cat.color,
          isCustom: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }

    for (const tx of localStore.transactions) {
      batch.set(doc(db, 'users', uid, 'transactions', tx.id), {
        id: tx.id,
        ownerId: uid,
        type: tx.type,
        amount: clampAmount(tx.amount),
        date: tx.date,
        categoryId: tx.categoryId,
        note: tx.note.slice(0, 120),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const goal of localStore.goals) {
      batch.set(doc(db, 'users', uid, 'goals', goal.id), {
        id: goal.id,
        ownerId: uid,
        name: goal.name.slice(0, 60),
        targetAmount: clampAmount(goal.targetAmount),
        savedAmount: Math.min(1000000, Math.max(0, Math.round(goal.savedAmount * 100) / 100)),
        deadline: goal.deadline,
        isPrimary: goal.isPrimary,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    if (localStore.settings.userName || localStore.settings.monthlyLimit) {
      batch.update(doc(db, 'users', uid, 'settings', 'preferences'), {
        userName: localStore.settings.userName.slice(0, 40),
        monthlyLimit: localStore.settings.monthlyLimit
          ? clampAmount(localStore.settings.monthlyLimit)
          : null,
        theme: localStore.settings.theme,
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteAllCloudUserData(uid: string): Promise<void> {
  const path = `users/${uid}`;
  try {
    const batch = writeBatch(db);
    const [txSnap, catSnap, goalSnap] = await Promise.all([
      getDocs(query(collection(db, 'users', uid, 'transactions'), where('ownerId', '==', uid))),
      getDocs(query(collection(db, 'users', uid, 'categories'), where('ownerId', '==', uid))),
      getDocs(query(collection(db, 'users', uid, 'goals'), where('ownerId', '==', uid))),
    ]);

    for (const d of txSnap.docs) batch.delete(d.ref);
    for (const d of catSnap.docs) {
      if (d.data().isCustom) batch.delete(d.ref);
    }
    for (const d of goalSnap.docs) batch.delete(d.ref);

    batch.update(doc(db, 'users', uid, 'settings', 'preferences'), {
      userName: '',
      monthlyLimit: null,
      theme: 'dark',
      updatedAt: serverTimestamp(),
    });

    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}
