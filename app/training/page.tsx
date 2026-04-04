'use client';

import { useEffect, useState, useRef } from 'react';
import { trainingStorage } from '@/lib/storage';
import { TrainingTask, TaskTiming, TimingPart, CATEGORIES, CATEGORY_COLORS, Category } from '@/lib/types';

// ─── 定数 ────────────────────────────────────────────────
const MONTHS = [
  '2024-10','2024-11','2024-12',
  '2025-01','2025-02','2025-03','2025-04','2025-05',
  '2025-06','2025-07','2025-08','2025-09',
];
const MONTH_LABELS: Record<string, string> = {
  '2024-10':'10月','2024-11':'11月','2024-12':'12月',
  '2025-01':'1月','2025-02':'2月','2025-03':'3月',
  '2025-04':'4月','2025-05':'5月','2025-06':'6月',
  '2025-07':'7月','2025-08':'8月','2025-09':'9月',
};
const PART_LABELS: Record<TimingPart, string> = {
  early: '上旬', mid: '中旬', late: '下旬', all: '月内',
};
const PARTS: TimingPart[] = ['early', 'mid', 'late', 'all'];

const STATUS_MAP = {
  pending:     { label: '未着手', color: '#64748b', bg: '#f1f5f9' },
  in_progress: { label: '進行中', color: '#d97706', bg: '#fef3c7' },
  completed:   { label: '完了',   color: '#16a34a', bg: '#dcfce7' },
};

const DEFAULT_TIMING: TaskTiming = { month: '2025-04', part: 'early' };

// ─── 時系列ソート用スコア ────────────────────────────────
function timingScore(t: TaskTiming): number {
  const partScore: Record<TimingPart, number> = { early: 0, mid: 0.33, late: 0.66, all: 0 };
  return MONTHS.indexOf(t.month) + partScore[t.part];
}

// ─── バー位置計算（月ごとに3分割: 上旬/中旬/下旬）────────
function partToOffset(part: TimingPart): number {
  return part === 'early' ? 0 : part === 'mid' ? 1 : part === 'late' ? 2 : 0;
}

// ─── 初期フォームデータ ──────────────────────────────────
function emptyForm() {
  return {
    name: '',
    category: '' as Category | '',
    startTiming: { month: '2025-01', part: 'early' as TimingPart },
    endTiming:   { month: '2025-03', part: 'late'  as TimingPart },
    owner: '',
    responsible: '',
    notes: '',
    status: 'pending' as TrainingTask['status'],
    progress: 0,
  };
}

