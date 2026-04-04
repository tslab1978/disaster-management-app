// ─── 災害BOX管理 ─────────────────────────────────────────

export const BOX_AREAS = [
  '本部', '診療フロント', 'トリアージエリア',
  '赤エリア', '黄エリア', '緑エリア', '黒エリア',
  '搬送班', '総合案内ボランティア', '家族支援',
  'DMAT活動拠点本部', 'その他',
] as const;

export type BoxArea = typeof BOX_AREAS[number];

export const BOX_STORAGE_LOCATIONS = [
  '災害倉庫A', '災害倉庫B', '災害倉庫C', '災害倉庫D',
  '地域医療研修センター準備室', 'その他',
] as const;

export type BoxStorageLocation = typeof BOX_STORAGE_LOCATIONS[number];

export interface DisasterBox {
  id: string;
  area: BoxArea;
  areaCustom?: string;
  itemName: string;
  standardQty: number;
  currentQty: number;
  expiryMonth: string; // YYYY-MM
  storageLocation: BoxStorageLocation;
  storageLocationCustom?: string;
  replenishmentDone: boolean;
  inventoryChecked: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── ホワイトボード管理 ──────────────────────────────────

export const WB_USE_LOCATIONS = [
  '本部', '診療フロント', '活動拠点本部',
  '赤エリア', '黄エリア', '緑エリア', 'トリアージエリア',
  '総合受付', '患者家族待機場所', 'その他',
] as const;

export type WbUseLocation = typeof WB_USE_LOCATIONS[number];

export const WB_STORAGE_LOCATIONS = [
  '地域医療研修センター', '研修棟', '外来階段下',
  '1階研修医カンファレンス室', 'その他',
] as const;

export type WbStorageLocation = typeof WB_STORAGE_LOCATIONS[number];

export interface Whiteboard {
  id: string;
  useLocation: WbUseLocation;
  useLocationCustom?: string;
  storageLocation: WbStorageLocation;
  storageLocationCustom?: string;
  standardQty: number;
  currentQty: number;
  inventoryChecked: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── 物品請求リスト ──────────────────────────────────────

export interface SupplyRequest {
  id: string;
  itemName: string;
  manufacturer: string;
  standardQty: number;
  price: number;
  requested: boolean;
  deliveryDecided: boolean;
  createdAt: string;
  updatedAt: string;
}
