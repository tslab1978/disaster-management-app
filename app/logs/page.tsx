'use client';

import { useEffect, useState } from 'react';
import { getLogs, CommitteeLog } from '@/lib/storage';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function oneMonthAgoStr() {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

const CATEGORY_LABELS: Record<string, string> = {
  training: '訓練班',
  supplies_box: '物品班（BOX）',
  supplies_whiteboard: '物品班（WB）',
  supplies_request: '物品班（請求）',
  manual: 'マニュアル班',
  study: '勉強会班',
  team: 'チーム会班',
};

const ACTION_LABELS: Record<string, string> = {
  completed: '完了',
  in_progress: '進行中',
  pending: '未着手',
  done: '済み',
  upcoming: '予定に戻す',
  'replenishmentDone:true': '補充完了',
  'replenishmentDone:false': '補充完了を解除',
  'inventoryChecked:true': '棚卸確認済',
  'inventoryChecked:false': '棚卸確認を解除',
  'requested:true': '請求済',
  'requested:false': '請求済を解除',
  'deliveryDecided:true': '納品決定',
  'deliveryDecided:false': '納品決定を解除',
  'committeeApproved:true': '委員会承認済',
  'committeeApproved:false': '委員会承認を解除',
  'dataUpdated:true': 'データ更新済',
  'dataUpdated:false': 'データ更新を解除',
  'implemented:true': '実装済',
  'implemented:false': '実装済を解除',
};

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  training:              { bg: '#eff6ff', color: '#1d6fd4' },
  supplies_box:          { bg: '#fef3c7', color: '#d97706' },
  supplies_whiteboard:   { bg: '#fef3c7', color: '#d97706' },
  supplies_request:      { bg: '#fef3c7', color: '#d97706' },
  manual:                { bg: '#f0fdf4', color: '#16a34a' },
  study:                 { bg: '#fdf4ff', color: '#9333ea' },
  team:                  { bg: '#fff7ed', color: '#ea580c' },
};

const inp: React.CSSProperties = {
  padding: '8px 11px', fontSize: '13px', border: '1px solid #e2e8f0',
  borderRadius: '8px', outline: 'none', fontFamily: 'inherit',
  color: '#0f172a', backgroundColor: 'white', boxSizing: 'border-box',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<CommitteeLog[]>([]);
  const [dateFrom, setDateFrom] = useState(oneMonthAgoStr());
  const [dateTo, setDateTo] = useState(todayStr());
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => { setLogs(getLogs()); }, []);

  // フィルター適用
  const filtered = logs
    .filter(l => l.timestamp.slice(0, 10) >= dateFrom && l.timestamp.slice(0, 10) <= dateTo)
    .filter(l => categoryFilter === 'all' || l.category === categoryFilter)
    .filter(l => {
      if (!searchText) return true;
      const q = searchText.toLowerCase();
      return (
        l.taskName.toLowerCase().includes(q) ||
        (ACTION_LABELS[l.action] ?? l.action).toLowerCase().includes(q) ||
        (CATEGORY_LABELS[l.category] ?? l.category).toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const totalLogs = logs.length;

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ページヘッダー */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            Activity Log
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
            活動ログ
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            各班の状態変更履歴を記録・検索できます
          </p>
        </div>

        {/* サマリー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '1.5rem' }}>
          {[
            { label: '蓄積ログ総数', value: totalLogs, color: '#0f172a' },
            { label: '表示中', value: filtered.length, color: '#1d6fd4' },
            { label: '訓練班', value: logs.filter(l => l.category === 'training').length, color: '#1d6fd4' },
            { label: '物品班', value: logs.filter(l => l.category.startsWith('supplies')).length, color: '#d97706' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 5px' }}>{s.label}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* 検索・フィルターバー */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>

            {/* 期間指定 */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', margin: '0 0 5px' }}>期間</p>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inp} />
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>〜</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inp} />
              </div>
            </div>

            {/* カテゴリフィルター */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', margin: '0 0 5px' }}>班</p>
              <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
                style={{ ...inp, minWidth: '160px' }}>
                <option value="all">すべての班</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* テキスト検索 */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', margin: '0 0 5px' }}>テキスト検索</p>
              <input
                type="text"
                placeholder="タスク名・操作内容で検索..."
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ ...inp, width: '100%' }}
              />
            </div>

            {/* リセット */}
            <button
              onClick={() => { setDateFrom(oneMonthAgoStr()); setDateTo(todayStr()); setSearchText(''); setCategoryFilter('all'); }}
              style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              リセット
            </button>
          </div>
        </div>

        {/* ログ一覧テーブル */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              {totalLogs === 0
                ? '各班でステータス変更を行うとログが記録されます'
                : '条件に一致するログがありません'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['日時', '班', '対象', '変更内容'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const catColor = CATEGORY_COLORS[log.category] ?? { bg: '#f1f5f9', color: '#475569' };
                  return (
                    <tr key={log.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '10px 12px', color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', backgroundColor: catColor.bg, color: catColor.color }}>
                          {CATEGORY_LABELS[log.category] ?? log.category}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>
                        {log.taskName}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#16a34a' }}>
                          {ACTION_LABELS[log.action] ?? log.action}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && (
          <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right', marginTop: '8px' }}>
            {filtered.length}件表示 / 全{totalLogs}件
          </p>
        )}

      </div>
    </main>
  );
}
