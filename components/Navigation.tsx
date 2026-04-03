'use client';

import Link from 'next/link';

export default function Navigation() {
  return (
    <nav style={{
      display: 'flex',
      gap: '2rem',
      padding: '1rem 2rem',
      backgroundColor: '#f3f4f6',
      borderBottom: '1px solid #e5e7eb',
      alignItems: 'center',
    }}>
      <Link href="/" style={{ textDecoration: 'none', color: '#3b82f6', fontWeight: 'bold' }}>
        📊 ダッシュボード
      </Link>
      
      <Link href="/training" style={{ textDecoration: 'none', color: '#3b82f6', fontWeight: 'bold' }}>
        📋 訓練班
      </Link>
      
      <Link href="/equipment" style={{ textDecoration: 'none', color: '#3b82f6', fontWeight: 'bold' }}>
        🔧 機材班
      </Link>
      
      <Link href="/communications" style={{ textDecoration: 'none', color: '#3b82f6', fontWeight: 'bold' }}>
        📡 通信班
      </Link>
    </nav>
  );
}
