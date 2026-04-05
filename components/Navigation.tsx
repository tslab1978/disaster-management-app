'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MODULES } from '@/app/_config/modules';

export default function Navigation() {
  const pathname = usePathname();
  const activeModules = MODULES.filter((m) => m.active && m.href !== '#');

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      height: '56px',
      padding: '0 1.5rem',
      backgroundColor: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
    }}>
      {/* ブランド */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '2rem' }}>
        <div style={{
          width: '30px', height: '30px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #1d6fd4 0%, #0f4fa8 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1.5L2.5 4.5V9C2.5 11.8 4.9 14.4 8 15C11.1 14.4 13.5 11.8 13.5 9V4.5L8 1.5Z" fill="white" fillOpacity="0.9"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
            三重中央医療センター
          </div>
          <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.2, letterSpacing: '0.02em' }}>
            災害対策委員会
          </div>
        </div>
      </div>

      {/* セパレーター */}
      <div style={{ width: '1px', height: '20px', backgroundColor: '#e2e8f0', marginRight: '1.5rem' }} />

      {/* ナビリンク（ダッシュボード固定 + modules.tsx の active なページ） */}
      <div style={{ display: 'flex', gap: '4px' }}>

        {/* ダッシュボードは固定 */}
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', borderRadius: '8px',
          fontSize: '13px',
          fontWeight: pathname === '/' ? '600' : '400',
          color: pathname === '/' ? '#1d6fd4' : '#475569',
          backgroundColor: pathname === '/' ? '#eff6ff' : 'transparent',
          textDecoration: 'none', transition: 'all 0.15s ease',
        }}>
          <span style={{ color: pathname === '/' ? '#1d6fd4' : '#94a3b8', display: 'flex' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.9"/>
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="currentColor" opacity="0.3"/>
            </svg>
          </span>
          ダッシュボード
        </Link>

        {/* modules.tsx から自動生成 */}
        {activeModules.map((m) => {
          const isActive = pathname === m.href;
          return (
            <Link key={m.href} href={m.href} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 12px', borderRadius: '8px',
              fontSize: '13px',
              fontWeight: isActive ? '600' : '400',
              color: isActive ? '#1d6fd4' : '#475569',
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              textDecoration: 'none', transition: 'all 0.15s ease',
            }}>
              <span style={{ color: isActive ? '#1d6fd4' : '#94a3b8', display: 'flex' }}>
                {m.icon}
              </span>
              {m.label}
            </Link>
          );
        })}
      </div>

      {/* 右側：日付 */}
      <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8' }}>
        {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}
      </div>
    </nav>
  );
}