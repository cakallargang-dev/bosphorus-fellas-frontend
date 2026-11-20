"use client";

import { markChannelRead } from "@/lib/chatRead";
import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { chatApi, authApi, mediaApi } from "@/lib/api";
import { compressImage } from "@/lib/imageCompress";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  MessageCircle,
  Send,
  ShieldAlert,
  Check,
  Clock,
  ArrowLeft,
  Hash,
  Megaphone,
  Flame,
  Flag,
  Car,
  Camera,
  ImagePlus,
  Download,
  X,
} from "lucide-react";
import type { ChatMessage, SupportMessage, UserPublicProfile } from "@/types";

// ─── Constants ───────────────────────────────────────────────────────────────

// Tek kanal. Eski kanalların (ilan/touge/pist/rolling) mesajları DB'de duruyor.
const CHANNELS = [
  { id: "genel", label: "Sohbet", icon: MessageCircle, color: "text-blue-400" },
] as const;

const READ_COUNTS_KEY = "mancave_chat_read_counts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function getReadCounts(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(READ_COUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setReadCount(channel: string, count: number) {
  const counts = getReadCounts();
  counts[channel] = count;
  localStorage.setItem(READ_COUNTS_KEY, JSON.stringify(counts));
}

// ─── Support Chat View (Full-screen Private Admin-Member Chat) ───

