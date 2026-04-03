import { TrainingTask, MonthlyData } from './types';

const STORAGE_KEY = 'training_tasks';

export const trainingStorage = {
  // タスク一覧を取得
  getTasks: (): TrainingTask[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  // タスクを追加
  addTask: (task: TrainingTask): void => {
    if (typeof window === 'undefined') return;
    const tasks = trainingStorage.getTasks();
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...tasks, task]));
  },

  // タスクを更新
  updateTask: (id: string, updates: Partial<TrainingTask>): void => {
    if (typeof window === 'undefined') return;
    const tasks = trainingStorage.getTasks();
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  },

  // タスクを削除
  deleteTask: (id: string): void => {
    if (typeof window === 'undefined') return;
    const tasks = trainingStorage.getTasks();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.filter((t) => t.id !== id)));
  },

  // 月別データを取得
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

  // 全タスクをエクスポート（レポート用）
  exportTasks: (): string => {
    const tasks = trainingStorage.getTasks();
    return JSON.stringify(tasks, null, 2);
  },

  // タスクをインポート
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

  // タスク順序を更新（ドラッグ&ドロップ用）
  reorderTasks: (taskIds: string[]): void => {
    if (typeof window === 'undefined') return;
    const tasks = trainingStorage.getTasks();
    const taskMap = new Map(tasks.map((t) => [t.id, t]));
    const reordered = taskIds.map((id) => taskMap.get(id)!).filter(Boolean);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));
  },

  // ストレージをクリア（テスト用）
  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};
