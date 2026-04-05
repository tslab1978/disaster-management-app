'use client'
import { useState, useEffect } from 'react'

type Category = '事務部門' | 'DMAT'
type Priority = '緊急' | '通常' | '情報'

interface Notice {
  id: string
  category: Category
  priority: Priority
  title: string
  body: string
  author: string
  date: string
  deadline: string
  isRead: boolean
  createdAt: string
}

const STORAGE_KEY = 'office_notices'

const priorityStyle: Record<Priority, { bg: string; color: string; label: string }> = {
  緊急: { bg: '#fee2e2', color: '#dc2626', label: '緊急' },
  通常: { bg: '#fef3c7', color: '#d97706', label: '通常' },
  情報: { bg: '#dbeafe', color: '#1d6fd4', label: '情報' },
}

const categoryStyle: Record<Category, { bg: string; color: string }> = {
  '事務部門': { bg: '#ede9fe', color: '#7c3aed' },
  'DMAT':     { bg: '#dcfce7', color: '#16a34a' },
}

const emptyForm = (): Omit<Notice, 'id' | 'isRead' | 'createdAt'> => ({
  category: '事務部門',
  priority: '通常',
  title: '',
  body: '',
  author: '',
  date: new Date().toISOString().slice(0, 10),
  deadline: '',
})

