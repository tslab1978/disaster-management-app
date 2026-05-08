// ─── ステータス ───────────────────────────────────────────
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

// ─── タスクタイプ ─────────────────────────────────────────
export type TaskType = 'relative' | 'fixed';

// ─── カテゴリ ─────────────────────────────────────────────
export const CATEGORIES = [
  '年次計画・運営管理',
  '訓練デザイン',
  '説明会・反省会運用',
  '傷病者・模擬患者関連',
  '資機材準備・管理',
  '書類関係準備',
  'マニュアル改定',
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
  'マニュアル改定':       { bar: '#f43f5e', bg: '#fff1f2', text: '#be123c' },
  '訓練会場設営・運営':   { bar: '#ec4899', bg: '#fdf2f8', text: '#831843' },
};

// ─── タスク（v3）─────────────────────────────────────────
export interface TrainingTask {
  id: string;
  name: string;
  category: Category | '';
  taskType: TaskType;       // 'relative'=訓練日起算, 'fixed'=固定月

  // taskType === 'relative'
  monthsBefore: number;     // 訓練の何ヶ月前から開始（例：3）
  durationMonths: number;   // 何ヶ月間（例：2）

  // taskType === 'fixed'
  fixedStartMonth: string;  // 'YYYY-MM'
  fixedEndMonth: string;    // 'YYYY-MM'

  // 旬（上旬/中旬/下旬）
  startPart: 'early' | 'mid' | 'late';  // 開始：上旬・中旬・下旬
  endPart:   'early' | 'mid' | 'late';  // 終了：上旬・中旬・下旬

  owner: string;
  responsible: string;
  notes: string;
  status: TaskStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}
