"use client";

/**
 * Çevrimdışı altyapı:
 *  1) React Query cache'i localStorage'a yazılır → uçak modunda son görülen veri okunur.
 *  2) Sohbet mesajları için gönderim kuyruğu → bağlantı gelince sırayla gönderilir.
 */

const PERSIST_KEY = "mancave_rq_cache_v1";
const QUEUE_KEY = "mancave_chat_outbox_v1";
const persistStorage = typeof window !== "undefined" ? window.localStorage : undefined;

export { PERSIST_KEY, persistStorage };

/** Kalıcı olmasın: bu anahtarlar auth'a/aramaya bağlı kısa ömürlü veriler. */
export const PERSIST_EXCLUDE = ["chat-activity"];

export const persistOptions = {
  maxAge: 1000 * 60 * 60 * 24 * 7,
  buster: "v1",
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { state: { status: string }; queryKey: readonly unknown[] }) => {
      if (query.state.status !== "success") return false;
      const head = String(query.queryKey[0] ?? "");
      return !PERSIST_EXCLUDE.includes(head);
    },
  },
};

// ─── Sohbet gönderim kuyruğu ────────────────────────────────────────────────

export type OutboxItem = {
  localId: string;
  channel: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  senderId: string;
  senderName: string;
  status: "pending" | "error";
};

export function loadOutbox(): OutboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveOutbox(items: OutboxItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  } catch {
    /* kota dolu — sessizce geç */
  }
}

export function enqueue(item: OutboxItem) {
  saveOutbox([...loadOutbox(), item]);
}

export function removeFromOutbox(localId: string) {
  saveOutbox(loadOutbox().filter((i) => i.localId !== localId));
}

export function newLocalId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Tarayıcı çevrimiçi mi? (SSR'da true) */
export function isOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}
