export interface TrainingTask {
  id: string;
  name: string;
  dueMonth: string;
  status: 'pending' | 'in_progress' | 'completed';
  owner: string;
  responsible: string;
  createdAt: string;
  updatedAt: string;
  category?: string;
  progress?: number;
  notes?: string;
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
