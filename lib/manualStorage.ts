import { ManualLog, ManualVerification } from './manualTypes';

const LOG_KEY = 'manual_logs_v1';
const VER_KEY = 'manual_verifications_v1';
const URL_KEY = 'manual_url_v1';
const TITLE_KEY = 'manual_title_v1';

function load<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

function save<T>(key: string, items: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
}

function loadString(key: string): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(key) ?? '';
}

function saveString(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

// ─── 更新ログ ─────────────────────────────────────────────
export const logStorage = {
  getAll: (): ManualLog[] => load<ManualLog>(LOG_KEY),
  add: (item: ManualLog): void => {
    save(LOG_KEY, [...logStorage.getAll(), item]);
  },
  update: (id: string, updates: Partial<ManualLog>): void => {
    save(LOG_KEY, logStorage.getAll().map((x) =>
      x.id === id ? { ...x, ...updates } : x
    ));
  },
  delete: (id: string): void => {
    save(LOG_KEY, logStorage.getAll().filter((x) => x.id !== id));
  },
};

// ─── 検証事項・決議 ───────────────────────────────────────
export const verificationStorage = {
  getAll: (): ManualVerification[] => load<ManualVerification>(VER_KEY),
  add: (item: ManualVerification): void => {
    save(VER_KEY, [...verificationStorage.getAll(), item]);
  },
  update: (id: string, updates: Partial<ManualVerification>): void => {
    save(VER_KEY, verificationStorage.getAll().map((x) =>
      x.id === id ? { ...x, ...updates, updatedAt: new Date().toISOString() } : x
    ));
  },
  delete: (id: string): void => {
    save(VER_KEY, verificationStorage.getAll().filter((x) => x.id !== id));
  },
};

// ─── URL・タイトル ────────────────────────────────────────
export const manualMeta = {
  getUrl: (): string => loadString(URL_KEY),
  setUrl: (url: string): void => saveString(URL_KEY, url),
  getTitle: (): string => loadString(TITLE_KEY),
  setTitle: (title: string): void => saveString(TITLE_KEY, title),
};
