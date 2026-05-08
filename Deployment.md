# Deployment.md — 開発・デプロイフロー管理

三重中央医療センター 災害対策委員会管理システム  
**最終更新：2026-05-06**

---

## 📌 この方針を決めた背景

### 旧フロー（問題あり）

```
コード修正
  ↓
GitHub に直接コミット（GitHub MCP または手動）
  ↓
Vercel 自動デプロイ
  ↓
本番URL で確認
  ↓
問題があれば再修正 → 再デプロイ
```

**問題点：**
- デプロイのたびに本番URLを開いて確認する必要があり手間がかかる
- GitHub MCP のトークン切れ・不安定接続による書き込みエラーが頻発
- ローカルで未確認のコードが本番に上がるリスクがあった
- 過去の事例（KNOWLEDGE_BASE.md #001）では、vercel.json競合・tsconfig設定ミス・
  layout.tsx欠落など、**9時間のデバッグ**につながったことがある

### 新フロー（現行・推奨）

```
Claude AI（このチャット）で設計・相談・コード生成
  ↓
Claude Code（ターミナル）で実装
  ↓
localhost:3000 でローカル確認（何度でも）
  ↓  ← ここまでは本番に一切影響なし
完成形になったら git push
  ↓
Vercel 自動デプロイ → 本番確認
```

**メリット：**
- `localhost:3000` の localStorage は何度コード変更しても**消えない**
- 壊れてもすぐ `git stash` や `git checkout` で戻せる
- Vercel へのデプロイ回数を最小限に抑えられる
- GitHub MCP の不安定さに依存しない

---

## 🛠️ 開発環境

| 項目 | 内容 |
|------|------|
| ローカルパス | `~/Documents/GitHub/disaster-management-app` |
| ローカル確認URL | `http://localhost:3000` |
| リポジトリ | `https://github.com/tslab1978/disaster-management-app` |
| 本番URL | Vercel 管理画面で確認（`list_projects` → `domains`） |
| git push 方式 | SSH設定済み（`git@github.com:tslab1978/...`） |
| デプロイ | Vercel 自動（main ブランチへの push で発火） |

---

## 🔄 1セッションの標準フロー

### ステップ1：開発開始

ターミナル タブ1（`npm run dev` 専用・常時起動）：
```bash
cd ~/Documents/GitHub/disaster-management-app
npm run dev
```

ターミナル タブ2（git操作・ファイル作成用）：
```bash
cd ~/Documents/GitHub/disaster-management-app
# Cmd+T で新規タブを開いて使う
```

### ステップ2：ブランチ作成（新機能の場合）

```bash
git checkout -b feature/ページ名や機能名
# 例：git checkout -b feature/supabase-migration
```

> ⚠️ 小さな修正（バグ修正・テキスト変更など）は main 直接でもOK

### ステップ3：実装

Claude AI（このチャット）で設計・コード生成 → Claude Code（ターミナル）で実装。

### ステップ4：ローカル確認

```
http://localhost:3000
```

- localStorage のデータは保持されたまま確認できる
- 何度変更しても本番には影響しない
- 完成形になるまでここで繰り返す

### ステップ5：コミット＆プッシュ

```bash
git add -A
git commit -m "feat: 〇〇を実装"
git push origin feature/ページ名
```

コミットメッセージの形式：

| プレフィックス | 用途 |
|---|---|
| `feat:` | 新機能追加 |
| `fix:` | バグ修正 |
| `refactor:` | リファクタリング |
| `chore:` | 設定・依存関係の変更 |

### ステップ6：main にマージ → 自動デプロイ

```bash
git checkout main
git merge feature/ページ名
git push origin main
```

Vercel が自動的にビルド・デプロイを開始する（約1〜2分）。

### ステップ7：本番確認

Vercel ダッシュボードまたは本番URLで動作確認。

---

## ⚠️ GitHub MCP の取り扱いルール

過去のセッションで GitHub MCP のトークン切れ・接続不安定が複数回発生した。

