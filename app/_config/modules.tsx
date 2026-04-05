import { ReactNode } from 'react';

export interface ModuleConfig {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
  color: string;
  bg: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  active: boolean;
}

export const MODULES: ModuleConfig[] = [
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
    href: '/supplies',
    label: '物品管理班',
    description: '災害対策物品BOXの在庫確認・点検記録・補充管理',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="3" width="16" height="16" rx="3" stroke="#1d6fd4" strokeWidth="1.8"/>
        <path d="M8 11L10.5 13.5L15 8.5" stroke="#1d6fd4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
    href: '/manual',
    label: 'マニュアル班',
    description: '災害対策マニュアルの改訂ログ管理・検証事項の記録',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="4" y="2" width="12" height="18" rx="2" stroke="#1d6fd4" strokeWidth="1.8"/>
        <line x1="7" y1="7" x2="13" y2="7" stroke="#1d6fd4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="7" y1="10" x2="13" y2="10" stroke="#1d6fd4" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="7" y1="13" x2="11" y2="13" stroke="#1d6fd4" strokeWidth="1.5" strokeLinecap="round"/>
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
  {
    href: '/study',
    label: '勉強会班',
    description: '勉強会の開催記録・予定管理',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 6h14M4 10h10M4 14h12M4 18h8" stroke="#1d6fd4" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="17" cy="16" r="3" stroke="#1d6fd4" strokeWidth="1.6"/>
        <path d="M17 15v1.5l1 1" stroke="#1d6fd4" strokeWidth="1.4" strokeLinecap="round"/>
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
    href: '/team',
    label: 'チーム会班',
    description: '各部署のシミュレーション実施記録と予定を管理します',
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="8" cy="7" r="3" stroke="#1d6fd4" strokeWidth="1.8"/>
        <circle cx="15" cy="7" r="3" stroke="#1d6fd4" strokeWidth="1.8"/>
        <path d="M2 18c0-3 2.7-5 6-5s6 2 6 5" stroke="#1d6fd4" strokeWidth="1.8" strokeLinecap="round"/>
        <path d="M15 13c2.5 0 5 1.5 5 5" stroke="#1d6fd4" strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    ),
    color: '#1d6fd4',
    bg: '#eff6ff',
    badge: '稼働中',
    badgeBg: '#dbeafe',
    badgeColor: '#1e40af',
    active: true,
  },
];
