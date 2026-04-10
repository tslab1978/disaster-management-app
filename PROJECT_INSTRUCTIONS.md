# 三重中央医療センター 災害対策委員会管理システム
## プロジェクト指示書（Claude.ai プロジェクト用）

---

## プロジェクト概要

三重中央医療センター 災害対策委員会向けの統合管理Webアプリケーション。
委員会メンバーが各自のPCで入力・準備し、委員会でアプリを見ながら議論を進める形を目指す。

---

## 技術スタック

- フレームワーク：Next.js 14 + TypeScript
- スタイリング：インラインスタイル（CSS-in-JSなし）
- データ保存：localStorage（フェーズ2でSupabase移行予定）
- デプロイ：Vercel（GitHubと自動連携）
- リポジトリ：https://github.com/tslab1978/disaster-management-app

---

## 開発フロー

### 通常の開発
1. このチャットで機能の設計・相談
2. Claude Code（ターミナル）で実装・git push
3. Vercelが自動デプロイ → 動作確認

### Claude Codeの起動方法
```bash
cd ~/Documents/GitHub/disaster-management-app
claude
```
※ git pushはSSH設定済み（git@github.com:tslab1978/disaster-management-app.git）

### 単純なファイル作成・更新
GitHub MCPが使えるので、このチャットから直接GitHubにコミット可能。

---

## 実装済みページ

| ページ | パス | 状態 |
|--------|------|------|
| ダッシュボード | `/` | 稼働中 |
| 訓練班 | `/training` | 稼働中 |
| 物品班 | `/supplies` | 稼働中 |
| マニュアル班 | `/manual` | 稼働中 |
| チーム会班 | `/team` | 稼働中 |
| 勉強会班 | `/study` | 稼働中 |
| 事務部門・DMAT関連 | `/office` | 稼働中 |
| 議事録 | `/minutes` | 稼働中 |
| 活動ログ | `/logs` | 稼働中 |

---

## 設計方針

- `app/_config/modules.tsx` で全ページを一元管理
- 新ページ追加時は `modules.tsx` に1エントリ追加するだけでダッシュボードに反映
- デザイン：白ベース・ブルー系・清潔感重視（AppDesign.md参照）
- 将来的にSupabaseでDB化し複数人共有を実現

---

## デザイン基準

AppDesign.md を参照すること。
新規ページは必ず既存ページ（特に訓練班 app/training/page.tsx）のデザインを踏襲する。

主要カラー：
- メインブルー：#1d6fd4
- テキスト濃：#0f172a
- テキスト中：#64748b
- ボーダー：#e2e8f0
- 背景：#f8fafc

---

## データ設計（localStorage）

| キー | 内容 | 管理ページ |
|------|------|-----------|
| `training_tasks_v2` | 訓練タスク | /training |
| `supplies_boxes_v1` | 災害BOX物品 | /supplies |
| `supplies_whiteboards_v1` | ホワイトボード | /supplies |
| `supplies_requests_v1` | 物品請求 | /supplies |
| `manual_logs_v1` | マニュアル更新ログ | /manual |
| `manual_verifications_v1` | 検証事項・決議 | /manual |
| `manual_url_v1` | マニュアルURL | /manual |
| `manual_title_v1` | マニュアル表示名 | /manual |
| `study_sessions_v1` | 勉強会記録 | /study |
| `team_sessions_v1` | チーム会記録 | /team |
| `office_notices` | 事務連絡 | /office |
| `minutes_records` | 議事録 | /minutes |
| `committee_logs` | 活動ログ（全班共通） | /logs |
| `next_training_date` | 次回訓練日 | / (ダッシュボード) |

---

## 将来のロードマップ

### フェーズ1（現在）：localStorage運用
- 全ページ完成済み・実運用でデータ蓄積

### フェーズ2：Supabase移行
- クラウドDBに移行 → 複数人で同じデータを共有
- どのPCからでも入力・閲覧可能
- Claude Codeへの一括指示で対応予定

### フェーズ3：ログイン機能
- 班ごとのアクセス制御
- 管理者権限

---

## チャット引き継ぎのルール

チャットが長くなったら：
1.「プロジェクト指示書を最新版に更新して」と依頼
2. 出力された内容でPROJECT_INSTRUCTIONS.mdをGitHubに上書きコミット
3. 同内容をClaude.aiのプロジェクト設定にもコピペ
4. 新規チャットで続きから開始

---

## 注意事項

- GitHub MCPへの書き込みテストは一切行わない
- Claude Codeを使う場合、git pushはSSHで行う（PATは使わない）
- トークンやパスワードをチャットに貼り付けない
