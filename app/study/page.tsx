'use client';

import { useState } from 'react';

type StudyStatus = 'upcoming' | 'done';

interface StudySession {
  id: string;
  date: string;
  title: string;
  description: string;
  speaker: string;
  status: StudyStatus;
}

const STATUS_MAP: Record<StudyStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: '予定', color: '#1d6fd4', bg: '#eff6ff' },
  done:     { label: '済み', color: '#16a34a', bg: '#dcfce7' },
};

function emptyForm() {
  return { date: '', title: '', description: '', speaker: '', status: 'upcoming' as StudyStatus };
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 11px', fontSize: '13px',
  border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
  fontFamily: 'inherit', color: '#0f172a', backgroundColor: 'white', boxSizing: 'border-box',
};

const labelS: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  color: '#64748b', marginBottom: '5px', letterSpacing: '0.03em',
};

export default function StudyPage() {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [filter, setFilter] = useState<'all' | StudyStatus>('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const filtered = sessions.filter((s) =>
    filter === 'all' ? true : s.status === filter
  );
  const upcomingCount = sessions.filter((s) => s.status === 'upcoming').length;
  const doneCount     = sessions.filter((s) => s.status === 'done').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.date) return;
    if (editId) {
      setSessions((prev) => prev.map((s) => s.id === editId ? { ...s, ...form } : s));
      setEditId(null);
    } else {
      setSessions((prev) => [...prev, { id: Date.now().toString(), ...form }]);
    }
    setForm(emptyForm());
    setShowForm(false);
  };

  const openEdit = (session: StudySession) => {
    setForm({ date: session.date, title: session.title, description: session.description, speaker: session.speaker, status: session.status });
    setEditId(session.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm()); };

  const deleteSession = (id: string) => {
    if (!confirm('この勉強会を削除しますか？')) return;
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ページヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Study Session Division</p>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.02em' }}>勉強会班 — 開催記録・予定管理</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>災害対策に関する勉強会の開催記録と今後の予定を管理します</p>
          </div>
          <button onClick={() => showForm ? cancelForm() : setShowForm(true)} style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px',
            borderRadius: '9px', border: 'none', cursor: 'pointer',
            backgroundColor: showForm ? '#f1f5f9' : '#1d6fd4',
            color: showForm ? '#475569' : 'white',
            fontSize: '13px', fontWeight: '600',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d={showForm ? 'M2 7h10' : 'M7 2v10M2 7h10'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {showForm ? 'キャンセル' : '新規登録'}
          </button>
        </div>

        {/* サマリー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1.5rem' }}>
          {[
            { label: '全勉強会', value: sessions.length, color: '#0f172a' },
            { label: '予定',     value: upcomingCount,   color: '#1d6fd4' },
            { label: '済み',     value: doneCount,       color: '#16a34a' },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 5px' }}>{s.label}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: s.color, margin: 0, letterSpacing: '-0.03em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* 登録・編集フォーム */}
        {showForm && (
          <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>
              {editId ? 'タスクを編集' : '新規勉強会を登録'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '1rem' }}>
                <div>
                  <label style={labelS}>開催日 *</label>
                  <input style={inp} type="date" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <label style={labelS}>担当</label>
                  <input style={inp} type="text" placeholder="例：訓練班" value={form.speaker}
                    onChange={(e) => setForm({ ...form, speaker: e.target.value })} />
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelS}>タイトル *</label>
                <input style={inp} type="text" placeholder="例：AED・心肺蘇生法の実技練習" value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelS}>内容</label>
                <textarea style={{ ...inp, minHeight: '72px', resize: 'vertical', lineHeight: '1.6' }}
                  placeholder="勉強会の内容・目的など" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelS}>状態</label>
                <select style={inp} value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as StudyStatus })}>
                  <option value="upcoming">予定</option>
                  <option value="done">済み</option>
                </select>
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

        {/* フィルター */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem' }}>
          {(['all', 'upcoming', 'done'] as const).map((f) => {
            const labels = { all: 'すべて', upcoming: '予定', done: '済み' };
            const isActive = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 14px', borderRadius: '8px', border: '1px solid',
                borderColor: isActive ? '#bfdbfe' : '#e2e8f0',
                backgroundColor: isActive ? '#eff6ff' : 'white',
                color: isActive ? '#1d6fd4' : '#64748b',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* テーブル */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              {sessions.length === 0 ? '「新規登録」から勉強会を追加してください' : '該当する勉強会がありません'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['開催日', 'タイトル', '内容', '担当', '状態', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((session, i) => {
                  const st = STATUS_MAP[session.status];
                  return (
                    <tr key={session.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none', backgroundColor: 'white' }}>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>{session.date}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{session.title}</span>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>{session.description}</td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>{session.speaker}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', backgroundColor: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => openEdit(session)} style={{ padding: '4px 10px', border: '1px solid #bfdbfe', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#1d6fd4', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>編集</button>
                          <button onClick={() => deleteSession(session.id)} style={{ padding: '4px 10px', border: '1px solid #fecaca', borderRadius: '6px', backgroundColor: 'white', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>削除</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </main>
  );
}