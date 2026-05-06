import { TrainingTask } from './types';

const STORAGE_KEY = 'training_tasks_v3';
const LOG_KEY = 'committee_logs';
const TRAINING_DATE_KEY = 'training_date';

export const TRAINING_DATE_DEFAULT = '2025-11';

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

// ─── 訓練月（YYYY-MM）────────────────────────────────────
export const getTrainingMonth = (): string => {
  if (typeof window === 'undefined') return TRAINING_DATE_DEFAULT;
  return localStorage.getItem(TRAINING_DATE_KEY) ?? TRAINING_DATE_DEFAULT;
};

export const setTrainingMonth = (month: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TRAINING_DATE_KEY, month);
};

// ─── タスクストレージ（v3）───────────────────────────────
export const trainingStorage = {
  getAll: (): TrainingTask[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },
  save: (tasks: TrainingTask[]): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  },
  add: (task: TrainingTask): void => {
    if (typeof window === 'undefined') return;
    const tasks = trainingStorage.getAll();
    trainingStorage.save([...tasks, task]);
  },
  update: (id: string, updates: Partial<TrainingTask>): void => {
    if (typeof window === 'undefined') return;
    const tasks = trainingStorage.getAll();
    trainingStorage.save(
      tasks.map((t) => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)
    );
  },
  remove: (id: string): void => {
    if (typeof window === 'undefined') return;
    const tasks = trainingStorage.getAll();
    trainingStorage.save(tasks.filter((t) => t.id !== id));
  },
};