**ルール：**
- **書き込みエラーが出ても接続テストは一切行わない**
- MCP に頼らず、**ターミナルからの git コマンド**で操作する
- KNOWLEDGE_BASE.md などのドキュメント更新も、ターミナルから直接編集する

**トークン期限が切れたと思われる場合：**
1. `https://github.com/settings/tokens` でトークンを再発行
2. `~/Library/Application Support/Claude/claude_desktop_config.json` の `GITHUB_PERSONAL_ACCESS_TOKEN` を更新
3. Claude Desktop を `Cmd+Q` で完全終了 → 再起動

詳細は KNOWLEDGE_BASE.md セクション14を参照。

---

## 🗃️ localStorage と本番データの関係

**よくある誤解：「Vercel にデプロイすると localStorage のデータが消える」**

→ **これは誤り。** localStorage はブラウザとドメインに紐づいており、デプロイとは無関係。

| 環境 | localStorage の場所 | デプロイの影響 |
|------|---------------------|----------------|
| `localhost:3000` | ブラウザの localhost 用 | **なし** |
| 本番URL（Vercel） | ブラウザの本番ドメイン用 | **なし** |

ただし以下のケースでは消える：

- ブラウザのキャッシュ・サイトデータをクリアした場合
- 別のブラウザ・別の端末でアクセスした場合（localStorage は端末ローカルのため）
- ストレージキーを変更した場合（例：`v1` → `v2` に変えると旧データは参照不可）

→ これが **Supabase 移行が必要な理由**（KNOWLEDGE_BASE.md セクション11参照）。

---

## 🚀 Vercel デプロイのトラブルシューティング

問題が発生した場合は **KNOWLEDGE_BASE.md** を必ず参照。

### よくあるエラーと対処

| エラー | 原因 | 対処 |
|--------|------|------|
| `404: NOT_FOUND` | Framework設定が `null`、または vercel.json 競合 | セクション1・2参照 |
| `Module not found` | tsconfig.json に `paths` がない | `"@/*": ["./*"]` を追加 |
| `TS5023` | `include` が `compilerOptions` 内に書かれている | トップレベルに移動 |
| `doesn't have root layout` | `app/layout.tsx` が欠落 | 再作成 |
| ビルド時間 < 2秒 | Next.js が起動していない | `package.json` を確認 |

### 確認フロー（Vercel MCP 使用時）

```
1. list_teams → teamId を取得
2. list_projects(teamId) → 正しいドメインを確認
3. get_project(projectId, teamId) → framework が "nextjs" か確認
4. list_deployments → 最新の state を確認
5. get_deployment_build_logs → エラー全文を確認
```

---

## 📋 現在の開発フェーズ

| フェーズ | 内容 | 状態 |
|----------|------|------|
| Phase 1 | 全ページ実装・localStorage で運用 | ✅ 完了 |
| Phase 2 | 各ページに JSON エクスポート機能追加 | ⬜ 未着手 |
| Phase 3 | Supabase セットアップ | ⬜ 未着手 |
| Phase 4 | ストレージファイルの Supabase 対応 | ⬜ 未着手 |
| Phase 5 | データ移行 | ⬜ 未着手 |
| Phase 6 | ダッシュボード集計ロジック修正 | ⬜ 未着手 |

詳細は KNOWLEDGE_BASE.md セクション11（Supabase移行計画）を参照。

---

## 📝 新スレッド開始時のテンプレート

新しいチャットを始めるときは冒頭に以下を貼るだけで引き継ぎ完了：

```
このプロジェクトは三重中央医療センター 災害対策委員会管理システムの開発プロジェクトです。
KNOWLEDGE_BASE.md を必ず参照の上、作業を開始してください。

技術：Next.js 14 + TypeScript / localStorage（→Supabase移行予定）/ Vercel自動デプロイ

開発フロー：
- 設計・相談 → このチャット
- 実装 → Claude Code（cd ~/Documents/GitHub/disaster-management-app && claude）
- ローカル確認（localhost:3000）で完成形にしてから git push
- git push → SSH設定済み

禁止事項：書き込みエラー時にGitHub MCPの接続テストは一切行わない。
```