// ─── メインコンポーネント ────────────────────────────────
export default function TrainingPage() {
  const [tasks, setTasks] = useState<TrainingTask[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [view, setView] = useState<'gantt' | 'list'>('gantt');
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTasks(trainingStorage.getTasks()); }, []);

  useEffect(() => {
    if (selectedTask && detailRef.current) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }
  }, [selectedTask]);

  const isOverdue = (t: TrainingTask) =>
    new Date(t.endTiming?.month + '-28') < new Date() && t.status !== 'completed';

  // ─── フォーム送信（新規 or 更新）
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    const now = new Date().toISOString();
    if (editId) {
      trainingStorage.updateTask(editId, { ...form, dueMonth: form.endTiming.month, updatedAt: now });
      setTasks((prev) => prev.map((t) => t.id === editId ? { ...t, ...form, dueMonth: form.endTiming.month, updatedAt: now } : t));
      setEditId(null);
    } else {
      const newTask: TrainingTask = {
        id: Date.now().toString(), ...form, dueMonth: form.endTiming.month,
        createdAt: now, updatedAt: now,
      };
      trainingStorage.addTask(newTask);
      setTasks((prev) => [...prev, newTask]);
    }
    setForm(emptyForm());
    setShowForm(false);
  };

  const openEdit = (task: TrainingTask) => {
    setForm({
      name: task.name, category: task.category,
      startTiming: task.startTiming ?? DEFAULT_TIMING,
      endTiming:   task.endTiming   ?? DEFAULT_TIMING,
      owner: task.owner, responsible: task.responsible,
      notes: task.notes ?? '', status: task.status, progress: task.progress ?? 0,
    });
    setEditId(task.id);
    setShowForm(true);
    setSelectedTask(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm()); };

  const updateStatus = (id: string, status: TrainingTask['status']) => {
    trainingStorage.updateTask(id, { status });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  };

  const updateProgress = (id: string, progress: number) => {
    trainingStorage.updateTask(id, { progress });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, progress } : t));
  };

  const deleteTask = (id: string) => {
    if (!confirm('このタスクを削除しますか？')) return;
    trainingStorage.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTask === id) setSelectedTask(null);
  };

  const totalCompleted  = tasks.filter((t) => t.status === 'completed').length;
  const totalInProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const totalOverdue    = tasks.filter((t) => isOverdue(t)).length;
  const sortedTasks = [...tasks].sort((a, b) =>
    timingScore(a.startTiming ?? DEFAULT_TIMING) - timingScore(b.startTiming ?? DEFAULT_TIMING)
  );
  const selectedTaskData = tasks.find((t) => t.id === selectedTask);

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 11px', fontSize: '13px',
    border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
    fontFamily: 'inherit', color: '#0f172a', backgroundColor: 'white', boxSizing: 'border-box',
  };

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ── ページヘッダー ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Training Division</p>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.02em' }}>訓練班 — 年間タスク管理</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>大規模災害訓練の立案・運用のための年間スケジュール管理</p>
          </div>
          <button onClick={() => showForm ? cancelForm() : setShowForm(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
            borderRadius: '9px', border: 'none', cursor: 'pointer',
            backgroundColor: showForm ? '#f1f5f9' : '#1d6fd4', color: showForm ? '#475569' : 'white',
            fontSize: '13px', fontWeight: '600', transition: 'all 0.15s',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d={showForm ? 'M2 7h10' : 'M7 2v10M2 7h10'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {showForm ? 'キャンセル' : '新規タスク'}
          </button>
        </div>

        {/* ── サマリー ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '1.5rem' }}>
          {[
            { label: '全タスク',  value: tasks.length,    color: '#0f172a' },
            { label: '完了',      value: totalCompleted,  color: '#16a34a' },
            { label: '進行中',    value: totalInProgress, color: '#d97706' },
            { label: '期限超過',  value: totalOverdue,    color: '#ef4444' },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 5px' }}>{s.label}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: s.color, margin: 0, letterSpacing: '-0.03em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── フォーム ── */}
        {showForm && (
          <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>
              {editId ? '✏️ タスクを編集' : '新規タスク登録'}
            </h3>
            <form onSubmit={handleSubmit}>
              {/* カテゴリ */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelS}>カテゴリ *</label>
                <select style={inp} value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Category | '' })} required>
                  <option value="">— 選択してください —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* タスク名 */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelS}>タスク名 *</label>
                <input style={inp} type="text" placeholder="例：企画案作成、部門調整など"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              {/* 開始 / 完了時期 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                {(['start', 'end'] as const).map((key) => {
                  const timing = key === 'start' ? form.startTiming : form.endTiming;
                  const setTiming = (t: TaskTiming) => setForm({ ...form, [key === 'start' ? 'startTiming' : 'endTiming']: t });
                  return (
                    <div key={key}>
                      <label style={labelS}>{key === 'start' ? '開始時期' : '完了時期'}</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <select style={inp} value={timing.month} onChange={(e) => setTiming({ ...timing, month: e.target.value })}>
                          {MONTHS.map((m) => <option key={m} value={m}>{MONTH_LABELS[m]}</option>)}
                        </select>
                        <select style={inp} value={timing.part} onChange={(e) => setTiming({ ...timing, part: e.target.value as TimingPart })}>
                          {PARTS.map((p) => <option key={p} value={p}>{PART_LABELS[p]}</option>)}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 担当者 / 責任者 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label style={labelS}>担当者</label>
                  <input style={inp} type="text" placeholder="例：田中太郎" value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} />
                </div>
                <div>
                  <label style={labelS}>責任者</label>
                  <input style={inp} type="text" placeholder="例：〇〇統括" value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
                </div>
              </div>
              {/* 状態 / 進捗（編集時のみ） */}
              {editId && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                  <div>
                    <label style={labelS}>状態</label>
                    <select style={inp} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TrainingTask['status'] })}>
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
              {/* 備考 */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelS}>備考</label>
                <textarea style={{ ...inp, minHeight: '72px', resize: 'vertical', lineHeight: '1.6' }}
                  placeholder="補足事項・注意点など"
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ padding: '9px 20px', backgroundColor: '#1d6fd4', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  {editId ? '更新する' : '登録する'}
                </button>
                <button type="button" onClick={cancelForm} style={{ padding: '9px 16px', backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── ビュー切替 ── */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem' }}>
          {(['gantt', 'list'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '7px 14px', borderRadius: '8px', border: '1px solid',
              borderColor: view === v ? '#bfdbfe' : '#e2e8f0',
              backgroundColor: view === v ? '#eff6ff' : 'white',
              color: view === v ? '#1d6fd4' : '#64748b',
              fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
            }}>
              {v === 'gantt' ? '📊 ガントチャート' : '📝 リスト'}
            </button>
          ))}
        </div>

        {/* ── ガントチャート ── */}
        {view === 'gantt' && (
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', marginBottom: '1.5rem' }}>

            {/* 凡例 */}
            <div style={{ padding: '10px 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginRight: '4px' }}>カテゴリ：</span>
              {CATEGORIES.map((c) => {
                const col = CATEGORY_COLORS[c];
                return (
                  <span key={c} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: col.text }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: col.bar, flexShrink: 0 }} />
                    {c}
                  </span>
                );
              })}
            </div>

            {/* スクロール可能なテーブル */}
            <div style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '1000px' }}>

                {/* ヘッダー：月 */}
                <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${MONTHS.length}, 1fr)`, backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1 }}>
                  <div style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8', fontWeight: '700', borderRight: '1px solid #e2e8f0' }}>タスク名</div>
                  {MONTHS.map((m) => (
                    <div key={m} style={{ padding: '8px 4px', fontSize: '11px', fontWeight: '700', color: '#475569', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                      {MONTH_LABELS[m]}
                    </div>
                  ))}
                </div>

                {/* サブヘッダー：上旬/中旬/下旬 */}
                <div style={{ display: 'grid', gridTemplateColumns: `200px repeat(${MONTHS.length}, 1fr)`, borderBottom: '2px solid #e2e8f0' }}>
                  <div style={{ borderRight: '1px solid #e2e8f0' }} />
                  {MONTHS.map((m) => (
                    <div key={m} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderRight: '1px solid #e2e8f0' }}>
                      {(['上','中','下']).map((p) => (
                        <div key={p} style={{ fontSize: '9px', color: '#cbd5e1', textAlign: 'center', padding: '2px 0', borderRight: p !== '下' ? '1px dotted #e2e8f0' : 'none' }}>{p}</div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* タスク行 */}
                {sortedTasks.length === 0 ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    タスクがありません。「新規タスク」から追加してください。
                  </div>
                ) : (
                  sortedTasks.map((task, idx) => {
                    const catColor = task.category
                      ? CATEGORY_COLORS[task.category as Category]
                      : { bar: '#94a3b8', bg: '#f1f5f9', text: '#475569' };
                    const start = task.startTiming ?? DEFAULT_TIMING;
                    const end   = task.endTiming   ?? DEFAULT_TIMING;
                    const startMonthIdx = MONTHS.indexOf(start.month);
                    const endMonthIdx   = MONTHS.indexOf(end.month);
                    const isSelected = selectedTask === task.id;
                    const over = isOverdue(task);

                    return (
                      <div
                        key={task.id}
                        onClick={() => setSelectedTask(isSelected ? null : task.id)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: `200px repeat(${MONTHS.length}, 1fr)`,
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#f0f9ff' : over ? '#fff7f7' : (idx % 2 === 0 ? 'white' : '#fafafa'),
                          transition: 'background-color 0.1s',
                          minHeight: '38px',
                        }}
                      >
                        {/* タスク名 */}
                        <div style={{ padding: '6px 10px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: isSelected ? '#1d6fd4' : '#0f172a', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.name}
                          </span>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {task.owner && <span style={{ fontSize: '9px', color: '#94a3b8' }}>{task.owner}</span>}
                            {over && <span style={{ fontSize: '9px', fontWeight: '700', color: '#ef4444' }}>超過</span>}
                            {task.notes && <span style={{ fontSize: '9px', color: '#94a3b8' }}>📝</span>}
                          </div>
                        </div>

                        {/* 月セル */}
                        {MONTHS.map((month, mIdx) => {
                          const inRange = mIdx >= startMonthIdx && mIdx <= endMonthIdx;
                          const isStartMonth = mIdx === startMonthIdx;
                          const isEndMonth   = mIdx === endMonthIdx;
                          const isSameMonth  = startMonthIdx === endMonthIdx;

                          // バーの left/width（月幅=100%、旬=33.3%ずつ）
                          const startOffset = isStartMonth ? partToOffset(start.part) / 3 : 0;
                          const endRight = isEndMonth
                            ? 1 - (partToOffset(end.part) + (end.part === 'all' ? 3 : 1)) / 3
                            : 0;
                          const left  = inRange && (isStartMonth || !inRange) ? `${startOffset * 100}%` : '0%';
                          const right = inRange && (isEndMonth || !inRange) ? `${endRight * 100}%` : '0%';

                          const barColor = task.status === 'completed'
                            ? STATUS_MAP.completed.color
                            : catColor.bar;

                          return (
                            <div key={month} style={{ position: 'relative', borderRight: '1px solid #e2e8f0', height: '38px' }}>
                              {inRange && (
                                <div style={{
                                  position: 'absolute',
                                  top: '50%', transform: 'translateY(-50%)',
                                  left: isStartMonth ? `${(partToOffset(start.part) / 3) * 100}%` : '0',
                                  right: isEndMonth  ? `${(1 - (partToOffset(end.part) + (end.part === 'all' ? 3 : 1)) / 3) * 100}%` : '0',
                                  height: '16px',
                                  backgroundColor: barColor,
                                  opacity: task.status === 'pending' ? 0.35 : 0.82,
                                  borderRadius: `${isStartMonth ? '4px' : '0'} ${isEndMonth ? '4px' : '0'} ${isEndMonth ? '4px' : '0'} ${isStartMonth ? '4px' : '0'}`,
                                  overflow: 'hidden',
                                  minWidth: '4px',
                                }}>
                                  {/* 進捗ハイライト */}
                                  {task.status === 'in_progress' && isSameMonth && (
                                    <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${task.progress ?? 0}%`, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                                  )}
                                </div>
                              )}
                              {/* 旬区切り点線 */}
                              <div style={{ position: 'absolute', left: '33.3%', top: '20%', bottom: '20%', borderLeft: '1px dotted #e8edf2' }} />
                              <div style={{ position: 'absolute', left: '66.6%', top: '20%', bottom: '20%', borderLeft: '1px dotted #e8edf2' }} />
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 詳細パネル（ガントクリック時）── */}
        {view === 'gantt' && selectedTaskData && (
          <div ref={detailRef} style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                {selectedTaskData.category && (
                  <span style={{ fontSize: '11px', fontWeight: '700', display: 'inline-block', marginBottom: '6px', padding: '2px 8px', borderRadius: '4px', backgroundColor: CATEGORY_COLORS[selectedTaskData.category as Category]?.bg, color: CATEGORY_COLORS[selectedTaskData.category as Category]?.text }}>
                    {selectedTaskData.category}
                  </span>
                )}
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{selectedTaskData.name}</h3>
              </div>
              <button onClick={() => setSelectedTask(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1rem' }}>
              {[
                { label: '開始時期', value: `${MONTH_LABELS[selectedTaskData.startTiming?.month ?? ''] ?? ''} ${PART_LABELS[selectedTaskData.startTiming?.part ?? 'all']}` },
                { label: '完了時期', value: `${MONTH_LABELS[selectedTaskData.endTiming?.month ?? ''] ?? ''} ${PART_LABELS[selectedTaskData.endTiming?.part ?? 'all']}` },
                { label: '状態',    value: STATUS_MAP[selectedTaskData.status].label },
                { label: '担当者',  value: selectedTaskData.owner || '—' },
                { label: '責任者',  value: selectedTaskData.responsible || '—' },
                { label: '進捗',    value: `${selectedTaskData.progress ?? 0}%` },
              ].map(({ label, value }) => (
                <div key={label} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', margin: '0 0 3px', letterSpacing: '0.04em' }}>{label}</p>
                  <p style={{ fontSize: '13px', color: '#0f172a', fontWeight: '600', margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* 進捗スライダー */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                <span>進捗調整</span><span>{selectedTaskData.progress ?? 0}%</span>
              </div>
              <input type="range" min="0" max="100" step="1" value={selectedTaskData.progress ?? 0}
                onChange={(e) => updateProgress(selectedTaskData.id, parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#1d6fd4' }} />
            </div>

            {/* 備考 */}
            {selectedTaskData.notes && (
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', fontSize: '13px', color: '#475569', lineHeight: '1.7', borderLeft: '3px solid #93c5fd' }}>
                {selectedTaskData.notes}
              </div>
            )}

            {/* アクション */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              {(['pending', 'in_progress', 'completed'] as const).map((st) => {
                const sm = STATUS_MAP[st];
                const isActive = selectedTaskData.status === st;
                return (
                  <button key={st} onClick={() => updateStatus(selectedTaskData.id, st)} style={{
                    padding: '6px 12px', border: '1px solid', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.1s',
                    borderColor: isActive ? sm.color : '#e2e8f0',
                    backgroundColor: isActive ? sm.bg : 'white',
                    color: isActive ? sm.color : '#94a3b8',
                  }}>{sm.label}</button>
                );
              })}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                <button onClick={() => openEdit(selectedTaskData)} style={{ padding: '6px 14px', border: '1px solid #bfdbfe', borderRadius: '7px', backgroundColor: '#eff6ff', color: '#1d6fd4', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  ✏️ 編集
                </button>
                <button onClick={() => deleteTask(selectedTaskData.id)} style={{ padding: '6px 12px', border: '1px solid #fecaca', borderRadius: '7px', backgroundColor: 'white', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  削除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── リスト表示 ── */}
        {view === 'list' && (
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            {tasks.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>まだタスクがありません</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['カテゴリ','タスク名','開始','完了','担当','状態','進捗',''].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedTasks.map((task, i) => {
                    const s = STATUS_MAP[task.status];
                    const over = isOverdue(task);
                    const catColor = task.category ? CATEGORY_COLORS[task.category as Category] : null;
                    return (
                      <tr key={task.id} style={{ borderBottom: i < tasks.length - 1 ? '1px solid #f1f5f9' : 'none', backgroundColor: over ? '#fff7f7' : 'white' }}>
                        <td style={{ padding: '10px 12px' }}>
                          {catColor && (
                            <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '4px', backgroundColor: catColor.bg, color: catColor.text, whiteSpace: 'nowrap' }}>
                              {task.category}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: '600', color: '#0f172a' }}>{task.name}</span>
                          {over && <span style={{ display: 'block', fontSize: '10px', color: '#ef4444', fontWeight: '600' }}>期限超過</span>}
                          {task.notes && (
                            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.5 }}>
                              📝 {task.notes.length > 40 ? task.notes.slice(0, 40) + '…' : task.notes}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {MONTH_LABELS[task.startTiming?.month ?? '']} {PART_LABELS[task.startTiming?.part ?? 'all']}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {MONTH_LABELS[task.endTiming?.month ?? '']} {PART_LABELS[task.endTiming?.part ?? 'all']}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>{task.owner || '—'}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px' }}>{task.progress ?? 0}%</td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => openEdit(task)} style={{ padding: '4px 10px', border: '1px solid #bfdbfe', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#1d6fd4', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>編集</button>
                            <button onClick={() => deleteTask(task.id)} style={{ padding: '4px 10px', border: '1px solid #fecaca', borderRadius: '6px', backgroundColor: 'white', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>削除</button>
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
