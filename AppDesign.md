# AppDesign.md — デザインシステム基準

三重中央医療センター 災害対策委員会管理システム  
**全ページ共通のデザインルール。新規ページ作成時は必ず遵守すること。**

---

## 基本原則

- 白背景・グレーボーダー・清潔感重視
- 絵文字はナビゲーションやボタンに使用しない
- フォント：`'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif`
- 最大幅：`1400px`（ダッシュボードは `1100px`）、中央寄せ、padding `2rem 1.5rem`

---

## カラーパレット

| 用途 | 値 |
|------|-----|
| メインブルー | `#1d6fd4` |
| テキスト（濃） | `#0f172a` |
| テキスト（中） | `#64748b` |
| テキスト（薄） | `#94a3b8` |
| テキスト（極薄） | `#cbd5e1` |
| ボーダー（標準） | `#e2e8f0` |
| ボーダー（強調） | `#bfdbfe` |
| 背景（ページ） | `#f8fafc` |
| 背景（カード） | `white` |
| 背景（ブルー薄） | `#eff6ff` |
| 成功・完了 | `#16a34a` / `#dcfce7` |
| 警告・進行中 | `#d97706` / `#fef3c7` |
| 危険・超過・期限切れ | `#ef4444` / `#fff7f7` |
| 危険ボーダー | `#fecaca` |
| 未着手 | `#64748b` / `#f1f5f9` |

---

## ナビゲーション

高さ56px・半透明・スティッキー固定。

```tsx
<nav style={{
  position: 'sticky',
  top: 0,
  zIndex: 100,
  height: '56px',
  padding: '0 1.5rem',
  backgroundColor: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(0,0,0,0.07)',
  display: 'flex',
  alignItems: 'center',
}}>
```

---

## ページ全体の構造

```tsx
<main style={{
  minHeight: 'calc(100vh - 56px)',
  backgroundColor: '#f8fafc',
  fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif",
}}>
  <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
    {/* ① ページヘッダー */}
    {/* ② サマリーカード */}
    {/* ③ メインコンテンツ */}
  </div>
</main>
```

---

## ① ページヘッダー

```tsx
<div style={{ marginBottom: '1.5rem' }}>
  {/* 英語サブラベル（大文字・薄色） */}
  <p style={{
    fontSize: '11px', fontWeight: '600', color: '#94a3b8',
    letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px',
  }}>
    English Division Name
  </p>
  {/* メインタイトル */}
  <h1 style={{
    fontSize: '22px', fontWeight: '700', color: '#0f172a',
    margin: '0 0 2px', letterSpacing: '-0.02em',
  }}>
    班名 — ページタイトル
  </h1>
  {/* サブテキスト */}
  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
    説明テキスト
  </p>
</div>
```

---

## ② サマリーカード（4枚グリッド）

```tsx
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '10px',
  marginBottom: '1.5rem',
}}>
  <div style={{
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
  }}>
    <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 5px' }}>
      ラベル
    </p>
    <p style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
      0
    </p>
  </div>
</div>
```

アラート時はボーダーカラーを変更：
- 警告：`border: '1px solid #fecaca'`
- 数値色：`color: '#ef4444'`

---

## ③ メインコンテンツ

### テーブルコンテナ

```tsx
<div style={{
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '14px',
  overflow: 'hidden',
}}>
```

### テーブルヘッダー行

```tsx
<tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
  <th style={{
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '10px',
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  }}>
    列名
  </th>
</tr>
```

### テーブルデータ行

```tsx
<tr style={{ borderBottom: '1px solid #f1f5f9' }}>
  <td style={{ padding: '10px 12px', fontSize: '13px', color: '#64748b' }}>
    値
  </td>
</tr>
```

### カードコンテナ（フォーム・詳細パネル）

```tsx
<div style={{
  backgroundColor: 'white',
  border: '1px solid #bfdbfe',   // 強調時はブルーボーダー
  borderRadius: '14px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
}}>
```

---

## ボタンスタイル

