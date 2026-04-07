'use client';

import { useEffect, useState } from 'react';
import { logStorage, verificationStorage, manualMeta } from '@/lib/manualStorage';
import { addLog } from '@/lib/storage';
import { ManualLog, ManualVerification } from '@/lib/manualTypes';

// ─── スタイル定数 ────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 11px', fontSize: '13px',
  border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
  fontFamily: 'inherit', color: '#0f172a', backgroundColor: 'white', boxSizing: 'border-box',
};
const labelS: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  color: '#64748b', marginBottom: '5px', letterSpacing: '0.03em',
};
const btnPrimary: React.CSSProperties = {
  padding: '9px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer',
  backgroundColor: '#1d6fd4', color: 'white', fontSize: '13px', fontWeight: '600',
};
const btnSecondary: React.CSSProperties = {
  padding: '9px 16px', borderRadius: '9px', border: '1px solid #e2e8f0', cursor: 'pointer',
  backgroundColor: 'white', color: '#475569', fontSize: '13px', fontWeight: '600',
};
const btnDanger: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
  backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: '600',
};
const btnEdit: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
  backgroundColor: '#eff6ff', color: '#1d6fd4', fontSize: '12px', fontWeight: '600',
};

// ─── ユーティリティ ──────────────────────────────────────
function nowISO() { return new Date().toISOString(); }
function genId() { return Date.now().toString() + Math.random().toString(36).slice(2, 7); }
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}
function formatDateTime(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── 行背景色 ────────────────────────────────────────────
function logRowBg(log: ManualLog): string {
  if (log.committeeApproved && log.dataUpdated) return '#f8fafc';
  if (log.dataUpdated) return '#eff6ff';
  if (log.committeeApproved) return '#f0fdf4';
  return 'white';
}
function logRowBorder(log: ManualLog): string {
  if (log.committeeApproved && log.dataUpdated) return '#e2e8f0';
  if (log.dataUpdated) return '#bfdbfe';
  if (log.committeeApproved) return '#bbf7d0';
  return '#e2e8f0';
}

// ─── 文字数カウンター付きTextarea ────────────────────────
function TextareaWithCount({
  value, onChange, placeholder, maxLen = 300, rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLen?: number;
  rows?: number;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <textarea
        style={{ ...inp, resize: 'vertical', minHeight: `${rows * 22}px` }}
        value={value}
        maxLength={maxLen}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
      />
      <span style={{
        position: 'absolute', bottom: '8px', right: '10px',
        fontSize: '11px', color: value.length >= maxLen ? '#ef4444' : '#94a3b8',
      }}>
        {value.length}/{maxLen}
      </span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// タブ1: 更新ログ入力
// ══════════════════════════════════════════════════════════
function emptyLog() {
  return { updatedAt: todayStr(), chapter: '', summary: '', committeeApproved: false, dataUpdated: false };
}

function LogInputTab() {
  const [logs, setLogs] = useState<ManualLog[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyLog());

  useEffect(() => { setLogs(logStorage.getAll()); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.chapter || !form.summary) return;
    const now = nowISO();
    if (editId) {
      logStorage.update(editId, { ...form });
      setLogs((prev) => prev.map((x) => x.id === editId ? { ...x, ...form } : x));
      setEditId(null);
    } else {
      const newItem: ManualLog = { id: genId(), ...form, createdAt: now };
      logStorage.add(newItem);
      setLogs((prev) => [...prev, newItem]);
    }
    setForm(emptyLog());
    setShowForm(false);
  };

  const openEdit = (item: ManualLog) => {
    setForm({
      updatedAt: item.updatedAt, chapter: item.chapter,
      summary: item.summary, committeeApproved: item.committeeApproved,
      dataUpdated: item.dataUpdated,
    });
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = (id: string) => {
    if (!confirm('削除しますか？')) return;
    logStorage.delete(id);
    setLogs((prev) => prev.filter((x) => x.id !== id));
  };

  const toggleField = (id: string, field: 'committeeApproved' | 'dataUpdated', val: boolean) => {
    logStorage.update(id, { [field]: val });
    const item = logs.find((x) => x.id === id);
    if (item) addLog('manual', field + ':' + (val ? 'true' : 'false'), id, item.chapter);
    setLogs((prev) => prev.map((x) => x.id === id ? { ...x, [field]: val } : x));
  };

  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyLog()); };

  const sorted = [...logs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const approvedCount = logs.filter((x) => x.committeeApproved).length;
  const updatedCount = logs.filter((x) => x.dataUpdated).length;
  const doneCount = logs.filter((x) => x.committeeApproved && x.dataUpdated).length;

  return (
    <div>
      {/* サマリー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '1.25rem' }}>
        {[
          { label: '総件数', value: logs.length, color: '#0f172a' },
          { label: '委員会承認済', value: approvedCount, color: '#16a34a' },
          { label: 'データ更新済', value: updatedCount, color: '#1d6fd4' },
          { label: '完了', value: doneCount, color: '#64748b' },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 凡例 */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {[
          { bg: '#f0fdf4', border: '#bbf7d0', label: '委員会承認済' },
          { bg: '#eff6ff', border: '#bfdbfe', label: 'データ更新済' },
          { bg: '#f8fafc', border: '#e2e8f0', label: '完了（両方）' },
        ].map((l) => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: l.bg, border: `1px solid ${l.border}` }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* フォーム */}
      {showForm && (
        <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>
            {editId ? '編集' : '新規更新ログ登録'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelS}>更新日時 *</label>
                <input style={inp} type="date" value={form.updatedAt} required
                  onChange={(e) => setForm({ ...form, updatedAt: e.target.value })} />
              </div>
              <div>
                <label style={labelS}>章 *</label>
                <input style={inp} value={form.chapter} placeholder="例: 第3章 初動対応" required
                  onChange={(e) => setForm({ ...form, chapter: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelS}>内容要約 *</label>
              <TextareaWithCount value={form.summary} onChange={(v) => setForm({ ...form, summary: v })}
                placeholder="更新内容を要約してください" />
            </div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.committeeApproved}
                  onChange={(e) => setForm({ ...form, committeeApproved: e.target.checked })} />
                委員会での周知承認
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.dataUpdated}
                  onChange={(e) => setForm({ ...form, dataUpdated: e.target.checked })} />
                データ更新済
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={btnPrimary}>{editId ? '更新' : '登録'}</button>
              <button type="button" style={btnSecondary} onClick={cancelForm}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* ツールバー */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button style={btnPrimary} onClick={() => { showForm ? cancelForm() : setShowForm(true); }}>
          {showForm ? 'キャンセル' : '+ 新規登録'}
        </button>
      </div>

      {/* リスト */}
      {sorted.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          登録データがありません
        </div>
      ) : (
        sorted.map((item) => (
          <div key={item.id} style={{
            backgroundColor: logRowBg(item), border: `1px solid ${logRowBorder(item)}`,
            borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{item.updatedAt}</span>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{item.chapter}</span>
                  {item.committeeApproved && (
                    <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                      委員会承認済
                    </span>
                  )}
                  {item.dataUpdated && (
                    <span style={{ fontSize: '11px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                      データ更新済
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{item.summary}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={btnEdit} onClick={() => openEdit(item)}>編集</button>
                  <button style={btnDanger} onClick={() => deleteItem(item.id)}>削除</button>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={item.committeeApproved}
                      onChange={(e) => toggleField(item.id, 'committeeApproved', e.target.checked)} />
                    委員会承認
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={item.dataUpdated}
                      onChange={(e) => toggleField(item.id, 'dataUpdated', e.target.checked)} />
                    データ更新済
                  </label>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// タブ2: 更新履歴一覧
// ══════════════════════════════════════════════════════════
function LogHistoryTab() {
  const [logs, setLogs] = useState<ManualLog[]>([]);
  const [filterChapter, setFilterChapter] = useState('全て');
  const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'pending'>('all');
  const [modalItem, setModalItem] = useState<ManualLog | null>(null);

  useEffect(() => { setLogs(logStorage.getAll()); }, []);

  const allChapters = ['全て', ...Array.from(new Set(logs.map((x) => x.chapter)))];
  const filtered = logs
    .filter((x) => filterChapter === '全て' || x.chapter === filterChapter)
    .filter((x) => {
      if (filterApproval === 'approved') return x.committeeApproved;
      if (filterApproval === 'pending') return !x.committeeApproved;
      return true;
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div>
      {/* フィルター */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ ...labelS, margin: 0, whiteSpace: 'nowrap' }}>章</label>
          <select style={{ ...inp, width: 'auto', minWidth: '160px' }} value={filterChapter}
            onChange={(e) => setFilterChapter(e.target.value)}>
            {allChapters.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ ...labelS, margin: 0, whiteSpace: 'nowrap' }}>承認状態</label>
          <select style={{ ...inp, width: 'auto', minWidth: '120px' }} value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value as 'all' | 'approved' | 'pending')}>
            <option value="all">全て</option>
            <option value="approved">承認済み</option>
            <option value="pending">未承認</option>
          </select>
        </div>
        <span style={{ fontSize: '12px', color: '#94a3b8', marginLeft: 'auto' }}>{filtered.length}件</span>
      </div>

      {/* リスト */}
      {filtered.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          該当するデータがありません
        </div>
      ) : (
        filtered.map((item) => (
          <div key={item.id}
            onClick={() => setModalItem(item)}
            style={{
              backgroundColor: logRowBg(item), border: `1px solid ${logRowBorder(item)}`,
              borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '8px',
              cursor: 'pointer', transition: 'box-shadow 0.15s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', minWidth: '90px' }}>{item.updatedAt}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>{item.chapter}</span>
              <span style={{ fontSize: '12px', color: '#64748b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.summary}</span>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                {item.committeeApproved && (
                  <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                    委員会承認済
                  </span>
                )}
                {item.dataUpdated && (
                  <span style={{ fontSize: '11px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                    データ更新済
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* 詳細モーダル */}
      {modalItem && (
        <div
          onClick={() => setModalItem(null)}
          style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white', borderRadius: '16px', padding: '2rem',
              maxWidth: '560px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div>
                <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', letterSpacing: '0.08em', margin: '0 0 4px' }}>
                  更新日: {modalItem.updatedAt}
                </p>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{modalItem.chapter}</h3>
              </div>
              <button onClick={() => setModalItem(null)} style={{ ...btnSecondary, padding: '6px 12px', fontSize: '12px' }}>
                閉じる
              </button>
            </div>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{modalItem.summary}</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: modalItem.committeeApproved ? '#16a34a' : '#d1d5db' }} />
                <span style={{ color: modalItem.committeeApproved ? '#16a34a' : '#94a3b8' }}>
                  委員会承認{modalItem.committeeApproved ? '済' : '未'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: modalItem.dataUpdated ? '#1d6fd4' : '#d1d5db' }} />
                <span style={{ color: modalItem.dataUpdated ? '#1d6fd4' : '#94a3b8' }}>
                  データ更新{modalItem.dataUpdated ? '済' : '未'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// タブ3: 検証事項・決議
// ══════════════════════════════════════════════════════════
function emptyVer() {
  return { topic: '', resolution: '' };
}

function VerificationTab() {
  const [items, setItems] = useState<ManualVerification[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyVer());

  useEffect(() => { setItems(verificationStorage.getAll()); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic) return;
    const now = nowISO();
    if (editId) {
      verificationStorage.update(editId, { ...form });
      setItems((prev) => prev.map((x) => x.id === editId ? { ...x, ...form, updatedAt: now } : x));
      setEditId(null);
    } else {
      const newItem: ManualVerification = { id: genId(), ...form, recordedAt: now, createdAt: now, updatedAt: now };
      verificationStorage.add(newItem);
      setItems((prev) => [...prev, newItem]);
    }
    setForm(emptyVer());
    setShowForm(false);
  };

  const openEdit = (item: ManualVerification) => {
    setForm({ topic: item.topic, resolution: item.resolution });
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = (id: string) => {
    if (!confirm('削除しますか？')) return;
    verificationStorage.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyVer()); };

  const sorted = [...items].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));

  return (
    <div>
      {/* フォーム */}
      {showForm && (
        <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>
            {editId ? '編集' : '新規登録'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={labelS}>検証事項 *</label>
              <TextareaWithCount value={form.topic} onChange={(v) => setForm({ ...form, topic: v })}
                placeholder="検証が必要な事項を記述してください" rows={4} />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={labelS}>委員会での決議</label>
              <TextareaWithCount value={form.resolution} onChange={(v) => setForm({ ...form, resolution: v })}
                placeholder="委員会での決議内容を記述してください" rows={4} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={btnPrimary}>{editId ? '更新' : '登録'}</button>
              <button type="button" style={btnSecondary} onClick={cancelForm}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* ツールバー */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button style={btnPrimary} onClick={() => { showForm ? cancelForm() : setShowForm(true); }}>
          {showForm ? 'キャンセル' : '+ 新規登録'}
        </button>
      </div>

      {/* リスト */}
      {sorted.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          登録データがありません
        </div>
      ) : (
        sorted.map((item) => (
          <div key={item.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                記録日時: {formatDateTime(item.recordedAt)}
              </span>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button style={btnEdit} onClick={() => openEdit(item)}>編集</button>
                <button style={btnDanger} onClick={() => deleteItem(item.id)}>削除</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', margin: '0 0 6px', letterSpacing: '0.04em' }}>検証事項</p>
                <div style={{ backgroundColor: '#fef9c3', border: '1px solid #fef08a', borderRadius: '8px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '13px', color: '#0f172a', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{item.topic}</p>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', margin: '0 0 6px', letterSpacing: '0.04em' }}>委員会での決議</p>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 12px', minHeight: '60px' }}>
                  <p style={{ fontSize: '13px', color: '#0f172a', margin: 0, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {item.resolution || <span style={{ color: '#94a3b8' }}>未記入</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// タブ4: 最新版マニュアル
// ══════════════════════════════════════════════════════════
function ManualLinkTab() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedUrl = manualMeta.getUrl();
    const storedTitle = manualMeta.getTitle();
    setUrl(storedUrl);
    setTitle(storedTitle);
    setUrlInput(storedUrl);
    setTitleInput(storedTitle);

    const logs = logStorage.getAll();
    if (logs.length > 0) {
      const latest = logs.reduce((a, b) => a.updatedAt > b.updatedAt ? a : b);
      setLastUpdated(latest.updatedAt);
    }
  }, []);

  const handleSave = () => {
    manualMeta.setUrl(urlInput);
    manualMeta.setTitle(titleInput);
    setUrl(urlInput);
    setTitle(titleInput);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      {/* 管理設定（折りたたみ） */}
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', marginBottom: '1.5rem', overflow: 'hidden' }}>
        <button
          onClick={() => setShowSettings((v) => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: '600', color: '#475569',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke="#94a3b8" strokeWidth="1.5"/>
              <path d="M7 4.5v3l2 1.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            管理設定を開く
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: showSettings ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <path d="M2 4l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {showSettings && (
          <div style={{ borderTop: '1px solid #f1f5f9', padding: '1.25rem 1.5rem', backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', maxWidth: '480px' }}>
              <div>
                <label style={labelS}>マニュアルURL（Google Drive等）</label>
                <input style={inp} type="url" value={urlInput} placeholder="https://..."
                  onChange={(e) => setUrlInput(e.target.value)} />
              </div>
              <div>
                <label style={labelS}>表示名</label>
                <input style={inp} value={titleInput} placeholder="例: 2025年度版 災害対策BCPマニュアル"
                  onChange={(e) => setTitleInput(e.target.value)} />
              </div>
              <div>
                <button style={btnPrimary} onClick={handleSave}>URLを保存</button>
                {saved && <span style={{ marginLeft: '12px', fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>保存しました</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* メインエリア */}
      {url ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 1rem' }}>
              <rect x="8" y="6" width="28" height="36" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1.5"/>
              <path d="M14 16h20M14 22h16M14 28h12" stroke="#1d6fd4" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {title && (
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                {title}
              </h2>
            )}
            {lastUpdated && (
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                最終更新: {lastUpdated}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '10px',
                backgroundColor: '#1d6fd4', color: 'white',
                fontSize: '14px', fontWeight: '700', textDecoration: 'none',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3H3a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1v-3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M10 2h4v4M14 2l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              マニュアルを開く
            </a>
            <button
              onClick={() => { const w = window.open(url, '_blank'); w?.print(); }}
              style={{ ...btnSecondary, display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: '700' }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 5V2h8v3" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="2" y="5" width="12" height="7" rx="1.5" stroke="#475569" strokeWidth="1.5"/>
                <path d="M4 9h8M4 12h8" stroke="#475569" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              印刷
            </button>
          </div>
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', border: '2px dashed #e2e8f0', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" style={{ margin: '0 auto 1rem' }}>
            <circle cx="20" cy="20" r="16" fill="#f1f5f9"/>
            <path d="M20 12v8M20 24v2" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#64748b', margin: '0 0 6px' }}>
            マニュアルURLが未設定です
          </p>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 1.25rem' }}>
            管理設定からURLを設定してください
          </p>
          <button style={{ ...btnSecondary, fontSize: '13px' }} onClick={() => setShowSettings(true)}>
            管理設定を開く
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// メインページ
// ══════════════════════════════════════════════════════════
export default function ManualPage() {
  const [tab, setTab] = useState<'log' | 'history' | 'verification' | 'link'>('log');

  const TABS = [
    { key: 'log' as const, label: '更新ログ入力' },
    { key: 'history' as const, label: '更新履歴一覧' },
    { key: 'verification' as const, label: '検証事項・決議' },
    { key: 'link' as const, label: '最新版マニュアル' },
  ];

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ページヘッダー */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            Manual Division
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
            マニュアル班 — 改訂・更新管理
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            災害対策マニュアルの改訂ログ管理・検証事項の記録
          </p>
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '4px', marginBottom: '1.5rem', width: 'fit-content', flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600', transition: 'all 0.15s',
              backgroundColor: tab === t.key ? '#1d6fd4' : 'transparent',
              color: tab === t.key ? 'white' : '#64748b',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        {tab === 'log' && <LogInputTab />}
        {tab === 'history' && <LogHistoryTab />}
        {tab === 'verification' && <VerificationTab />}
        {tab === 'link' && <ManualLinkTab />}
      </div>
    </main>
  );
}
