"use client";

/**
 * Sohbet kanallarının "son okuma" zamanı.
 *
 * Neden localStorage: ChatMessage tablosuna kullanıcı başına lastReadAt
 * eklemek Prisma migration gerektiriyordu. Okunmamış rozeti için bu
 * bilgi cihazda tutmak yeterli — sunucuya yazma/kilit maliyeti yok.
 *
 * Hesap: /api/chat/activity her kanal için toplam mesaj sayısı ve son
 * mesajın zamanını döner. Son okuma zamanından SONRA gelen mesaj varsa
 * kanal "okunmamış" sayılır.
 */

const KEY = "bf_chat_read";

type ReadMap = Record<string, string>; // channel -> ISO timestamp

function load(): ReadMap {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as ReadMap;
  } catch {
    return {};
  }
}

/** Kanalı şu an okundu olarak işaretle */
export function markChannelRead(channel: string): void {
  if (typeof window === "undefined") return;
  const map = load();
  map[channel] = new Date().toISOString();
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* kota dolu — sessizce geç */
  }
}

/** Kanalın son okunma zamanı (yoksa null) */
export function getChannelReadAt(channel: string): string | null {
  return load()[channel] ?? null;
}

/**
 * Okunmamış kanal sayısı.
 * `activity` → /api/chat/activity yanıtı.
 */
export function countUnreadChannels(
  activity: Record<string, { count: number; lastMessage: { createdAt: string } | null }>
): number {
  const map = load();
  let unread = 0;
  for (const [channel, info] of Object.entries(activity)) {
    if (!info.lastMessage) continue;
    const readAt = map[channel];
    // Hiç okunmamışsa: mesaj varsa okunmamış say
    if (!readAt || new Date(info.lastMessage.createdAt) > new Date(readAt)) {
      unread += 1;
    }
  }
  return unread;
}
