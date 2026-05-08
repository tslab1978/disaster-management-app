'use client';

import { useEffect, useState, useRef } from 'react';
import { trainingStorage, addLog, getTrainingMonth, setTrainingMonth } from '@/lib/storage';
import { TrainingTask, TaskType, CATEGORIES, CATEGORY_COLORS, Category } from '@/lib/types';

// ─── ガント月リスト生成（13ヶ月）────────────────────────────
// 訓練月YYYY-MM → 表示開始:(YYYY-1)年(MM+1)月 〜 表示終了:YYYY年(MM+1)月
function getGanttMonths(trainingMonth: string): string[] {
  const [y, m] = trainingMonth.split('-').map(Number);
  const months: string[] = [];
  let startYear = y - 1;
  let startMonth = m + 1;
  if (startMonth > 12) { startMonth -= 12; startYear += 1; }
  for (let i = 0; i < 13; i++) {
    let mo = startMonth + i;
    let yr = startYear;
    while (mo > 12) { mo -= 12; yr += 1; }
    months.push(`${yr}-${String(mo).padStart(2, '0')}`);
  }
  return months;
}

// ─── 旬 ──────────────────────────────────────────────────────
type TaskPart = 'early' | 'mid' | 'late';
const PART_LABEL: Record<TaskPart, string> = { early: '上旬', mid: '中旬', late: '下旬' };
const PARTS: TaskPart[] = ['early', 'mid', 'late'];
const PART_OFFSET: Record<TaskPart, number> = { early: 0, mid: 1, late: 2 };

// ─── タスクのstart/end月・旬を返す ──────────────────────────
type ResolvedMonths = { start: string; end: string; startPart: TaskPart; endPart: TaskPart };
function resolveTaskMonths(task: TrainingTask, trainingMonth: string): ResolvedMonths {
  const startPart: TaskPart = task.startPart ?? 'early';
  const endPart:   TaskPart = task.endPart   ?? 'early';
  if (task.taskType === 'fixed') {
    return { start: task.fixedStartMonth, end: task.fixedEndMonth, startPart, endPart };
  }
  const [y, m] = trainingMonth.split('-').map(Number);
  let startMo = m - task.monthsBefore;
  let startYr = y;
  while (startMo <= 0)  { startMo += 12; startYr -= 1; }
  while (startMo > 12)  { startMo -= 12; startYr += 1; }
  let endMo = startMo + task.durationMonths - 1;
  let endYr = startYr;
  while (endMo > 12) { endMo -= 12; endYr += 1; }
  return {
    start: `${startYr}-${String(startMo).padStart(2, '0')}`,
    end:   `${endYr}-${String(endMo).padStart(2, '0')}`,
    startPart, endPart,
  };
}

function monthLabel(ym: string): string {
  if (!ym) return '';
  return `${parseInt(ym.split('-')[1], 10)}月`;
}

// ─── 定数 ────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:     { label: '未着手', color: '#64748b', bg: '#f1f5f9' },
  in_progress: { label: '進行中', color: '#d97706', bg: '#fef3c7' },
  completed:   { label: '完了',   color: '#16a34a', bg: '#dcfce7' },
};

// ─── フォーム状態型 ───────────────────────────────────────────
type FormState = {
  name: string;
  category: Category | '';
  taskType: TaskType;
  monthsBefore: number;
  durationMonths: number;
  fixedStartMonth: string;
  fixedEndMonth: string;
  startPart: TaskPart;
  endPart: TaskPart;
  owner: string;
  responsible: string;
  notes: string;
  status: TrainingTask['status'];
  progress: number;
};

function emptyForm(ganttMonths: string[] = [], trainingMonth = ''): FormState {
  return {
    name: '',
    category: '' as Category | '',
    taskType: 'relative',
    monthsBefore: 3,
    durationMonths: 2,
    fixedStartMonth: ganttMonths[2] ?? trainingMonth,
    fixedEndMonth:   ganttMonths[4] ?? trainingMonth,
    startPart: 'early',
    endPart: 'early',
    owner: '',
    responsible: '',
    notes: '',
    status: 'pending',
    progress: 0,
  };
}

// ─── インライン編集状態型 ─────────────────────────────────────
type InlineEditState = {
  taskId: string;
  field: 'owner' | 'responsible';
  value: string;
};

