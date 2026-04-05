'use client'
import { useState, useEffect } from 'react'

// ── レポート生成ユーティリティ ──────────────────────────────
function generateReport(minutes: { title: string; body: string; updatedAt: string }): string {
  const baseDate = new Date(minutes.updatedAt)
  const baseDateStr = `${baseDate.getFullYear()}/${String(baseDate.getMonth()+1).padStart(2,'0')}/${String(baseDate.getDate()).padStart(2,'0')}`
  const oneMonthAgo = new Date(baseDate)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

  const inRange = (dateStr: string) => {
    const d = new Date(dateStr)
    return d >= oneMonthAgo && d <= baseDate
  }

  const lines: string[] = []
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('　三重中央医療センター 災害対策委員会')
  lines.push(`　管理診療会議 報告資料　${baseDateStr}`)
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')

  // ── 議事録 ──
  lines.push('【議事録】')
  lines.push(`タイトル：${minutes.title}`)
  lines.push(`更新日時：${baseDateStr}`)
  lines.push('')
  lines.push(minutes.body || '（本文なし）')
  lines.push('')
  lines.push('────────────────────────────────────────')

  // ── 訓練班 ──
  try {
    const raw = localStorage.getItem('training_tasks_v2')
    const tasks = raw ? JSON.parse(raw) : []
    const done = tasks.filter((t: { status: string; updatedAt?: string }) =>
      t.status === 'completed' && t.updatedAt && inRange(t.updatedAt)
    )
    lines.push('')
    lines.push('【訓練班】直近1ヶ月の完了項目')
    if (done.length === 0) {
      lines.push('　・該当なし')
    } else {
      done.forEach((t: { title?: string; name?: string; updatedAt?: string }) => {
        lines.push(`　・${t.title ?? t.name ?? '（名称不明）'}`)
      })
    }
  } catch { lines.push('　・データ取得エラー') }
  lines.push('')
  lines.push('────────────────────────────────────────')

  // ── 物品班 ──
  try {
    const raw = localStorage.getItem('supplies_boxes_v1')
    const boxes = raw ? JSON.parse(raw) : []
    const done = boxes.filter((b: { inventoryChecked: boolean; updatedAt?: string }) =>
      b.inventoryChecked && b.updatedAt && inRange(b.updatedAt)
    )
    lines.push('')
    lines.push('【物品班】直近1ヶ月の棚卸済みBOX')
    if (done.length === 0) {
      lines.push('　・該当なし')
    } else {
      done.forEach((b: { name?: string; boxNumber?: string; updatedAt?: string }) => {
        lines.push(`　・${b.name ?? b.boxNumber ?? '（名称不明）'}`)
      })
    }
  } catch { lines.push('　・データ取得エラー') }
  lines.push('')
  lines.push('────────────────────────────────────────')

  // ── 勉強会班 ──
  try {
    const raw = localStorage.getItem('study_sessions_v1')
    const sessions = raw ? JSON.parse(raw) : []
    const done = sessions.filter((s: { status: string; date: string }) =>
      s.status === 'done' && inRange(s.date)
    )
    lines.push('')
    lines.push('【勉強会班】直近1ヶ月の開催済み勉強会')
    if (done.length === 0) {
      lines.push('　・該当なし')
    } else {
      done.forEach((s: { title: string; date: string; speaker?: string }) => {
        lines.push(`　・${s.date}　${s.title}${s.speaker ? `（担当：${s.speaker}）` : ''}`)
      })
    }
  } catch { lines.push('　・データ取得エラー') }
  lines.push('')
  lines.push('────────────────────────────────────────')

  // ── チーム会班 ──
  try {
    const raw = localStorage.getItem('team_sessions_v1')
    const sessions = raw ? JSON.parse(raw) : []
    const done = sessions.filter((s: { status: string; date: string }) =>
      s.status === 'done' && inRange(s.date)
    )
    lines.push('')
    lines.push('【チーム会班】直近1ヶ月の実施済みシミュレーション')
    if (done.length === 0) {
      lines.push('　・該当なし')
    } else {
      done.forEach((s: { department: string; content: string; date: string }) => {
        lines.push(`　・${s.date}　${s.department}　${s.content}`)
      })
    }
  } catch { lines.push('　・データ取得エラー') }
  lines.push('')
  lines.push('────────────────────────────────────────')

  // ── 事務部門・DMAT ──
  try {
    const raw = localStorage.getItem('office_notices')
    const notices = raw ? JSON.parse(raw) : []
    const done = notices.filter((n: { isRead: boolean; date: string }) =>
      n.isRead && inRange(n.date)
    )
    lines.push('')
    lines.push('【事務部門・DMAT】直近1ヶ月の既読連絡事項')
    if (done.length === 0) {
      lines.push('　・該当なし')
    } else {
      done.forEach((n: { title: string; date: string; category: string; author: string }) => {
        lines.push(`　・${n.date}　[${n.category}]　${n.title}（${n.author}）`)
      })
    }
  } catch { lines.push('　・データ取得エラー') }

  lines.push('')
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push(`出力日時：${new Date().toLocaleString('ja-JP')}`)
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  return lines.join('\n')
}

