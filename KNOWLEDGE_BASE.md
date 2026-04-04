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