// ─── メインコンポーネント ─────────────────────────────────────
export default function TrainingPage() {
  const [trainingMonthState, setTrainingMonthState] = useState('2025-11');
  const [tasks, setTasks]             = useState<TrainingTask[]>([]);
  const [ganttMonths, setGanttMonths] = useState<string[]>([]);
  const [showForm, setShowForm]       = useState(false);
  const [editId, setEditId]           = useState<string | null>(null);
  const [form, setForm]               = useState<FormState>(() => emptyForm());
  const [view, setView]               = useState<'gantt' | 'list'>('gantt');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [inlineEdit, setInlineEdit]   = useState<InlineEditState | null>(null);
  const leftBodyRef  = useRef<HTMLDivElement>(null);
  const rightBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tm = getTrainingMonth();
    setTrainingMonthState(tm);
    const months = getGanttMonths(tm);
    setGanttMonths(months);
    setTasks(trainingStorage.getAll());
    setForm(emptyForm(months, tm));
  }, []);

  // ─── 現在月
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // ─── 訓練日変更
  const handleTrainingMonthChange = (newMonth: string) => {
    setTrainingMonthState(newMonth);
    setTrainingMonth(newMonth);
    const newMonths = getGanttMonths(newMonth);
    setGanttMonths(newMonths);
  };

  const isOverdue = (t: TrainingTask): boolean => {
    const { end } = resolveTaskMonths(t, trainingMonthState);
    return end < currentMonth && t.status !== 'completed';
  };

  // ─── フォームプレビュー
  const formPreview = (() => {
    if (form.taskType === 'fixed') {
      return { start: form.fixedStartMonth, end: form.fixedEndMonth, startPart: form.startPart, endPart: form.endPart };
    }
    const [y, m] = trainingMonthState.split('-').map(Number);
    let startMo = m - form.monthsBefore;
    let startYr = y;
    while (startMo <= 0)  { startMo += 12; startYr -= 1; }
    while (startMo > 12)  { startMo -= 12; startYr += 1; }
    let endMo = startMo + form.durationMonths - 1;
    let endYr = startYr;
    while (endMo > 12) { endMo -= 12; endYr += 1; }
    return {
      start: `${startYr}-${String(startMo).padStart(2, '0')}`,
      end:   `${endYr}-${String(endMo).padStart(2, '0')}`,
      startPart: form.startPart,
      endPart:   form.endPart,
    };
  })();

  // ─── フォーム送信
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    const ts = new Date().toISOString();
    const updates: Partial<TrainingTask> = {
      name: form.name, category: form.category,
      taskType: form.taskType,
      monthsBefore: form.monthsBefore, durationMonths: form.durationMonths,
      fixedStartMonth: form.fixedStartMonth, fixedEndMonth: form.fixedEndMonth,
      startPart: form.startPart, endPart: form.endPart,
      owner: form.owner, responsible: form.responsible,
      notes: form.notes, status: form.status, progress: form.progress,
      updatedAt: ts,
    };
    if (editId) {
      trainingStorage.update(editId, updates);
      setTasks((prev) => prev.map((t) => t.id === editId ? { ...t, ...updates } : t));
      setEditId(null);
    } else {
      const newTask: TrainingTask = {
        id: Date.now().toString(),
        name: form.name, category: form.category,
        taskType: form.taskType,
        monthsBefore: form.monthsBefore, durationMonths: form.durationMonths,
        fixedStartMonth: form.fixedStartMonth, fixedEndMonth: form.fixedEndMonth,
        startPart: form.startPart, endPart: form.endPart,
        owner: form.owner, responsible: form.responsible,
        notes: form.notes, status: form.status, progress: form.progress,
        createdAt: ts, updatedAt: ts,
      };
      trainingStorage.add(newTask);
      setTasks((prev) => [...prev, newTask]);
    }
    setForm(emptyForm(ganttMonths, trainingMonthState));
    setShowForm(false);
  };

  const openEdit = (task: TrainingTask) => {
    setForm({
      name: task.name, category: task.category,
      taskType: task.taskType,
      monthsBefore: task.monthsBefore, durationMonths: task.durationMonths,
      fixedStartMonth: task.fixedStartMonth, fixedEndMonth: task.fixedEndMonth,
      startPart: task.startPart ?? 'early', endPart: task.endPart ?? 'early',
      owner: task.owner, responsible: task.responsible,
      notes: task.notes ?? '', status: task.status, progress: task.progress ?? 0,
    });
    setEditId(task.id);
    setShowForm(true);
    setSelectedTask(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm(ganttMonths, trainingMonthState));
  };

  const updateStatus = (id: string, status: TrainingTask['status']) => {
    trainingStorage.update(id, { status });
    const task = tasks.find((t) => t.id === id);
    if (task) addLog('training', status, id, task.name);
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  };

  const updateProgress = (id: string, progress: number) => {
    trainingStorage.update(id, { progress });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, progress } : t));
  };

  const deleteTask = (id: string) => {
    if (!window.confirm('このタスクを削除しますか？')) return;
    trainingStorage.remove(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTask === id) setSelectedTask(null);
  };

  // ─── JSONエクスポート
  const handleExport = () => {
    const allTasks = trainingStorage.getAll();
    const tm = getTrainingMonth();
    const data = { exportedAt: new Date().toISOString(), trainingMonth: tm, tasks: allTasks };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── インライン編集
  const saveInlineEdit = () => {
    if (!inlineEdit) return;
    const { taskId, field, value } = inlineEdit;
    trainingStorage.update(taskId, { [field]: value });
    setTasks((prev) => prev.map((t) =>
      t.id === taskId ? { ...t, [field]: value, updatedAt: new Date().toISOString() } : t
    ));
    setInlineEdit(null);
  };

  // ─── フィルタリング・ソート
  const DIVISIONS = ['訓練班', '勉強会班', '物品班', 'マニュアル班', 'その他'];
  const knownDivisions = ['訓練班', '勉強会班', '物品班', 'マニュアル班'];
  const filteredTasks = tasks.filter((t) => {
    if (selectedDivision === 'その他') {
      if (knownDivisions.includes(t.responsible)) return false;
    } else if (selectedDivision !== 'all') {
      if (t.responsible !== selectedDivision) return false;
    }
    if (hideCompleted && t.status === 'completed') return false;
    return true;
  });
  const sortedTasks = [...filteredTasks].sort((a, b) =>
    resolveTaskMonths(a, trainingMonthState).start.localeCompare(
      resolveTaskMonths(b, trainingMonthState).start
    )
  );

  // ─── サマリー
  const totalCompleted  = tasks.filter((t) => t.status === 'completed').length;
  const totalInProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const totalOverdue    = tasks.filter((t) => isOverdue(t)).length;
  const selectedTaskData = tasks.find((t) => t.id === selectedTask);

  // ─── ガント設定
  const COL_W = 84; // px per month column
  const GANTT_MIN_WIDTH = `${Math.max(780, ganttMonths.length * COL_W)}px`;
  const GANTT_GRID_COLS = `repeat(${ganttMonths.length}, 1fr)`;

  // ─── スクロール同期（左右の縦スクロール）
  const syncingRef = useRef(false);
  const handleLeftScroll = () => {
    if (syncingRef.current || !rightBodyRef.current || !leftBodyRef.current) return;
    syncingRef.current = true;
    rightBodyRef.current.scrollTop = leftBodyRef.current.scrollTop;
    syncingRef.current = false;
  };
  const handleRightScroll = () => {
    if (syncingRef.current || !leftBodyRef.current || !rightBodyRef.current) return;
    syncingRef.current = true;
    leftBodyRef.current.scrollTop = rightBodyRef.current.scrollTop;
    syncingRef.current = false;
  };

  // ─── スタイル定数
  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 11px', fontSize: '13px',
    border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
    fontFamily: 'inherit', color: '#0f172a', backgroundColor: 'white', boxSizing: 'border-box',
  };
  const inlineInp: React.CSSProperties = {
    padding: '3px 7px', fontSize: '12px',
    border: '1px solid #bfdbfe', borderRadius: '6px', outline: 'none',
    fontFamily: 'inherit', color: '#0f172a', backgroundColor: 'white',
  };
  const numInp: React.CSSProperties = {
    width: '64px', padding: '7px 9px', fontSize: '13px',
    border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
    fontFamily: 'inherit', color: '#0f172a', backgroundColor: 'white',
    textAlign: 'center', boxSizing: 'border-box',
  };
  const partSel: React.CSSProperties = {
    padding: '5px 8px', borderRadius: '6px', border: '1px solid #e2e8f0',
    fontSize: '13px', color: '#0f172a', backgroundColor: 'white',
    fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
  };

  // ─── ガントバー位置計算（旬単位）
  const calcBar = (task: TrainingTask) => {
    const { start, end, startPart, endPart } = resolveTaskMonths(task, trainingMonthState);
    const si = ganttMonths.indexOf(start);
    const ei = ganttMonths.indexOf(end);
    const showBar = !(si === -1 && ei === -1);
    const startIdx = si === -1 ? 0 : si;
    const endIdx   = ei === -1 ? ganttMonths.length - 1 : ei;
    const total      = ganttMonths.length * 3;
    const startCell  = startIdx * 3 + PART_OFFSET[startPart];
    const endCell    = endIdx   * 3 + PART_OFFSET[endPart];
    const leftPct    = (startCell / total) * 100;
    const widthPct   = (Math.max(1, endCell - startCell + 1) / total) * 100;
    return { showBar, leftPct, widthPct, si, ei };
  };

  return (
    <main style={{
      ...(view === 'gantt'
        ? { height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }
        : { minHeight: 'calc(100vh - 56px)' }),
      backgroundColor: '#f8fafc',
      fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif",
    }}>
      <div style={{
        maxWidth: '1400px', margin: '0 auto', width: '100%',
        padding: view === 'gantt' ? '1rem 1.5rem 0' : '1.5rem 1.5rem',
        ...(view === 'gantt' ? { flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 } : {}),
      }}>

        {/* ── ヘッダーエリア（固定）── */}
        <div style={{ ...(view === 'gantt' ? { flexShrink: 0 } : {}) }}>

          {/* ── ヘッダー行：タイトル + サマリーカード4枚 + ボタン ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {/* タイトルブロック */}
            <div style={{ flex: 1, minWidth: '180px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 2px' }}>
                Training Division
              </p>
              <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                訓練班 — 年間タスク管理
              </h1>
            </div>

            {/* サマリーカード（コンパクト）*/}
            {[
              { label: '全タスク',  value: tasks.length,    color: '#0f172a', warn: false },
              { label: '完了',      value: totalCompleted,  color: '#16a34a', warn: false },
              { label: '進行中',    value: totalInProgress, color: '#d97706', warn: false },
              { label: '期限超過',  value: totalOverdue,    color: '#ef4444', warn: totalOverdue > 0 },
            ].map((s) => (
              <div key={s.label} style={{
                padding: '6px 14px', borderRadius: '8px',
                border: s.warn ? '1px solid #fecaca' : '1px solid #e2e8f0',
                backgroundColor: 'white', textAlign: 'center', flexShrink: 0,
              }}>
                <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', margin: '0 0 1px' }}>{s.label}</p>
                <p style={{ fontSize: '20px', fontWeight: '700', color: s.color, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}

            {/* JSONバックアップボタン */}
            <button onClick={handleExport} style={{
              padding: '9px 16px', borderRadius: '9px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', color: '#64748b', fontSize: '13px', cursor: 'pointer', flexShrink: 0,
            }}>
              JSONバックアップ
            </button>

            {/* 新規タスクボタン */}
            <button onClick={() => showForm ? cancelForm() : setShowForm(true)} style={{
              padding: '9px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              backgroundColor: showForm ? '#f1f5f9' : '#1d6fd4',
              color: showForm ? '#475569' : 'white',
              fontSize: '13px', fontWeight: '600', transition: 'all 0.15s', flexShrink: 0,
            }}>
              {showForm ? 'キャンセル' : '+ 新規タスク'}
            </button>
          </div>

          {/* ── 訓練日設定 ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', fontSize: '12px', color: '#64748b' }}>
            <span style={{ fontWeight: '600' }}>訓練日：</span>
            <input
              type="month"
              value={trainingMonthState}
              onChange={(e) => e.target.value && handleTrainingMonthChange(e.target.value)}
              style={{
                padding: '4px 8px', fontSize: '12px', border: '1px solid #e2e8f0',
                borderRadius: '6px', outline: 'none', fontFamily: 'inherit',
                color: '#0f172a', backgroundColor: 'white', cursor: 'pointer',
              }}
            />
            <span style={{ color: '#94a3b8' }}>（変更すると全タスクが自動再配置）</span>
            <span style={{ color: '#94a3b8' }}>　表示範囲：{ganttMonths[0]} 〜 {ganttMonths[ganttMonths.length - 1]}</span>
          </div>

          {/* ── フォーム ── */}
          {showForm && (
            <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.25rem 1.5rem', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1rem' }}>
                {editId ? '編集' : '新規タスク登録'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '0.75rem' }}>
                  {/* カテゴリ */}
                  <div>
                    <label style={labelS}>カテゴリ *</label>
                    <select style={inp} value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value as Category | '' })} required>
                      <option value="">— 選択してください —</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  {/* タスク名 */}
                  <div>
                    <label style={labelS}>タスク名 *</label>
                    <input style={inp} type="text" placeholder="例：企画案作成、部門調整など"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                </div>

                {/* スケジュール種別 */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={labelS}>スケジュール種別</label>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {(['relative', 'fixed'] as const).map((t) => (
                      <label key={t} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#0f172a' }}>
                        <input type="radio" name="taskType" value={t} checked={form.taskType === t}
                          onChange={() => setForm({ ...form, taskType: t })} style={{ accentColor: '#1d6fd4' }} />
                        {t === 'relative' ? '訓練日起算（デフォルト）' : '固定月指定'}
                      </label>
                    ))}
                    {/* プレビュー */}
                    <span style={{ fontSize: '12px', color: '#1d6fd4', fontWeight: '600', marginLeft: '4px' }}>
                      → {formPreview.start}{PART_LABEL[formPreview.startPart]} 〜 {formPreview.end}{PART_LABEL[formPreview.endPart]}
                    </span>
                  </div>
                </div>

                {/* 相対 / 固定 フィールド */}
                {form.taskType === 'relative' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>訓練の</span>
                    <input type="number" min="-6" max="24" style={numInp}
                      value={form.monthsBefore}
                      onChange={(e) => setForm({ ...form, monthsBefore: Math.max(-6, parseInt(e.target.value) || 0) })} />
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      {form.monthsBefore < 0 ? 'ヶ月後' : 'ヶ月前'}
                    </span>
                    <select value={form.startPart} onChange={(e) => setForm({ ...form, startPart: e.target.value as TaskPart })}
                      style={partSel}>
                      {PARTS.map((p) => <option key={p} value={p}>{PART_LABEL[p]}</option>)}
                    </select>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>から</span>
                    <input type="number" min="1" max="24" style={numInp}
                      value={form.durationMonths}
                      onChange={(e) => setForm({ ...form, durationMonths: Math.max(1, parseInt(e.target.value) || 1) })} />
                    <span style={{ fontSize: '13px', color: '#64748b' }}>ヶ月</span>
                    <select value={form.endPart} onChange={(e) => setForm({ ...form, endPart: e.target.value as TaskPart })}
                      style={partSel}>
                      {PARTS.map((p) => <option key={p} value={p}>{PART_LABEL[p]}</option>)}
                    </select>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>まで</span>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={labelS}>開始月・旬</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input type="month" style={{ ...inp, flex: 1 }} value={form.fixedStartMonth}
                          onChange={(e) => setForm({ ...form, fixedStartMonth: e.target.value })} />
                        <select value={form.startPart} onChange={(e) => setForm({ ...form, startPart: e.target.value as TaskPart })}
                          style={{ ...partSel, flexShrink: 0 }}>
                          {PARTS.map((p) => <option key={p} value={p}>{PART_LABEL[p]}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={labelS}>終了月・旬</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input type="month" style={{ ...inp, flex: 1 }} value={form.fixedEndMonth}
                          onChange={(e) => setForm({ ...form, fixedEndMonth: e.target.value })} />
                        <select value={form.endPart} onChange={(e) => setForm({ ...form, endPart: e.target.value as TaskPart })}
                          style={{ ...partSel, flexShrink: 0 }}>
                          {PARTS.map((p) => <option key={p} value={p}>{PART_LABEL[p]}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '0.75rem' }}>
                  <div>
                    <label style={labelS}>担当者</label>
                    <input style={inp} type="text" placeholder="例：田中太郎"
                      value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                  </div>
                  <div>
                    <label style={labelS}>担当班</label>
                    <input style={inp} type="text" placeholder="例：訓練班"
                      value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
                  </div>
                </div>

                {editId && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '0.75rem' }}>
                    <div>
                      <label style={labelS}>状態</label>
                      <select style={inp} value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as TrainingTask['status'] })}>
                        <option value="pending">未着手</option>
                        <option value="in_progress">進行中</option>
                        <option value="completed">完了</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelS}>進捗 {form.progress}%</label>
                      <input type="range" min="0" max="100" step="1" value={form.progress}
                        onChange={(e) => setForm({ ...form, progress: parseInt(e.target.value) })}
                        style={{ width: '100%', marginTop: '10px', accentColor: '#1d6fd4' }} />
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '1rem' }}>
                  <label style={labelS}>メモ</label>
                  <textarea style={{ ...inp, minHeight: '60px', resize: 'vertical', lineHeight: '1.6' }}
                    placeholder="補足事項・注意点など"
                    value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" style={{ padding: '9px 16px', borderRadius: '9px', border: 'none', backgroundColor: '#1d6fd4', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    {editId ? '更新する' : '登録する'}
                  </button>
                  <button type="button" onClick={cancelForm} style={{ padding: '9px 16px', borderRadius: '9px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── ビュー切替 + フィルター ── */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {(['gantt', 'list'] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: '7px 14px', borderRadius: '8px', border: '1px solid',
                borderColor: view === v ? '#bfdbfe' : '#e2e8f0',
                backgroundColor: view === v ? '#eff6ff' : 'white',
                color: view === v ? '#1d6fd4' : '#64748b',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}>
                {v === 'gantt' ? 'ガントチャート' : 'リスト'}
              </button>
            ))}
            <div style={{ width: '1px', height: '18px', backgroundColor: '#e2e8f0', margin: '0 4px' }} />
            <button onClick={() => setHideCompleted((v) => !v)} style={{
              padding: '7px 14px', borderRadius: '8px', border: '1px solid',
              borderColor: hideCompleted ? '#fde68a' : '#e2e8f0',
              backgroundColor: hideCompleted ? '#fefce8' : 'white',
              color: hideCompleted ? '#92400e' : '#64748b',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer',
            }}>
              {hideCompleted ? '完了を非表示中' : '完了を非表示'}
            </button>
          </div>

        </div>{/* ── ヘッダーエリア終わり ── */}

        {/* ── コンテンツエリア ── */}

        {/* ─────────────────── ガントチャート ─────────────────── */}
        {view === 'gantt' && (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '0.5rem' }}>

            {/* ガント本体 */}
            <div style={{ flex: 1, minHeight: 0, backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

              {/* 凡例 + 担当班フィルター */}
              <div style={{ flexShrink: 0, padding: '5px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>カテゴリ：</span>
                {CATEGORIES.map((c) => {
                  const col = CATEGORY_COLORS[c];
                  return (
                    <span key={c} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: col.text }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: col.bar, flexShrink: 0 }} />
                      {c}
                    </span>
                  );
                })}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>担当班：</span>
                  <select
                    value={selectedDivision}
                    onChange={(e) => setSelectedDivision(e.target.value)}
                    style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#0f172a', backgroundColor: 'white', cursor: 'pointer' }}
                  >
                    <option value="all">すべて</option>
                    {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {sortedTasks.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                  タスクがありません。「+ 新規タスク」から追加してください。
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

                  {/* 左列：タスク名（200px固定）*/}
                  <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0' }}>
                    {/* ヘッダースペーサー（右列のheaderと高さ揃え：月行22px + 旬行16px = 38px）*/}
                    <div style={{ flexShrink: 0, height: '38px', backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', padding: '0 10px', boxSizing: 'border-box' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8' }}>タスク名</span>
                    </div>
                    {/* タスク名リスト（スクロール）*/}
                    <div ref={leftBodyRef} onScroll={handleLeftScroll} style={{ flex: 1, overflowY: 'auto' }}>
                      {sortedTasks.map((task, idx) => {
                        const isSelected = selectedTask === task.id;
                        const over = isOverdue(task);
                        const isCompleted = task.status === 'completed';
                        const rowBg = isSelected ? '#f0f9ff' : over ? '#fff7f7' : (idx % 2 === 0 ? 'white' : '#fafafa');
                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(isSelected ? null : task.id)}
                            style={{ height: '34px', padding: '0 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1px', overflow: 'hidden', cursor: 'pointer', backgroundColor: rowBg, borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.1s' }}
                          >
                            <span style={{ fontSize: '11px', fontWeight: '600', color: isSelected ? '#1d6fd4' : isCompleted ? '#94a3b8' : '#0f172a', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {task.name}
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {task.owner && <span style={{ fontSize: '9px', color: '#94a3b8', lineHeight: 1 }}>{task.owner}</span>}
                              {over && <span style={{ fontSize: '9px', fontWeight: '700', color: '#ef4444', lineHeight: 1 }}>超過</span>}
                              {task.taskType === 'fixed' && <span style={{ fontSize: '9px', color: '#8b5cf6', lineHeight: 1 }}>固定</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 右列：バーエリア（縦横スクロール）*/}
                  <div ref={rightBodyRef} onScroll={handleRightScroll} style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', minWidth: 0 }}>
                    <div style={{ minWidth: GANTT_MIN_WIDTH }}>

                      {/* 月ヘッダー（sticky）*/}
                      <div style={{ position: 'sticky', top: 0, zIndex: 2, backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        {/* 月ラベル行 */}
                        <div style={{ display: 'grid', gridTemplateColumns: GANTT_GRID_COLS }}>
                          {ganttMonths.map((m) => {
                            const isTm = m === trainingMonthState;
                            const isCurrent = m === currentMonth;
                            return (
                              <div key={m} style={{
                                padding: '3px 2px', fontSize: '10px', fontWeight: isCurrent ? '700' : '600',
                                color: isTm ? '#dc2626' : isCurrent ? '#1d6fd4' : '#475569',
                                textAlign: 'center', borderRight: '1px solid #e2e8f0',
                                borderTop: isTm ? '2px solid #dc2626' : isCurrent ? '2px solid #1d6fd4' : '2px solid transparent',
                                backgroundColor: isTm ? '#fff1f2' : isCurrent ? '#eff6ff' : undefined,
                                boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px',
                              }}>
                                {monthLabel(m)}
                                {isTm && <span style={{ fontSize: '7px', backgroundColor: '#dc2626', color: 'white', borderRadius: '2px', padding: '0 2px', lineHeight: '12px' }}>訓練</span>}
                              </div>
                            );
                          })}
                        </div>
                        {/* 旬サブラベル行 */}
                        <div style={{ display: 'grid', gridTemplateColumns: GANTT_GRID_COLS }}>
                          {ganttMonths.map((m) => (
                            <div key={m} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderRight: '1px solid #e2e8f0', backgroundColor: m === currentMonth ? '#eff6ff' : m === trainingMonthState ? '#fff1f2' : undefined }}>
                              {['上', '中', '下'].map((p, pi) => (
                                <div key={p} style={{ fontSize: '8px', color: '#cbd5e1', textAlign: 'center', padding: '1px 0', borderRight: pi < 2 ? '1px dotted #e2e8f0' : 'none' }}>{p}</div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* バー行 */}
                      {sortedTasks.map((task, idx) => {
                        const catColor = task.category
                          ? CATEGORY_COLORS[task.category as Category]
                          : { bar: '#94a3b8', bg: '#f1f5f9', text: '#475569' };
                        const { showBar, leftPct, widthPct, si, ei } = calcBar(task);
                        const barColor = task.status === 'completed' ? `${catColor.bar}55` : catColor.bar;
                        const isSelected = selectedTask === task.id;
                        const over = isOverdue(task);
                        const rowBg = isSelected ? '#f0f9ff' : over ? '#fff7f7' : (idx % 2 === 0 ? 'white' : '#fafafa');

                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTask(isSelected ? null : task.id)}
                            style={{ position: 'relative', display: 'grid', gridTemplateColumns: GANTT_GRID_COLS, height: '34px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: rowBg, transition: 'background-color 0.1s' }}
                          >
                            {ganttMonths.map((month) => (
                              <div key={month} style={{
                                position: 'relative', borderRight: '1px solid #e2e8f0', height: '100%',
                                backgroundColor: month === trainingMonthState ? 'rgba(220,38,38,0.04)' : month === currentMonth ? 'rgba(29,111,212,0.04)' : undefined,
                              }}>
                                <div style={{ position: 'absolute', left: '33.3%', top: '15%', bottom: '15%', borderLeft: '1px dotted #f0f4f8' }} />
                                <div style={{ position: 'absolute', left: '66.6%', top: '15%', bottom: '15%', borderLeft: '1px dotted #f0f4f8' }} />
                              </div>
                            ))}
                            {showBar && (
                              <div style={{
                                position: 'absolute', zIndex: 1,
                                top: '50%', transform: 'translateY(-50%)',
                                left: `${leftPct}%`, width: `${widthPct}%`,
                                height: '13px', backgroundColor: barColor,
                                opacity: task.status === 'pending' ? 0.35 : 0.82,
                                borderRadius: `${si !== -1 ? '3px' : '0'} ${ei !== -1 ? '3px' : '0'} ${ei !== -1 ? '3px' : '0'} ${si !== -1 ? '3px' : '0'}`,
                                overflow: 'hidden', minWidth: '4px', pointerEvents: 'none',
                              }}>
                                {task.status === 'in_progress' && task.progress > 0 && (
                                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${task.progress}%`, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* 下段：タスク詳細パネル（選択時のみ）*/}
            {selectedTaskData && (() => {
              const { start, end, startPart, endPart } = resolveTaskMonths(selectedTaskData, trainingMonthState);
              const catCol = selectedTaskData.category ? CATEGORY_COLORS[selectedTaskData.category as Category] : null;
              return (
                <div style={{ flexShrink: 0, height: '180px', backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '0.75rem 1.25rem', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      {catCol && (
                        <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: catCol.bg, color: catCol.text }}>{selectedTaskData.category}</span>
                      )}
                      <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', backgroundColor: selectedTaskData.taskType === 'fixed' ? '#f5f3ff' : '#f0f9ff', color: selectedTaskData.taskType === 'fixed' ? '#5b21b6' : '#0369a1' }}>
                        {selectedTaskData.taskType === 'fixed'
                          ? '固定月'
                          : selectedTaskData.monthsBefore < 0
                            ? `訓練${Math.abs(selectedTaskData.monthsBefore)}M後・${selectedTaskData.durationMonths}M間`
                            : `訓練${selectedTaskData.monthsBefore}M前・${selectedTaskData.durationMonths}M間`}
                      </span>
                      <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{selectedTaskData.name}</h3>
                    </div>
                    <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>✕</button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: '6px', marginBottom: '0.5rem' }}>
                    {[
                      { label: '開始月', value: `${start}${PART_LABEL[startPart]}` },
                      { label: '終了月', value: `${end}${PART_LABEL[endPart]}` },
                      { label: '状態',   value: STATUS_MAP[selectedTaskData.status].label },
                      { label: '担当者', value: selectedTaskData.owner || '—' },
                      { label: '担当班', value: selectedTaskData.responsible || '—' },
                      { label: '進捗',   value: `${selectedTaskData.progress ?? 0}%` },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ backgroundColor: '#f8fafc', borderRadius: '6px', padding: '5px 8px' }}>
                        <p style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '600', margin: '0 0 1px', letterSpacing: '0.04em' }}>{label}</p>
                        <p style={{ fontSize: '11px', color: '#0f172a', fontWeight: '600', margin: 0 }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {(['pending', 'in_progress', 'completed'] as const).map((st) => {
                        const sm = STATUS_MAP[st];
                        const isActive = selectedTaskData.status === st;
                        return (
                          <button key={st} onClick={() => updateStatus(selectedTaskData.id, st)} style={{
                            padding: '4px 10px', border: '1px solid', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600',
                            borderColor: isActive ? sm.color : '#e2e8f0',
                            backgroundColor: isActive ? sm.bg : 'white',
                            color: isActive ? sm.color : '#94a3b8',
                          }}>{sm.label}</button>
                        );
                      })}
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap' }}>進捗 {selectedTaskData.progress ?? 0}%</span>
                      <input type="range" min="0" max="100" step="1" value={selectedTaskData.progress ?? 0}
                        onChange={(e) => updateProgress(selectedTaskData.id, parseInt(e.target.value))}
                        style={{ flex: 1, accentColor: '#1d6fd4' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => openEdit(selectedTaskData)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d6fd4', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>編集</button>
                      <button onClick={() => deleteTask(selectedTaskData.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: 'white', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>削除</button>
                    </div>
                  </div>

                  {selectedTaskData.notes && (
                    <div style={{ backgroundColor: '#f8fafc', borderRadius: '6px', padding: '5px 10px', marginTop: '0.4rem', fontSize: '12px', color: '#475569', lineHeight: '1.6', borderLeft: '3px solid #93c5fd' }}>
                      {selectedTaskData.notes}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* ─────────────────── リスト表示 ─────────────────── */}
        {view === 'list' && (
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            {sortedTasks.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>まだタスクがありません</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['カテゴリ', 'タスク名', '種別', '開始月', '終了月', '担当者', '担当班', '状態', '進捗', ''].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((task, i) => {
                    const s = STATUS_MAP[task.status];
                    const over = isOverdue(task);
                    const catColor = task.category ? CATEGORY_COLORS[task.category as Category] : null;
                    const { start, end, startPart, endPart } = resolveTaskMonths(task, trainingMonthState);
                    const isEditingOwner = inlineEdit?.taskId === task.id && inlineEdit?.field === 'owner';
                    const isEditingResp  = inlineEdit?.taskId === task.id && inlineEdit?.field === 'responsible';

                    return (
                      <tr key={task.id} style={{
                        borderBottom: i < sortedTasks.length - 1 ? '1px solid #f1f5f9' : 'none',
                        backgroundColor: over ? '#fff7f7' : 'white',
                        opacity: task.status === 'completed' ? 0.6 : 1,
                      }}>
                        {/* カテゴリ */}
                        <td style={{ padding: '10px 12px' }}>
                          {catColor && (
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', backgroundColor: catColor.bg, color: catColor.text, whiteSpace: 'nowrap' }}>
                              {task.category}
                            </span>
                          )}
                        </td>
                        {/* タスク名 */}
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{task.name}</span>
                          {over && <span style={{ display: 'block', fontSize: '10px', color: '#ef4444', fontWeight: '600' }}>期限超過</span>}
                          {task.notes && (
                            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {task.notes.length > 40 ? task.notes.slice(0, 40) + '…' : task.notes}
                            </span>
                          )}
                        </td>
                        {/* 種別 */}
                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', fontSize: '11px', color: task.taskType === 'fixed' ? '#5b21b6' : '#0369a1' }}>
                          {task.taskType === 'fixed'
                            ? '固定'
                            : task.monthsBefore < 0
                              ? `${Math.abs(task.monthsBefore)}M後/${task.durationMonths}M`
                              : `${task.monthsBefore}M前/${task.durationMonths}M`}
                        </td>
                        {/* 開始月 */}
                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>{start}{PART_LABEL[startPart]}</td>
                        {/* 終了月 */}
                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>{end}{PART_LABEL[endPart]}</td>
                        {/* 担当者（インライン編集）*/}
                        <td style={{ padding: '10px 12px' }}>
                          {isEditingOwner ? (
                            <input autoFocus value={inlineEdit!.value}
                              onChange={(e) => setInlineEdit({ ...inlineEdit!, value: e.target.value })}
                              onBlur={saveInlineEdit}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(); if (e.key === 'Escape') setInlineEdit(null); }}
                              style={{ ...inlineInp, width: '90px' }} />
                          ) : (
                            <span onClick={() => setInlineEdit({ taskId: task.id, field: 'owner', value: task.owner })}
                              title="クリックして編集"
                              style={{ color: '#64748b', fontSize: '12px', cursor: 'text', padding: '2px 4px', borderRadius: '4px', display: 'inline-block', minWidth: '36px' }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              {task.owner || '—'}
                            </span>
                          )}
                        </td>
                        {/* 担当班（インライン編集）*/}
                        <td style={{ padding: '10px 12px' }}>
                          {isEditingResp ? (
                            <input autoFocus value={inlineEdit!.value}
                              onChange={(e) => setInlineEdit({ ...inlineEdit!, value: e.target.value })}
                              onBlur={saveInlineEdit}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveInlineEdit(); if (e.key === 'Escape') setInlineEdit(null); }}
                              style={{ ...inlineInp, width: '90px' }} />
                          ) : (
                            <span onClick={() => setInlineEdit({ taskId: task.id, field: 'responsible', value: task.responsible })}
                              title="クリックして編集"
                              style={{ color: '#64748b', fontSize: '12px', cursor: 'text', padding: '2px 4px', borderRadius: '4px', display: 'inline-block', minWidth: '36px' }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                              {task.responsible || '—'}
                            </span>
                          )}
                        </td>
                        {/* 状態 */}
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                        </td>
                        {/* 進捗 */}
                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>{task.progress ?? 0}%</td>
                        {/* アクション */}
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => openEdit(task)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d6fd4', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>編集</button>
                            <button onClick={() => deleteTask(task.id)} style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: 'white', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>削除</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </main>
  );
}

const labelS: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  color: '#64748b', marginBottom: '5px', letterSpacing: '0.03em',
};