function downloadTxt(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
// ────────────────────────────────────────────────────────────

interface Minutes {
  id: string
  title: string
  body: string
  confirmed: boolean
  updatedAt: string
  createdAt: string
}

const STORAGE_KEY = 'minutes_records'

export default function MinutesPage() {
  const [records, setRecords] = useState<Minutes[]>([])
  const [editing, setEditing] = useState<Minutes | null>(null)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) setRecords(JSON.parse(raw))
  }, [])

  const save = (next: Minutes[]) => {
    const sorted = [...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    setRecords(sorted)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted))
  }

  const handleNew = () => {
    const now = new Date().toISOString()
    setEditing({
      id: Date.now().toString(),
      title: '',
      body: '',
      confirmed: false,
      updatedAt: now,
      createdAt: now,
    })
    setIsNew(true)
  }

  const handleSave = () => {
    if (!editing) return
    if (!editing.title.trim()) return alert('タイトルを入力してください')
    const now = new Date().toISOString()
    const updated = { ...editing, updatedAt: now }
    if (isNew) {
      save([updated, ...records])
    } else {
      save(records.map(r => r.id === updated.id ? updated : r))
    }
    setEditing(null)
    setIsNew(false)
  }

  const handleDelete = (id: string) => {
    if (!confirm('この議事録を削除しますか？')) return
    save(records.filter(r => r.id !== id))
    setEditing(null)
    setIsNew(false)
  }

  const toggleConfirmed = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    save(records.map(r => r.id === id ? { ...r, confirmed: !r.confirmed } : r))
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  }

  const confirmedCount = records.filter(r => r.confirmed).length

  // 編集画面
  if (editing) {
    return (
      <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* ヘッダー */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>Minutes</p>
              <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                {isNew ? '新規議事録' : '議事録を編集'}
              </h1>
            </div>
            <button
              onClick={() => { setEditing(null); setIsNew(false) }}
              style={{ padding: '9px 16px', borderRadius: '9px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}
            >
              一覧に戻る
            </button>
          </div>

          {/* 編集フォーム */}
          <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '2rem' }}>

            {/* タイトル */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                タイトル <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                value={editing.title}
                onChange={e => setEditing({ ...editing, title: e.target.value })}
                placeholder="例：第12回 災害対策委員会"
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
              />
            </div>

            {/* 本文 */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                議事録本文
              </label>
              <textarea
                value={editing.body}
                onChange={e => setEditing({ ...editing, body: e.target.value })}
                placeholder={`例）\n【日時】令和〇年〇月〇日\n【場所】会議室\n【出席者】〇〇、〇〇\n\n【議題1】...\n【議題2】...`}
                rows={20}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', lineHeight: '1.7', resize: 'vertical' as const, boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
              />
            </div>

            {/* 確認チェック */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <input
                type="checkbox"
                id="confirmed"
                checked={editing.confirmed}
                onChange={e => setEditing({ ...editing, confirmed: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#1d6fd4' }}
              />
              <label htmlFor="confirmed" style={{ fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                確認済み（承認完了）
              </label>
            </div>

            {/* 更新日表示 */}
            {!isNew && (
              <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '1.25rem' }}>
                最終更新：{formatDate(editing.updatedAt)}　作成：{formatDate(editing.createdAt)}
              </p>
            )}

            {/* ボタン */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSave}
                style={{ flex: 2, padding: '11px', borderRadius: '9px', border: 'none', backgroundColor: '#1d6fd4', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                保存する
              </button>
              {!isNew && (
                <button
                  onClick={() => {
                    const content = generateReport(editing)
                    const dateStr = new Date(editing.updatedAt).toISOString().slice(0, 10).replace(/-/g, '')
                    downloadTxt(content, `disaster_report_${dateStr}.txt`)
                  }}
                  style={{ flex: 2, padding: '11px', borderRadius: '9px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d6fd4', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
                >
                  レポート出力 (.txt)
                </button>
              )}
              {!isNew && (
                <button
                  onClick={() => handleDelete(editing.id)}
                  style={{ flex: 1, padding: '11px', borderRadius: '9px', border: '1px solid #fee2e2', backgroundColor: 'white', color: '#dc2626', fontSize: '13px', cursor: 'pointer' }}
                >
                  削除
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    )
  }

  // 一覧画面
  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ヘッダー */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>Minutes</p>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>議事録</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>委員会議事録の入力・管理</p>
          </div>
          <button
            onClick={handleNew}
            style={{ padding: '9px 16px', borderRadius: '9px', border: 'none', backgroundColor: '#1d6fd4', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            + 新規議事録
          </button>
        </div>

        {/* サマリーカード */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '1.5rem' }}>
          {[
            { label: '総件数', value: records.length, color: '#0f172a' },
            { label: '確認済み', value: confirmedCount, color: '#16a34a' },
            { label: '未確認', value: records.length - confirmedCount, color: '#d97706' },
            { label: '今月', value: records.filter(r => r.updatedAt.startsWith(new Date().toISOString().slice(0,7))).length, color: '#1d6fd4' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 5px' }}>{s.label}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* 一覧 */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'center' as const, width: '60px' }}>確認</th>
                <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'left' as const }}>タイトル</th>
                <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'left' as const, width: '180px' }}>最終更新</th>
                <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em', textAlign: 'center' as const, width: '80px' }}>編集</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '3rem', textAlign: 'center' as const, color: '#94a3b8', fontSize: '14px' }}>
                    議事録はまだありません
                  </td>
                </tr>
              )}
              {records.map(r => (
                <tr
                  key={r.id}
                  onClick={() => { setEditing(r); setIsNew(false) }}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}
                >
                  <td style={{ padding: '12px', textAlign: 'center' as const }} onClick={e => toggleConfirmed(r.id, e)}>
                    <input
                      type="checkbox"
                      checked={r.confirmed}
                      onChange={() => {}}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#1d6fd4' }}
                    />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {r.confirmed && (
                        <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '5px', backgroundColor: '#dcfce7', color: '#16a34a' }}>確認済</span>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{r.title || '（タイトルなし）'}</span>
                    </div>
                    {r.body && (
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: '600px' }}>
                        {r.body.slice(0, 80)}...
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>{formatDate(r.updatedAt)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' as const }}>
                    <span style={{ fontSize: '11px', color: '#1d6fd4', fontWeight: '600' }}>編集 →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}