function SupportChatView({ onBack }: { onBack: () => void }) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  const { data, isLoading } = useQuery({
    queryKey: ["support-messages"],
    queryFn: () => chatApi.getSupport(),
    refetchInterval: 5000,
  });

  const messages: SupportMessage[] = (data as any)?.data ?? [];

  // Admin: group by sender, member: filter own messages
  const memberIds = isAdmin
    ? [...new Set(messages.map((m) => m.senderId))]
    : [user?.id || ""];

  // If admin hasn't selected a member, and there are members, auto-select first
  useEffect(() => {
    if (isAdmin && !selectedMemberId && memberIds.length > 0) {
      setSelectedMemberId(memberIds[0]);
    }
  }, [isAdmin, selectedMemberId, memberIds]);

  const filteredMessages = isAdmin
    ? messages.filter((m) => m.senderId === selectedMemberId)
    : messages;

  /**
   * En son mesaja kaydır.
   * `scrollIntoView` sayfayı da kaydırdığı için (klavye açıkken tüm
   * sohbet ekranı zıplıyordu) doğrudan scroll konteynerini kaydırıyoruz.
   */
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages.length, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await chatApi.sendSupport(trimmed);
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Mesaj gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  const handleAdminSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    
    setSending(true);
    
    // If no member selected, show error
    if (!selectedMemberId) {
      toast.error("Önce bir üye seçin");
      setSending(false);
      return;
    }

    try {
      // Find the latest unreplied message from this member
      const latestMsg = [...filteredMessages].reverse().find(
        (m) => !m.replied && m.senderId === selectedMemberId
      );
      
      const targetMsg = latestMsg || [...filteredMessages].reverse().find(
        (m) => m.senderId === selectedMemberId
      );
      
      if (!targetMsg) {
        toast.error("Cevaplanacak mesaj bulunamadı");
        setSending(false);
        return;
      }

      await chatApi.replySupport(targetMsg.id, trimmed);
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cevap gönderilemedi");
    } finally {
      setSending(false);
    }
  };

  // Get member name by ID
  const getMemberName = (senderId: string) => {
    const msg = messages.find((m) => m.senderId === senderId);
    return msg?.senderName || "Üye";
  };

  // Count unreplied per member
  const getUnrepliedCount = (senderId: string) =>
    messages.filter((m) => m.senderId === senderId && !m.replied).length;

  return (
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-mancave-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 text-[#8f9fb4] hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/20 flex items-center justify-center">
          <ShieldAlert className="w-3.5 h-3.5 text-[#3b82f6]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">
            {isAdmin ? "Destek" : "Yönetici ile Sohbet"}
          </h3>
          <p className="text-[10px] text-[#4d5c70]">
            {isAdmin ? "Üyelerle özel görüşme" : "Özel mesaj"}
          </p>
        </div>
      </div>

      {/* Admin: member selector */}
      {isAdmin && memberIds.length > 0 && (
        <div className="flex gap-1 overflow-x-auto pb-2 mb-2 border-b border-mancave-border no-scrollbar">
          {memberIds.map((mid) => {
            const unread = getUnrepliedCount(mid);
            return (
              <button
                key={mid}
                onClick={() => setSelectedMemberId(mid)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                  selectedMemberId === mid
                    ? "bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-[#030711] font-bold"
                    : "bg-white/5 text-[#8f9fb4] hover:bg-white/10"
                }`}
              >
                {getMemberName(mid)}
                {unread > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Messages — chat bubbles */}
      <div ref={scrollRef} data-chat-scroll className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
        {isLoading && (
          <p className="text-center text-[#6b7d94] text-xs py-8">Yükleniyor...</p>
        )}
        {!isLoading && filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#6b7d94]">
            <ShieldAlert className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-xs">
              {isAdmin ? "Üye seç" : "Yöneticiye mesaj gönderebilirsin"}
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {filteredMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.senderId === user?.id ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Member message */}
              <div
                className={`flex gap-2 ${
                  msg.senderId === user?.id ? "flex-row-reverse" : ""
                }`}
              >
                <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                  <AvatarImage
                    src={msg.sender?.avatar ? `${apiBase}${msg.sender.avatar}` : undefined}
                  />
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/20 text-[#3b82f6]">
                    {msg.senderName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[75%] rounded-[22px] px-3 py-2 text-sm ${
                    msg.senderId === user?.id
                      ? "bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/20 text-[#030711] font-bold rounded-tr-md"
                      : "bg-white/5 text-[#030711] font-bold/90 rounded-tl-md"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-[#3b82f6]/70">
                      {msg.senderId === user?.id ? "Sen" : msg.senderName}
                    </span>
                    <span className="text-[10px] text-[#4d5c70] ml-auto">
                      {formatTime(msg.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>

              {/* Admin reply — as a separate bubble */}
              {msg.reply && (
                <div
                  className={`flex gap-2 mt-1 ${
                    msg.senderId === user?.id ? "" : "flex-row-reverse"
                  }`}
                >
                  <Avatar className="w-7 h-7 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[10px] bg-[#06b6d4]/20 text-[#06b6d4]">
                      Y
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={`max-w-[75%] rounded-[22px] px-3 py-2 text-sm ${
                      msg.senderId === user?.id
                        ? "bg-[#06b6d4]/10 text-white/90 rounded-tl-md"
                        : "bg-[#06b6d4]/20 text-white rounded-tr-md"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-[#06b6d4]">
                        {isAdmin ? "Sen" : "Yönetici"}
                      </span>
                      <span className="text-[10px] text-[#4d5c70] ml-auto">
                        {msg.replyAt ? formatTime(msg.replyAt) : ""}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">{msg.reply}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input — her zaman en altta, klavyenin üstünde */}
      <div className="flex shrink-0 gap-2 pb-1">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              isAdmin ? handleAdminSend() : handleSend();
            }
          }}
          placeholder={isAdmin ? "Cevap yaz..." : "Yöneticiye mesaj yaz..."}
          className="min-h-[40px] h-[40px] resize-none bg-white/5 border-white/20 text-white placeholder:text-[#4d5c70] text-sm"
        />
        <Button
          onClick={() => (isAdmin ? handleAdminSend() : handleSend())}
          disabled={!input.trim() || sending}
          size="icon"
          className="h-[40px] w-[40px] shrink-0 bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] hover:bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/80 text-black"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Channel Chat View ───────────────────────────────────────────────────────

function ChannelChatView({
  channel,
  onBack,
}: {
  channel: (typeof CHANNELS)[number];
  onBack: () => void;
}) {
  const { user } = useAuth();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  /** Tek gönderimlik fotoğraf */
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const galleryRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserPublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const msgCountRef = useRef(0);

  const Icon = channel.icon;

  const { data, isLoading } = useQuery({
    queryKey: ["chat-messages", channel.id],
    queryFn: () => chatApi.getMessages(channel.id),
    refetchInterval: 5000,
  });

  const messages: ChatMessage[] = (data as any)?.data ?? [];

  /**
   * En son mesaja kaydır.
   * `scrollIntoView` sayfayı da kaydırdığı için (klavye açıkken tüm
   * sohbet ekranı zıplıyordu) doğrudan scroll konteynerini kaydırıyoruz.
   */
  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Auto-scroll on new messages & update read count
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      scrollToBottom();
    }
    prevLengthRef.current = messages.length;
    msgCountRef.current = messages.length;
    // Mark channel as read whenever message list updates
    if (messages.length > 0) {
      setReadCount(channel.id, messages.length);
    }
  }, [messages.length, scrollToBottom, channel.id]);

  // Scroll to bottom on mount & mark as read
  useEffect(() => {
    scrollToBottom();
    queryClient.invalidateQueries({ queryKey: ["chat-activity"] });
    // On unmount (leaving channel), ensure read count is up to date
    return () => {
      if (msgCountRef.current > 0) {
        setReadCount(channel.id, msgCountRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenProfile = async (userId: string) => {
    if (userId === user?.id) return;
    setProfileUserId(userId);
    setProfileLoading(true);
    setProfileData(null);
    try {
      const res = await authApi.getPublicProfile(userId);
      setProfileData(res.data);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
    }
  };

  /** Fotoğraf seç → tarayıcıda küçült → yükle (boyut limiti yok) */
  const handlePickImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file: small } = await compressImage(file);
      const res = await mediaApi.uploadSingle(small);
      const url = res.data?.url;
      if (!url) throw new Error("url yok");
      setAttachPreview(url);
    } catch {
      toast.error("Fotoğraf yüklenemedi");
    } finally {
      setUploading(false);
      if (galleryRef.current) galleryRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((!trimmed && !attachPreview) || sending || uploading) return;
    setSending(true);
    try {
      await chatApi.sendMessage(channel.id, trimmed, attachPreview);
      setInput("");
      setAttachPreview(null);
      // Optimistically mark own message as read
      setReadCount(channel.id, messages.length + 1);
      queryClient.invalidateQueries({ queryKey: ["chat-messages", channel.id] });
      queryClient.invalidateQueries({ queryKey: ["chat-activity"] });
    } catch {
      // handled
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Messages */}
      {/*
        Sohbet zemini: Boğaz Köprüsü + şehir haritası deseni.
        Üzerine koyu katman: balonlar okunaklı kalsın, desen silik dursun.
      */}
      <div
        ref={scrollRef}
        data-chat-scroll
        className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain space-y-2 mb-1 px-1 py-2"
        style={{
          backgroundImage: "url('/chat-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundAttachment: "local",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(3,7,17,.72) 0%, rgba(3,7,17,.62) 40%, rgba(3,7,17,.78) 100%)",
          }}
        />
        {isLoading && (
          <p className="text-center text-[#7a8da4] text-sm py-8">Yükleniyor...</p>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-[#7a8da4]">
            <Icon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Henüz mesaj yok. Sohbeti başlat!</p>
          </div>
        )}
        <div className="relative z-10 space-y-2">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.senderId === user?.id ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex gap-2 ${
                msg.senderId === user?.id ? "flex-row-reverse" : ""
              }`}
            >
              {/* Avatar — clickable */}
              <button
                onClick={() => handleOpenProfile(msg.senderId)}
                className="shrink-0 mt-0.5 cursor-pointer"
                title="Profile bak"
              >
                <Avatar className="w-8 h-8 hover:ring-2 hover:ring-[#3b82f6]/50 transition-all">
                  <AvatarImage
                    src={
                      msg.sender?.avatar
                        ? `${apiBase}${msg.sender.avatar}`
                        : undefined
                    }
                  />
                  <AvatarFallback className="bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/20 text-[#3b82f6] text-xs">
                    {msg.senderName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
              {/* Bubble — WhatsApp tarzı */}
              <div
                className={`max-w-[78%] rounded-[16px] px-3 py-2 text-[13.5px] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,.35)] ${
                  msg.senderId === user?.id
                    ? "bg-[#1e4b6b] text-white rounded-br-[5px]"
                    : "bg-[#1b2a3a] text-[#e6edf5] rounded-bl-[5px]"
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11.5px] font-semibold text-[#7cc4f0]">
                    {msg.senderId === user?.id ? "Sen" : msg.senderName}
                  </span>
                </div>
                {(msg.sender?.carBrand || msg.sender?.plateNumber) && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Car className="w-3 h-3 text-[#6e8299]" />
                    <span className="text-[10px] text-[#8fa3b8]">
                      {[msg.sender.carBrand, msg.sender.carModel]
                        .filter(Boolean)
                        .join(" ") || "—"}
                      {msg.sender.plateNumber && (
                        <>
                          {" · "}
                          <span className="text-[#8f9fb4] font-mono">
                            {msg.sender.plateNumber}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                )}
                {msg.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setViewer(msg.imageUrl as string)}
                    className="mb-1 block w-full overflow-hidden rounded-[14px]"
                    title="Büyüt"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={msg.imageUrl}
                      alt="Fotoğraf"
                      className="max-h-[240px] w-full cursor-zoom-in object-cover"
                      loading="lazy"
                    />
                  </button>
                )}
                {msg.content ? (
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                ) : null}
                <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#8fa3b8]">
                  {formatTime(msg.createdAt)}
                  {msg.senderId === user?.id && (
                    <Check className="h-3 w-3 text-[#53bdeb]" />
                  )}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
        </div>
      </div>

      {/* Gizli dosya girişleri: kamera ve galeri */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handlePickImage(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePickImage(e.target.files?.[0])}
      />

      {/* Seçilen fotoğraf önizlemesi */}
      {attachPreview && (
        <div className="shrink-0 pb-1">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachPreview}
              alt="Önizleme"
              className="h-[72px] w-[72px] rounded-[12px] border border-[#3b82f6]/40 object-cover"
            />
            <button
              type="button"
              onClick={() => setAttachPreview(null)}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#ef4444] text-white"
              aria-label="Kaldır"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <p className="mt-1 text-[10px] text-[#7a8da4]">24 saat sonra silinir</p>
        </div>
      )}

      {/* Input — her zaman en altta, klavyenin üstünde */}
      <div className="flex shrink-0 gap-2 pb-1">
        {/*
          iOS Safari, odaklanan metin alanının üstüne "▲ ▼ ✓" şeklinde
          kendi form yardımcı çubuğunu (input accessory bar) ekliyor.
          `inputMode="search"` + `enterKeyHint="send"` + `autoCorrect off`
          kombinasyonu bu çubuğu kaldırır; klavye doğrudan giriş kutusunun
          altında başlar.
        */}
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Mesaj yaz..."
          inputMode="search"
          enterKeyHint="send"
          autoCorrect="off"
          autoCapitalize="sentences"
          rows={1}
          className="min-h-[44px] h-[44px] resize-none bg-white/5 border-white/20 text-white placeholder:text-[#7a8da4] text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="h-[44px] w-[44px] shrink-0 border-white/20 bg-white/5 text-[#8b9bb0] hover:text-white"
          title="Kameradan çek"
        >
          <Camera className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => galleryRef.current?.click()}
          disabled={uploading}
          className="h-[44px] w-[44px] shrink-0 border-white/20 bg-white/5 text-[#8b9bb0] hover:text-white"
          title="Galeriden seç"
        >
          {uploading ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
        </Button>
        <Button
          onClick={handleSend}
          disabled={(!input.trim() && !attachPreview) || sending || uploading}
          size="icon"
          className="h-[44px] w-[44px] shrink-0 bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] hover:bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/80 text-black"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/*
        Tam ekran fotoğraf görüntüleyici.
        Portal ile doğrudan <body>'ye basılır: sohbet konteynerindeki
        transform/overflow, "fixed" elemanı kırpıyor ve alttaki MESAJ
        YAZMA ÇUBUĞU görüntüleyicinin üstünde kalıp İndir butonuna
        basmayı engelliyordu. Portal'da böyle bir ata yok.
      */}
      {viewer && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[999] flex flex-col bg-black/95"
          onClick={() => setViewer(null)}
        >
          <div className="flex items-center justify-between p-4 pt-[calc(env(safe-area-inset-top,0px)+16px)]">
            <span className="text-[11px] text-white/60">24 saat sonra silinir</span>
            <button
              type="button"
              onClick={() => setViewer(null)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative z-0 flex flex-1 items-center justify-center overflow-hidden p-3 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewer} alt="Fotoğraf" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="relative z-10 p-4 pb-[calc(env(safe-area-inset-bottom,0px)+28px)]">
            <a
              href={viewer}
              download
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-2 rounded-[16px] border border-white/20 py-3 text-[13px] font-medium text-white"
            >
              <Download className="w-4 h-4" />
              İndir
            </a>
          </div>
        </div>,
        document.body
      )}

      {/* Profile Dialog */}
      <Dialog open={!!profileUserId} onOpenChange={() => setProfileUserId(null)}>
        <DialogContent className="bg-mancave-card border-[#162544] text-white max-w-sm">
          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
            </div>
          ) : profileData ? (
            <div className="text-center space-y-4">
              <Avatar className="w-20 h-20 mx-auto border-2 border-[#3b82f6]/30">
                <AvatarImage
                  src={profileData.avatar ? `${apiBase}${profileData.avatar}` : undefined}
                />
                <AvatarFallback className="bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/10 text-[#3b82f6] text-2xl">
                  {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-white text-lg font-semibold">
                  {profileData.firstName} {profileData.lastName}
                </h3>
              </div>
              <div className="space-y-2 text-left bg-mancave-surface rounded-lg p-3">
                {profileData.phone && (
                  <div className="flex items-center gap-2 text-sm text-[#8f9fb4]">
                    <span className="text-[#7a8da4] w-16 text-xs">Telefon</span>
                    <span className="text-[#b9c6d8]">{profileData.phone}</span>
                  </div>
                )}
                {profileData.carBrand && (
                  <div className="flex items-center gap-2 text-sm text-[#8f9fb4]">
                    <span className="text-[#7a8da4] w-16 text-xs">Araç</span>
                    <span className="text-[#b9c6d8]">
                      {[profileData.carBrand, profileData.carModel].filter(Boolean).join(" ")}
                    </span>
                  </div>
                )}
                {profileData.plateNumber && (
                  <div className="flex items-center gap-2 text-sm text-[#8f9fb4]">
                    <span className="text-[#7a8da4] w-16 text-xs">Plaka</span>
                    <span className="text-[#b9c6d8] font-mono">{profileData.plateNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-[#7a8da4] py-4">Profil yüklenemedi</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Channel List View ──────────────────────────────────────────────────────

function ChannelList({ onSelectChannel }: { onSelectChannel: (c: (typeof CHANNELS)[number]) => void }) {
  const { data } = useQuery({
    queryKey: ["chat-activity"],
    queryFn: () => chatApi.getActivity(),
    refetchInterval: 5000,
  });

  const activity: Record<
    string,
    { count: number; lastMessage: { content: string; senderName: string; createdAt: string } | null }
  > = (data as any)?.data ?? {};

  const [initialized, setInitialized] = useState(false);

  // On first load, initialize read counts to current totals
  useEffect(() => {
    if (!initialized && data && Object.keys(activity).length > 0) {
      const reads = getReadCounts();
      let updated = false;
      Object.entries(activity).forEach(([channelId, info]) => {
        if (reads[channelId] === undefined) {
          reads[channelId] = info.count;
          updated = true;
        }
      });
      if (updated) {
        localStorage.setItem(READ_COUNTS_KEY, JSON.stringify(reads));
      }
      setInitialized(true);
    }
  }, [data, activity, initialized]);

  const getUnread = (channelId: string): number => {
    const info = activity[channelId];
    if (!info) return 0;
    const read = getReadCounts()[channelId] ?? 0;
    return Math.max(0, info.count - read);
  };

  const truncate = (text: string, max = 40): string =>
    text.length > max ? text.slice(0, max) + "..." : text;

  return (
    <div className="space-y-1">
      {CHANNELS.map((ch) => {
        const Icon = ch.icon;
        const info = activity[ch.id];
        const unread = getUnread(ch.id);

        return (
          <motion.button
            key={ch.id}
            onClick={() => onSelectChannel(ch)}
            whileTap={{ scale: 0.99 }}
            className="w-full flex items-center gap-3 p-3 rounded-[16px] hover:bg-white/5 transition-colors text-left group"
          >
            {/* Icon */}
            <div className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
              <Icon className={`w-5 h-5 ${ch.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-white font-medium text-sm">{ch.label}</span>
                {info?.lastMessage && (
                  <span className="text-[10px] text-[#7a8da4] shrink-0">
                    {formatTime(info.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <p className="text-[#7a8da4] text-xs truncate mt-0.5">
                {info?.lastMessage
                  ? `${info.lastMessage.senderName}: ${truncate(info.lastMessage.content)}`
                  : "Henüz mesaj yok"}
              </p>
            </div>

            {/* Unread badge */}
            {unread > 0 && (
              <Badge className="shrink-0 bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-black text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
                {unread > 99 ? "99+" : unread}
              </Badge>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [showSupport, setShowSupport] = useState(false);

  /**
   * Tek kanal, tam ekran sohbet.
   *
   * - Sohbet modunda sayfa `fixed inset-0` ile tüm ekranı kaplar; alt
   *   navigasyon görünmez. Böylece klavye açılınca içerik kaymaz.
   * - Destek moduna geçince normal Layout + alt nav geri gelir.
   */
  const channel = CHANNELS[0];

  useEffect(() => {
    markChannelRead(channel.id);
  }, [channel.id]);

  /**
   * Klavye takibi.
   *
   * iOS'ta `100dvh` klavye açılınca DEĞİŞMEZ. Klavye açıkken gerçek
   * görünür alan `visualViewport.height`'tır. Bunu kullanarak sohbet
   * alanını klavyenin tam üstüne oturtuyoruz — sayfa kaymıyor.
   *
   * `keyboardOpen` true iken alt navigasyonu gizliyoruz (App Store
   * sohbet uygulamalarındaki davranış), böylece nav klavyenin üstünde
   * ortada belirmiyor.
   */
  const [vpHeight, setVpHeight] = useState<number | null>(null);
  const [vpTop, setVpTop] = useState<number | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  /**
   * Klavye açıkken alt navigasyonu gizle.
   * BottomNav bu sınıfı okuyup kendini gizler — nav klavyenin üstünde
   * ortada belirmesin.
   */
  useEffect(() => {
    const el = document.documentElement;
    if (keyboardOpen) el.classList.add("kb-open");
    else el.classList.remove("kb-open");
    return () => el.classList.remove("kb-open");
  }, [keyboardOpen]);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const BASE = window.innerHeight;

    const update = () => {
      setVpHeight(vv.height);
      setVpTop(vv.offsetTop);
      // 120px'ten fazla küçülme = klavye açıldı
      setKeyboardOpen(BASE - vv.height > 120);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  /**
   * Klavye açılıp kapandığında konteyner yüksekliği değişir; scroll
   * konumu korunmaz. Her iki durumda da en son mesaja sabitliyoruz.
   */
  useEffect(() => {
    const el = document.querySelector<HTMLDivElement>("[data-chat-scroll]");
    if (el) el.scrollTop = el.scrollHeight;
  }, [keyboardOpen, vpHeight]);

  if (showSupport) {
    return (
      <AuthGuard>
        <Layout hideFooter>
          <div className="h-[calc(100dvh-4.5rem)] p-4">
            <SupportChatView onBack={() => setShowSupport(false)} />
          </div>
        </Layout>
      </AuthGuard>
    );
  }

  /**
   * Klavye açıkken viewport'un üst kenarı (visualViewport.offsetTop).
   * Giriş kutusunu bu ofsete göre konumluyoruz.
   */
  const vvTop = vpTop ?? 0;

  return (
    <AuthGuard>
      {/*
        Sohbet, klavye durumuna göre iki modda çalışır:

        1) Klavye KAPALI → normal akış. Alt nav görünür (72px pay).
        2) Klavye AÇIK   → container `position: fixed` ile görsel viewport'a
           kilitlenir. Sayfa hiç kaymaz; giriş kutusu klavyenin tam üstünde.
           Alt nav gizlenir (klavyenin üstünde ortada belirmesin).

        iOS'ta `100dvh` klavyeden etkilenmediği için yalnızca
        visualViewport.height/offsetTop kullanılabilir.
      */}
      <div
        className="flex flex-col overflow-hidden bg-[#030711] pt-[env(safe-area-inset-top,0px)]"
        style={
          keyboardOpen
            ? {
                position: "fixed",
                left: 0,
                right: 0,
                top: `${vvTop}px`,
                height: `${vpHeight ?? window.innerHeight}px`,
                zIndex: 70,
              }
            : {
                // Nav bar'ın tam üstüne sabitle: hesap yok, boşluk imkânsız.
                // Nav: bottom = safe-area + 12px, yükseklik 60px  →  alt kenar = 72px + safe
                position: "fixed",
                left: 0,
                right: 0,
                top: 0,
                bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
                zIndex: 40,
              }
        }
      >
        {/* Başlık */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[#162544] px-4 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/10">
            <MessageCircle className="h-4 w-4 text-[#3b82f6]" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-bold leading-tight text-white">Sohbet</h2>
            <p className="text-[10.5px] leading-tight text-[#6b7d94]">Tüm üyeler</p>
          </div>
          <button
            onClick={() => setShowSupport(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-[#8f9fb4] transition-colors hover:bg-white/10"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Destek
          </button>
        </div>

        {/* Mesajlar */}
        <div className="min-h-0 flex-1 overflow-hidden px-4 pt-3">
          <ChannelChatView channel={channel} onBack={() => {}} />
        </div>
      </div>
</AuthGuard>
  );
}
