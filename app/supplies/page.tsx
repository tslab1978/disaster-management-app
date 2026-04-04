'use client';

import { useEffect, useState } from 'react';
import { boxStorage, wbStorage, requestStorage } from '@/lib/suppliesStorage';
import {
  DisasterBox, Whiteboard, SupplyRequest,
  BOX_AREAS, BOX_STORAGE_LOCATIONS, BoxArea, BoxStorageLocation,
  WB_USE_LOCATIONS, WB_STORAGE_LOCATIONS, WbUseLocation, WbStorageLocation,
} from '@/lib/suppliesTypes';

// ─── スタイル定数 ────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '9px 11px', fontSize: '13px',
  border: '1px solid #e2e8f0', borderRadius: '8px', outline: 'none',
  fontFamily: 'inherit', color: '#0f172a', backgroundColor: 'white', boxSizing: 'border-box',
};
const labelS: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  color: '#64748b', marginBottom: '5px', letterSpacing: '0.03em',
};
const btnPrimary: React.CSSProperties = {
  padding: '9px 16px', borderRadius: '9px', border: 'none', cursor: 'pointer',
  backgroundColor: '#1d6fd4', color: 'white', fontSize: '13px', fontWeight: '600',
};
const btnSecondary: React.CSSProperties = {
  padding: '9px 16px', borderRadius: '9px', border: '1px solid #e2e8f0', cursor: 'pointer',
  backgroundColor: 'white', color: '#475569', fontSize: '13px', fontWeight: '600',
};
const btnDanger: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
  backgroundColor: '#fee2e2', color: '#dc2626', fontSize: '12px', fontWeight: '600',
};
const btnEdit: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '7px', border: 'none', cursor: 'pointer',
  backgroundColor: '#eff6ff', color: '#1d6fd4', fontSize: '12px', fontWeight: '600',
};
const card: React.CSSProperties = {
  backgroundColor: 'white', border: '1px solid #e2e8f0',
  borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '8px',
};

// ─── ユーティリティ ──────────────────────────────────────
function nowISO() { return new Date().toISOString(); }
function genId() { return Date.now().toString() + Math.random().toString(36).slice(2, 7); }

function getAreaLabel(item: DisasterBox): string {
  return item.area === 'その他' && item.areaCustom ? item.areaCustom : item.area;
}
function getStorageLabel(item: DisasterBox): string {
  return item.storageLocation === 'その他' && item.storageLocationCustom
    ? item.storageLocationCustom : item.storageLocation;
}
function getWbUseLabel(item: Whiteboard): string {
  return item.useLocation === 'その他' && item.useLocationCustom ? item.useLocationCustom : item.useLocation;
}
function getWbStorageLabel(item: Whiteboard): string {
  return item.storageLocation === 'その他' && item.storageLocationCustom
    ? item.storageLocationCustom : item.storageLocation;
}

// 期限アラート判定（補充完了済みは除外）
function getBoxAlerts(item: DisasterBox): Array<{ label: string; color: string; bg: string }> {
  if (item.replenishmentDone) return [];
  const alerts: Array<{ label: string; color: string; bg: string }> = [];
  const shortage = item.standardQty - item.currentQty;
  if (item.currentQty === 0 && item.standardQty > 0) {
    alerts.push({ label: '欠品', color: '#dc2626', bg: '#fee2e2' });
  } else if (shortage > 0) {
    alerts.push({ label: `不足 ${shortage}個`, color: '#d97706', bg: '#fef3c7' });
  }
  if (item.expiryMonth) {
    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const nextYM = (() => {
      const d = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();
    if (item.expiryMonth < currentYM) {
      alerts.push({ label: '期限切れ', color: '#dc2626', bg: '#fee2e2' });
    } else if (item.expiryMonth <= nextYM) {
      alerts.push({ label: '期限注意', color: '#d97706', bg: '#fef3c7' });
    }
  }
  return alerts;
}

// ─── 初期フォーム ─────────────────────────────────────────
function emptyBox(): Omit<DisasterBox, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    area: '本部', areaCustom: '', itemName: '', standardQty: 0, currentQty: 0,
    expiryMonth: '', storageLocation: '災害倉庫A', storageLocationCustom: '',
    replenishmentDone: false, inventoryChecked: false,
  };
}
function emptyWb(): Omit<Whiteboard, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    useLocation: '本部', useLocationCustom: '', storageLocation: '地域医療研修センター',
    storageLocationCustom: '', standardQty: 0, currentQty: 0, inventoryChecked: false,
  };
}
function emptyReq(): Omit<SupplyRequest, 'id' | 'createdAt' | 'updatedAt'> {
  return { itemName: '', manufacturer: '', standardQty: 0, price: 0, requested: false, deliveryDecided: false };
}

