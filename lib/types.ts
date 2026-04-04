export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export type MonthKey =
  | '2024-10' | '2024-11' | '2024-12'
  | '2025-01' | '2025-02' | '2025-03' | '2025-04' | '2025-05'
  | '2025-06' | '2025-07' | '2025-08' | '2025-09';

export type TimingPart = 'early' | 'mid' | 'late' | 'all';

export interface TaskTiming {
  month: string;      // 例: '2025-03'
  part: TimingPart;  // 上旬 / 中旬 / 下旬 / 月内
}

export const CATEGORIES = [
  '年次計画・運営管理',
  '訓練デザイン',
  '説明会・反省会運用',
  '傷病者・模擬患者関連',
  '資機材準備・管理',
  '書類関係準備',
  '訓練会場設営・運営',
] as const;

export type Category = typeof CATEGORIES[number];

export const CATEGORY_COLORS: Record<Category, { bar: string; bg: string; text: string }> = {
  '年次計画・運営管理':   { bar: '#3b82f6', bg: '#eff6ff', text: '#1e40af' },
  '訓練デザイン':         { bar: '#8b5cf6', bg: '#f5f3ff', text: '#5b21b6' },
  '説明会・反省会運用':   { bar: '#06b6d4', bg: '#ecfeff', text: '#0e7490' },
  '傷病者・模擬患者関連': { bar: '#f59e0b', bg: '#fef3c7', text: '#92400e' },
  '資機材準備・管理':     { bar: '#10b981', bg: '#d1fae5', text: '#065f46' },
  '書類関係準備':         { bar: '#f97316', bg: '#fff7ed', text: '#9a3412' },
  '訓練会場設営・運営':   { bar: '#ec4899', bg: '#fdf2f8', text: '#831843' },
};

export interface TrainingTask {
  id: string;
  name: string;
  category: Category | '';
  startTiming: TaskTiming;
  endTiming: TaskTiming;
  /** 後方互換のため残す */
  dueMonth: string;
  status: TaskStatus;
  owner: string;
  responsible: string;
  progress: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyData {
  month: string;
  tasks: TrainingTask[];
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
}

export interface GanttData {
  taskName: string;
  startMonth: string;
  endMonth: string;
  status: string;
  progress: number;
}
