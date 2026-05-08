# 三重中央医療センター 災害対策委員会管理システム
# プロジェクトナレッジベース

**リポジトリ：** https://github.com/tslab1978/disaster-management-app
**最終更新：** 2026-05-08

---

## 📋 目次

1. [プロジェクト概要](#1-プロジェクト概要)
2. [開発フロー（標準手順）](#2-開発フロー標準手順)
3. [デザインシステム基準](#3-デザインシステム基準)
4. [進捗・フェーズ管理](#4-進捗フェーズ管理)
5. [Supabase移行計画](#5-supabase移行計画)
6. [Vercelデプロイ トラブルシューティング](#6-vercelデプロイ-トラブルシューティング)
7. [解決事例ログ](#7-解決事例ログ)

---

## 1. プロジェクト概要

### システム概要

| 項目 | 内容 |
|------|------|
| 名称 | 三重中央医療センター 災害対策委員会管理システム |
| 技術スタック | Next.js 14 + TypeScript |
| データ管理 | localStorage（→ Supabase 移行予定） |
| デプロイ | Vercel（main ブランチへの push で自動発火） |
| ローカルパス | `~/Documents/GitHub/disaster-management-app` |
| リポジトリ | `https://github.com/tslab1978/disaster-management-app` |
| ローカル確認URL | `http://localhost:3000` |
| git push 方式 | SSH 設定済み |

### 実装済みページ一覧

| ページ名 | パス | ファイル | 状態 |
|----------|------|----------|------|
| ダッシュボード | `/` | `app/page.tsx` | ✅ 稼働中 |
| 訓練班 | `/training` | `app/training/page.tsx` | ✅ 稼働中 |
| 物品班 | `/supplies` | `app/supplies/page.tsx` | ✅ 稼働中 |
| マニュアル班 | `/manual` | `app/manual/page.tsx` | ✅ 稼働中 |
| 勉強会班 | `/study` | `app/study/page.tsx` | ✅ 稼働中 |
| チーム会班 | `/team` | `app/team/page.tsx` | ✅ 稼働中 |
| 事務部門・DMAT | `/office` | `app/office/page.tsx` | ✅ 稼働中 |
| 議事録 | `/minutes` | `app/minutes/page.tsx` | ✅ 稼働中 |
｜活動ログ｜　/logsapp/logs/page.tsx　｜　✅ 稼働中

### 各班のストレージキーと完了フラグ

| 班 | ストレージキー | 完了フラグ |
|----|----------------|------------|
| 訓練班 | `training_tasks_v2` | `status === 'completed'` |
| 物品班（BOX） | `supplies_boxes_v1` | `inventoryChecked === true` |
| 物品班（WB） | `supplies_whiteboards_v1` | `inventoryChecked === true` |
| 物品請求 | `supplies_requests_v1` | `deliveryDecided === true` |
| 勉強会班 | `study_sessions_v1` | `status === 'done'` |
| チーム会班 | `team_sessions_v1` | `status === 'done'` |
| 事務部門・DMAT | `office_notices` | `isRead === true` |
| 議事録 | `minutes_records` | `confirmed === true` |
| 活動ログ | `committee_logs` | — |

---

## 2. 開発フロー（標準手順）

### 基本方針

**Claude AI（このチャット）で設計・プロンプト作成 → Claude Code で実装 → git push** の流れで完結させる。GitHub MCP は使用しない。

```
Claude AI（このチャット）
  設計・相談・コード生成・プロンプト作成
      ↓
Claude Code（ターミナル）
  cd ~/Documents/GitHub/disaster-management-app && claude
  実装・ファイル編集
      ↓
localhost:3000 でローカル確認（何度でも・本番に影響なし）
      ↓ 完成形になったら
git push → Vercel 自動デプロイ → 本番確認
```

### 1セッションの手順

**ターミナル タブ1（常時起動・触らない）**
```bash
cd ~/Documents/GitHub/disaster-management-app
npm run dev
```

**ターミナル タブ2（作業用・Cmd+T で新規タブ）**

```bash
# ① 新機能の場合はブランチを作成（小修正は main 直接でもOK）
git checkout -b feature/機能名

# ② Claude Code で実装
claude

# ③ localhost:3000 で確認 → 完成形になったら

# ④ コミット＆プッシュ
git add -A
git commit -m "feat: 〇〇を実装"
git push origin feature/機能名

# ⑤ main にマージ → 自動デプロイ
git checkout main
git merge feature/機能名
git push origin main
```

### コミットメッセージの形式

| プレフィックス | 用途 |
|---|---|
| `feat:` | 新機能追加 |
| `fix:` | バグ修正 |
| `refactor:` | リファクタリング |
| `chore:` | 設定・依存関係の変更 |

### GitHub MCP について

**GitHub MCP は使用しない。** 過去に接続不安定・トークン切れが頻発し、9時間のデバッグにつながった経緯がある。すべての git 操作はターミナルのコマンドで行う。

### localStorage とデプロイの関係

localStorage はブラウザとドメインに紐づいており、Vercel へのデプロイとは**無関係**。デプロイしてもデータは消えない。ただし以下のケースでは消える：

- ブラウザのキャッシュ・サイトデータをクリアした場合
- 別のブラウザ・別の端末でアクセスした場合
- ストレージキーを変更した場合（`v1` → `v2` など）

→ これが **Supabase 移行が必要な理由**（セクション5参照）。

### 新スレッド開始時のテンプレート

新しいチャットを始めるときは冒頭に以下を貼るだけで引き継ぎ完了：

```
このプロジェクトは三重中央医療センター 災害対策委員会管理システムの開発です。
KNOWLEDGE_BASE.md を必ず参照の上、作業を開始してください。
https://github.com/tslab1978/disaster-management-app

技術：Next.js 14 + TypeScript / localStorage（→Supabase移行予定）/ Vercel自動デプロイ

開発フロー：
- 設計・相談・プロンプト作成 → このチャット（Claude AI）
- 実装 → Claude Code（cd ~/Documents/GitHub/disaster-management-app && claude）
- ローカル確認（localhost:3000）で完成形にしてから git push
- GitHub MCP は使用しない
```

---

## 3. デザインシステム基準

**新規ページ作成時は必ず遵守すること。**
訓練班ページ（`app/training/page.tsx`）が最も完成度が高く、参考にすること。

### 基本原則

- 白背景・グレーボーダー・清潔感重視
- 絵文字はナビゲーションやボタンに**使用しない**
- フォント：`'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif`
- 最大幅：`1400px`（ダッシュボードは `1100px`）、中央寄せ、padding `2rem 1.5rem`

### カラーパレット

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
| 危険・超過 | `#ef4444` / `#fff7f7` |
| 危険ボーダー | `#fecaca` |
| 未着手 | `#64748b` / `#f1f5f9` |

### ナビゲーション

高さ56px・半透明・スティッキー固定。

```tsx
<nav style={{
  position: 'sticky', top: 0, zIndex: 100,
  height: '56px', padding: '0 1.5rem',
  backgroundColor: 'rgba(255,255,255,0.92)',
  backdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(0,0,0,0.07)',
  display: 'flex', alignItems: 'center',
}}>
```

### ページ全体の構造テンプレート

```tsx
<main style={{
  minHeight: 'calc(100vh - 56px)',
  backgroundColor: '#f8fafc',
  fontFamily: "'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif",
}}>
  <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

    {/* ① ページヘッダー */}
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8',
        letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
        English Division Name
      </p>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a',
        margin: '0 0 2px', letterSpacing: '-0.02em' }}>
        班名 — ページタイトル
      </h1>
      <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
        説明テキスト
      </p>
    </div>

    {/* ② サマリーカード（4枚グリッド） */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
      gap: '10px', marginBottom: '1.5rem' }}>
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0',
        borderRadius: '10px', padding: '1rem 1.25rem' }}>
        <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 5px' }}>ラベル</p>
        <p style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a',
          margin: 0, letterSpacing: '-0.03em' }}>0</p>
      </div>
    </div>

    {/* ③ メインコンテンツ */}
    <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0',
      borderRadius: '14px', overflow: 'hidden' }}>
      ...
    </div>

  </div>
</main>
```

### ボタンスタイル

```tsx
// プライマリ（新規登録・保存）
{ padding: '9px 16px', borderRadius: '9px', border: 'none',
  backgroundColor: '#1d6fd4', color: 'white',
  fontSize: '13px', fontWeight: '600', cursor: 'pointer' }

// セカンダリ（キャンセル）
{ padding: '9px 16px', borderRadius: '9px',
  border: '1px solid #e2e8f0', backgroundColor: 'white',
  color: '#64748b', fontSize: '13px', cursor: 'pointer' }

// フィルター（アクティブ）
{ padding: '7px 14px', borderRadius: '8px',
  border: '1px solid #bfdbfe', backgroundColor: '#eff6ff',
  color: '#1d6fd4', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }

// フィルター（非アクティブ）
{ padding: '7px 14px', borderRadius: '8px',
  border: '1px solid #e2e8f0', backgroundColor: 'white',
  color: '#64748b', fontSize: '12px', cursor: 'pointer' }

// 編集（小）
{ padding: '4px 10px', borderRadius: '6px',
  border: '1px solid #bfdbfe', backgroundColor: '#eff6ff',
  color: '#1d6fd4', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }

// 削除（小）
{ padding: '4px 10px', borderRadius: '6px',
  border: '1px solid #fecaca', backgroundColor: 'white',
  color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }
```

### テーブルスタイル

```tsx
// thead行
{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }

// thセル
{ padding: '10px 12px', textAlign: 'left', fontSize: '10px',
  fontWeight: '700', color: '#94a3b8', letterSpacing: '0.06em', whiteSpace: 'nowrap' }

// tbody行の区切り
{ borderBottom: '1px solid #f1f5f9' }

// tdセル（標準）
{ padding: '10px 12px', fontSize: '13px', color: '#64748b' }
```

### ステータスバッジ

```tsx
// 完了
{ fontSize: '11px', fontWeight: '600', padding: '3px 8px',
  borderRadius: '6px', backgroundColor: '#dcfce7', color: '#16a34a' }

// 進行中
{ fontSize: '11px', fontWeight: '600', padding: '3px 8px',
  borderRadius: '6px', backgroundColor: '#fef3c7', color: '#d97706' }

// 未着手
{ fontSize: '11px', fontWeight: '600', padding: '3px 8px',
  borderRadius: '6px', backgroundColor: '#f1f5f9', color: '#64748b' }
```

### フォーム入力欄

```tsx
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 11px', fontSize: '13px',
  border: '1px solid #e2e8f0', borderRadius: '8px',
  outline: 'none', fontFamily: 'inherit',
  color: '#0f172a', backgroundColor: 'white', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', fontWeight: '600',
  color: '#64748b', marginBottom: '5px', letterSpacing: '0.03em',
};
```

### フッター

```tsx
<p style={{ textAlign: 'center', fontSize: '11px', color: '#cbd5e1', marginTop: '3rem' }}>
  三重中央医療センター 災害対策委員会管理システム
</p>
```

### 新規ページ追加時のチェックリスト

- [ ] `app/_config/modules.tsx` に1行追加
- [ ] `app/[ページ名]/page.tsx` を作成
- [ ] デザインシステム基準（このセクション）に準拠しているか確認
- [ ] localStorage 保存を `useEffect` + `saveToStorage` で実装
- [ ] `setSessions((prev) => ...)` パターンは使わず `const next = ...` で変数に取ってから `saveToStorage` に渡す

---

## 4. 進捗・フェーズ管理

### 現在のフェーズ

| フェーズ | 内容 | 状態 |
|----------|------|------|
| Phase 1 | 全ページ実装・localStorage で運用 | ✅ 完了 |
| Phase 2 | 各ページに JSON エクスポート機能追加 | ⬜ 未着手 |
| Phase 3 | Supabase セットアップ | ⬜ 未着手 |
| Phase 4 | ストレージファイルの Supabase 対応 | ⬜ 未着手 |
| Phase 5 | データ移行 | ⬜ 未着手 |
| Phase 6 | ダッシュボード集計ロジック修正 | ⬜ 未着手 |

### 残タスク詳細（Phase 2）

JSONエクスポートが未実装のストレージキー一覧（`training_tasks_v2` のみ実装済み）：

| ストレージキー | 管理ファイル |
|---|---|
| `manual_logs_v1` | `lib/manualStorage.ts` |
| `manual_verifications_v1` | `lib/manualStorage.ts` |
| `manual_url_v1` / `manual_title_v1` | `lib/manualStorage.ts` |
| `supplies_boxes_v1` | `lib/suppliesStorage.ts` |
| `supplies_whiteboards_v1` | `lib/suppliesStorage.ts` |
| `supplies_requests_v1` | `lib/suppliesStorage.ts` |
| `study_sessions_v1` | `app/study/page.tsx` |
| `team_sessions_v1` | `app/team/page.tsx` |
| `office_notices` | `app/office/page.tsx` |
| `minutes_records` | `app/minutes/page.tsx` |
| `next_training_date` | `app/page.tsx` |

**実装パターン（ストレージファイルに追加）：**
```typescript
export: (): string => {
  return JSON.stringify(boxStorage.getAll(), null, 2);
}
```

**各ページへのボタン追加パターン：**
```typescript
const handleExport = () => {
  const json = boxStorage.export();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'supplies_boxes.json';
  a.click();
  URL.revokeObjectURL(url);
};
```

### committee_logs 設計仕様

各班の状態変更操作を `committee_logs` キーに記録する仕組み。将来の Supabase 移行・議事録自動生成の基盤。

**型定義（`lib/storage.ts`）：**
```typescript
export type CommitteeLog = {
  id: string;        // Date.now().toString()
  timestamp: string; // ISO形式
  category: string;  // 班識別子
  action: string;    // 状態値
  taskId: string;
  taskName: string;
};
```

**各ページの category・action 一覧：**

| ページ | category | action例 |
|--------|----------|---------|
| 訓練班 | `training` | `completed` / `in_progress` / `pending` |
| 物品BOX | `supplies_box` | `replenishmentDone:true` / `inventoryChecked:true` |
| 物品WB | `supplies_whiteboard` | `inventoryChecked:true` |
| 物品請求 | `supplies_request` | `requested:true` / `deliveryDecided:true` |
| マニュアル班 | `manual` | `committeeApproved:true` / `dataUpdated:true` |
| 勉強会班 | `study` | `done` / `upcoming` |
| チーム会班 | `team` | `done` / `implemented:true` |

---

## 5. Supabase移行計画

### 移行対象テーブル一覧

| localStorageキー | 内容 | 管理ファイル |
|---|---|---|
| `training_tasks_v2` | 訓練タスク | `lib/storage.ts` |
| `manual_logs_v1` | マニュアル更新ログ | `lib/manualStorage.ts` |
| `manual_verifications_v1` | 検証事項・決議 | `lib/manualStorage.ts` |
| `manual_url_v1` / `manual_title_v1` | マニュアルURL・タイトル | `lib/manualStorage.ts` |
| `supplies_boxes_v1` | 災害BOX | `lib/suppliesStorage.ts` |
| `supplies_whiteboards_v1` | ホワイトボード | `lib/suppliesStorage.ts` |
| `supplies_requests_v1` | 物品請求 | `lib/suppliesStorage.ts` |
| `study_sessions_v1` | 勉強会 | `app/study/page.tsx` |
| `team_sessions_v1` | チーム会 | `app/team/page.tsx` |
| `office_notices` | 事務連絡 | `app/office/page.tsx` |
| `minutes_records` | 議事録 | `app/minutes/page.tsx` |
| `committee_logs` | 活動ログ | `lib/storage.ts` |
| `next_training_date` | 次回訓練日 | `app/page.tsx` |

### Phase 3 以降の作業内容

**Phase 3：Supabase セットアップ**
- Supabaseアカウント作成・プロジェクト作成
- 上記13テーブルの SQL 作成・実行
- Vercel に環境変数を設定（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`）

**Phase 4：ストレージファイルの書き換え**
- `lib/storage.ts` → Supabase対応
- `lib/manualStorage.ts` → Supabase対応
- `lib/suppliesStorage.ts` → Supabase対応
- `app/study/page.tsx` 内ストレージ → `lib/studyStorage.ts` に切り出してSupabase対応
- `app/team/page.tsx` 内ストレージ → `lib/teamStorage.ts` に切り出してSupabase対応
- `app/office/page.tsx` 内ストレージ → `lib/officeStorage.ts` に切り出してSupabase対応
- `app/minutes/page.tsx` 内ストレージ → `lib/minutesStorage.ts` に切り出してSupabase対応

**Phase 5：データ移行**
- 各班ページからJSONエクスポート
- SupabaseダッシュボードからJSONインポート（またはSQL INSERT）
- 動作確認後、localStorageのデータをクリア

**Phase 6：ダッシュボード集計ロジック修正**
- `app/page.tsx` の `countUnresolved()` をSupabaseクエリに書き換え

---

## 6. Vercelデプロイ トラブルシューティング

### よくあるエラーと対処

| エラー | 原因 | 対処 |
|--------|------|------|
| `404: NOT_FOUND` | Framework設定が `null`、または vercel.json 競合 | 下記「404問題」参照 |
| `Module not found` | tsconfig.json に `paths` がない | `"@/*": ["./*"]` を追加 |
| `TS5023` | `include` が `compilerOptions` 内に書かれている | トップレベルに移動 |
| `doesn't have root layout` | `app/layout.tsx` が欠落 | 再作成 |
| ビルド時間 < 2秒 | Next.js が起動していない | `package.json` を確認 |
| `No Output Directory` | vercel.json の outputDirectory 競合 | vercel.json を削除 |

### 404 問題の解決フロー

```
404が出る
  ↓
1. Vercel → Settings → Framework Preset が "Next.js" になっているか確認
   → null → Next.js に変更 → Redeploy
  ↓
2. vercel.json が存在するか確認
   → outputDirectory が設定されていれば vercel.json を削除
  ↓
3. 正しいドメインにアクセスしているか確認
   → Vercel ダッシュボードで domains を確認
  ↓
4. ビルドログで Route(app) のリストを確認
   → 目的のパスが含まれているか？
```

### tsconfig.json の正しい書き方

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "node",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "strict": false,
    "noEmit": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowJs": true,
    "incremental": true,
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

> ⚠️ `include` は `compilerOptions` の**外**（トップレベル）に書く。内側に書くと `TS5023` エラー。

### Vercel MCP での確認フロー（必要な場合）

```
1. list_teams → teamId を取得
2. list_projects(teamId) → 正しいドメインを確認
3. get_project(projectId, teamId) → framework が "nextjs" か確認
4. list_deployments → 最新の state を確認
5. get_deployment_build_logs → エラー全文を確認
```

---

## 7. 解決事例ログ

### 事例 #001 — 2026-04-04

**症状：** `/training` ページが常に404。ビルドログは「Ready」。調査時間：約9時間

| # | エラー | 根本原因 | 解決策 |
|---|--------|----------|--------|
| 1 | `Module not found: '@/components/Navigation'` | tsconfig.json に paths 設定がなかった | `paths: {"@/*": ["./*"]}` を追加 |
| 2 | `No Next.js version detected` | package.json が欠落 | package.json を再作成 |
| 3 | `TS5023: Unknown compiler option 'include'` | include が compilerOptions 内に書かれていた | include をトップレベルに移動 |
| 4 | `doesn't have a root layout` | app/layout.tsx が欠落 | app/layout.tsx を再作成 |
| 5 | ビルド成功・デプロイ完了なのに404 | vercel.json の outputDirectory がVercel自動検出と競合 | vercel.json を削除 |
| 6 | 正しいURLに当たっていなかった | Vercelに2プロジェクト存在、古い方のURLにアクセス | Vercelダッシュボードで正しいドメインを特定 |

**教訓：**
- 同じエラーが3回以上繰り返されたら、Vercel側の実際の設定状態を確認する
- `framework: null` と `vercel.json` の競合は、ビルドログだけでは見えない
- → この経験から **GitHub MCP を廃止し、Claude Code + git push の運用に移行**した

---

### 事例 #002 — 2026-04-05

**作業内容：** 残ページの実装・レポート出力機能の追加

| # | 作業 | 内容 | 解決策・備考 |
|---|------|------|-------------|
| 1 | 事務部門・DMAT連絡板 | `/office` ページ新規実装 | 掲示板形式・カテゴリ別フィルター・既読管理・対応期限管理 |
| 2 | 議事録ページ | `/minutes` ページ新規実装 | テキストボックス形式・更新日自動記録・確認チェックボックス |
| 3 | 勉強会・チーム会 | localStorageが未実装だった | `useEffect`＋`saveToStorage`を追加。setSessions呼び出し箇所を全て修正 |
| 4 | チーム会型エラー | `toggleStatus`でTS型エラー | `as TeamStatus`を追加して解決 |
| 5 | レポート出力機能 | 全班データを横断収集してtxt出力 | 議事録の`updatedAt`を基準に1ヶ月遡って各班の完了項目を収集 |
| 6 | レポートUX改善 | 保存→再度開く→出力の二度手間 | 「保存してレポート出力」ボタンに統合・出力後リスト画面に戻る |

**教訓：**
- 新規ページ作成時は必ず localStorage 保存を実装すること
- `setSessions((prev) => ...)` パターンは `saveToStorage` と組み合わせられない。`const next = ...` で変数に取ってから両方に渡す

---

*次の事例はここに追記してください*
