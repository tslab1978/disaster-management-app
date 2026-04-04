// ─── 更新ログ ─────────────────────────────────────────────
export interface ManualLog {
  id: string;
  updatedAt: string;       // YYYY-MM-DD
  chapter: string;         // 例: 第3章 初動対応
  summary: string;         // 内容要約（最大300文字）
  committeeApproved: boolean;  // 委員会での周知承認
  dataUpdated: boolean;        // データ更新済
  createdAt: string;
}

// ─── 検証事項・決議 ───────────────────────────────────────
export interface ManualVerification {
  id: string;
  topic: string;           // 検証事項（最大300文字）
  resolution: string;      // 委員会での決議（最大300文字）
  recordedAt: string;      // 記録日時（ISO文字列）
  createdAt: string;
  updatedAt: string;
}
