'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main style={{
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <h1>🏥 災害対策委員会管理システム</h1>
      <p>三重中央医療センター 統合管理ダッシュボード</p>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/training" style={{
          padding: '1rem 2rem',
          backgroundColor: '#3b82f6',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          fontWeight: 'bold'
        }}>
          📋 訓練班
        </Link>
      </div>
    </main>
  );
}
