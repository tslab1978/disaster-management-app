import { DisasterBox, Whiteboard, SupplyRequest } from './suppliesTypes';

const BOX_KEY = 'supplies_boxes_v1';
const WB_KEY = 'supplies_whiteboards_v1';
const REQ_KEY = 'supplies_requests_v1';

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

function save<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
}

// ─── 災害BOX ─────────────────────────────────────────────
export const boxStorage = {
  getAll: (): DisasterBox[] => load<DisasterBox>(BOX_KEY),
  saveAll: (items: DisasterBox[]): void => save(BOX_KEY, items),
  add: (item: DisasterBox): void => {
    save(BOX_KEY, [...boxStorage.getAll(), item]);
  },
  update: (id: string, updates: Partial<DisasterBox>): void => {
    save(BOX_KEY, boxStorage.getAll().map((x) =>
      x.id === id ? { ...x, ...updates, updatedAt: new Date().toISOString() } : x
    ));
  },
  delete: (id: string): void => {
    save(BOX_KEY, boxStorage.getAll().filter((x) => x.id !== id));
  },
};

// ─── ホワイトボード ──────────────────────────────────────
export const wbStorage = {
  getAll: (): Whiteboard[] => load<Whiteboard>(WB_KEY),
  add: (item: Whiteboard): void => {
    save(WB_KEY, [...wbStorage.getAll(), item]);
  },
  update: (id: string, updates: Partial<Whiteboard>): void => {
    save(WB_KEY, wbStorage.getAll().map((x) =>
      x.id === id ? { ...x, ...updates, updatedAt: new Date().toISOString() } : x
    ));
  },
  delete: (id: string): void => {
    save(WB_KEY, wbStorage.getAll().filter((x) => x.id !== id));
  },
};

// ─── 物品請求 ─────────────────────────────────────────────
export const requestStorage = {
  getAll: (): SupplyRequest[] => load<SupplyRequest>(REQ_KEY),
  add: (item: SupplyRequest): void => {
    save(REQ_KEY, [...requestStorage.getAll(), item]);
  },
  update: (id: string, updates: Partial<SupplyRequest>): void => {
    save(REQ_KEY, requestStorage.getAll().map((x) =>
      x.id === id ? { ...x, ...updates, updatedAt: new Date().toISOString() } : x
    ));
  },
  delete: (id: string): void => {
    save(REQ_KEY, requestStorage.getAll().filter((x) => x.id !== id));
  },
};
