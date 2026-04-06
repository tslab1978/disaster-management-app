# 🧠 デバッグ・ナレッジベース
**場所：** https://github.com/tslab1978/disaster-management-app/blob/main/KNOWLEDGE_BASE.md  
**最終更新：** 2026-04-04

---

## 🔖 このファイルの使い方（重要）

### 呼び出し方
新しいスレッドの**冒頭**に以下を書くだけで、このナレッジベースを参照した上でサポートが始まります：

```
/debug
```
または
```
/debug [問題の概要]
例：/debug Vercelで404が出ている
例：/debug ビルドは通るのに画面が出ない
```

`/debug` と書くと、Claudeは自動的に以下を実行します：
1. このファイルの内容を https://github.com/tslab1978/disaster-management-app/blob/main/KNOWLEDGE_BASE.md から読み込む
2. 過去の解決事例と照合してデバッグを開始する
3. 解決後に「このファイルへの追記内容」を提示する

### 追記の手順（解決後）
Claudeが追記内容を提示したら：
1. https://github.com/tslab1978/disaster-management-app/blob/main/KNOWLEDGE_BASE.md を開く
2. 鉛筆アイコン（編集）をクリック
3. 提示された内容を「9. 解決事例ログ」セクションに追加
4. 「Commit changes」でコミット

---

