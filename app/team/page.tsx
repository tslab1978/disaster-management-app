'use client';

import { useState, useEffect } from 'react';

type TeamStatus = 'upcoming' | 'done';
type FilterType = 'all' | TeamStatus | 'unimplemented';

interface TeamSession {
  id: string;
  date: string;
  undecided: boolean;
  department: string;
  content: string;
  proposal: string;
  implemented: boolean;
  status: TeamStatus;
}

const STATUS_MAP: Record<TeamStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: '予定', color: '#1d6fd4', bg: '#eff6ff' },
  done:     { label: '済み', color: '#16a34a', bg: '#dcfce7' },
};

function emptyForm() {
  return {
    date: '',
    undecided: false,
    department: '',
    content: '',
    proposal: '',
    implemented: false,
    status: 'upcoming' as TeamStatus,
  };
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

export default function TeamPage() {
  const [sessions, setSessions] = useState<TeamSession[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const STORAGE_KEY = 'team_sessions_v1';

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setSessions(JSON.parse(raw));
  }, []);

  const saveToStorage = (next: TeamSession[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const filtered = sessions.filter((s) => {
    if (filter === 'upcoming') return s.status === 'upcoming';
    if (filter === 'done') return s.status === 'done';
    if (filter === 'unimplemented') return s.proposal !== '' && !s.implemented;
    return true;
  });

  const upcomingCount      = sessions.filter((s) => s.status === 'upcoming').length;
  const doneCount          = sessions.filter((s) => s.status === 'done').length;
  const unimplementedCount = sessions.filter((s) => s.proposal !== '' && !s.implemented).length;
  const departmentCount    = new Set(sessions.map((s) => s.department).filter(Boolean)).size;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.department || !form.content) return;
    if (editId) {
      const next = sessions.map((s) => s.id === editId ? { ...s, ...form } : s);
      setSessions(next);
      saveToStorage(next);
      setEditId(null);
    } else {
      const next = [...sessions, { id: Date.now().toString(), ...form }];
      setSessions(next);
      saveToStorage(next);
    }
    setForm(emptyForm());
    setShowForm(false);
  };

  const openEdit = (session: TeamSession) => {
    setForm({
      date: session.date,
      undecided: session.undecided,
      department: session.department,
      content: session.content,
      proposal: session.proposal,
      implemented: session.implemented,
      status: session.status,
    });
    setEditId(session.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyForm()); };

  const deleteSession = (id: string) => {
    if (!confirm('この記録を削除しますか？')) return;
    const next = sessions.filter((s) => s.id !== id);
    setSessions(next);
    saveToStorage(next);
  };

  const toggleStatus = (id: string) => {
    const next = sessions.map((s) =>
      s.id === id ? { ...s, status: (s.status === 'upcoming' ? 'done' : 'upcoming') as TeamStatus } : s
    );
    setSessions(next);
    saveToStorage(next);
  };

  const toggleImplemented = (id: string) => {
    const next = sessions.map((s) =>
      s.id === id ? { ...s, implemented: !s.implemented } : s
    );
    setSessions(next);
    saveToStorage(next);
  };

  const filterLabels: Record<FilterType, string> = {
    all: 'すべて', upcoming: '予定', done: '済み', unimplemented: '未実装の提案',
  };

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ページヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Team Meeting Division</p>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.02em' }}>チーム会班 — シミュレーション管理</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>各部署のシミュレーション実施記録と予定を管理します</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '1.5rem' }}>
          {[
            { label: '全記録',     value: sessions.length,   color: '#0f172a' },
            { label: '予定',       value: upcomingCount,     color: '#1d6fd4' },
            { label: '済み',       value: doneCount,         color: '#16a34a' },
            { label: '未実装の提案', value: unimplementedCount, color: '#d97706' },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 5px' }}>{s.label}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: s.color, margin: 0, letterSpacing: '-0.03em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* フォーム */}
        {showForm && (
          <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>
              {editId ? 'タスクを編集' : '新規シミュレーションを登録'}
            </h3>
            <form onSubmit={handleSubmit}>

              {/* 実施日 */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelS}>実施日</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input style={{ ...inp, width: 'auto' }} type="date" value={form.date}
                    disabled={form.undecided}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.undecided}
                      onChange={(e) => setForm({ ...form, undecided: e.target.checked, date: e.target.checked ? '' : form.date })} />
                    日程未定
                  </label>
                </div>
              </div>

              {/* 部署名 */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelS}>部署名 *</label>
                <input style={inp} type="text" placeholder="例：看護部、薬剤部" value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })} required />
              </div>

              {/* 内容 */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelS}>内容 * （30文字以内）</label>
                <input style={inp} type="text" placeholder="シミュレーションの内容" maxLength={30} value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })} required />
                <p style={{ fontSize: '11px', color: form.content.length >= 28 ? '#ef4444' : '#94a3b8', margin: '4px 0 0', textAlign: 'right' }}>
                  {form.content.length}/30
                </p>
              </div>

              {/* マニュアル班への提案 */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={labelS}>マニュアル班への提案（100文字以内・任意）</label>
                <textarea style={{ ...inp, minHeight: '72px', resize: 'vertical', lineHeight: '1.6' }}
                  placeholder="マニュアルへの反映を提案する内容があれば記入してください" maxLength={100} value={form.proposal}
                  onChange={(e) => setForm({ ...form, proposal: e.target.value })} />
                <p style={{ fontSize: '11px', color: form.proposal.length >= 90 ? '#ef4444' : '#94a3b8', margin: '4px 0 0', textAlign: 'right' }}>
                  {form.proposal.length}/100
                </p>
              </div>

              {/* 状態 */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelS}>状態</label>
                <select style={inp} value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as TeamStatus })}>
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
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {(['all', 'upcoming', 'done', 'unimplemented'] as const).map((f) => {
            const isActive = filter === f;
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 14px', borderRadius: '8px', border: '1px solid',
                borderColor: isActive ? (f === 'unimplemented' ? '#fde68a' : '#bfdbfe') : '#e2e8f0',
                backgroundColor: isActive ? (f === 'unimplemented' ? '#fef3c7' : '#eff6ff') : 'white',
                color: isActive ? (f === 'unimplemented' ? '#d97706' : '#1d6fd4') : '#64748b',
                fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {filterLabels[f]}
                {f === 'unimplemented' && unimplementedCount > 0 && (
                  <span style={{ marginLeft: '6px', backgroundColor: '#d97706', color: 'white', borderRadius: '10px', padding: '1px 6px', fontSize: '10px' }}>
                    {unimplementedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* テーブル */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              {sessions.length === 0 ? '「新規登録」からシミュレーションを追加してください' : '該当する記録がありません'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['実施日', '部署名', '内容', 'マニュアル班への提案', '実装済み', '状態', ''].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((session, i) => {
                  const st = STATUS_MAP[session.status];
                  const hasProposal = session.proposal !== '';
                  return (
                    <tr key={session.id} style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none',
                      backgroundColor: filter === 'unimplemented' ? '#fffbeb' : 'white',
                    }}>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {session.undecided ? (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>日程未定</span>
                        ) : session.date}
                      </td>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {session.department}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                        {session.content}
                      </td>
                      <td style={{ padding: '12px', fontSize: '12px', maxWidth: '200px' }}>
                        {hasProposal ? (
                          <span style={{ color: '#64748b', lineHeight: 1.6 }}>{session.proposal}</span>
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {hasProposal ? (
                          <input type="checkbox" checked={session.implemented}
                            onChange={() => toggleImplemented(session.id)}
                            style={{ width: '16px', height: '16px', accentColor: '#16a34a', cursor: 'pointer' }} />
                        ) : (
                          <span style={{ color: '#e2e8f0' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => toggleStatus(session.id)} style={{
                          fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px',
                          backgroundColor: st.bg, color: st.color,
                          border: 'none', cursor: 'pointer',
                        }}>
                          {st.label}
                        </button>
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