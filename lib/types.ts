// 訓練タスクの型定義
export interface TrainingTask {
  id: string;
  name: string;
  dueMonth: string; // "2024-10" 形式
  status: 'pending' | 'in_progress' | 'completed';
  owner: string; // 担当者
  responsible: string; // 責任者
  createdAt: string;
  updatedAt: string;
  category?: string; // 企画・運営統括、訓練デザイン等
  progress?: number; // 0-100
  notes?: string; // メモ
}

// 月別データ
export interface MonthlyData {
  month: string; // "2024-10"
  tasks: TrainingTask[];
  summary: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
  };
}

// ガントチャート用データ
export interface GanttData {
  taskName: string;
  startMonth: string;
  endMonth: string;
  status: string;
  progress: number;
}