// ─── サブコンポーネント: SelectWithOther ─────────────────
function SelectWithOther<T extends string>({
  options, value, onChange, customValue, onCustomChange, label,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  customValue: string;
  onCustomChange: (v: string) => void;
  label: string;
}) {
  return (
    <div>
      <label style={labelS}>{label}</label>
      <select style={inp} value={value} onChange={(e) => onChange(e.target.value as T)} required>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {value === 'その他' && (
        <input
          style={{ ...inp, marginTop: '6px' }}
          placeholder="その他（自由入力）"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// タブ1: 災害BOX管理
// ══════════════════════════════════════════════════════════
function BoxTab() {
  const [items, setItems] = useState<DisasterBox[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyBox());
  const [filterArea, setFilterArea] = useState<string>('全て');

  useEffect(() => { setItems(boxStorage.getAll()); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName) return;
    const now = nowISO();
    if (editId) {
      boxStorage.update(editId, { ...form, updatedAt: now });
      setItems((prev) => prev.map((x) => x.id === editId ? { ...x, ...form, updatedAt: now } : x));
      setEditId(null);
    } else {
      const newItem: DisasterBox = { id: genId(), ...form, createdAt: now, updatedAt: now };
      boxStorage.add(newItem);
      setItems((prev) => [...prev, newItem]);
    }
    setForm(emptyBox());
    setShowForm(false);
  };

  const openEdit = (item: DisasterBox) => {
    setForm({
      area: item.area, areaCustom: item.areaCustom ?? '',
      itemName: item.itemName, standardQty: item.standardQty, currentQty: item.currentQty,
      expiryMonth: item.expiryMonth,
      storageLocation: item.storageLocation, storageLocationCustom: item.storageLocationCustom ?? '',
      replenishmentDone: item.replenishmentDone, inventoryChecked: item.inventoryChecked,
    });
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = (id: string) => {
    if (!confirm('削除しますか？')) return;
    boxStorage.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const toggleCheck = (id: string, field: 'replenishmentDone' | 'inventoryChecked', val: boolean) => {
    boxStorage.update(id, { [field]: val });
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, [field]: val } : x));
  };

  const checkAllInventory = () => {
    const filtered = filterArea === '全て' ? items : items.filter((x) => getAreaLabel(x) === filterArea);
    filtered.forEach((x) => { boxStorage.update(x.id, { inventoryChecked: true }); });
    setItems((prev) => prev.map((x) => {
      const inFiltered = filtered.some((f) => f.id === x.id);
      return inFiltered ? { ...x, inventoryChecked: true } : x;
    }));
  };

  const handlePrint = () => { window.print(); };

  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyBox()); };

  const allAreas = ['全て', ...Array.from(new Set(items.map((x) => getAreaLabel(x))))];
  const filtered = filterArea === '全て' ? items : items.filter((x) => getAreaLabel(x) === filterArea);
  const alertCount = items.filter((x) => getBoxAlerts(x).length > 0).length;
  const checkedCount = items.filter((x) => x.inventoryChecked).length;

  return (
    <div>
      {/* サマリー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1.25rem' }}>
        {[
          { label: '登録品目', value: items.length, color: '#0f172a' },
          { label: 'アラートあり', value: alertCount, color: '#ef4444' },
          { label: '棚卸済', value: checkedCount, color: '#16a34a' },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* フォーム */}
      {showForm && (
        <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>
            {editId ? '編集' : '新規登録'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '12px' }}>
              <SelectWithOther
                options={BOX_AREAS} value={form.area as BoxArea}
                onChange={(v) => setForm({ ...form, area: v, areaCustom: '' })}
                customValue={form.areaCustom ?? ''}
                onCustomChange={(v) => setForm({ ...form, areaCustom: v })}
                label="エリア *"
              />
              <div>
                <label style={labelS}>品目 *</label>
                <input style={inp} value={form.itemName} required
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
              </div>
              <div>
                <label style={labelS}>定数</label>
                <input style={inp} type="number" min="0" value={form.standardQty}
                  onChange={(e) => setForm({ ...form, standardQty: Number(e.target.value) })} />
              </div>
              <div>
                <label style={labelS}>現在数</label>
                <input style={inp} type="number" min="0" value={form.currentQty}
                  onChange={(e) => setForm({ ...form, currentQty: Number(e.target.value) })} />
              </div>
              <div>
                <label style={labelS}>使用期限（YYYY-MM）</label>
                <input style={inp} type="month" value={form.expiryMonth}
                  onChange={(e) => setForm({ ...form, expiryMonth: e.target.value })} />
              </div>
              <SelectWithOther
                options={BOX_STORAGE_LOCATIONS} value={form.storageLocation as BoxStorageLocation}
                onChange={(v) => setForm({ ...form, storageLocation: v, storageLocationCustom: '' })}
                customValue={form.storageLocationCustom ?? ''}
                onCustomChange={(v) => setForm({ ...form, storageLocationCustom: v })}
                label="保管場所"
              />
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.replenishmentDone}
                  onChange={(e) => setForm({ ...form, replenishmentDone: e.target.checked })} />
                補充完了
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.inventoryChecked}
                  onChange={(e) => setForm({ ...form, inventoryChecked: e.target.checked })} />
                棚卸確認
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={btnPrimary}>{editId ? '更新' : '登録'}</button>
              <button type="button" style={btnSecondary} onClick={cancelForm}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* ツールバー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ ...labelS, margin: 0, whiteSpace: 'nowrap' }}>エリア絞り込み</label>
          <select style={{ ...inp, width: 'auto', minWidth: '140px' }} value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}>
            {allAreas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={checkAllInventory}>
            全棚卸チェック
          </button>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={handlePrint}>
            印刷
          </button>
          <button style={btnPrimary} onClick={() => { showForm ? cancelForm() : setShowForm(true); }}>
            {showForm ? 'キャンセル' : '+ 新規登録'}
          </button>
        </div>
      </div>

      {/* リスト */}
      {filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
          登録データがありません
        </div>
      ) : (
        filtered.map((item) => {
          const alerts = getBoxAlerts(item);
          const shortage = item.standardQty - item.currentQty;
          const bgColor = alerts.some((a) => a.bg === '#fee2e2') ? '#fff5f5'
            : alerts.some((a) => a.bg === '#fef3c7') ? '#fffbeb' : 'white';
          return (
            <div key={item.id} style={{ ...card, backgroundColor: bgColor, borderColor: alerts.length > 0 ? (bgColor === '#fff5f5' ? '#fecaca' : '#fde68a') : '#e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#1d6fd4', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                      {getAreaLabel(item)}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{item.itemName}</span>
                    {alerts.map((a, i) => (
                      <span key={i} style={{ fontSize: '11px', backgroundColor: a.bg, color: a.color, padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>
                        {a.label}
                      </span>
                    ))}
                    {item.inventoryChecked && (
                      <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                        棚卸済
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                    <span>定数: <strong style={{ color: '#0f172a' }}>{item.standardQty}</strong></span>
                    <span>現在: <strong style={{ color: '#0f172a' }}>{item.currentQty}</strong></span>
                    {shortage > 0 && <span>不足: <strong style={{ color: '#d97706' }}>{shortage}</strong></span>}
                    {item.expiryMonth && <span>使用期限: <strong style={{ color: '#0f172a' }}>{item.expiryMonth}</strong></span>}
                    <span>保管: <strong style={{ color: '#0f172a' }}>{getStorageLabel(item)}</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={btnEdit} onClick={() => openEdit(item)}>編集</button>
                    <button style={btnDanger} onClick={() => deleteItem(item.id)}>削除</button>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={item.replenishmentDone}
                        onChange={(e) => toggleCheck(item.id, 'replenishmentDone', e.target.checked)} />
                      補充完了
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" checked={item.inventoryChecked}
                        onChange={(e) => toggleCheck(item.id, 'inventoryChecked', e.target.checked)} />
                      棚卸確認
                    </label>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// タブ2: ホワイトボード管理
// ══════════════════════════════════════════════════════════
function WhiteboardTab() {
  const [items, setItems] = useState<Whiteboard[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyWb());

  useEffect(() => { setItems(wbStorage.getAll()); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = nowISO();
    if (editId) {
      wbStorage.update(editId, { ...form, updatedAt: now });
      setItems((prev) => prev.map((x) => x.id === editId ? { ...x, ...form, updatedAt: now } : x));
      setEditId(null);
    } else {
      const newItem: Whiteboard = { id: genId(), ...form, createdAt: now, updatedAt: now };
      wbStorage.add(newItem);
      setItems((prev) => [...prev, newItem]);
    }
    setForm(emptyWb());
    setShowForm(false);
  };

  const openEdit = (item: Whiteboard) => {
    setForm({
      useLocation: item.useLocation, useLocationCustom: item.useLocationCustom ?? '',
      storageLocation: item.storageLocation, storageLocationCustom: item.storageLocationCustom ?? '',
      standardQty: item.standardQty, currentQty: item.currentQty,
      inventoryChecked: item.inventoryChecked,
    });
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = (id: string) => {
    if (!confirm('削除しますか？')) return;
    wbStorage.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const toggleInventory = (id: string, val: boolean) => {
    wbStorage.update(id, { inventoryChecked: val });
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, inventoryChecked: val } : x));
  };

  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyWb()); };

  const shortageCount = items.filter((x) => x.standardQty > x.currentQty).length;
  const checkedCount = items.filter((x) => x.inventoryChecked).length;

  return (
    <div>
      {/* サマリー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1.25rem' }}>
        {[
          { label: '登録数', value: items.length, color: '#0f172a' },
          { label: '不足あり', value: shortageCount, color: '#d97706' },
          { label: '棚卸済', value: checkedCount, color: '#16a34a' },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* フォーム */}
      {showForm && (
        <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>
            {editId ? '編集' : '新規登録'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '12px' }}>
              <SelectWithOther
                options={WB_USE_LOCATIONS} value={form.useLocation as WbUseLocation}
                onChange={(v) => setForm({ ...form, useLocation: v, useLocationCustom: '' })}
                customValue={form.useLocationCustom ?? ''}
                onCustomChange={(v) => setForm({ ...form, useLocationCustom: v })}
                label="有事利用場所 *"
              />
              <SelectWithOther
                options={WB_STORAGE_LOCATIONS} value={form.storageLocation as WbStorageLocation}
                onChange={(v) => setForm({ ...form, storageLocation: v, storageLocationCustom: '' })}
                customValue={form.storageLocationCustom ?? ''}
                onCustomChange={(v) => setForm({ ...form, storageLocationCustom: v })}
                label="保管場所"
              />
              <div>
                <label style={labelS}>定数</label>
                <input style={inp} type="number" min="0" value={form.standardQty}
                  onChange={(e) => setForm({ ...form, standardQty: Number(e.target.value) })} />
              </div>
              <div>
                <label style={labelS}>現在数</label>
                <input style={inp} type="number" min="0" value={form.currentQty}
                  onChange={(e) => setForm({ ...form, currentQty: Number(e.target.value) })} />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.inventoryChecked}
                  onChange={(e) => setForm({ ...form, inventoryChecked: e.target.checked })} />
                棚卸確認
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={btnPrimary}>{editId ? '更新' : '登録'}</button>
              <button type="button" style={btnSecondary} onClick={cancelForm}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* ツールバー */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button style={btnPrimary} onClick={() => { showForm ? cancelForm() : setShowForm(true); }}>
          {showForm ? 'キャンセル' : '+ 新規登録'}
        </button>
      </div>

      {/* リスト */}
      {items.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
          登録データがありません
        </div>
      ) : (
        items.map((item) => {
          const shortage = item.standardQty - item.currentQty;
          const hasAlert = shortage > 0;
          return (
            <div key={item.id} style={{ ...card, backgroundColor: hasAlert ? '#fffbeb' : 'white', borderColor: hasAlert ? '#fde68a' : '#e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', backgroundColor: '#eff6ff', color: '#1d6fd4', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                      {getWbUseLabel(item)}
                    </span>
                    {hasAlert && (
                      <span style={{ fontSize: '11px', backgroundColor: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '20px', fontWeight: '700' }}>
                        不足 {shortage}枚
                      </span>
                    )}
                    {item.inventoryChecked && (
                      <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '20px', fontWeight: '600' }}>
                        棚卸済
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12px', color: '#64748b' }}>
                    <span>保管: <strong style={{ color: '#0f172a' }}>{getWbStorageLabel(item)}</strong></span>
                    <span>定数: <strong style={{ color: '#0f172a' }}>{item.standardQty}</strong></span>
                    <span>現在: <strong style={{ color: '#0f172a' }}>{item.currentQty}</strong></span>
                    {shortage > 0 && <span>不足: <strong style={{ color: '#d97706' }}>{shortage}</strong></span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={btnEdit} onClick={() => openEdit(item)}>編集</button>
                    <button style={btnDanger} onClick={() => deleteItem(item.id)}>削除</button>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <input type="checkbox" checked={item.inventoryChecked}
                      onChange={(e) => toggleInventory(item.id, e.target.checked)} />
                    棚卸確認
                  </label>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// タブ3: 物品請求リスト
// ══════════════════════════════════════════════════════════
function RequestTab() {
  const [items, setItems] = useState<SupplyRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyReq());
  const [priceInput, setPriceInput] = useState('');

  useEffect(() => { setItems(requestStorage.getAll()); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName) return;
    const price = Math.max(0, Number(priceInput.replace(/,/g, '')) || 0);
    const now = nowISO();
    if (editId) {
      requestStorage.update(editId, { ...form, price, updatedAt: now });
      setItems((prev) => prev.map((x) => x.id === editId ? { ...x, ...form, price, updatedAt: now } : x));
      setEditId(null);
    } else {
      const newItem: SupplyRequest = { id: genId(), ...form, price, createdAt: now, updatedAt: now };
      requestStorage.add(newItem);
      setItems((prev) => [...prev, newItem]);
    }
    setForm(emptyReq());
    setPriceInput('');
    setShowForm(false);
  };

  const openEdit = (item: SupplyRequest) => {
    setForm({
      itemName: item.itemName, manufacturer: item.manufacturer,
      standardQty: item.standardQty, price: item.price,
      requested: item.requested, deliveryDecided: item.deliveryDecided,
    });
    setPriceInput(String(item.price));
    setEditId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = (id: string) => {
    if (!confirm('削除しますか？')) return;
    requestStorage.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const toggleField = (id: string, field: 'requested' | 'deliveryDecided', val: boolean) => {
    requestStorage.update(id, { [field]: val });
    setItems((prev) => prev.map((x) => x.id === id ? { ...x, [field]: val } : x));
  };

  const cancelForm = () => { setShowForm(false); setEditId(null); setForm(emptyReq()); setPriceInput(''); };

  const totalAmount = items.reduce((sum, x) => sum + (x.price * x.standardQty), 0);
  const requestedAmount = items.filter((x) => x.requested).reduce((sum, x) => sum + (x.price * x.standardQty), 0);
  const deliveredAmount = items.filter((x) => x.deliveryDecided).reduce((sum, x) => sum + (x.price * x.standardQty), 0);

  return (
    <div>
      {/* サマリー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1.25rem' }}>
        {[
          { label: '合計金額', value: `¥${totalAmount.toLocaleString()}`, color: '#0f172a' },
          { label: '請求済金額', value: `¥${requestedAmount.toLocaleString()}`, color: '#1d6fd4' },
          { label: '納品決定金額', value: `¥${deliveredAmount.toLocaleString()}`, color: '#16a34a' },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* フォーム */}
      {showForm && (
        <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>
            {editId ? '編集' : '新規登録'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelS}>品目 *</label>
                <input style={inp} value={form.itemName} required
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
              </div>
              <div>
                <label style={labelS}>製造メーカー等</label>
                <input style={inp} value={form.manufacturer}
                  onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} />
              </div>
              <div>
                <label style={labelS}>定数</label>
                <input style={inp} type="number" min="0" value={form.standardQty}
                  onChange={(e) => setForm({ ...form, standardQty: Number(e.target.value) })} />
              </div>
              <div>
                <label style={labelS}>金額（円）</label>
                <input style={inp} type="text" inputMode="numeric" placeholder="例: 1500"
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.requested}
                  onChange={(e) => setForm({ ...form, requested: e.target.checked })} />
                請求済み
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.deliveryDecided}
                  onChange={(e) => setForm({ ...form, deliveryDecided: e.target.checked })} />
                納品決定
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={btnPrimary}>{editId ? '更新' : '登録'}</button>
              <button type="button" style={btnSecondary} onClick={cancelForm}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* ツールバー */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
        <button style={btnPrimary} onClick={() => { showForm ? cancelForm() : setShowForm(true); }}>
          {showForm ? 'キャンセル' : '+ 新規登録'}
        </button>
      </div>

      {/* テーブル */}
      {items.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
          登録データがありません
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['品目', 'メーカー', '定数', '単価', '合計', '請求済', '納品決定', '操作'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item.id} style={{ borderBottom: i < items.length - 1 ? '1px solid #f1f5f9' : 'none', backgroundColor: item.deliveryDecided ? '#f0fdf4' : 'white' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>{item.itemName}</td>
                  <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.manufacturer || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#0f172a' }}>{item.standardQty}</td>
                  <td style={{ padding: '10px 12px', color: '#0f172a' }}>¥{item.price.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: '#0f172a' }}>
                    ¥{(item.price * item.standardQty).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <input type="checkbox" checked={item.requested}
                      onChange={(e) => toggleField(item.id, 'requested', e.target.checked)} />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <input type="checkbox" checked={item.deliveryDecided}
                      onChange={(e) => toggleField(item.id, 'deliveryDecided', e.target.checked)} />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={btnEdit} onClick={() => openEdit(item)}>編集</button>
                      <button style={btnDanger} onClick={() => deleteItem(item.id)}>削除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                <td colSpan={4} style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a', fontSize: '12px' }}>合計</td>
                <td style={{ padding: '10px 12px', fontWeight: '700', color: '#0f172a' }}>
                  ¥{totalAmount.toLocaleString()}
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// メインページ
// ══════════════════════════════════════════════════════════
export default function SuppliesPage() {
  const [tab, setTab] = useState<'box' | 'whiteboard' | 'request'>('box');

  const TABS = [
    { key: 'box' as const, label: '災害BOX管理' },
    { key: 'whiteboard' as const, label: 'ホワイトボード管理' },
    { key: 'request' as const, label: '物品請求リスト' },
  ];

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
      <style>{`
        @media print {
          nav, header, .no-print { display: none !important; }
          main { padding: 0 !important; }
          button { display: none !important; }
        }
      `}</style>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* ページヘッダー */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
            Supplies Division
          </p>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.02em' }}>
            物品管理班 — 在庫・補充管理
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            災害対策物品BOXの在庫確認・点検記録・補充管理
          </p>
        </div>

        {/* タブ */}
        <div style={{ display: 'flex', gap: '4px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '4px', marginBottom: '1.5rem', width: 'fit-content' }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: '600', transition: 'all 0.15s',
              backgroundColor: tab === t.key ? '#1d6fd4' : 'transparent',
              color: tab === t.key ? 'white' : '#64748b',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        {tab === 'box' && <BoxTab />}
        {tab === 'whiteboard' && <WhiteboardTab />}
        {tab === 'request' && <RequestTab />}
      </div>
    </main>
  );
}
