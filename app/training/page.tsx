'use client';

import { useEffect, useState } from 'react';
import { trainingStorage } from '@/lib/storage';
import { TrainingTask } from '@/lib/types';

const MONTHS = [
  '2024-10','2024-11','2024-12',
  '2025-01','2025-02','2025-03','2025-04','2025-05','2025-06','2025-07','2025-08','2025-09',
];
const MONTH_LABELS: Record<string, string> = {
  '2024-10':'10月','2024-11':'11月','2024-12':'12月',
  '2025-01':'1月','2025-02':'2月','2025-03':'3月',
  '2025-04':'4月','2025-05':'5月','2025-06':'6月',
  '2025-07':'7月','2025-08':'8月','2025-09':'9月',
};

const STATUS_MAP = {
  pending:     { label: '未着手', color: '#94a3b8', bg: '#f1f5f9' },
  in_progress: { label: '進行中', color: '#d97706', bg: '#fef3c7' },
  completed:   { label: '完了',   color: '#16a34a', bg: '#dcfce7' },
};

export default function TrainingPage() {
  const [tasks, setTasks] = useState<TrainingTask[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [view, setView] = useState<'gantt' | 'list'>('gantt');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', dueMonth: MONTHS[4], owner: '', responsible: '', category: '',
  });

  useEffect(() => { setTasks(trainingStorage.getTasks()); }, []);

  const isOverdue = (t: TrainingTask) =>
    new Date(t.dueMonth + '-01') < new Date() && t.status !== 'completed';

  const monthSummary = (month: string) => {
    const mt = tasks.filter((t) => t.dueMonth === month);
    return { total: mt.length, completed: mt.filter((t) => t.status === 'completed').length };
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    const t: TrainingTask = {
      id: Date.now().toString(), name: formData.name, dueMonth: formData.dueMonth,
      status: 'pending', owner: formData.owner, responsible: formData.responsible,
      category: formData.category, progress: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    trainingStorage.addTask(t);
    setTasks((prev) => [...prev, t]);
    setFormData({ name: '', dueMonth: MONTHS[4], owner: '', responsible: '', category: '' });
    setShowForm(false);
  };

  const updateStatus = (id: string, status: TrainingTask['status']) => {
    trainingStorage.updateTask(id, { status });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  };

  const updateProgress = (id: string, progress: number) => {
    trainingStorage.updateTask(id, { progress });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, progress } : t));
  };

  const deleteTask = (id: string) => {
    trainingStorage.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const shownTasks = selectedMonth ? tasks.filter((t) => t.dueMonth === selectedMonth) : tasks;

  const totalCompleted = tasks.filter((t) => t.status === 'completed').length;
  const totalInProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const totalOverdue = tasks.filter((t) => isOverdue(t)).length;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', fontSize: '13px',
    border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
    fontFamily: 'inherit', color: '#0f172a', backgroundColor: 'white',
    boxSizing: 'border-box',
  };

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', system-ui, sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* ページヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Training Division</p>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>訓練班 — 年間タスク管理</h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '0.3rem' }}>大規模災害訓練の立案・運用のための年間スケジュール管理</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer',
            backgroundColor: showForm ? '#f1f5f9' : '#1d6fd4', color: showForm ? '#475569' : 'white',
            fontSize: '13px', fontWeight: '600', transition: 'all 0.15s',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d={showForm ? 'M2 7h10' : 'M7 2v10M2 7h10'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {showForm ? 'キャンセル' : '新規タスク'}
          </button>
        </div>

        {/* サマリーバー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
          {[
            { label: '全タスク', value: tasks.length, color: '#0f172a' },
            { label: '完了', value: totalCompleted, color: '#16a34a' },
            { label: '進行中', value: totalInProgress, color: '#d97706' },
            { label: '期限超過', value: totalOverdue, color: '#ef4444' },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 6px' }}>{s.label}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: s.color, margin: 0, letterSpacing: '-0.03em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* 新規フォーム */}
        {showForm && (
          <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>新規タスク登録</h3>
            <form onSubmit={handleAdd}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px', letterSpacing: '0.03em' }}>タスク名 *</label>
                <input style={inputStyle} type="text" placeholder="例：企画案作成、部門調整など"
                  value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '1.25rem' }}>
                {[
                  { label: '期限月', key: 'dueMonth', type: 'select' },
                  { label: '担当者', key: 'owner', placeholder: '例：田中太郎' },
                  { label: '責任者', key: 'responsible', placeholder: '例：〇〇統括' },
                  { label: 'カテゴリ', key: 'category', placeholder: '例：企画・運営' },
                ].map((f) => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '6px', letterSpacing: '0.03em' }}>{f.label}</label>
                    {f.type === 'select' ? (
                      <select style={inputStyle} value={formData.dueMonth}
                        onChange={(e) => setFormData({ ...formData, dueMonth: e.target.value })}>
                        {MONTHS.map((m) => <option key={m} value={m}>{MONTH_LABELS[m]}</option>)}
                      </select>
                    ) : (
                      <input style={inputStyle} type="text" placeholder={f.placeholder}
                        value={(formData as any)[f.key]}
                        onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} />
                    )}
                  </div>
                ))}
              </div>
              <button type="submit" style={{
                padding: '9px 20px', backgroundColor: '#1d6fd4', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              }}>
                登録する
              </button>
            </form>
          </div>
        )}

        {/* ビュー切替 */}
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

        {/* ガントチャート */}
        {view === 'gantt' && (
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem', letterSpacing: '-0.01em' }}>年間ガントチャート</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '6px' }}>
              {MONTHS.map((month) => {
                const { total, completed } = monthSummary(month);
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isSelected = selectedMonth === month;
                return (
                  <div key={month}
                    onClick={() => setSelectedMonth(isSelected ? null : month)}
                    style={{
                      padding: '10px 8px', borderRadius: '10px', cursor: 'pointer',
                      border: `1px solid ${isSelected ? '#bfdbfe' : '#f1f5f9'}`,
                      backgroundColor: isSelected ? '#eff6ff' : '#f8fafc',
                      transition: 'all 0.15s',
                    }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: isSelected ? '#1d6fd4' : '#334155', margin: '0 0 8px', textAlign: 'center' }}>
                      {MONTH_LABELS[month]}
                    </p>
                    <div style={{ height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, backgroundColor: '#1d6fd4', borderRadius: '2px', transition: 'width 0.3s' }} />
                    </div>
                    <p style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center', margin: 0 }}>
                      {total > 0 ? `${completed}/${total}` : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 月別詳細 */}
        {selectedMonth && view === 'gantt' && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: '0 0 1rem' }}>
              {MONTH_LABELS[selectedMonth]} のタスク
            </h3>
            {shownTasks.length === 0 ? (
              <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                この月のタスクはありません
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {shownTasks.map((task) => <TaskCard key={task.id} task={task} isOverdue={isOverdue(task)} onStatus={updateStatus} onProgress={updateProgress} onDelete={deleteTask} />)}
              </div>
            )}
          </div>
        )}

        {/* リスト表示 */}
        {view === 'list' && (
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            {tasks.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>まだタスクがありません</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    {['タスク名', '期限月', '担当者', '状態', '進捗', ''].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, i) => {
                    const s = STATUS_MAP[task.status];
                    const over = isOverdue(task);
                    return (
                      <tr key={task.id} style={{ borderBottom: i < tasks.length - 1 ? '1px solid #f1f5f9' : 'none', backgroundColor: over ? '#fef2f2' : 'white' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontWeight: '500', color: '#0f172a' }}>{task.name}</span>
                          {over && <span style={{ display: 'inline-block', marginLeft: '8px', fontSize: '10px', color: '#ef4444', fontWeight: '600' }}>期限超過</span>}
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>{MONTH_LABELS[task.dueMonth]}</td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>{task.owner || '—'}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                        </td>
                        <td style={{ padding: '12px 14px', color: '#64748b' }}>{task.progress ?? 0}%</td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => deleteTask(task.id)} style={{
                            padding: '4px 10px', border: '1px solid #fecaca', borderRadius: '6px',
                            backgroundColor: 'white', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                          }}>削除</button>
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

function TaskCard({ task, isOverdue, onStatus, onProgress, onDelete }: {
  task: TrainingTask;
  isOverdue: boolean;
  onStatus: (id: string, s: TrainingTask['status']) => void;
  onProgress: (id: string, p: number) => void;
  onDelete: (id: string) => void;
}) {
  const s = STATUS_MAP[task.status];
  return (
    <div style={{
      backgroundColor: 'white', border: `1px solid ${isOverdue ? '#fecaca' : '#e2e8f0'}`,
      borderRadius: '12px', padding: '1.25rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px' }}>{task.name}</span>
          {isOverdue && (
            <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: '700', color: '#ef4444', backgroundColor: '#fef2f2', padding: '2px 8px', borderRadius: '4px' }}>
              期限超過
            </span>
          )}
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: '#94a3b8' }}>
            {task.owner && <span>担当: {task.owner}</span>}
            {task.responsible && <span>責任: {task.responsible}</span>}
            {task.category && (
              <span style={{ backgroundColor: '#eff6ff', color: '#1d6fd4', padding: '1px 8px', borderRadius: '4px', fontWeight: '600' }}>
                {task.category}
              </span>
            )}
          </div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: '600', padding: '4px 10px', borderRadius: '6px', backgroundColor: s.bg, color: s.color, flexShrink: 0 }}>
          {s.label}
        </span>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
          <span>進捗</span><span>{task.progress ?? 0}%</span>
        </div>
        <input type="range" min="0" max="100" step="1" value={task.progress ?? 0}
          onChange={(e) => onProgress(task.id, parseInt(e.target.value))}
          style={{ width: '100%', accentColor: '#1d6fd4' }} />
      </div>

      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
        {(['pending', 'in_progress', 'completed'] as const).map((st) => {
          const sm = STATUS_MAP[st];
          return (
            <button key={st} onClick={() => onStatus(task.id, st)} style={{
              padding: '5px 12px', border: '1px solid', borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', transition: 'all 0.1s',
              borderColor: task.status === st ? sm.color : '#e2e8f0',
              backgroundColor: task.status === st ? sm.bg : 'white',
              color: task.status === st ? sm.color : '#94a3b8',
            }}>{sm.label}</button>
          );
        })}
        <button onClick={() => onDelete(task.id)} style={{
          marginLeft: '6px', padding: '5px 10px', border: '1px solid #fecaca', borderRadius: '7px',
          backgroundColor: 'white', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
        }}>削除</button>
      </div>
    </div>
  );
}
