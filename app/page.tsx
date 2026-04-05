'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { MODULES } from './_config/modules';

const TRAINING_DATE_KEY = 'next_training_date';

export default function Home() {
  const [nextTrainingDate, setNextTrainingDate] = useState('');
  const [editingDate, setEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState('');

  // localStorageから次回訓練日を読み込み
  useEffect(() => {
    const saved = localStorage.getItem(TRAINING_DATE_KEY);
    if (saved) setNextTrainingDate(saved);
  }, []);

  const saveDate = () => {
    localStorage.setItem(TRAINING_DATE_KEY, tempDate);
    setNextTrainingDate(tempDate);
    setEditingDate(false);
  };

  const cancelEdit = () => {
    setTempDate(nextTrainingDate);
    setEditingDate(false);
  };

  // 次回訓練まで何日か計算
  const daysUntilTraining = (): { value: string; sub: string; warn: boolean } => {
    if (!nextTrainingDate) return { value: '未設定', sub: '下のボタンから日程を入力', warn: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(nextTrainingDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { value: '終了', sub: `${nextTrainingDate} 実施済み`, warn: false };
    if (diff === 0) return { value: '本日', sub: `${nextTrainingDate} 開催日`, warn: false };
    if (diff <= 30) return { value: `${diff}日`, sub: `${nextTrainingDate} まで`, warn: true };
    return { value: `${diff}日`, sub: `${nextTrainingDate} まで`, warn: false };
  };

  const training = daysUntilTraining();

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

        {/* ステータスカード（2枚） */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '2rem' }}>

          {/* 次回訓練まで */}
          <div style={{ backgroundColor: 'white', border: `1px solid ${training.warn ? '#fecaca' : '#e2e8f0'}`, borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', marginBottom: '8px', letterSpacing: '0.02em' }}>
              次回訓練まで
            </p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: training.warn ? '#ef4444' : '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
              {training.value}
            </p>
            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{training.sub}</p>

            {/* 日程入力 */}
            <div style={{ marginTop: '12px' }}>
              {editingDate ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="date"
                    value={tempDate}
                    onChange={(e) => setTempDate(e.target.value)}
                    style={{ padding: '5px 8px', fontSize: '12px', border: '1px solid #bfdbfe', borderRadius: '6px', outline: 'none' }}
                  />
                  <button onClick={saveDate} style={{ padding: '5px 12px', backgroundColor: '#1d6fd4', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    保存
                  </button>
                  <button onClick={cancelEdit} style={{ padding: '5px 10px', backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setTempDate(nextTrainingDate); setEditingDate(true); }}
                  style={{ padding: '5px 12px', backgroundColor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                >
                  {nextTrainingDate ? '日程を変更' : '日程を入力'}
                </button>
              )}
            </div>
          </div>

          {/* 未達成目標（DB連携後） */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', marginBottom: '8px', letterSpacing: '0.02em' }}>
              未達成目標
            </p>
            <p style={{ fontSize: '28px', fontWeight: '700', color: '#cbd5e1', margin: 0, letterSpacing: '-0.03em' }}>
              —
            </p>
            <p style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>データベース連携後に自動集計</p>
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontSize: '11px', color: '#cbd5e1', padding: '3px 8px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                準備中
              </span>
            </div>
          </div>

        </div>

        {/* モジュールカード */}
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '1rem', letterSpacing: '0.03em' }}>
            管理モジュール
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {MODULES.map((m) => {
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