"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { chatApi, authApi } from "@/lib/api";
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
  X,
} from "lucide-react";
import type { ChatMessage, SupportMessage, UserPublicProfile } from "@/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const CHANNELS = [
  { id: "genel", label: "Genel Sohbet", icon: MessageCircle, color: "text-blue-400" },
  { id: "ilan", label: "İlan", icon: Megaphone, color: "text-orange-400" },
  { id: "touge", label: "Touge", icon: Flame, color: "text-red-400" },
  { id: "pist", label: "Pist", icon: Flag, color: "text-green-400" },
  { id: "rolling", label: "Rolling", icon: Car, color: "text-purple-400" },
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

// ─── Support Section ─────────────────────────────────────────────────────────

function SupportSection() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["support-messages"],
    queryFn: () => chatApi.getSupport(),
    refetchInterval: 5000,
  });

  const messages: SupportMessage[] = (data as any)?.data ?? [];

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await chatApi.sendSupport(trimmed);
      setInput("");
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    } catch {
      // error handled by api layer
    } finally {
      setSending(false);
    }
  };

  const handleToggleReplied = async (id: string) => {
    try {
      await chatApi.toggleSupportReplied(id);
      queryClient.invalidateQueries({ queryKey: ["support-messages"] });
    } catch {
      // handled
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-mancave-bg/80 p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-[#3b82f6]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Destek</h3>
          <p className="text-sm text-gray-400">
            Sorularını veya sorunlarını buradan iletebilirsin
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="max-h-64 overflow-y-auto space-y-3 mb-4 pr-1">
        {isLoading && (
          <p className="text-center text-mancave-muted text-sm">Yükleniyor...</p>
        )}
        {!isLoading && messages.length === 0 && (
          <p className="text-center text-mancave-muted text-sm py-4">
            Henüz destek mesajı yok. Bir şey sormak istersen aşağıdan yazabilirsin.
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`rounded-lg p-3 text-sm ${
                msg.senderId === user?.id
                  ? "bg-[#3b82f6]/10 border border-[#3b82f6]/20 ml-4"
                  : "bg-white/5 border border-white/10 mr-4"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-gray-400">
                  {msg.senderId === user?.id ? "Sen" : msg.senderName}
                </span>
                <span className="text-xs text-mancave-muted">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
              <p className="text-white/90 whitespace-pre-wrap">{msg.content}</p>
              {isAdmin && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs text-mancave-muted">
                    {msg.replied ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <Check className="w-3 h-3" /> Yanıtlandı
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <Clock className="w-3 h-3" /> Bekliyor
                      </span>
                    )}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleReplied(msg.id)}
                    className="h-7 text-xs border-white/20 text-gray-400 hover:text-white hover:border-white/40"
                  >
                    {msg.replied ? "Geri Al" : "Yanıtlandı"}
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Mesajını yaz..."
          className="min-h-[44px] h-[44px] resize-none bg-white/5 border-white/20 text-white placeholder:text-mancave-muted text-sm"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          size="icon"
          className="h-[44px] w-[44px] shrink-0 bg-[#3b82f6] hover:bg-[#3b82f6]/80 text-black"
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
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserPublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const msgCountRef = useRef(0);

  const Icon = channel.icon;

  const { data, isLoading } = useQuery({
    queryKey: ["chat-messages", channel.id],
    queryFn: () => chatApi.getMessages(channel.id),
    refetchInterval: 5000,
  });

  const messages: ChatMessage[] = (data as any)?.data ?? [];

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    try {
      await chatApi.sendMessage(channel.id, trimmed);
      setInput("");
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
          <Icon className={`w-4 h-4 ${channel.color}`} />
        </div>
        <div>
          <h3 className="text-white font-medium text-sm">{channel.label}</h3>
          <p className="text-mancave-muted text-xs">{messages.length} mesaj</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1">
        {isLoading && (
          <p className="text-center text-mancave-muted text-sm py-8">Yükleniyor...</p>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-mancave-muted">
            <Icon className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">Henüz mesaj yok. Sohbeti başlat!</p>
          </div>
        )}
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
                  <AvatarFallback className="bg-[#3b82f6]/20 text-[#3b82f6] text-xs">
                    {msg.senderName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
              {/* Bubble */}
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  msg.senderId === user?.id
                    ? "bg-[#3b82f6]/20 text-white rounded-tr-md"
                    : "bg-white/5 text-white/90 rounded-tl-md"
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-[#3b82f6]/70">
                    {msg.senderId === user?.id ? "Sen" : msg.senderName}
                  </span>
                </div>
                {(msg.sender?.carBrand || msg.sender?.plateNumber) && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <Car className="w-3 h-3 text-mancave-muted" />
                    <span className="text-[10px] text-mancave-muted">
                      {[msg.sender.carBrand, msg.sender.carModel]
                        .filter(Boolean)
                        .join(" ") || "—"}
                      {msg.sender.plateNumber && (
                        <>
                          {" · "}
                          <span className="text-gray-400 font-mono">
                            {msg.sender.plateNumber}
                          </span>
                        </>
                      )}
                    </span>
                  </div>
                )}
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <span className="text-[10px] text-mancave-muted mt-1 block text-right">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
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
          className="min-h-[44px] h-[44px] resize-none bg-white/5 border-white/20 text-white placeholder:text-mancave-muted text-sm"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          size="icon"
          className="h-[44px] w-[44px] shrink-0 bg-[#3b82f6] hover:bg-[#3b82f6]/80 text-black"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>

      {/* Profile Dialog */}
      <Dialog open={!!profileUserId} onOpenChange={() => setProfileUserId(null)}>
        <DialogContent className="bg-mancave-card border-gray-800 text-white max-w-sm">
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
                <AvatarFallback className="bg-[#3b82f6]/10 text-[#3b82f6] text-2xl">
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
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-mancave-muted w-16 text-xs">Telefon</span>
                    <span className="text-gray-300">{profileData.phone}</span>
                  </div>
                )}
                {profileData.carBrand && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-mancave-muted w-16 text-xs">Araç</span>
                    <span className="text-gray-300">
                      {[profileData.carBrand, profileData.carModel].filter(Boolean).join(" ")}
                    </span>
                  </div>
                )}
                {profileData.plateNumber && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-mancave-muted w-16 text-xs">Plaka</span>
                    <span className="text-gray-300 font-mono">{profileData.plateNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center text-mancave-muted py-4">Profil yüklenemedi</p>
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
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left group"
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
                  <span className="text-[10px] text-mancave-muted shrink-0">
                    {formatTime(info.lastMessage.createdAt)}
                  </span>
                )}
              </div>
              <p className="text-mancave-muted text-xs truncate mt-0.5">
                {info?.lastMessage
                  ? `${info.lastMessage.senderName}: ${truncate(info.lastMessage.content)}`
                  : "Henüz mesaj yok"}
              </p>
            </div>

            {/* Unread badge */}
            {unread > 0 && (
              <Badge className="shrink-0 bg-[#3b82f6] text-black text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center">
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
  const [selectedChannel, setSelectedChannel] = useState<
    (typeof CHANNELS)[number] | null
  >(null);

  return (
    <AuthGuard>
      <Layout hideFooter>
        <div className="flex flex-col h-full">
          {/* Compact header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-mancave-border">
            <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#3b82f6]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sohbet</h2>
            </div>
          </div>

          {/* Main Content — fills remaining space */}
          <div className="flex-1 overflow-hidden">
            {selectedChannel ? (
              <div className="h-full flex flex-col p-4">
                <ChannelChatView
                  channel={selectedChannel}
                  onBack={() => setSelectedChannel(null)}
                />
              </div>
            ) : (
              <div className="h-full overflow-y-auto p-4">
                <ChannelList onSelectChannel={setSelectedChannel} />
                {/* Support Section */}
                <div className="mt-4">
                  <SupportSection />
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
}
