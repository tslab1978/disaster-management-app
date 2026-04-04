'use client';

import Link from 'next/link';

const modules = [
  {
    href: '/training',
    label: '訓練班',
    description: '年間訓練計画の立案・進捗管理・ガントチャート表示',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="3" stroke="#1d6fd4" strokeWidth="1.8"/>
        <line x1="7" y1="8" x2="15" y2="8" stroke="#1d6fd4" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="7" y1="11" x2="13" y2="11" stroke="#1d6fd4" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="7" y1="14" x2="11" y2="14" stroke="#1d6fd4" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    color: '#1d6fd4',
    bg: '#eff6ff',
    badge: '稼働中',
    badgeBg: '#dbeafe',
    badgeColor: '#1e40af',
    active: true,
  },
  {
    href: '#',
    label: '物品管理班',
    description: '災害対策物品BOXの在庫確認・点検記録・補充管理',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="3" stroke="#94a3b8" strokeWidth="1.8"/>
        <path d="M8 11L10.5 13.5L15 8.5" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#94a3b8',
    bg: '#f8fafc',
    badge: '準備中',
    badgeBg: '#f1f5f9',
    badgeColor: '#64748b',
    active: false,
  },
  {
    href: '#',
    label: '情報班',
    description: '災害時の情報収集・伝達体制の管理',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8" stroke="#94a3b8" strokeWidth="1.8"/>
        <path d="M11 7v4l3 3" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    color: '#94a3b8',
    bg: '#f8fafc',
    badge: '準備中',
    badgeBg: '#f1f5f9',
    badgeColor: '#64748b',
    active: false,
  },
  {
    href: '#',
    label: '統括班',
    description: '委員会全体の進捗管理・報告書作成',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 3L4 7V12C4 15.9 7.1 19.5 11 20C14.9 19.5 18 15.9 18 12V7L11 3Z" stroke="#94a3b8" strokeWidth="1.8" strokeLinejoin="round"/>
      </svg>
    ),
    color: '#94a3b8',
    bg: '#f8fafc',
    badge: '準備中',
    badgeBg: '#f1f5f9',
    badgeColor: '#64748b',
    active: false,
  },
];

const stats = [
  { label: '今月のタスク', value: '—', sub: 'データ読み込み中' },
  { label: '完了率', value: '—', sub: 'データ読み込み中' },
  { label: '次回訓練まで', value: '—', sub: 'データ読み込み中' },
  { label: '期限超過', value: '—', sub: 'データ読み込み中', warn: true },
];

export default function Home() {
  return (
    <main style={{
      minHeight: 'calc(100vh - 56px)',
      backgroundColor: '#f8fafc',
      padding: '2.5rem 2rem',
      fontFamily: "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ヘッダー */}
        <div style={{ marginBottom: '2.5rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Disaster Management System
          </p>
          <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            統合管理ダッシュボード
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '0.4rem' }}>
            各班のタスク・進捗をここから管理できます
          </p>
        </div>

        {/* ステータスカード */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '2.5rem',
        }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              backgroundColor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
            }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', marginBottom: '8px', letterSpacing: '0.02em' }}>
                {s.label}
              </p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: s.warn ? '#ef4444' : '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
                {s.value}
              </p>
              <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* モジュールカード */}
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '1rem', letterSpacing: '0.03em' }}>
            管理モジュール
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
          }}>
            {modules.map((m) => {
              const inner = (
                <div style={{
                  backgroundColor: 'white',
                  border: `1px solid ${m.active ? '#bfdbfe' : '#e2e8f0'}`,
                  borderRadius: '14px',
                  padding: '1.5rem',
                  height: '100%',
                  boxSizing: 'border-box',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  opacity: m.active ? 1 : 0.65,
                  cursor: m.active ? 'pointer' : 'default',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '10px',
                      backgroundColor: m.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {m.icon}
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '3px 10px',
                      borderRadius: '999px', backgroundColor: m.badgeBg, color: m.badgeColor,
                    }}>
                      {m.badge}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 0.4rem', letterSpacing: '-0.01em' }}>
                    {m.label}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                    {m.description}
                  </p>
                  {m.active && (
                    <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '6px', color: '#1d6fd4', fontSize: '13px', fontWeight: '600' }}>
                      開く
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 7H11M8 4L11 7L8 10" stroke="#1d6fd4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              );

              return m.active ? (
                <Link key={m.label} href={m.href} style={{ textDecoration: 'none', display: 'block' }}>
                  {inner}
                </Link>
              ) : (
                <div key={m.label}>{inner}</div>
              );
            })}
          </div>
        </div>

        {/* フッター */}
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#cbd5e1', marginTop: '3rem' }}>
          三重中央医療センター 災害対策委員会管理システム
        </p>
      </div>
    </main>
  );
}
