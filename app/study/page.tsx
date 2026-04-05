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

const initialSessions: StudySession[] = [
  {
    id: '1',
    date: '2026-04-10',
    title: '防災マップの読み方と避難経路の確認',
    description: '地域の防災マップを使った避難経路の確認方法を学びます。',
    speaker: '訓練班',
    status: 'upcoming',
  },
  {
    id: '2',
    date: '2026-03-15',
    title: 'AED・心肺蘇生法（CPR）実技練習',
    description: 'AEDの使い方と心肺蘇生法の実技練習を行いました。',
    speaker: '物品班',
    status: 'done',
  },
  {
    id: '3',
    date: '2026-05-20',
    title: '災害時の情報収集と連絡手段',
    description: '院内無線・トランシーバーを活用した情報収集の方法を学びます。',
    speaker: 'マニュアル班',
    status: 'upcoming',
  },
];

const STATUS_MAP: Record<StudyStatus, { label: string; color: string; bg: string }> = {
  upcoming: { label: '予定', color: '#1d6fd4', bg: '#eff6ff' },
  done:     { label: '済み', color: '#16a34a', bg: '#dcfce7' },
};

export default function StudyPage() {
  const [sessions] = useState<StudySession[]>(initialSessions);
  const [filter, setFilter] = useState<'all' | StudyStatus>('all');

  const filtered = sessions.filter((s) =>
    filter === 'all' ? true : s.status === filter
  );

  const upcomingCount = sessions.filter((s) => s.status === 'upcoming').length;
  const doneCount     = sessions.filter((s) => s.status === 'done').length;

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
        </div>

        {/* サマリー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1.5rem' }}>
          {[
            { label: '全勉強会', value: sessions.length,  color: '#0f172a' },
            { label: '予定',     value: upcomingCount,    color: '#1d6fd4' },
            { label: '済み',     value: doneCount,        color: '#16a34a' },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 5px' }}>{s.label}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: s.color, margin: 0, letterSpacing: '-0.03em' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* フィルター */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem' }}>
          {(['all', 'upcoming', 'done'] as const).map((f) => {
            const labels = { all: 'すべて', upcoming: '予定', done: '済み' };
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '7px 14px', borderRadius: '8px', border: '1px solid',
                  borderColor: isActive ? '#bfdbfe' : '#e2e8f0',
                  backgroundColor: isActive ? '#eff6ff' : 'white',
                  color: isActive ? '#1d6fd4' : '#64748b',
                  fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {labels[f]}
              </button>
            );
          })}
        </div>

        {/* カード一覧 */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              該当する勉強会がありません
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['開催日', 'タイトル', '内容', '担当', '状態'].map((h) => (
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
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {session.date}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>{session.title}</span>
                      </td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px', lineHeight: 1.6 }}>
                        {session.description}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {session.speaker}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px', backgroundColor: st.bg, color: st.color }}>
                          {st.label}
                        </span>
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