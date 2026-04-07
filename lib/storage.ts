import { TrainingTask, MonthlyData } from './types';

const STORAGE_KEY = 'training_tasks_v2';
const LOG_KEY = 'committee_logs';

// ─── ログ型 ───────────────────────────────────────────────
export type CommitteeLog = {
  id: string;
  timestamp: string;
  category: string;
  action: string;
  taskId: string;
  taskName: string;
};

// ─── ログ追加関数 ─────────────────────────────────────────
export const addLog = (
  category: string,
  action: string,
  taskId: string,
  taskName: string
): void => {
  if (typeof window === 'undefined') return;
  const logs: CommitteeLog[] = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
  const newLog: CommitteeLog = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    category,
    action,
    taskId,
    taskName,
  };
  localStorage.setItem(LOG_KEY, JSON.stringify([...logs, newLog]));
};

// ─── ログ取得関数 ─────────────────────────────────────────
export const getLogs = (): CommitteeLog[] => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
};

export const trainingStorage = {
  getTasks: (): TrainingTask[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  addTask: (task: TrainingTask): void => {
    if (typeof window === 'undefined') return;
    const tasks = trainingStorage.getTasks();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...tasks, task]));
  },
  updateTask: (id: string, updates: Partial<TrainingTask>): void => {
    if (typeof window === 'undefined') return;
    const tasks = trainingStorage.getTasks();
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },
  deleteTask: (id: string): void => {
    if (typeof window === 'undefined') return;
    const tasks = trainingStorage.getTasks();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.filter((t) => t.id !== id)));
  },
  getMonthlyData: (month: string): MonthlyData => {
    const tasks = trainingStorage.getTasks().filter((t) => t.dueMonth === month);
    return {
      month,
      tasks,
      summary: {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        inProgress: tasks.filter((t) => t.status === 'in_progress').length,
        pending: tasks.filter((t) => t.status === 'pending').length,
      },
    };
  },
  exportTasks: (): string => {
    return JSON.stringify(trainingStorage.getTasks(), null, 2);
  },
  importTasks: (jsonData: string): boolean => {
    try {
      const tasks = JSON.parse(jsonData);
      if (Array.isArray(tasks)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};