```tsx
// プライマリ（新規登録・保存）
{
  padding: '9px 16px', borderRadius: '9px', border: 'none',
  backgroundColor: '#1d6fd4', color: 'white',
  fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  transition: 'all 0.15s',
}

// セカンダリ（キャンセル）
{
  padding: '9px 16px', borderRadius: '9px',
  border: '1px solid #e2e8f0', backgroundColor: 'white',
  color: '#64748b', fontSize: '13px', cursor: 'pointer',
}

// フィルター（アクティブ）
{
  padding: '7px 14px', borderRadius: '8px',
  border: '1px solid #bfdbfe', backgroundColor: '#eff6ff',
  color: '#1d6fd4', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
}

// フィルター（非アクティブ）
{
  padding: '7px 14px', borderRadius: '8px',
  border: '1px solid #e2e8f0', backgroundColor: 'white',
  color: '#64748b', fontSize: '12px', cursor: 'pointer',
}

// 削除ボタン（小）
{
  padding: '4px 10px', borderRadius: '6px',
  border: '1px solid #fecaca', backgroundColor: 'white',
  color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
}

// 編集ボタン（小）
{
  padding: '4px 10px', borderRadius: '6px',
  border: '1px solid #bfdbfe', backgroundColor: '#eff6ff',
  color: '#1d6fd4', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
}
```

---

## ステータスバッジ

```tsx
// 完了
{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px',
  backgroundColor: '#dcfce7', color: '#16a34a' }

// 進行中
{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px',
  backgroundColor: '#fef3c7', color: '#d97706' }

// 未着手
{ fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '6px',
  backgroundColor: '#f1f5f9', color: '#64748b' }

// 稼働中（モジュールカード）
{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '999px',
  backgroundColor: '#dbeafe', color: '#1e40af' }

// 準備中（モジュールカード）
{ fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '999px',
  backgroundColor: '#f1f5f9', color: '#64748b' }
```

---

## フォーム入力欄

```tsx
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  fontSize: '13px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  outline: 'none',
  fontFamily: 'inherit',
  color: '#0f172a',
  backgroundColor: 'white',
  boxSizing: 'border-box',
};

// ラベル共通スタイル
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: '600',
  color: '#64748b',
  marginBottom: '5px',
  letterSpacing: '0.03em',
};
```

---

## モジュールカード（ダッシュボード）

```tsx
<div style={{
  backgroundColor: 'white',
  border: '1px solid #bfdbfe',   // active時。非activeは '#e2e8f0'
  borderRadius: '14px',
  padding: '1.5rem',
  opacity: 1,                    // 非activeは 0.65
  cursor: 'pointer',             // 非activeは 'default'
  transition: 'box-shadow 0.2s, border-color 0.2s',
}}>
  {/* アイコン */}
  <div style={{ width: '44px', height: '44px', borderRadius: '10px',
    backgroundColor: '#eff6ff',   // カテゴリ色
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }} />

  {/* タイトル */}
  <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a',
    margin: '0 0 0.4rem', letterSpacing: '-0.01em' }} />

  {/* 説明 */}
  <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }} />

  {/* 「開く」リンク */}
  <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center',
    gap: '6px', color: '#1d6fd4', fontSize: '13px', fontWeight: '600' }}>
    開く →
  </div>
</div>
```

---

## フッター

```tsx
<p style={{
  textAlign: 'center',
  fontSize: '11px',
  color: '#cbd5e1',
  marginTop: '3rem',
}}>
  三重中央医療センター 災害対策委員会管理システム
</p>
```

---

## 実装済みページ一覧

| ページ | パス | 参照ファイル |
|--------|------|-------------|
| ダッシュボード | `/` | `app/page.tsx` |
| 訓練班 | `/training` | `app/training/page.tsx` |
| 物品班 | `/supplies` | `app/supplies/page.tsx` |
| マニュアル班 | `/manual` | `app/manual/page.tsx` |

---

## ブランチ運用・開発フロー

- Claude Code（ターミナル）で実装・git push
- `cd ~/Documents/GitHub/disaster-management-app && claude` で起動
- git pushはSSH設定済み
- 新ページ追加時は `app/_config/modules.tsx` に1行追加するだけ
