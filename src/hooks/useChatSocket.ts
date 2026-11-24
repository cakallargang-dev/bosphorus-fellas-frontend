"use client";

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

/**
 * Tek socket bağlantısı, kanal join/leave, gelen mesaj/okundu olayları.
 *
 * - Aynı origin üzerinde `path: "/socket.io"` ile bağlanır.
 * - Auth: `{ token }` (localStorage `mancave_token`). Token yoksa bağlanmaz.
 * - Kanal değişince eski kanaldan leave, yenisine join.
 * - Kopunca socket.io kendi otomatik yeniden bağlanma mekanizmasını kullanır.
 *
 * Olay dinleyicileri callback'lerin değişmesinden etkilenmesin diye ref
 * üzerinden okunur — böylece effect yalnızca token/kanal değişince yeniden
 * bağlanır, her render'da değil.
 */
export function useChatSocket(opts: {
  token: string | null;
  channel: string;
  onMessage: (payload: { channel: string; message: CapMessage }) => void;
  onReadUpdate: (payload: {
    channel: string;
    userId: string;
    lastReadMessageId: string;
  }) => void;
}) {
  const { token, channel, onMessage, onReadUpdate } = opts;

  const onMessageRef = useRef(onMessage);
  const onReadUpdateRef = useRef(onReadUpdate);
  onMessageRef.current = onMessage;
  onReadUpdateRef.current = onReadUpdate;

  useEffect(() => {
    if (!token) return;

    const socket: Socket = io({
      path: "/socket.io",
      auth: { token },
    });

    const handleMessage = (payload: {
      channel: string;
      message: CapMessage;
    }) => {
      if (payload.channel === channel) onMessageRef.current(payload);
    };

    const handleRead = (payload: {
      channel: string;
      userId: string;
      lastReadMessageId: string;
    }) => {
      if (payload.channel === channel) onReadUpdateRef.current(payload);
    };

    socket.on("message:new", handleMessage);
    socket.on("read:update", handleRead);

    // Giriş sinyali — bağlanınca kanala katıl
    socket.on("connect", () => {
      socket.emit("channel:join", channel);
    });

    // Zaten bağlıysa (ilk bağlantı connect'ten önce emit edilemez) hemen join
    if (socket.connected) {
      socket.emit("channel:join", channel);
    }

    return () => {
      socket.emit("channel:leave", channel);
      socket.off("message:new", handleMessage);
      socket.off("read:update", handleRead);
      socket.disconnect();
    };
  }, [token, channel]);
}

/**
 * Sohbet mesajı için minimum şekil. Tam tip `ChatMessage` olsa da socket
 * payload'ı tüm alanları taşıyabilir; ek alanlar (`pending` vb.) opsiyonel.
 */
export interface CapMessage {
  id: string;
  content: string;
  channel?: string;
  imageUrl?: string | null;
  senderId: string;
  senderName: string;
  createdAt: string;
  sender?: {
    avatar: string | null;
    carBrand: string | null;
    carModel: string | null;
    plateNumber: string | null;
    phone: string | null;
  };
  pending?: boolean;
}
