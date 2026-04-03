'use client';

import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { trainingStorage } from '@/lib/storage';
import { TrainingTask } from '@/lib/types';

export default function TrainingPage() {
  const [tasks, setTasks] = useState<TrainingTask[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showGantt, setShowGantt] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    dueMonth: new Date().toISOString().slice(0, 7),
    owner: '',
    responsible: '',
    category: '',
  });

  const months = [
    '2024-10', '2024-11', '2024-12',
    '2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09'
  ];

  const monthLabels: { [key: string]: string } = {
    '2024-10': '10月', '2024-11': '11月', '2024-12': '12月',
    '2025-01': '1月', '2025-02': '2月', '2025-03': '3月',
    '2025-04': '4月', '2025-05': '5月', '2025-06': '6月',
    '2025-07': '7月', '2025-08': '8月', '2025-09': '9月'
  };

  useEffect(() => {
    setTasks(trainingStorage.getTasks());
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newTask: TrainingTask = {
      id: Date.now().toString(),
      name: formData.name,
      dueMonth: formData.dueMonth,
      status: 'pending',
      owner: formData.owner,
      responsible: formData.responsible,
      category: formData.category,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    trainingStorage.addTask(newTask);
    setTasks([...tasks, newTask]);
    setFormData({ name: '', dueMonth: new Date().toISOString().slice(0, 7), owner: '', responsible: '', category: '' });
    setShowForm(false);
  };

  const handleStatusChange = (id: string, status: 'pending' | 'in_progress' | 'completed') => {
    trainingStorage.updateTask(id, { status });
    setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const handleProgressChange = (id: string, progress: number) => {
    trainingStorage.updateTask(id, { progress });
    setTasks(tasks.map((t) => (t.id === id ? { ...t, progress } : t)));
  };

  const handleDeleteTask = (id: string) => {
    trainingStorage.deleteTask(id);
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const isOverdue = (task: TrainingTask) => {
    const dueDate = new Date(task.dueMonth + '-01');
    const now = new Date();
    return dueDate < now && task.status !== 'completed';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#f59e0b';
      case 'pending': return '#9ca3af';
      default: return '#e5e7eb';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return '完了';
      case 'in_progress': return '進行中';
      case 'pending': return '未着手';
      default: return '不明';
    }
  };

  const monthlyData = selectedMonth
    ? tasks.filter((t) => t.dueMonth === selectedMonth)
    : tasks;

  const monthSummary = (month: string) => {
    const monthTasks = tasks.filter((t) => t.dueMonth === month);
    return {
      total: monthTasks.length,
      completed: monthTasks.filter((t) => t.status === 'completed').length,
      inProgress: monthTasks.filter((t) => t.status === 'in_progress').length,
    };
  };

  return (
    <main>
      <Navigation />
      <div style={styles.container}>
        <h1 style={styles.title}>📋 訓練班 - 年間タスク管理</h1>
        <p style={styles.subtitle}>
          大規模災害訓練の立案・運用のための年間スケジュール管理
        </p>

        {/* 操作ボタン */}
        <div style={styles.actionBar}>
          <button 
            style={{ ...styles.btn, ...(showGantt ? styles.btnActive : styles.btnSecondary) }}
            onClick={() => setShowGantt(true)}
          >
            📊 ガントチャート
          </button>
          <button 
            style={{ ...styles.btn, ...(!showGantt ? styles.btnActive : styles.btnSecondary) }}
            onClick={() => setShowGantt(false)}
          >
            📝 リスト表示
          </button>
          <button 
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ キャンセル' : '+ 新規タスク'}
          </button>
        </div>

        {/* フォーム */}
        {showForm && (
          <div style={styles.formCard}>
            <h3 style={styles.formTitle}>新規タスク登録</h3>
            <form onSubmit={handleAddTask}>
              <div style={styles.formGroup}>
                <label style={styles.label}>タスク名 *</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="例：企画案作成、部門調整など"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>期限月</label>
                  <select
                    style={styles.select}
                    value={formData.dueMonth}
                    onChange={(e) => setFormData({ ...formData, dueMonth: e.target.value })}
                  >
                    {months.map((m) => (
                      <option key={m} value={m}>{monthLabels[m]}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>担当者</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="例：田中太郎"
                    value={formData.owner}
                    onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>責任者</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="例：〇〇統括"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>カテゴリ</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder="例：企画・運営統括"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" style={{ ...styles.btn, ...styles.btnSuccess }}>
                登録する
              </button>
            </form>
          </div>
        )}

        {/* ガントチャートビュー */}
        {showGantt && (
          <div style={styles.ganttContainer}>
            <h3 style={styles.sectionTitle}>年間ガントチャート</h3>
            <div style={styles.ganttChart}>
              {months.map((month) => {
                const summary = monthSummary(month);
                const isSelected = selectedMonth === month;
                return (
                  <div
                    key={month}
                    style={{
                      ...styles.ganttMonth,
                      ...(isSelected ? styles.ganttMonthSelected : {}),
                    }}
                    onClick={() => setSelectedMonth(isSelected ? null : month)}
                  >
                    <div style={styles.ganttMonthLabel}>{monthLabels[month]}</div>
                    <div style={styles.ganttBar}>
                      <div
                        style={{
                          width: `${summary.total > 0 ? (summary.completed / summary.total) * 100 : 0}%`,
                          height: '6px',
                          backgroundColor: '#10b981',
                          borderRadius: '3px',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                    <div style={styles.ganttSummary}>
                      {summary.total > 0 && (
                        <>
                          <span style={styles.ganttStat}>✓{summary.completed}</span>
                          <span style={styles.ganttStat}>→{summary.inProgress}</span>
                          <span style={styles.ganttStat}>◯{summary.total - summary.completed - summary.inProgress}</span>
                        </>
                      )}
                      {summary.total === 0 && <span style={styles.ganttEmpty}>タスク無</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 月別詳細ビュー */}
        {selectedMonth && (
          <div style={styles.detailContainer}>
            <h3 style={styles.sectionTitle}>{monthLabels[selectedMonth]} の詳細</h3>
            {monthlyData.length === 0 ? (
              <p style={styles.emptyText}>このパッケージはタスクがありません</p>
            ) : (
              <div style={styles.taskList}>
                {monthlyData.map((task) => (
                  <div key={task.id} style={{ ...styles.taskCard, ...(isOverdue(task) ? styles.taskOverdue : {}) }}>
                    <div style={styles.taskHeader}>
                      <div style={styles.taskTitle}>{task.name}</div>
                      {isOverdue(task) && <div style={styles.badgeOverdue}>⚠ 期限超過</div>}
                    </div>

                    <div style={styles.taskMeta}>
                      <span>担当: {task.owner || '未指定'}</span>
                      <span>責任: {task.responsible || '未指定'}</span>
                      {task.category && <span style={styles.badge}>{task.category}</span>}
                    </div>

                    <div style={styles.progressContainer}>
                      <label style={styles.label}>進捗: {task.progress || 0}%</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={task.progress || 0}
                        onChange={(e) => handleProgressChange(task.id, parseInt(e.target.value))}
                        style={styles.progressBar}
                      />
                    </div>

                    <div style={styles.taskFooter}>
                      <select
                        style={styles.statusSelect}
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                      >
                        <option value="pending">未着手</option>
                        <option value="in_progress">進行中</option>
                        <option value="completed">完了</option>
                      </select>
                      <button
                        style={{ ...styles.btn, ...styles.btnDanger }}
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* リスト表示 */}
        {!showGantt && (
          <div style={styles.listContainer}>
            <h3 style={styles.sectionTitle}>全タスク一覧</h3>
            {tasks.length === 0 ? (
              <p style={styles.emptyText}>まだタスクがありません</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeader}>
                      <th style={styles.tableCell}>タスク名</th>
                      <th style={styles.tableCell}>期限月</th>
                      <th style={styles.tableCell}>担当者</th>
                      <th style={styles.tableCell}>状態</th>
                      <th style={styles.tableCell}>進捗</th>
                      <th style={styles.tableCell}>アクション</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task.id} style={{ ...styles.tableRow, ...(isOverdue(task) ? styles.tableRowOverdue : {}) }}>
                        <td style={styles.tableCell}>
                          <div>{task.name}</div>
                          {isOverdue(task) && <div style={styles.overdueLabel}>⚠ 期限超過</div>}
                        </td>
                        <td style={styles.tableCell}>{monthLabels[task.dueMonth]}</td>
                        <td style={styles.tableCell}>{task.owner || '-'}</td>
                        <td style={styles.tableCell}>
                          <span
                            style={{
                              ...styles.statusBadge,
                              backgroundColor: getStatusColor(task.status),
                            }}
                          >
                            {getStatusLabel(task.status)}
                          </span>
                        </td>
                        <td style={styles.tableCell}>{task.progress || 0}%</td>
                        <td style={styles.tableCell}>
                          <button
                            style={{ ...styles.btn, ...styles.btnDanger, fontSize: '0.75rem' }}
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 進捗サマリー */}
        <div style={styles.summaryGrid}>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>完了タスク</div>
            <div style={{ ...styles.summaryValue, color: '#10b981' }}>
              {tasks.filter((t) => t.status === 'completed').length}
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>進行中</div>
            <div style={{ ...styles.summaryValue, color: '#f59e0b' }}>
              {tasks.filter((t) => t.status === 'in_progress').length}
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>未着手</div>
            <div style={{ ...styles.summaryValue, color: '#6b7280' }}>
              {tasks.filter((t) => t.status === 'pending').length}
            </div>
          </div>
          <div style={styles.summaryCard}>
            <div style={styles.summaryLabel}>期限超過</div>
            <div style={{ ...styles.summaryValue, color: '#ef4444' }}>
              {tasks.filter((t) => isOverdue(t)).length}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// スタイル定義
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '0.5rem',
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: '2rem',
    fontSize: '0.95rem',
  },
  actionBar: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
    flexWrap: 'wrap',
  },
  btn: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'all 0.3s ease',
  },
  btnPrimary: {
    backgroundColor: '#3b82f6',
    color: 'white',
  },
  btnSecondary: {
    backgroundColor: '#e5e7eb',
    color: '#374151',
  },
  btnActive: {
    backgroundColor: '#2563eb',
    color: 'white',
  },
  btnSuccess: {
    backgroundColor: '#10b981',
    color: 'white',
  },
  btnDanger: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '0.5rem 1rem',
    fontSize: '0.8rem',
  },
  formCard: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  formTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
    color: '#1f2937',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    marginBottom: '0.5rem',
    color: '#374151',
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.9rem',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  ganttContainer: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
    color: '#1f2937',
  },
  ganttChart: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '1rem',
  },
  ganttMonth: {
    padding: '1rem',
    backgroundColor: '#f3f4f6',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
  },
  ganttMonthSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  ganttMonthLabel: {
    fontSize: '0.9rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
    color: '#1f2937',
  },
  ganttBar: {
    backgroundColor: '#e5e7eb',
    height: '8px',
    borderRadius: '4px',
    marginBottom: '0.75rem',
    overflow: 'hidden',
  },
  ganttSummary: {
    fontSize: '0.75rem',
    color: '#6b7280',
    display: 'flex',
    gap: '0.5rem',
  },
  ganttStat: {
    backgroundColor: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
  },
  ganttEmpty: {
    color: '#9ca3af',
  },
  detailContainer: {
    marginBottom: '2rem',
  },
  taskList: {
    display: 'grid',
    gap: '1rem',
  },
  taskCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '1.5rem',
  },
  taskOverdue: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  taskTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1f2937',
  },
  badgeOverdue: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
  },
  taskMeta: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    fontSize: '0.85rem',
    color: '#6b7280',
    flexWrap: 'wrap',
  },
  progressContainer: {
    marginBottom: '1rem',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    marginTop: '0.5rem',
  },
  taskFooter: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
  statusSelect: {
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    fontSize: '0.85rem',
    fontFamily: 'inherit',
  },
  listContainer: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.9rem',
  },
  tableHeader: {
    backgroundColor: '#f3f4f6',
    borderBottom: '2px solid #e5e7eb',
  },
  tableCell: {
    padding: '1rem',
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
  },
  tableRow: {
    transition: 'background-color 0.2s ease',
  },
  tableRowOverdue: {
    backgroundColor: '#fef2f2',
  },
  statusBadge: {
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '0.25rem',
    fontSize: '0.75rem',
    fontWeight: 600,
    display: 'inline-block',
  },
  overdueLabel: {
    color: '#dc2626',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
  },
  summaryCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: '0.85rem',
    color: '#6b7280',
    marginBottom: '0.75rem',
    fontWeight: 500,
  },
  summaryValue: {
    fontSize: '2rem',
    fontWeight: 700,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    padding: '2rem',
  },
};
