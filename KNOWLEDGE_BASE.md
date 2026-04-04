# 🧠 デバッグ・ナレッジベース
> インフラ・デプロイ・連携トラブルの診断フロー集  
> 最終更新：2026-04-04 | 対象：Next.js / GitHub / Vercel

---

## 📋 目次
1. [Vercel × Next.js デプロイ 404問題](#1-vercel--nextjs-デプロイ-404問題)
2. [ビルドは成功するのにページが表示されない](#2-ビルドは成功するのにページが表示されない)
3. [Module not found エラー（@/パスが解決できない）](#3-module-not-found-エラーパスが解決できない)
4. [tsconfig.json の設定ミス](#4-tsconfigjson-の設定ミス)
5. [vercel.json が引き起こす競合](#5-verceljson-が引き起こす競合)
6. [GitHub × Vercel 連携の確認手順](#6-github--vercel-連携の確認手順)
7. [プロジェクトが複数存在する問題](#7-プロジェクトが複数存在する問題)
8. [デバッグの基本フロー（インフラ編）](#8-デバッグの基本フローインフラ編)

---

## 1. Vercel × Next.js デプロイ 404問題

### 症状
- ビルドは「Ready」になっている
- URLにアクセスすると `404: NOT_FOUND`
- `Code: NOT_FOUND` が表示される

### 原因の優先順位（上から順に確認）

| 優先度 | 原因 | 確認方法 |
|--------|------|----------|
| ★★★ | `vercel.json` に誤った `outputDirectory` が設定されている | GitHub で vercel.json の中身を確認 |
| ★★★ | Vercel のフレームワーク設定が `null`（Other）になっている | Vercel → Settings → Build and Deployment → Framework Preset |
| ★★★ | 間違ったプロジェクトのURLにアクセスしている（複数プロジェクト問題） | Vercel API または Dashboard で正しいドメインを確認 |
| ★★ | `app/page.tsx` が存在しない | GitHub でファイル構成を確認 |
| ★★ | `app/layout.tsx` が存在しない | GitHub でファイル構成を確認 |
| ★ | ビルドキャッシュが古い | Vercel Dashboard → Redeploy（キャッシュなし） |

### 解決フロー

```
404が出る
  ↓
1. Vercel API で framework フィールドを確認
   → framework: null → Settings で Next.js に変更 → Redeploy
  ↓
2. vercel.json が存在するか確認
   → outputDirectory や buildCommand が設定されていれば削除を検討
  ↓
3. 正しいドメインにアクセスしているか確認
   → Vercel → Project → Domains で本番URLを確認
  ↓
4. ビルドログで Route(app) のリストを確認
   → / と /training が含まれているか？
```

---

## 2. ビルドは成功するのにページが表示されない

### 症状
```
✓ Compiled successfully
✓ Generating static pages (5/5)
Build Completed in /vercel/output
Deployment completed
```
ここまで成功するが、本番URLは404。

### 原因
`vercel.json` の `outputDirectory: ".next"` が設定されている場合、Next.js の標準出力先とVercelの期待する出力先がズレる。

### 解決策
**`vercel.json` を削除する**（Next.js × Vercel の組み合わせでは不要）

```json
// ❌ これが問題を起こす
{
  "buildCommand": "next build",
  "outputDirectory": ".next"
}
```

Next.js プロジェクトでは、Vercel がフレームワークを検出して自動的に正しい設定を適用する。`vercel.json` で上書きすると、この自動検出が無効になる。

### 判断基準
- Vercel の Framework Preset が `Next.js` に設定されているなら → `vercel.json` は不要
- `vercel.json` が必要なのは、カスタムフレームワークや複雑なモノレポ構成の場合のみ

---

## 3. Module not found エラー（@/パスが解決できない）

### 症状
```
Module not found: Can't resolve '@/components/Navigation'
Module not found: Can't resolve '@/lib/storage'
```

### 原因
`tsconfig.json` に `paths` 設定がない、または不正確。

### 解決策
`tsconfig.json` の `compilerOptions` に以下を追加：

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 注意
- `paths` は `compilerOptions` の**中**に書く
- `include` や `exclude` は `compilerOptions` の**外**（トップレベル）に書く
  → 混在させると `TS5023: Unknown compiler option 'include'` エラーになる

---

## 4. tsconfig.json の設定ミス

### よくある間違い

**❌ 間違い：`include` を `compilerOptions` の中に書いてしまう**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "include": ["**/*.ts"]   ← ここが間違い
  }
}
```

**エラーメッセージ：**
```
Error: error TS5023: Unknown compiler option 'include'.
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
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Next.js が `tsconfig.json` を自動修正するケース
ビルドログに以下が出る場合、Next.js が自動で設定を追加している（問題なし）：
```
We detected TypeScript in your project and reconfigured your tsconfig.json
```

---

## 5. vercel.json が引き起こす競合

### 症状
Vercel の Build and Deployment Settings に以下の警告が出る：
```
⚠️ Configuration Settings in the current Production deployment 
   differ from your current Project Settings.
```

### 意味
`vercel.json` に書かれた設定と、Vercel Dashboard のプロジェクト設定が食い違っている。

### 対処方針

| 状況 | 対処 |
|------|------|
| Next.js + Vercel の標準構成 | `vercel.json` を削除 |
| カスタムビルドコマンドが必要 | Vercel Dashboard の Settings で設定し、`vercel.json` は使わない |
| モノレポ構成 | `vercel.json` の `root` 設定のみ使用 |

---

## 6. GitHub × Vercel 連携の確認手順

### Vercel API で状態確認（推奨）

```
1. チームID確認：list_teams
2. プロジェクト一覧：list_projects(teamId)
3. プロジェクト詳細：get_project(projectId, teamId)
   → framework フィールドを確認（null なら問題）
   → domains フィールドで正しいURLを確認
4. デプロイ一覧：list_deployments(projectId, teamId)
   → 最新の state が ERROR か READY か確認
5. ビルドログ：get_deployment_build_logs(deploymentId, teamId)
   → エラーメッセージの全文を確認
```

### 確認すべき重要フィールド

```json
{
  "framework": "nextjs",   // null なら Framework Preset 未設定
  "live": true,            // false なら本番に反映されていない
  "domains": [...],        // 正しい本番URLがここに入っている
  "latestDeployment": {
    "readyState": "READY"  // ERROR なら最新デプロイは失敗
  }
}
```

---

## 7. プロジェクトが複数存在する問題

### 症状
Vercel Dashboard に同名に近いプロジェクトが複数ある：
- `disaster-management-app`
- `disaster-management-app-mirq`

アクセスしているURLが古いプロジェクトのものだと、いくら新しいプロジェクトをビルドしても反映されない。

### 発生原因
- GitHub からの Import を複数回実行してしまった
- 最初のデプロイ失敗後、再度 Import した

### 確認・解決手順
1. Vercel API の `list_projects` で全プロジェクトを列挙
2. 各プロジェクトの `domains` を確認し、アクセスしているURLがどのプロジェクトのものか特定
3. 古いプロジェクト（`-mirq` など）は削除するか無視する
4. 正しいプロジェクトの `domains[0]` にアクセスする

---

## 8. デバッグの基本フロー（インフラ編）

### ステップ1：症状を特定する

```
Q1: ビルドは成功しているか？
  YES → ルーティング・設定の問題
  NO  → コンパイル・依存関係の問題
  
Q2: ローカル（Zed/VSCode）では動くか？
  YES → Vercel/デプロイ設定の問題
  NO  → コードの問題
  
Q3: 同じエラーが繰り返されるか？
  YES → 根本原因が未解決のまま表面的な修正を繰り返している可能性
```

### ステップ2：ビルドログを読む（優先順位）

```
1. エラーの「最初の1行」を探す
   → それ以降は連鎖的なエラーが多い
   
2. よくあるパターン：
   - "Module not found"     → ファイルパスまたはtsconfig問題
   - "TS5023"               → tsconfig.json の構造エラー
   - "doesn't have a root layout" → app/layout.tsx が欠落
   - "No Next.js version detected" → package.json が欠落
   - "No Output Directory" → vercel.json の outputDirectory 設定問題
   
3. ビルド時間が異常に短い場合（< 2秒）
   → Next.js が起動すらしていない
   → package.json または framework 設定を確認
```

### ステップ3：一度に1つだけ変更する

```
❌ 悪いパターン：
  複数ファイルを同時に変更 → どれが原因か不明
  
✅ 良いパターン：
  1つ変更 → デプロイ確認 → 次の変更
  変更履歴をメモしておく
```

### ステップ4：変更を元に戻す手段を持っておく

- GitHub の Commit 履歴から任意の時点に戻せる
- Vercel の Deployments からも過去の成功したデプロイに「Rollback」できる

---

## 📎 このプロジェクトでの解決事例

**プロジェクト：** 三重中央医療センター 災害対策委員会管理システム  
**GitHub：** https://github.com/tslab1978/disaster-management-app  
**解決日：** 2026-04-04

### 発生した問題と解決策の対応表

| # | 問題 | 根本原因 | 解決策 |
|---|------|----------|--------|
| 1 | `/training` が404 | `@/components/Navigation` が解決できない | `tsconfig.json` に `paths: {"@/*": ["./*"]}` を追加 |
| 2 | ビルド自体が起動しない | `package.json` の `devDependencies` に TypeScript が未定義 | `typescript`, `@types/react`, `@types/node` を追加 |
| 3 | tsconfig エラー | `include` が `compilerOptions` の内側に書かれていた | `include` をトップレベルに移動 |
| 4 | ビルド成功でも404 | `vercel.json` の `outputDirectory: ".next"` がVercelの自動検出と競合 | `vercel.json` を削除 |
| 5 | `app/page.tsx` が404 | 全ファイル削除後に `page.tsx` を追加し忘れた | `app/page.tsx` を再作成 |
| 6 | `training/page.tsx doesn't have a root layout` | `app/layout.tsx` が欠落 | `app/layout.tsx` を再作成 |

### 最終的に必要だったファイル構成

```
/
├── app/
│   ├── layout.tsx        ← ルートレイアウト（必須）
│   ├── page.tsx          ← ダッシュボード（/）
│   └── training/
│       └── page.tsx      ← 訓練班ページ（/training）
├── components/
│   └── Navigation.tsx    ← ナビゲーション
├── lib/
│   ├── types.ts          ← 型定義
│   └── storage.ts        ← localStorage管理
├── package.json          ← next, react, devDependencies必須
├── tsconfig.json         ← paths設定必須、includeはトップレベルに
└── next.config.js        ← 最小限の設定でOK
```

**`vercel.json` は不要（削除）**

---

## 🔖 呼び出し方

このナレッジベースを参照したい時は、新しいスレッドで以下のように呼び出してください：

```
「ナレッジベースを参照して、[問題の内容] をデバッグしてください」
「KNOWLEDGE_BASE.md の [セクション名] に従って確認してください」
```

または GitHub の以下のURLから直接参照できます：  
https://github.com/tslab1978/disaster-management-app/blob/main/KNOWLEDGE_BASE.md