export default function OfficePage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [filterCat, setFilterCat] = useState<Category | 'すべて'>('すべて')
  const [filterRead, setFilterRead] = useState<'すべて' | '未読' | '既読'>('すべて')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) setNotices(JSON.parse(raw))
  }, [])

  const save = (next: Notice[]) => {
    setNotices(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const handleAdd = () => {
    if (!form.title.trim() || !form.author.trim()) return
    const next: Notice = {
      ...form,
      id: Date.now().toString(),
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    save([next, ...notices])
    setForm(emptyForm())
    setShowModal(false)
  }

  const toggleRead = (id: string) => {
    save(notices.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n))
  }

  const handleDelete = (id: string) => {
    if (!confirm('この連絡事項を削除しますか？')) return
    save(notices.filter(n => n.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  const filtered = notices.filter(n => {
    const catOk = filterCat === 'すべて' || n.category === filterCat
    const readOk = filterRead === 'すべて' || (filterRead === '未読' ? !n.isRead : n.isRead)
    return catOk && readOk
  })

  const unreadCount = notices.filter(n => !n.isRead).length
  const urgentCount = notices.filter(n => n.priority === '緊急').length
  const todayStr = new Date().toISOString().slice(0, 10)
  const nearDeadline = notices.filter(n => n.deadline && n.deadline >= todayStr && n.deadline <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)).length

  const btnFilter = (active: boolean) => ({
    padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' as const,
    cursor: 'pointer', border: active ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
    backgroundColor: active ? '#eff6ff' : 'white', color: active ? '#1d6fd4' : '#64748b',
  })

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ヘッダー */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: '0 0 4px' }}>Office / DMAT</p>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 4px' }}>事務部門・DMAT — 連絡板</h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>事務部門・DMAT からの連絡事項を一元管理します</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ padding: '9px 16px', borderRadius: '9px', border: 'none', backgroundColor: '#1d6fd4', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            + 連絡事項を追加
          </button>
        </div>

        {/* サマリーカード */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '1.5rem' }}>
          {[
            { label: '総件数', value: notices.length, color: '#0f172a' },
            { label: '未読', value: unreadCount, color: '#1d6fd4' },
            { label: '緊急', value: urgentCount, color: '#dc2626' },
            { label: '期限7日以内', value: nearDeadline, color: '#d97706' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
              <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 5px' }}>{s.label}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* フィルター */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' as const }}>
          {(['すべて', '事務部門', 'DMAT'] as const).map(c => (
            <button key={c} onClick={() => setFilterCat(c)} style={btnFilter(filterCat === c)}>{c}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
            {(['すべて', '未読', '既読'] as const).map(r => (
              <button key={r} onClick={() => setFilterRead(r)} style={btnFilter(filterRead === r)}>{r}</button>
            ))}
          </div>
        </div>

        {/* 掲示板 */}
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '10px' }}>
          {filtered.length === 0 && (
            <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '3rem', textAlign: 'center' as const, color: '#94a3b8', fontSize: '14px' }}>
              連絡事項はありません
            </div>
          )}
          {filtered.map(n => {
            const ps = priorityStyle[n.priority]
            const cs = categoryStyle[n.category]
            const expanded = expandedId === n.id
            const overdue = n.deadline && n.deadline < todayStr
            return (
              <div key={n.id} style={{ backgroundColor: 'white', border: `1px solid ${n.isRead ? '#e2e8f0' : '#bfdbfe'}`, borderRadius: '12px', padding: '1rem 1.25rem', opacity: n.isRead ? 0.75 : 1, transition: 'all 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* 未読インジケーター */}
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: n.isRead ? 'transparent' : '#1d6fd4', marginTop: '6px', flexShrink: 0, border: n.isRead ? '1px solid #e2e8f0' : 'none' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' as const }}>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '6px', backgroundColor: cs.bg, color: cs.color }}>{n.category}</span>
                      <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '6px', backgroundColor: ps.bg, color: ps.color }}>{ps.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>{n.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#94a3b8', flexWrap: 'wrap' as const }}>
                      <span>発信：{n.author}</span>
                      <span>日付：{n.date}</span>
                      {n.deadline && <span style={{ color: overdue ? '#dc2626' : '#d97706', fontWeight: '600' }}>期限：{n.deadline}{overdue ? '（期限超過）' : ''}</span>}
                    </div>
                    {expanded && (
                      <div style={{ marginTop: '10px', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#374151', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }}>
                        {n.body || '（本文なし）'}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => setExpandedId(expanded ? null : n.id)} style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}>
                      {expanded ? '閉じる' : '詳細'}
                    </button>
                    <button onClick={() => toggleRead(n.id)} style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #e2e8f0', backgroundColor: n.isRead ? 'white' : '#eff6ff', color: n.isRead ? '#64748b' : '#1d6fd4', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>
                      {n.isRead ? '未読に戻す' : '既読'}
                    </button>
                    <button onClick={() => handleDelete(n.id)} style={{ padding: '5px 10px', borderRadius: '7px', border: '1px solid #fee2e2', backgroundColor: 'white', color: '#dc2626', fontSize: '11px', cursor: 'pointer' }}>
                      削除
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* モーダル */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' as const }}>
            <h2 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.5rem' }}>連絡事項を追加</h2>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>
              {/* カテゴリ */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>カテゴリ</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['事務部門', 'DMAT'] as Category[]).map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, category: c }))} style={{ ...btnFilter(form.category === c), flex: 1 }}>{c}</button>
                  ))}
                </div>
              </div>
              {/* 重要度 */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>重要度</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['緊急', '通常', '情報'] as Priority[]).map(p => (
                    <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))} style={{ ...btnFilter(form.priority === p), flex: 1 }}>{p}</button>
                  ))}
                </div>
              </div>
              {/* タイトル */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>タイトル <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="連絡事項のタイトル" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' as const }} />
              </div>
              {/* 本文 */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>本文</label>
                <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="連絡内容の詳細（任意）" rows={4} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', resize: 'vertical' as const, boxSizing: 'border-box' as const }} />
              </div>
              {/* 発信者・日付・期限 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>発信者名 <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="例：事務部 山田" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' as const }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>発信日</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' as const }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '6px' }}>対応期限（任意）</label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box' as const }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button onClick={() => { setShowModal(false); setForm(emptyForm()) }} style={{ flex: 1, padding: '10px', borderRadius: '9px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontSize: '13px', cursor: 'pointer' }}>キャンセル</button>
              <button onClick={handleAdd} style={{ flex: 2, padding: '10px', borderRadius: '9px', border: 'none', backgroundColor: '#1d6fd4', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>追加する</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}