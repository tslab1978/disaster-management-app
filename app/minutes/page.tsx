'use client'
import { useState, useEffect } from 'react'
import { getLogs, CommitteeLog } from '@/lib/storage'

// ─── ユーティリティ ───────────────────────────────────────
function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`
}
function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function oneMonthAgoStr() {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// ─── ログのaction を日本語に変換 ──────────────────────────
function actionLabel(action: string): string {
  const map: Record<string, string> = {
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
  }
  return map[action] ?? action
}

// ─── カテゴリを日本語に変換 ───────────────────────────────
function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    training: '訓練班',
    supplies_box: '物品班（BOX）',
    supplies_whiteboard: '物品班（WB）',
    supplies_request: '物品班（請求）',
    manual: 'マニュアル班',
    study: '勉強会班',
    team: 'チーム会班',
  }
  return map[cat] ?? cat
}

// ─── レポートテキスト生成 ─────────────────────────────────
function generateReport(
  title: string,
  body: string,
  logs: CommitteeLog[],
  dateFrom: string,
  dateTo: string,
): string {
  const lines: string[] = []
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('　三重中央医療センター 災害対策委員会')
  lines.push(`　${title}`)
  lines.push(`　対象期間：${dateFrom} ～ ${dateTo}`)
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  lines.push('')

  if (body.trim()) {
    lines.push('【議事録本文】')
    lines.push(body)
    lines.push('')
    lines.push('────────────────────────────────────────')
    lines.push('')
  }

  // カテゴリ別に集計
  const categories = ['training','supplies_box','supplies_whiteboard','supplies_request','manual','study','team']
  categories.forEach(cat => {
    const catLogs = logs.filter(l => l.category === cat)
    if (catLogs.length === 0) return
    lines.push(`【${categoryLabel(cat)}】`)
    catLogs.forEach(l => {
      const time = formatDateTime(l.timestamp)
      lines.push(`　・${time}　${l.taskName}　→　${actionLabel(l.action)}`)
    })
    lines.push('')
  })

  lines.push('────────────────────────────────────────')
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

// ─── 型 ───────────────────────────────────────────────────
interface Minutes {
  id: string
  title: string
  body: string
  confirmed: boolean
  updatedAt: string
  createdAt: string
  dateFrom?: string
  dateTo?: string
}

const STORAGE_KEY = 'minutes_records'

// ════════════════════════════════════════════════════════
// メインページ
// ════════════════════════════════════════════════════════
export default function MinutesPage() {
  const [records, setRecords] = useState<Minutes[]>([])
  const [editing, setEditing] = useState<Minutes | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [allLogs, setAllLogs] = useState<CommitteeLog[]>([])
  const [dateFrom, setDateFrom] = useState(oneMonthAgoStr())
  const [dateTo, setDateTo] = useState(todayStr())
  const [printMode, setPrintMode] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) setRecords(JSON.parse(raw))
    setAllLogs(getLogs())
  }, [])

  // 期間フィルター済みログ
  const filteredLogs = allLogs.filter(l => {
    const d = l.timestamp.slice(0, 10)
    return d >= dateFrom && d <= dateTo
  })

  // カテゴリ別件数
  const logSummary = {
    training: filteredLogs.filter(l => l.category === 'training').length,
    supplies: filteredLogs.filter(l => l.category.startsWith('supplies')).length,
    manual: filteredLogs.filter(l => l.category === 'manual').length,
    study: filteredLogs.filter(l => l.category === 'study').length,
    team: filteredLogs.filter(l => l.category === 'team').length,
  }

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
      dateFrom,
      dateTo,
    })
    setIsNew(true)
  }

  const handleSave = () => {
    if (!editing) return
    if (!editing.title.trim()) return alert('タイトルを入力してください')
    const now = new Date().toISOString()
    const updated = { ...editing, updatedAt: now, dateFrom, dateTo }
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

  const confirmedCount = records.filter(r => r.confirmed).length

  const inp: React.CSSProperties = {
    padding: '9px 11px', fontSize: '13px', border: '1px solid #e2e8f0',
    borderRadius: '8px', outline: 'none', fontFamily: 'inherit',
    color: '#0f172a', backgroundColor: 'white', boxSizing: 'border-box',
  }

  // ── 印刷プレビュー ──
  if (printMode && editing) {
    return (
      <div style={{ fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',serif", padding: '40px', maxWidth: '800px', margin: '0 auto', color: '#0f172a' }}>
        <style>{`@media print { button { display: none !important; } }`}</style>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '24px' }} className="no-print">
          <button onClick={() => window.print()} style={{ padding: '8px 16px', backgroundColor: '#1d6fd4', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            🖨️ 印刷
          </button>
          <button onClick={() => setPrintMode(false)} style={{ padding: '8px 16px', backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
            戻る
          </button>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '2px solid #0f172a', paddingBottom: '16px' }}>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px' }}>三重中央医療センター 災害対策委員会</p>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 8px' }}>{editing.title || '（タイトルなし）'}</h1>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>対象期間：{dateFrom} ～ {dateTo}</p>
        </div>

        {editing.body.trim() && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>議事録本文</h2>
            <p style={{ fontSize: '13px', lineHeight: '1.8', whiteSpace: 'pre-wrap' }}>{editing.body}</p>
          </div>
        )}

        <h2 style={{ fontSize: '14px', fontWeight: '700', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '16px' }}>
          期間中の活動ログ（{filteredLogs.length}件）
        </h2>
        {['training','supplies_box','supplies_whiteboard','supplies_request','manual','study','team'].map(cat => {
          const catLogs = filteredLogs.filter(l => l.category === cat)
          if (catLogs.length === 0) return null
          return (
            <div key={cat} style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#1d6fd4', margin: '0 0 8px' }}>{categoryLabel(cat)}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: '600', color: '#64748b' }}>日時</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: '600', color: '#64748b' }}>対象</th>
                    <th style={{ padding: '6px 8px', textAlign: 'left', border: '1px solid #e2e8f0', fontWeight: '600', color: '#64748b' }}>変更内容</th>
                  </tr>
                </thead>
                <tbody>
                  {catLogs.map(l => (
                    <tr key={l.id}>
                      <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDateTime(l.timestamp)}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>{l.taskName}</td>
                      <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0', fontWeight: '600' }}>{actionLabel(l.action)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
        <p style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'right', marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
          出力日時：{new Date().toLocaleString('ja-JP')}
        </p>
      </div>
    )
  }

  // ── 編集画面 ──
  if (editing) {
    return (
      <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Minutes</p>
              <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                {isNew ? '新規議事録' : '議事録を編集'}
              </h1>
            </div>
            <button onClick={() => { setEditing(null); setIsNew(false) }}
              style={{ padding: '9px 16px', borderRadius: '9px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>
              一覧に戻る
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

            {/* 左：入力フォーム */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', margin: '0 0 1rem', letterSpacing: '0.04em' }}>議事録入力</h3>

              {/* 対象期間 */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>対象期間</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    style={{ ...inp, flex: 1 }} />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>〜</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    style={{ ...inp, flex: 1 }} />
                </div>
              </div>

              {/* タイトル */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  タイトル <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })}
                  placeholder="例：第12回 災害対策委員会"
                  style={{ ...inp, width: '100%' }} />
              </div>

              {/* 本文 */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>議事録本文</label>
                <textarea value={editing.body} onChange={e => setEditing({ ...editing, body: e.target.value })}
                  placeholder={`【日時】令和〇年〇月〇日\n【場所】会議室\n【出席者】〇〇、〇〇\n\n【議題1】...`}
                  rows={12}
                  style={{ ...inp, width: '100%', resize: 'vertical', lineHeight: '1.7' }} />
              </div>

              {/* 確認チェック */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <input type="checkbox" id="confirmed" checked={editing.confirmed}
                  onChange={e => setEditing({ ...editing, confirmed: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#1d6fd4' }} />
                <label htmlFor="confirmed" style={{ fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}>
                  確認済み（承認完了）
                </label>
              </div>

              {/* ボタン */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={handleSave}
                  style={{ flex: 1, padding: '10px', borderRadius: '9px', border: 'none', backgroundColor: '#1d6fd4', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  保存
                </button>
                <button onClick={() => setPrintMode(true)}
                  style={{ flex: 1, padding: '10px', borderRadius: '9px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d6fd4', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  🖨️ 印刷プレビュー
                </button>
                <button onClick={() => {
                  if (!editing.title.trim()) return alert('タイトルを入力してください')
                  const content = generateReport(editing.title, editing.body, filteredLogs, dateFrom, dateTo)
                  const dateStr = dateTo.replace(/-/g, '')
                  downloadTxt(content, `minutes_${dateStr}.txt`)
                }}
                  style={{ flex: 1, padding: '10px', borderRadius: '9px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  📄 TXT出力
                </button>
                {!isNew && (
                  <button onClick={() => handleDelete(editing.id)}
                    style={{ padding: '10px 14px', borderRadius: '9px', border: '1px solid #fee2e2', backgroundColor: 'white', color: '#dc2626', fontSize: '13px', cursor: 'pointer' }}>
                    削除
                  </button>
                )}
              </div>
            </div>

            {/* 右：ログプレビュー */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#64748b', margin: 0, letterSpacing: '0.04em' }}>
                  期間中の活動ログ
                </h3>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#1d6fd4', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '20px' }}>
                  {filteredLogs.length}件
                </span>
              </div>

              {/* カテゴリ別サマリー */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '1rem' }}>
                {[
                  { label: '訓練班', value: logSummary.training, cat: 'training' },
                  { label: '物品班', value: logSummary.supplies, cat: 'supplies' },
                  { label: 'マニュアル班', value: logSummary.manual, cat: 'manual' },
                  { label: '勉強会班', value: logSummary.study, cat: 'study' },
                  { label: 'チーム会班', value: logSummary.team, cat: 'team' },
                ].map(s => (
                  <div key={s.cat} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{s.label}</span>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: s.value > 0 ? '#1d6fd4' : '#cbd5e1' }}>{s.value}</span>
                  </div>
                ))}
              </div>

              {/* ログ一覧 */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {filteredLogs.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '2rem 0' }}>
                    対象期間のログがありません
                  </p>
                ) : (
                  filteredLogs.map(l => (
                    <div key={l.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: '12px' }}>
                      <span style={{ color: '#94a3b8', whiteSpace: 'nowrap', flexShrink: 0 }}>{l.timestamp.slice(0,10)}</span>
                      <span style={{ fontSize: '10px', fontWeight: '600', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#eff6ff', color: '#1d6fd4', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {categoryLabel(l.category)}
                      </span>
                      <span style={{ color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.taskName}</span>
                      <span style={{ color: '#16a34a', fontWeight: '600', whiteSpace: 'nowrap', flexShrink: 0 }}>{actionLabel(l.action)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── 一覧画面 ──
  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Minutes</p>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>議事録</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>委員会議事録の入力・管理</p>
          </div>
          <button onClick={handleNew}
            style={{ padding: '9px 16px', borderRadius: '9px', border: 'none', backgroundColor: '#1d6fd4', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            + 新規議事録
          </button>
        </div>

        {/* サマリー */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '1.5rem' }}>
          {[
            { label: '総件数', value: records.length, color: '#0f172a' },
            { label: '確認済み', value: confirmedCount, color: '#16a34a' },
            { label: '未確認', value: records.length - confirmedCount, color: '#d97706' },
            { label: '蓄積ログ総数', value: allLogs.length, color: '#1d6fd4' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 5px' }}>{s.label}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* 一覧テーブル */}
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textAlign: 'center', width: '60px' }}>確認</th>
                <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textAlign: 'left' }}>タイトル</th>
                <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textAlign: 'left', width: '180px' }}>対象期間</th>
                <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textAlign: 'left', width: '160px' }}>最終更新</th>
                <th style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', textAlign: 'center', width: '80px' }}>編集</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                    議事録はまだありません
                  </td>
                </tr>
              )}
              {records.map(r => (
                <tr key={r.id} onClick={() => { setEditing(r); setIsNew(false) }}
                  style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'white')}>
                  <td style={{ padding: '12px', textAlign: 'center' }} onClick={e => toggleConfirmed(r.id, e)}>
                    <input type="checkbox" checked={r.confirmed} onChange={() => {}}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#1d6fd4' }} />
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {r.confirmed && (
                        <span style={{ fontSize: '10px', fontWeight: '600', padding: '2px 7px', borderRadius: '5px', backgroundColor: '#dcfce7', color: '#16a34a' }}>確認済</span>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{r.title || '（タイトルなし）'}</span>
                    </div>
                    {r.body && (
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                        {r.body.slice(0, 80)}...
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>
                    {r.dateFrom && r.dateTo ? `${r.dateFrom} ～ ${r.dateTo}` : '—'}
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>{formatDateTime(r.updatedAt)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
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