## 📋 目次
1. [Vercel × Next.js デプロイ 404問題](#1-vercel--nextjs-デプロイ-404問題)
2. [ビルドは成功するのにページが表示されない](#2-ビルドは成功するのにページが表示されない)
3. [Module not found エラー](#3-module-not-found-エラー)
4. [tsconfig.json の設定ミス](#4-tsconfigjson-の設定ミス)
5. [vercel.json が引き起こす競合](#5-verceljson-が引き起こす競合)
6. [GitHub × Vercel 連携の確認手順](#6-github--vercel-連携の確認手順)
7. [プロジェクトが複数存在する問題](#7-プロジェクトが複数存在する問題)
8. [デバッグの基本フロー（インフラ編）](#8-デバッグの基本フローインフラ編)
9. [解決事例ログ](#9-解決事例ログ)
10. [デザインシステム基準](#10-デザインシステム基準)

---

## 1. Vercel × Next.js デプロイ 404問題

### 症状
- ビルドは「Ready」になっている
- URLにアクセスすると `404: NOT_FOUND`

### 原因の優先順位

| 優先度 | 原因 | 確認方法 |
|--------|------|----------|
| ★★★ | `vercel.json` に誤った `outputDirectory` が設定されている | GitHubで vercel.json の中身を確認 |
| ★★★ | Vercelのフレームワーク設定が `null` になっている | Vercel → Settings → Build and Deployment → Framework Preset |
| ★★★ | 間違ったプロジェクトのURLにアクセスしている | `list_projects` で正しいdomainsを確認 |
| ★★ | `app/page.tsx` が存在しない | GitHubでファイル構成を確認 |
| ★★ | `app/layout.tsx` が存在しない | GitHubでファイル構成を確認 |
| ★ | ビルドキャッシュが古い | Vercel Dashboard → Redeploy（キャッシュなし） |

### 解決フロー
```
404が出る
  ↓
1. get_project で framework フィールドを確認
   → null → Settings で Next.js に変更 → Redeploy
  ↓
2. vercel.json が存在するか確認
   → outputDirectory が設定されていれば削除
  ↓
3. 正しいドメインにアクセスしているか確認
   → list_projects → domains[0] を使う
  ↓
4. ビルドログで Route(app) のリストを確認
   → 目的のパスが含まれているか？
```

---

## 2. ビルドは成功するのにページが表示されない

### 症状
```
✓ Compiled successfully
✓ Generating static pages (5/5)
Build Completed / Deployment completed
```
成功しているが本番URLは404。

### 原因
`vercel.json` の `outputDirectory: ".next"` がVercelの自動検出と競合している。

### 解決策
**`vercel.json` を削除する**（Next.js × Vercel の標準構成では不要）

```json
// ❌ これが問題を起こす
{
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

---

## 3. Module not found エラー

### 症状
```
Module not found: Can't resolve '@/components/Navigation'
Module not found: Can't resolve '@/lib/storage'
```

### 解決策
`tsconfig.json` の `compilerOptions` に以下を追加：
```json
"paths": {
  "@/*": ["./*"]
}
```

---

## 4. tsconfig.json の設定ミス

### よくある間違い（TS5023エラー）

**❌ 間違い：`include` を `compilerOptions` の中に書く**
```json
{
  "compilerOptions": {
    "include": ["**/*.ts"]   ← エラー：TS5023
  }
}
```

**✅ 正しい書き方：**
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

---

## 5. vercel.json が引き起こす競合

### 症状
```
⚠️ Configuration Settings in the current Production deployment 
   differ from your current Project Settings.
```

### 対処方針

| 状況 | 対処 |
|------|------|
| Next.js + Vercel の標準構成 | `vercel.json` を削除 |
| カスタムビルドコマンドが必要 | Vercel Dashboard の Settings で設定、`vercel.json` は使わない |

---

## 6. GitHub × Vercel 連携の確認手順

### Vercel MCP ツールを使った確認順序
```
1. list_teams → teamId を取得
2. list_projects(teamId) → projectId と domains を確認
3. get_project(projectId, teamId) → framework, live, domains を確認
4. list_deployments(projectId, teamId) → 最新の state を確認
5. get_deployment_build_logs(deploymentId, teamId) → エラー全文を確認
```

### 重要フィールド
```json
{
  "framework": "nextjs",  // null → Framework Preset 未設定
  "live": true,           // false → 本番未反映
  "domains": [...]        // 正しい本番URL
}
```

---

## 7. プロジェクトが複数存在する問題

### 原因
GitHubからのImportを複数回実行すると、`-mirq` などのサフィックスが付いた別プロジェクトが生成される。

### 解決
`list_projects` で全プロジェクトの `domains` を確認し、正しい方を特定して使う。古い方は無視または削除。

---

## 8. デバッグの基本フロー（インフラ編）

### ステップ1：症状の分類
```
ビルドが失敗する → コード・依存関係の問題
ビルドは成功するが404 → Vercel設定・ルーティングの問題
同じエラーが3回以上繰り返される → 根本原因が未解決
```

### ステップ2：ビルドログの読み方
```
"Module not found"         → tsconfig の paths 設定
"TS5023"                   → tsconfig の構造エラー
"doesn't have root layout" → app/layout.tsx が欠落
"No Next.js version"       → package.json が欠落
"No Output Directory"      → vercel.json の outputDirectory 競合
ビルド時間 < 2秒            → Next.js が起動していない
```

### ステップ3：一度に1つだけ変更する
1つ変更 → デプロイ確認 → ビルドログ確認 → 次の変更

### ステップ4：元に戻す手段
- GitHub: Commit履歴からRevert
- Vercel: Deployments → Instant Rollback

---

## 9. 解決事例ログ

---

### 事例 #001 — 2026-04-04
**プロジェクト：** 三重中央医療センター 災害対策委員会管理システム  
**症状：** `/training` ページが常に404。ビルドログは「Ready」。  
**調査時間：** 約9時間

| # | エラー | 根本原因 | 解決策 |
|---|--------|----------|--------|
| 1 | `Module not found: '@/components/Navigation'` | `tsconfig.json` に `paths` 設定がなかった | `paths: {"@/*": ["./*"]}` を追加 |
| 2 | `No Next.js version detected` | `package.json` が欠落 | `package.json` を再作成 |
| 3 | `TS5023: Unknown compiler option 'include'` | `include` が `compilerOptions` 内に書かれていた | `include` をトップレベルに移動 |
| 4 | `doesn't have a root layout` | `app/layout.tsx` が欠落 | `app/layout.tsx` を再作成 |
| 5 | ビルド成功・デプロイ完了なのに404 | `vercel.json` の `outputDirectory` がVercel自動検出と競合 | `vercel.json` を削除 |
| 6 | 正しいURLに当たっていなかった | Vercelに2プロジェクト存在、古い方のURLにアクセスしていた | `list_projects` で正しいドメインを特定 |

**教訓：**
- 同じエラーが3回以上繰り返されたら、`get_project` でVercel側の実際の状態を確認する
- `framework: null` と `vercel.json` の競合は、ビルドログだけでは見えない

---

*次の事例は解決後にここに追記してください*
---

## 10. デザインシステム基準

**概要：** 全ページ共通のデザインルール。新規ページ作成時は必ず遵守すること。

### 基本原則
- 白背景・グレーボーダー・清潔感重視
- 絵文字はナビゲーションやボタンに使用しない
- フォント：`'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP',system-ui,sans-serif`

### カラーパレット

| 用途 | 値 |
|------|-----|
| メインブルー | `#1d6fd4` |
| テキスト（濃） | `#0f172a` |
| テキスト（中） | `#64748b` |
| テキスト（薄） | `#94a3b8` |
| ボーダー | `#e2e8f0` |
| 背景（ページ） | `#f8fafc` |
| 背景（カード） | `white` |
| 成功・完了 | `#16a34a` / `#dcfce7` |
| 警告・進行中 | `#d97706` / `#fef3c7` |
| 危険・超過 | `#ef4444` / `#fff7f7` |
| ブルー薄（強調枠） | `#bfdbfe` / `#eff6ff` |

### ページ構造テンプレート
```tsx
<main style={{ minHeight: 'calc(100vh - 56px)', backgroundColor: '#f8fafc', fontFamily: "..." }}>
  <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>

    {/* ① ページヘッダー */}
    <div style={{ marginBottom: '1.5rem' }}>
      <p style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        English Division Name
      </p>
      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.02em' }}>
        班名 — ページタイトル
      </h1>
      <p style={{ fontSize: '13px', color: '#64748b' }}>サブテキスト</p>
    </div>

    {/* ② サマリーカード */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px', marginBottom: '1.5rem' }}>
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem 1.25rem' }}>
        <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', margin: '0 0 5px' }}>ラベル</p>
        <p style={{ fontSize: '26px', fontWeight: '700', color: '#0f172a', margin: 0 }}>0</p>
      </div>
    </div>

    {/* ③ メインコンテンツ（テーブル or カード） */}
    <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
      ...
    </div>

  </div>
</main>
```

### ボタンスタイル
```tsx
// プライマリ（新規登録など）
{ padding: '9px 16px', borderRadius: '9px', border: 'none', backgroundColor: '#1d6fd4', color: 'white', fontSize: '13px', fontWeight: '600' }

// セカンダリ（キャンセルなど）
{ padding: '9px 16px', borderRadius: '9px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontSize: '13px' }

// フィルター（アクティブ）
{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#1d6fd4', fontSize: '12px', fontWeight: '600' }

// フィルター（非アクティブ）
{ padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontSize: '12px' }
```

### テーブルスタイル
```tsx
// thead行
{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }

// thセル
{ padding: '10px 12px', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em' }

// tbody行の区切り
{ borderBottom: '1px solid #f1f5f9' }

// tdセル（標準）
{ padding: '12px', fontSize: '13px', color: '#64748b' }
```

### ステータスバッジ
```tsx
<span style={{
  fontSize: '11px', fontWeight: '600',
  padding: '3px 8px', borderRadius: '6px',
  backgroundColor: st.bg, color: st.color
}}>
  {st.label}
</span>
```

### 実装済みページ一覧

| ページ | パス | 参照ファイル |
|--------|------|-------------|
| 訓練班 | `/training` | `app/training/page.tsx` |
| 物品管理班 | `/supplies` | `app/supplies/page.tsx` |
| マニュアル班 | `/manual` | `app/manual/page.tsx` |
| 勉強会班 | `/study` | `app/study/page.tsx` |

### ブランチ運用ルール
- 新機能は必ず `feature/xxx` ブランチで作業
- 完成後に main へマージ
- コミットメッセージは `feat: 〇〇` の形式

### 1セッションの流れ
1. ブランチ作成
2. ページ構成の確認・合意
3. ファイル作成（VS Codeで貼り付け）
4. modules.tsx に追加
5. ローカル確認（npm run dev）
6. コミット＆プッシュ
7. main マージ → Vercel自動デプロイ

### ターミナルの使い方
- タブ1：`npm run dev` 専用（常時起動）
- タブ2：git操作・ファイル作成（Cmd+T で新規タブ）

### デザインシステム
セクション10を参照。訓練班ページ（app/training/page.tsx）が最も完成度が高く、新規ページの参考にする。

### 実装済みページ
| ページ | パス | 状態 |
|--------|------|------|
| ダッシュボード | `/` | 稼働中 |
| 訓練班 | `/training` | 稼働中 |
| 物品班 | `/supplies` | 稼働中 |
| マニュアル班 | `/manual` | 稼働中 |
| 勉強会班 | `/study` | 稼働中 |
| チーム会班 | `/team` | 稼働中 |
| 事務部門・DMAT関連 | `/office` | 稼働中 |
| 議事録 | `/minutes` | 稼働中 |

### 残タスク（優先順）
Supabase連携（全ページ完成後）


### 事例 #002 — 2026-04-05

**プロジェクト：** 三重中央医療センター 災害対策委員会管理システム
**作業内容：** 残ページの実装・レポート出力機能の追加

| # | 作業 | 内容 | 解決策・備考 |
|---|------|------|-------------|
| 1 | 事務部門・DMAT連絡板 | `/office` ページ新規実装 | 掲示板形式・カテゴリ別フィルター・既読管理・対応期限管理 |
| 2 | 議事録ページ | `/minutes` ページ新規実装 | テキストボックス形式・更新日自動記録・確認チェックボックス |
| 3 | 勉強会・チーム会 | localStorageが未実装だった | `useEffect`＋`saveToStorage`を追加。setSessions呼び出し箇所を全て修正 |
| 4 | チーム会型エラー | `toggleStatus`でTS型エラー | `as TeamStatus`を追加して解決 |
| 5 | レポート出力機能 | 全班データを横断収集してtxt出力 | 議事録の`updatedAt`を基準に1ヶ月遡って各班の完了項目を収集 |
| 6 | レポートUX改善 | 保存→再度開く→出力の二度手間 | 「保存してレポート出力」ボタンに統合・出力後リスト画面に戻る |

**各班のストレージキーと完了フラグ（レポート機能用）：**

| 班 | ストレージキー | 完了フラグ |
|---|---|---|
| 訓練班 | `training_tasks_v2` | `status === 'completed'` |
| 物品班(BOX) | `supplies_boxes_v1` | `inventoryChecked === true` |
| 物品班(WB) | `supplies_whiteboards_v1` | `inventoryChecked === true` |
| 勉強会班 | `study_sessions_v1` | `status === 'done'` |
| チーム会班 | `team_sessions_v1` | `status === 'done'` |
| 事務部門・DMAT | `office_notices` | `isRead === true` |
| 議事録 | `minutes_records` | `confirmed === true` |

**教訓：**
- 勉強会・チーム会は当初localStorageが未実装でページ離脱時にデータが消えていた。新規ページ作成時は必ずlocalStorage保存を実装すること
- `setSessions((prev) => ...)`のパターンは`saveToStorage`と組み合わせられないため、`const next = ...`で一度変数に入れてから両方に渡す


## 11. Supabase移行計画

**方針：** localStorageで運用・データ蓄積 → エクスポート → Supabase移行

### 移行対象キー一覧

| localStorageキー | 内容 | 管理ファイル | エクスポート実装 |
|---|---|---|---|
| `training_tasks_v2` | 訓練タスク | `lib/storage.ts` | ✅ 実装済み |
| `manual_logs_v1` | マニュアル更新ログ | `lib/manualStorage.ts` | ⬜ 未実装 |
| `manual_verifications_v1` | 検証事項・決議 | `lib/manualStorage.ts` | ⬜ 未実装 |
| `manual_url_v1` / `manual_title_v1` | マニュアルURL・タイトル | `lib/manualStorage.ts` | ⬜ 未実装 |
| `supplies_boxes_v1` | 災害BOX | `lib/suppliesStorage.ts` | ⬜ 未実装 |
| `supplies_whiteboards_v1` | ホワイトボード | `lib/suppliesStorage.ts` | ⬜ 未実装 |
| `supplies_requests_v1` | 物品請求 | `lib/suppliesStorage.ts` | ⬜ 未実装 |
| `study_sessions_v1` | 勉強会 | `app/study/page.tsx` | ⬜ 未実装 |
| `team_sessions_v1` | チーム会 | `app/team/page.tsx` | ⬜ 未実装 |
| `office_notices` | 事務連絡 | `app/office/page.tsx` | ⬜ 未実装 |
| `minutes_records` | 議事録 | `app/minutes/page.tsx` | ⬜ 未実装 |
| `next_training_date` | 次回訓練日 | `app/page.tsx` | ⬜ 未実装 |

---

### Phase 1：localStorageで運用（現在）
- 全ページ完成済み ✅
- データを実運用で蓄積・検証中

### Phase 2：エクスポート機能の追加（Supabase移行前）
- 各班ページに「JSONエクスポート」ボタンを追加
- 対象：上記テーブルの「未実装」11件
- 実装参考：`lib/storage.ts` の `exportTasks()` が実装済みモデル

**実装パターン（各ストレージファイルに追加）：**
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

### Phase 3：Supabaseセットアップ
- Supabaseアカウント作成・プロジェクト作成
- 移行対象12テーブルのSQL作成・実行
- Vercelに環境変数を設定（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`）

### Phase 4：ストレージファイルの書き換え
- `lib/storage.ts` → Supabase対応
- `lib/manualStorage.ts` → Supabase対応
- `lib/suppliesStorage.ts` → Supabase対応
- `app/study/page.tsx` 内ストレージ → `lib/studyStorage.ts` に切り出してSupabase対応
- `app/team/page.tsx` 内ストレージ → `lib/teamStorage.ts` に切り出してSupabase対応
- `app/office/page.tsx` 内ストレージ → `lib/officeStorage.ts` に切り出してSupabase対応
- `app/minutes/page.tsx` 内ストレージ → `lib/minutesStorage.ts` に切り出してSupabase対応

### Phase 5：データ移行
- 各班ページからJSONエクスポート
- SupabaseダッシュボードからJSONインポート（またはSQL INSERT）
- 動作確認後、localStorageのデータをクリア

### Phase 6：ダッシュボード集計ロジック修正
- `app/page.tsx` の `countUnresolved()` をSupabaseクエリに書き換え
- 
