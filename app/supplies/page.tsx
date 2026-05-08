'use client';

import { useEffect, useState } from 'react';
import { boxStorage, wbStorage, disasterItemStorage, requestStorage } from '@/lib/suppliesStorage';
import { addLog } from '@/lib/storage';
import {
  DisasterBox, Whiteboard, DisasterItem, SupplyRequest,
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
  const [form, setForm] = useState(emptyBox());
  const [filterArea, setFilterArea] = useState<string>('全て');

  useEffect(() => {
    // エリア名マイグレーション（旧名称 → 正式名称）
    const AREA_MIGRATION: Record<string, BoxArea> = {
      'フロント':             '診療フロント',
      'トリアージ':           'トリアージエリア',
      '黄色エリア':           '黄エリア',
      '黒':                   '黒エリア',
      '活拠':                 'DMAT活動拠点本部',
      '総合案内ボランティア': '総合案内・ボランティア',
    };
    const all = boxStorage.getAll();
    const migrated = all.map((x) => {
      const newArea = AREA_MIGRATION[x.area];
      return newArea ? { ...x, area: newArea } : x;
    });
    const hasChange = migrated.some((x, i) => x.area !== all[i].area);
    if (hasChange) boxStorage.saveAll(migrated);
    setItems(hasChange ? migrated : all);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName) return;
    const now = nowISO();
    const newItem: DisasterBox = { id: genId(), ...form, createdAt: now, updatedAt: now };
    boxStorage.add(newItem);
    setItems((prev) => [...prev, newItem]);
    setForm(emptyBox());
    setShowForm(false);
  };

  const deleteItem = (id: string) => {
    if (!confirm('削除しますか？')) return;
    boxStorage.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  // stateのみ更新（数値・日付フィールド用: onBlurでhandleSaveを呼ぶ）
  const handleFieldChange = (id: string, field: keyof DisasterBox, value: unknown) => {
    setItems((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b));
  };

  // state更新 + 即時storage保存（select / checkbox用）
  const handleFieldSave = (id: string, field: keyof DisasterBox, value: unknown) => {
    setItems((prev) => {
      const updated = prev.map((b) => b.id === id ? { ...b, [field]: value } : b);
      boxStorage.update(id, { [field]: value } as Partial<DisasterBox>);
      return updated;
    });
  };

  // onBlur時にstateの現在値をstorageへ保存
  const handleSave = (id: string) => {
    setItems((prev) => {
      const item = prev.find((b) => b.id === id);
      if (item) boxStorage.update(id, item);
      return prev;
    });
  };

  const checkAllInventory = () => {
    const target = filterArea === '全て' ? items : items.filter((x) => getAreaLabel(x) === filterArea);
    target.forEach((x) => { boxStorage.update(x.id, { inventoryChecked: true }); });
    setItems((prev) => prev.map((x) => {
      const inTarget = target.some((f) => f.id === x.id);
      return inTarget ? { ...x, inventoryChecked: true } : x;
    }));
  };

  const handlePrint = () => { window.print(); };

  const handleExport = () => {
    const boxes = boxStorage.getAll();
    const data = { exportedAt: new Date().toISOString(), totalItems: boxes.length, items: boxes };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supplies_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        const importedItems: DisasterBox[] = data.items ?? data;
        if (!Array.isArray(importedItems)) { alert('JSONの形式が正しくありません'); return; }
        if (!window.confirm(`${importedItems.length}件のデータをインポートします。既存データは上書きされます。よろしいですか？`)) return;
        boxStorage.saveAll(importedItems);
        setItems(importedItems);
        alert(`${importedItems.length}件をインポートしました`);
      } catch {
        alert('JSONファイルの読み込みに失敗しました');
      }
    };
    input.click();
  };

  const cancelForm = () => { setShowForm(false); setForm(emptyBox()); };

  const allAreas = ['全て', ...BOX_AREAS];
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

      {/* 新規登録フォーム */}
      {showForm && (
        <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>新規登録</h3>
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
              <button type="submit" style={btnPrimary}>登録</button>
              <button type="button" style={btnSecondary} onClick={cancelForm}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* ツールバー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ ...labelS, margin: 0, whiteSpace: 'nowrap' }}>エリア絞り込み</label>
          <select style={{ ...inp, width: 'auto', minWidth: '160px' }} value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}>
            {allAreas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={checkAllInventory}>全棚卸チェック</button>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={handlePrint}>印刷</button>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={handleImport}>JSONインポート</button>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={handleExport}>JSONバックアップ</button>
          <button style={btnPrimary} onClick={() => { showForm ? cancelForm() : setShowForm(true); }}>
            {showForm ? 'キャンセル' : '+ 新規登録'}
          </button>
        </div>
      </div>

      {/* テーブル */}
      {filtered.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          登録データがありません
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['エリア', '品目名', '定数', '現在数', '単位', '保管場所', '使用期限', '補充完了', '棚卸確認', '削除'].map((h) => (
                    <th key={h} className={h === '削除' ? 'no-print' : undefined} style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', whiteSpace: 'nowrap', textAlign: 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const alerts = getBoxAlerts(item);
                  const rowBg = alerts.some((a) => a.bg === '#fee2e2') ? '#fff5f5'
                    : alerts.some((a) => a.bg === '#fef3c7') ? '#fffbeb' : 'white';
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: rowBg }}>
                      {/* エリア */}
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#1d6fd4', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '20px' }}>
                          {getAreaLabel(item)}
                        </span>
                      </td>
                      {/* 品目名 */}
                      <td style={{ padding: '8px 12px', fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>
                        {item.itemName}
                        {alerts.length > 0 && (
                          <span style={{ marginLeft: '6px', fontSize: '11px', color: alerts[0].color, fontWeight: '700' }}>
                            {alerts.map((a) => a.label).join(' / ')}
                          </span>
                        )}
                      </td>
                      {/* 定数 */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          value={item.standardQty}
                          onChange={(e) => handleFieldChange(item.id, 'standardQty', Number(e.target.value))}
                          onBlur={() => handleSave(item.id)}
                          style={{ width: '60px', padding: '3px 6px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'right', outline: 'none' }}
                        />
                      </td>
                      {/* 現在数 */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          value={item.currentQty}
                          onChange={(e) => handleFieldChange(item.id, 'currentQty', Number(e.target.value))}
                          onBlur={() => handleSave(item.id)}
                          style={{ width: '60px', padding: '3px 6px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'right', outline: 'none' }}
                        />
                      </td>
                      {/* 単位 */}
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8' }}>個</td>
                      {/* 保管場所 */}
                      <td style={{ padding: '8px 12px' }}>
                        <select
                          value={item.storageLocation}
                          onChange={(e) => handleFieldSave(item.id, 'storageLocation', e.target.value)}
                          style={{ fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 6px', color: '#64748b', outline: 'none' }}
                        >
                          {BOX_STORAGE_LOCATIONS.map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </td>
                      {/* 使用期限 */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="month"
                          value={item.expiryMonth ?? ''}
                          onChange={(e) => handleFieldChange(item.id, 'expiryMonth', e.target.value)}
                          onBlur={() => handleSave(item.id)}
                          style={{ fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 6px', color: '#64748b', outline: 'none' }}
                        />
                      </td>
                      {/* 補充完了 */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={item.replenishmentDone}
                          onChange={(e) => {
                            addLog('supplies_box', 'replenishmentDone:' + e.target.checked, item.id, item.itemName);
                            handleFieldSave(item.id, 'replenishmentDone', e.target.checked);
                          }}
                        />
                      </td>
                      {/* 棚卸確認 */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={item.inventoryChecked}
                          onChange={(e) => {
                            addLog('supplies_box', 'inventoryChecked:' + e.target.checked, item.id, item.itemName);
                            handleFieldSave(item.id, 'inventoryChecked', e.target.checked);
                          }}
                        />
                      </td>
                      {/* 削除 */}
                      <td className="no-print" style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: 'white', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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
  const [form, setForm] = useState(emptyWb());
  const [filterArea, setFilterArea] = useState<string>('全て');

  useEffect(() => { setItems(wbStorage.getAll()); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = nowISO();
    const newItem: Whiteboard = { id: genId(), ...form, createdAt: now, updatedAt: now };
    wbStorage.add(newItem);
    setItems((prev) => [...prev, newItem]);
    setForm(emptyWb());
    setShowForm(false);
  };

  const deleteItem = (id: string) => {
    if (!confirm('削除しますか？')) return;
    wbStorage.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const handleFieldChange = (id: string, field: keyof Whiteboard, value: unknown) => {
    setItems((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleFieldSave = (id: string, field: keyof Whiteboard, value: unknown) => {
    setItems((prev) => {
      const updated = prev.map((b) => b.id === id ? { ...b, [field]: value } : b);
      wbStorage.update(id, { [field]: value } as Partial<Whiteboard>);
      return updated;
    });
  };

  const handleSave = (id: string) => {
    setItems((prev) => {
      const item = prev.find((b) => b.id === id);
      if (item) wbStorage.update(id, item);
      return prev;
    });
  };

  const checkAllInventory = () => {
    const target = filterArea === '全て' ? items : items.filter((x) => getWbUseLabel(x) === filterArea);
    target.forEach((x) => { wbStorage.update(x.id, { inventoryChecked: true }); });
    setItems((prev) => prev.map((x) => {
      const inTarget = target.some((f) => f.id === x.id);
      return inTarget ? { ...x, inventoryChecked: true } : x;
    }));
  };

  const handlePrint = () => { window.print(); };

  const handleExport = () => {
    const wbs = wbStorage.getAll();
    const data = { exportedAt: new Date().toISOString(), totalItems: wbs.length, items: wbs };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboards_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        const importedItems: Whiteboard[] = data.items ?? data;
        if (!Array.isArray(importedItems)) { alert('JSONの形式が正しくありません'); return; }
        if (!window.confirm(`${importedItems.length}件のデータをインポートします。既存データは上書きされます。よろしいですか？`)) return;
        wbStorage.saveAll(importedItems);
        setItems(importedItems);
        alert(`${importedItems.length}件をインポートしました`);
      } catch {
        alert('JSONファイルの読み込みに失敗しました');
      }
    };
    input.click();
  };

  const cancelForm = () => { setShowForm(false); setForm(emptyWb()); };

  const storageOptions = ['全て', ...Array.from(new Set(items.map((x) => getWbStorageLabel(x))))];
  const filtered = filterArea === '全て' ? items : items.filter((x) => getWbStorageLabel(x) === filterArea);
  const alertCount = filtered.filter((x) => x.standardQty > x.currentQty).length;
  const checkedCount = filtered.filter((x) => x.inventoryChecked).length;
  const totalStandard = filtered.reduce((sum, x) => sum + x.standardQty, 0);
  const totalCurrent = filtered.reduce((sum, x) => sum + x.currentQty, 0);

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

      {/* 新規登録フォーム */}
      {showForm && (
        <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>新規登録</h3>
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
            <div style={{ display: 'flex', gap: '16px', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.inventoryChecked}
                  onChange={(e) => setForm({ ...form, inventoryChecked: e.target.checked })} />
                棚卸確認
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={btnPrimary}>登録</button>
              <button type="button" style={btnSecondary} onClick={cancelForm}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* ツールバー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ ...labelS, margin: 0, whiteSpace: 'nowrap' }}>保管場所絞り込み</label>
          <select style={{ ...inp, width: 'auto', minWidth: '160px' }} value={filterArea}
            onChange={(e) => setFilterArea(e.target.value)}>
            {storageOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={checkAllInventory}>全棚卸チェック</button>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={handlePrint}>印刷</button>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={handleImport}>JSONインポート</button>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={handleExport}>JSONバックアップ</button>
          <button style={btnPrimary} onClick={() => { showForm ? cancelForm() : setShowForm(true); }}>
            {showForm ? 'キャンセル' : '+ 新規登録'}
          </button>
        </div>
      </div>

      {/* テーブル */}
      {filtered.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          登録データがありません
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['エリア', '品目名', '定数', '現在数', '単位', '保管場所', '使用期限', '補充完了', '棚卸確認', '削除'].map((h) => (
                    <th key={h} className={h === '削除' ? 'no-print' : undefined} style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', whiteSpace: 'nowrap', textAlign: 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const hasAlert = item.standardQty > item.currentQty;
                  const rowBg = hasAlert ? '#fffbeb' : 'white';
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: rowBg }}>
                      {/* エリア */}
                      <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#1d6fd4', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '20px' }}>
                          {getWbUseLabel(item)}
                        </span>
                      </td>
                      {/* 品目名 */}
                      <td style={{ padding: '8px 12px', fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>
                        ホワイトボード
                        {hasAlert && (
                          <span style={{ marginLeft: '6px', fontSize: '11px', color: '#d97706', fontWeight: '700' }}>
                            不足 {item.standardQty - item.currentQty}枚
                          </span>
                        )}
                      </td>
                      {/* 定数 */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          value={item.standardQty}
                          onChange={(e) => handleFieldChange(item.id, 'standardQty', Number(e.target.value))}
                          onBlur={() => handleSave(item.id)}
                          style={{ width: '60px', padding: '3px 6px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'right', outline: 'none' }}
                        />
                      </td>
                      {/* 現在数 */}
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          value={item.currentQty}
                          onChange={(e) => handleFieldChange(item.id, 'currentQty', Number(e.target.value))}
                          onBlur={() => handleSave(item.id)}
                          style={{ width: '60px', padding: '3px 6px', fontSize: '12px', border: `1px solid ${hasAlert ? '#fca5a5' : '#e2e8f0'}`, borderRadius: '6px', textAlign: 'right', outline: 'none', color: hasAlert ? '#dc2626' : undefined }}
                        />
                      </td>
                      {/* 単位 */}
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8' }}>枚</td>
                      {/* 保管場所 */}
                      <td style={{ padding: '8px 12px' }}>
                        <select
                          value={item.storageLocation}
                          onChange={(e) => handleFieldSave(item.id, 'storageLocation', e.target.value as WbStorageLocation)}
                          style={{ fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '3px 6px', color: '#64748b', outline: 'none' }}
                        >
                          {WB_STORAGE_LOCATIONS.map((loc) => (
                            <option key={loc} value={loc}>{loc}</option>
                          ))}
                        </select>
                      </td>
                      {/* 使用期限（ホワイトボードは非該当）*/}
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>—</td>
                      {/* 補充完了（ホワイトボードは非該当）*/}
                      <td style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>—</td>
                      {/* 棚卸確認 */}
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={item.inventoryChecked}
                          onChange={(e) => {
                            addLog('supplies_whiteboard', 'inventoryChecked:' + e.target.checked, item.id, getWbUseLabel(item));
                            handleFieldSave(item.id, 'inventoryChecked', e.target.checked);
                          }}
                        />
                      </td>
                      {/* 削除 */}
                      <td className="no-print" style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <button
                          onClick={() => deleteItem(item.id)}
                          style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: 'white', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                        >
                          削除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  {/* エリア列 */}
                  <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                    合計 {filtered.length} エリア
                  </td>
                  {/* 品目名列 */}
                  <td />
                  {/* 定数列 */}
                  <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'center' }}>
                    {totalStandard}
                  </td>
                  {/* 現在数列 */}
                  <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: totalCurrent < totalStandard ? '#ef4444' : '#0f172a', textAlign: 'center' }}>
                    {totalCurrent}
                  </td>
                  {/* 単位・保管場所・使用期限・補充完了・棚卸確認・削除 */}
                  <td /><td /><td /><td /><td /><td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// タブ3: 災害物品管理
// ══════════════════════════════════════════════════════════
function emptyDisasterItem(): Omit<DisasterItem, 'id' | 'createdAt' | 'updatedAt'> {
  return { location: '', name: '', quantity: 0, unit: '個', note: '', inventoryChecked: false };
}

function DisasterItemTab() {
  const [items, setItems] = useState<DisasterItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyDisasterItem());
  const [filterLocation, setFilterLocation] = useState<string>('全て');

  useEffect(() => { setItems(disasterItemStorage.getAll()); }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) return;
    const now = nowISO();
    const newItem: DisasterItem = { id: genId(), ...form, createdAt: now, updatedAt: now };
    disasterItemStorage.add(newItem);
    setItems((prev) => [...prev, newItem]);
    setForm(emptyDisasterItem());
    setShowForm(false);
  };

  const deleteItem = (id: string) => {
    if (!confirm('削除しますか？')) return;
    disasterItemStorage.delete(id);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const handleFieldChange = (id: string, field: keyof DisasterItem, value: unknown) => {
    setItems((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleFieldSave = (id: string, field: keyof DisasterItem, value: unknown) => {
    setItems((prev) => {
      const updated = prev.map((b) => b.id === id ? { ...b, [field]: value } : b);
      disasterItemStorage.update(id, { [field]: value } as Partial<DisasterItem>);
      return updated;
    });
  };

  const handleSave = (id: string) => {
    setItems((prev) => {
      const item = prev.find((b) => b.id === id);
      if (item) disasterItemStorage.update(id, item);
      return prev;
    });
  };

  const handleExport = () => {
    const data = { exportedAt: new Date().toISOString(), totalItems: items.length, items };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `disaster_items_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        const imported: DisasterItem[] = data.items ?? data;
        if (!Array.isArray(imported)) { alert('JSONの形式が正しくありません'); return; }
        if (!window.confirm(`${imported.length}件のデータをインポートします。既存データは上書きされます。よろしいですか？`)) return;
        disasterItemStorage.saveAll(imported);
        setItems(imported);
        alert(`${imported.length}件をインポートしました`);
      } catch {
        alert('JSONファイルの読み込みに失敗しました');
      }
    };
    input.click();
  };

  const cancelForm = () => { setShowForm(false); setForm(emptyDisasterItem()); };

  const locationOptions = ['全て', ...Array.from(new Set(items.map((x) => x.location).filter(Boolean)))];
  const filtered = filterLocation === '全て' ? items : items.filter((x) => x.location === filterLocation);
  const locationCount = new Set(items.map((x) => x.location).filter(Boolean)).size;
  const checkedCount = filtered.filter((x) => x.inventoryChecked).length;
  const totalQty = filtered.reduce((sum, x) => sum + x.quantity, 0);

  return (
    <div>
      {/* サマリー */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '1.25rem' }}>
        {[
          { label: '登録品目', value: filtered.length, color: '#0f172a' },
          { label: '保管場所数', value: locationCount, color: '#1d6fd4' },
          { label: '棚卸済', value: checkedCount, color: '#16a34a' },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
            <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 4px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: '700', color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* 新規登録フォーム */}
      {showForm && (
        <div style={{ backgroundColor: 'white', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a', margin: '0 0 1.25rem' }}>新規登録</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={labelS}>保管場所 *</label>
                <input style={inp} type="text" placeholder="例：災害倉庫B" value={form.location} required
                  onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label style={labelS}>物品名称 *</label>
                <input style={inp} type="text" placeholder="例：担架" value={form.name} required
                  onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={labelS}>数</label>
                <input style={inp} type="number" min="0" value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
              </div>
              <div>
                <label style={labelS}>単位</label>
                <input style={inp} type="text" placeholder="例：個・台・枚" value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelS}>備考</label>
                <input style={inp} type="text" value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.inventoryChecked}
                  onChange={(e) => setForm({ ...form, inventoryChecked: e.target.checked })} />
                棚卸確認
              </label>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={btnPrimary}>登録</button>
              <button type="button" style={btnSecondary} onClick={cancelForm}>キャンセル</button>
            </div>
          </form>
        </div>
      )}

      {/* ツールバー */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ ...labelS, margin: 0, whiteSpace: 'nowrap' }}>保管場所絞り込み</label>
          <select style={{ ...inp, width: 'auto', minWidth: '160px' }} value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}>
            {locationOptions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={handleImport}>JSONインポート</button>
          <button style={{ ...btnSecondary, fontSize: '12px', padding: '7px 12px' }} onClick={handleExport}>JSONバックアップ</button>
          <button style={btnPrimary} onClick={() => { showForm ? cancelForm() : setShowForm(true); }}>
            {showForm ? 'キャンセル' : '+ 新規登録'}
          </button>
        </div>
      </div>

      {/* テーブル */}
      {filtered.length === 0 ? (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
          登録データがありません
        </div>
      ) : (
        <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['保管場所', '物品名称', '数', '単位', '備考', '棚卸確認', '削除'].map((h) => (
                    <th key={h} className={h === '削除' ? 'no-print' : undefined} style={{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', whiteSpace: 'nowrap', textAlign: 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: 'white' }}>
                    {/* 保管場所 */}
                    <td style={{ padding: '8px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#1d6fd4', backgroundColor: '#eff6ff', padding: '2px 8px', borderRadius: '20px' }}>
                        {item.location || '—'}
                      </span>
                    </td>
                    {/* 物品名称 */}
                    <td style={{ padding: '8px 12px', fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>
                      {item.name}
                    </td>
                    {/* 数 */}
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleFieldChange(item.id, 'quantity', Number(e.target.value))}
                        onBlur={() => handleSave(item.id)}
                        style={{ width: '60px', padding: '3px 6px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'right', outline: 'none' }}
                      />
                    </td>
                    {/* 単位 */}
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleFieldChange(item.id, 'unit', e.target.value)}
                        onBlur={() => handleSave(item.id)}
                        style={{ width: '56px', padding: '3px 6px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', color: '#64748b' }}
                      />
                    </td>
                    {/* 備考 */}
                    <td style={{ padding: '8px 12px' }}>
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => handleFieldChange(item.id, 'note', e.target.value)}
                        onBlur={() => handleSave(item.id)}
                        style={{ width: '160px', padding: '3px 6px', fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', outline: 'none', color: '#64748b' }}
                      />
                    </td>
                    {/* 棚卸確認 */}
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={item.inventoryChecked}
                        onChange={(e) => {
                          addLog('supplies_item', 'inventoryChecked:' + e.target.checked, item.id, item.name);
                          handleFieldSave(item.id, 'inventoryChecked', e.target.checked);
                        }}
                      />
                    </td>
                    {/* 削除 */}
                    <td className="no-print" style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <button
                        onClick={() => deleteItem(item.id)}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: 'white', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  {/* 保管場所列 */}
                  <td style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                    合計 {filtered.length} 品目
                  </td>
                  {/* 物品名称列 */}
                  <td />
                  {/* 数列 */}
                  <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '700', color: '#0f172a', textAlign: 'center' }}>
                    {totalQty}
                  </td>
                  {/* 単位・備考・棚卸確認・削除 */}
                  <td /><td /><td /><td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
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
    const item = items.find((x) => x.id === id);
    if (item) addLog('supplies_request', field + ':' + (val ? 'true' : 'false'), id, item.itemName);
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
  const [tab, setTab] = useState<'box' | 'whiteboard' | 'item' | 'request'>('box');

  const TABS = [
    { key: 'box' as const, label: '災害BOX管理' },
    { key: 'whiteboard' as const, label: 'ホワイトボード管理' },
    { key: 'item' as const, label: '災害物品管理' },
    { key: 'request' as const, label: '物品請求リスト' },
  ];

  return (
    <main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif" }}>
      <style>{`
        @media print {
          nav,
          button,
          input[type="file"],
          select.filter-select,
          .no-print {
            display: none !important;
          }

          @page {
            size: A4 landscape;
            margin: 8mm 6mm;
          }

          body {
            font-size: 7pt;
            color: #000;
            background: white;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7pt;
          }

          th {
            background-color: #f0f0f0 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            font-size: 7pt;
            padding: 2px 4px !important;
            border: 0.5pt solid #ccc;
          }

          td {
            padding: 2px 4px !important;
            font-size: 7pt;
            border: 0.5pt solid #e0e0e0;
            vertical-align: middle;
          }

          input[type="number"],
          input[type="month"],
          select {
            border: none !important;
            padding: 0 !important;
            font-size: 7pt;
            background: transparent;
            -webkit-appearance: none;
            appearance: none;
          }

          tr {
            height: 14pt;
            page-break-inside: avoid;
          }

          tbody {
            page-break-inside: auto;
          }

          .summary-cards {
            display: flex;
            gap: 8px;
            margin-bottom: 4mm;
          }

          h1 {
            font-size: 11pt;
            margin: 0 0 2mm;
          }
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
        {tab === 'item' && <DisasterItemTab />}
        {tab === 'request' && <RequestTab />}
      </div>
    </main>
  );
}
