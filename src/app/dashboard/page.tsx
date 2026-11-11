"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, eventsApi, meetingApi, type Meeting, type RollUserCard, imgUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { SponsorCard } from "@/components/SponsorCard";
import { SkeletonCard } from "@/components/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Car, Trophy, Sparkles, Star, ShoppingBag, Calendar, Plus, X, MapPin, CalendarCheck, CalendarDays, Flame, Clock, Trash2, Check } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const DAY = 86400000;


export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const TR_MONTHS_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];
const TR_DAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const CAL_EVENT = "#3b82f6";
const CAL_ROLL = "#f97316";

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function parseDateLabel(label?: string | null): Date | null {
  if (!label) return null;
  const m = label.match(/^(\d{1,2})\s+([A-Za-zŞşĞğÜüÖöÇçİı]+)\s+(\d{4})/);
  if (!m) return null;
  const idx = TR_MONTHS_SHORT.findIndex(
    (mo) => mo.toLowerCase().slice(0, 3) === m[2].toLowerCase().slice(0, 3)
  );
  if (idx < 0) return null;
  return new Date(Number(m[3]), idx, Number(m[1]));
}

function monthGrid(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Pazartesi = 0
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function countdown(date: string, time?: string) {
  const target = new Date(date);
  if (time && /^\d{1,2}:\d{2}/.test(time)) {
    const [h, m] = time.split(":").map(Number);
    target.setHours(h || 0, m || 0, 0, 0);
  }
  const ms = target.getTime() - Date.now();
  if (ms <= 0) return "Başladı";
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / 3600000);
  return `${d} gün ${h} sa`;
}

function DashboardContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newRoll, setNewRoll] = useState(false);
  const [sheet, setSheet] = useState<RollUserCard | null>(null);
  const today = new Date();
  const [calMonth, setCalMonth] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [calDay, setCalDay] = useState<string | null>(null);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.getData(),
    staleTime: 30_000,
  });

  const { data: meetData } = useQuery({
    queryKey: ["meetings"],
    queryFn: () => meetingApi.list(),
    staleTime: 15_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["meetings"] });
  };

  const joinEvent = useMutation({
    mutationFn: (id: string) => eventsApi.join(id),
    onSuccess: () => {
      toast.success("Etkinliğe katıldınız!");
      refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Katılım başarısız"),
  });

  const leaveEvent = useMutation({
    mutationFn: (id: string) => eventsApi.leave(id),
    onSuccess: () => {
      toast.success("Etkinlikten ayrıldınız");
      refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Ayrılma başarısız"),
  });

  const createMeeting = useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      date: string;
      time?: string;
      place?: string;
      mapUrl?: string;
    }) => meetingApi.create(data),
    onSuccess: () => {
      toast.success("Buluşma daveti oluşturuldu");
      setNewRoll(false);
      refresh();
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Buluşma oluşturulamadı"),
  });

  const respondMeeting = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "going" | "not_going" }) =>
      meetingApi.respond(id, status),
    onSuccess: (res) => {
      toast.success(res.message || "Yanıtın kaydedildi");
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Kaydedilemedi"),
  });

  const deleteMeeting = useMutation({
    mutationFn: (id: string) => meetingApi.remove(id),
    onSuccess: () => {
      toast.success("Buluşma silindi");
      refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Silinemedi"),
  });

  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "";
  const events = dashboardData?.data.upcomingEvents ?? [];
  const products = dashboardData?.data.products ?? [];
  const sponsors = dashboardData?.data.sponsors ?? [];
  const meetings = (meetData?.data ?? []) as Meeting[];

  const calMap = useMemo(() => {
    const map = new Map<string, { events: number; rolls: number }>();
    const bump = (d: Date | null, k: "events" | "rolls") => {
      if (!d) return;
      const key = dayKey(d);
      const cur = map.get(key) || { events: 0, rolls: 0 };
      cur[k] += 1;
      map.set(key, cur);
    };
    events.forEach((e) => bump(new Date(e.date), "events"));
    meetings.forEach((m) => bump(new Date(m.dateIso || m.date), "rolls"));
    return map;
  }, [events, meetings]);

  const upcomingCount = events.filter((e) => new Date(e.date) >= new Date()).length;
  const monthLabel = new Date().toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  const calCells = useMemo(() => monthGrid(calMonth.y, calMonth.m), [calMonth]);
  const todayKey = dayKey(new Date());
  const calEventList = calDay ? events.filter((e) => dayKey(new Date(e.date)) === calDay) : [];
  const calMeetingList = calDay
    ? meetings.filter((m) => {
        const d = new Date(m.dateIso || m.date);
        return !isNaN(d.getTime()) && dayKey(d) === calDay;
      })
    : [];


  return (
    <Layout>
      <div className="max-w-[430px] mx-auto px-4 pb-10 animate-fade-in">
        {/* Hoş geldin — üst tarafla bütünleşik hero */}
        <div className="relative -mx-4 -mt-4 mb-7 overflow-hidden">
          {/* Zemin katmanı */}
          <div className="absolute inset-0 bg-[#0a1628]">
            {user?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl(user.avatar)}
                alt={user?.firstName || "profil"}
                className="w-full h-full object-cover opacity-[0.35] scale-105"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050b16] via-[#050b16]/94 via-50% to-[#0a1628]/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-transparent to-[#030711]/60" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 85% 15%, rgba(59,130,246,0.22) 0%, transparent 58%)",
              }}
            />
          </div>

          {/* Üst accent çizgi */}
          <span className="absolute left-0 right-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#3b82f6]/60 to-transparent z-10" />

          <div className="relative z-10 px-5 pt-7 pb-6">
            <p className="text-[9.5px] uppercase tracking-[0.24em] text-[#3b82f6]/80 mb-2">
              Bosphorus Fellas
            </p>

            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Avatar className="w-[54px] h-[54px] border border-[#3b82f6]/30 ring-1 ring-white/5">
                  <AvatarImage
                    src={user?.avatar ? imgUrl(user.avatar) : undefined}
                    alt={user?.firstName}
                  />
                  <AvatarFallback className="bg-[#0f1d32] text-[#60a5fa] text-[15px] font-semibold tracking-wide">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#050b16]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <h1 className="text-[21px] leading-tight font-semibold tracking-[-0.03em] text-white truncate drop-shadow">
                    {user?.firstName}
                  </h1>
                  <Sparkles className="w-3.5 h-3.5 text-[#3b82f6] shrink-0 mb-0.5" />
                </div>
                <p className="text-[11.5px] text-white/50 truncate">
                  Toplulukta neler oluyor, bir göz at.
                </p>
              </div>
            </div>

            {/* Alt bilgi şeridi */}
            <div className="flex items-center gap-4 mt-4 pt-3.5 border-t border-white/[0.07] text-[10.5px] text-white/45">
              <span className="flex items-center gap-1.5">
                <CalendarCheck className="w-3 h-3 text-[#3b82f6]/70" />
                {upcomingCount} yaklaşan
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-[#3b82f6]/70" />
                {(user as any)?.score ? `${(user as any).score}/10` : "0/10"} aktiflik
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-white/30">
                <CalendarDays className="w-3 h-3" />
                {monthLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Aylık takvim */}
        <section className="relative mb-8">
          {/* Takvim arkasinda marka zemini */}
          <div className="pointer-events-none absolute -inset-x-2 -top-3 bottom-0 rounded-3xl overflow-hidden -z-10">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.22]"
              style={{ backgroundImage: "url('/brand-bg-square.webp')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#030711]/40 via-[#030711]/25 to-[#030711]" />
          </div>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#b9c6d8] mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#3b82f6]" />
            Takvim
            <button
              onClick={() => setNewRoll(true)}
              disabled={createMeeting.isPending}
              className="flex items-center gap-1 text-[12px] border border-[#162544] rounded-lg px-2.5 py-1 text-gray-200 hover:bg-[#0a1628]/80 disabled:opacity-50"
            >
              <Plus className="w-3 h-3" />
              Buluşma
            </button>
            <span className="ml-auto flex items-center gap-3 text-[11px] font-normal text-[#7a8da4]">
              <span className="flex items-center gap-1">
                <i className="w-2 h-2 rounded-full inline-block" style={{ background: CAL_EVENT }} />
                Etkinlik
              </span>
              <span className="flex items-center gap-1">
                <i className="w-2 h-2 rounded-full inline-block" style={{ background: CAL_ROLL }} />
                Buluşma
              </span>
            </span>
          </h2>

          <div className="bg-[#0f1d32]/70 border border-[#162544] rounded-2xl premium-shadow p-3 animate-slide-up">
            <div className="flex items-center justify-between mb-2.5">
              <button
                onClick={() =>
                  setCalMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))
                }
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#162544] text-[#b9c6d8] hover:bg-[#0a1628]/80"
                aria-label="Önceki ay"
              >
                ‹
              </button>
              <p className="text-[14px] font-semibold text-white">
                {TR_MONTHS[calMonth.m]} {calMonth.y}
              </p>
              <button
                onClick={() =>
                  setCalMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))
                }
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#162544] text-[#b9c6d8] hover:bg-[#0a1628]/80"
                aria-label="Sonraki ay"
              >
                ›
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {TR_DAYS.map((d) => (
                <span key={d} className="text-[11px] text-center text-[#7a8da4]">
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calCells.map((day, i) => {
                if (!day) return <span key={`e${i}`} />;
                const key = dayKey(day);
                const info = calMap.get(key);
                const isPast = key < todayKey;
                const isToday = key === todayKey;
                const hasE = (info?.events ?? 0) > 0;
                const hasR = (info?.rolls ?? 0) > 0;
                const active = hasE || hasR;
                return (
                  <button
                    key={key}
                    onClick={() => active && setCalDay(key)}
                    disabled={!active}
                    className={`relative h-9 rounded-lg text-[12px] flex items-center justify-center border transition-colors ${
                      isPast
                        ? "text-[#4d5c70] border-transparent bg-[#0a1628]/40"
                        : active
                        ? "border-[#162544] text-white hover:bg-[#0a1628]/80"
                        : "text-[#8f9fb4] border-transparent"
                    } ${isToday ? "ring-1 ring-[#3b82f6]" : ""}`}
                  >
                    {day.getDate()}
                    {active && (
                      <span className="absolute bottom-1 flex gap-0.5">
                        {hasE && (
                          <i
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: CAL_EVENT, opacity: isPast ? 0.45 : 1 }}
                          />
                        )}
                        {hasR && (
                          <i
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: CAL_ROLL, opacity: isPast ? 0.45 : 1 }}
                          />
                        )}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

{/* Sponsorlar */}
        <section className="mb-8">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#b9c6d8] mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#3b82f6]" />
            Anlaşmalı Noktalar
          </h2>
          {isLoading ? (
            <SkeletonCard className="h-20" />
          ) : sponsors.length === 0 ? (
            <EmptyState icon={Star} title="Henüz sponsor yok" description="Anlaşmalı noktalarımız burada listelenecek." compact />
          ) : (
            <div className="space-y-3">
              {sponsors.map((s) => (
                <SponsorCard key={s.id} sponsor={s} />
              ))}
            </div>
          )}
        </section>

        {/* MANCAVE Market */}
        <section>
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#b9c6d8] mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#3b82f6]" />
            Bosphorus Market
          </h2>
          {isLoading ? (
            <SkeletonCard className="h-40" />
          ) : products.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="Henüz ürün yok" description="Bosphorus Market ürünleri yakında burada." compact />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>

      {sheet && <ProfileSheet user={sheet} onClose={() => setSheet(null)} />}

      {calDay && (
        <DayModal
          label={`${Number(calDay.slice(8, 10))} ${TR_MONTHS[Number(calDay.slice(5, 7)) - 1]} ${calDay.slice(0, 4)}`}
          events={calEventList}
          meetings={calMeetingList}
          onClose={() => setCalDay(null)}
          onOpenUser={(u) => setSheet({ id: u.id, name: `${u.firstName} ${u.lastName}`, car: [u.carBrand, u.carModel].filter(Boolean).join(" "), spec: "", photo: u.avatar, bio: "", rolls: 0, wins: 0, since: "" })}
          onDeleteMeeting={(id) => deleteMeeting.mutate(id)}
          onRespond={(id, status) => respondMeeting.mutate({ id, status })}
          onJoinEvent={(id) => joinEvent.mutate(id)}
          onLeaveEvent={(id) => leaveEvent.mutate(id)}
          canDeleteMeeting={true}
        />
      )}

      {newRoll && (
        <NewMeetingSheet
          onClose={() => setNewRoll(false)}
          onSubmit={(d) => createMeeting.mutate(d)}
          pending={createMeeting.isPending}
        />
      )}
    </Layout>
  );
}

function CarBox({
  user,
  isMe,
  onOpen,
}: {
  user: RollUserCard;
  isMe: boolean;
  onOpen: (u: RollUserCard) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(user)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(user);
        }
      }}
      className="bg-[#0a1628]/90 border border-[#162544]/70 rounded-xl p-2 text-center min-h-[150px] flex flex-col justify-center cursor-pointer transition-colors hover:outline hover:outline-1 hover:outline-[#3b82f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3b82f6]"
    >
      <div className="h-16 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center mb-1.5 overflow-hidden">
        {user.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgUrl(user.photo)} alt={user.car} className="w-full h-full object-cover" />
        ) : (
          <Car className="w-7 h-7 text-[#3b82f6]" />
        )}
      </div>
      <p className="text-[13px] font-semibold text-white truncate">{user.car}</p>
      {user.spec && <p className="text-[12px] text-[#7a8da4] truncate">{user.spec}</p>}
      <p className="text-[12px] text-[#3b82f6] truncate">
        {user.name}
        {isMe ? " (sen)" : ""} · Profil
      </p>
    </div>
  );
}

function MeetingCard({
  m,
  onOpen,
  onDelete,
  onRespond,
  canDelete,
}: {
  m: Meeting;
  onOpen: (u: { id: string; firstName: string; lastName: string; avatar: string | null; carBrand: string | null; carModel: string | null }) => void;
  onDelete: (id: string) => void;
  onRespond: (id: string, status: "going" | "not_going") => void;
  canDelete: boolean;
}) {
  const d = new Date(m.dateIso || m.date);
  const dateLabel = !isNaN(d.getTime())
    ? d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" })
    : m.date;

  // Google Maps statik onizleme (lat/lng varsa)
  // Google Maps embed — anahtar gerekmez, pin otomatik cikar
  const mapQuery =
    m.lat != null && m.lng != null
      ? `${m.lat},${m.lng}`
      : m.place && m.place !== "Konum belirtilmedi"
        ? m.place
        : null;

  const mapImg = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed&hl=tr`
    : null;

  return (
    <article className="relative overflow-hidden rounded-2xl border border-[#f97316]/25 bg-[#0f1d32]/70 premium-shadow">
      {/* Turuncu serit */}
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#f97316] z-10" />

      {/* Harita / yer gorseli */}
      {m.photoUrl && (
        <div className="relative h-[150px] overflow-hidden bg-[#0a1628]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.photoUrl}
            alt={m.place || m.title}
            className="w-full h-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#0f1d32] via-transparent to-transparent pointer-events-none" />
          <span className="absolute top-2 left-3 flex items-center gap-1 text-[10px] font-medium bg-black/55 backdrop-blur px-2 py-0.5 rounded-md text-white/90">
            <MapPin className="w-2.5 h-2.5 text-[#f97316]" />
            Mekan fotoğrafı
          </span>
          {m.mapUrl && (
            <a
              href={m.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 left-3 right-3 flex items-center gap-1 text-[10.5px] text-white/95 hover:text-[#fb923c]"
            >
              <MapPin className="w-3 h-3 text-[#f97316] shrink-0" />
              <span className="truncate">{m.place}</span>
            </a>
          )}
        </div>
      )}

      {!m.photoUrl && mapImg && (
        <div className="relative h-[130px] overflow-hidden bg-[#0a1628]">
          <iframe
            src={mapImg}
            title={m.place}
            loading="lazy"
            className="w-full h-full border-0 pointer-events-none scale-[1.15]"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-[#0f1d32] via-transparent to-transparent pointer-events-none" />
          {m.mapUrl && (
            <a
              href={m.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 left-3 right-3 flex items-center gap-1 text-[10.5px] text-white/90 hover:text-[#fb923c]"
            >
              <MapPin className="w-3 h-3 text-[#f97316] shrink-0" />
              <span className="truncate">{m.place}</span>
            </a>
          )}
        </div>
      )}

      <div className="p-3.5 pl-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-semibold tracking-[-0.01em] text-white leading-snug">
            {m.title}
          </p>
          <span className="shrink-0 rounded-full bg-[#f97316]/15 border border-[#f97316]/30 px-2 py-0.5 text-[9px] uppercase tracking-[0.1em] text-[#fb923c]">
            Buluşma
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-[12px] text-[#8b9bb0] mt-1.5">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {dateLabel}
          </span>
          {m.time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {m.time}
            </span>
          )}
        </div>

        {!mapImg && m.mapUrl && (
          <a
            href={m.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 flex items-center gap-1 text-[12px] text-[#f97316] underline underline-offset-2"
          >
            <MapPin className="w-3 h-3" />
            {m.place} · Haritada aç
          </a>
        )}

        {m.description && (
          <p className="mt-2 text-[12px] leading-relaxed text-[#8b9bb0] line-clamp-3">
            {m.description}
          </p>
        )}

        {/* Olusturan */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={() => onOpen(m.creator)}
            className="flex items-center gap-2 rounded-full bg-white/5 pl-0.5 pr-2.5 py-0.5 hover:bg-white/10 transition-colors"
          >
            {m.creator.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl(m.creator.avatar)}
                alt=""
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <span className="w-6 h-6 rounded-full bg-[#f97316]/20 flex items-center justify-center text-[9px] font-semibold text-[#fb923c]">
                {(m.creator.firstName?.[0] || "") + (m.creator.lastName?.[0] || "")}
              </span>
            )}
            <span className="text-[11px] text-[#b9c6d8]">
              {m.creator.firstName} {m.creator.lastName}
            </span>
          </button>

          {canDelete && (
            <button
              onClick={() => onDelete(m.id)}
              className="ml-auto flex items-center gap-1 rounded-lg border border-[#3a1c1c] px-2.5 py-1 text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Sil
            </button>
          )}
        </div>

        {/* Katilim */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => onRespond(m.id, "going")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[11.5px] font-medium transition-colors ${
              m.myResponse === "going"
                ? "border-[#22c55e] bg-[#22c55e]/15 text-[#4ade80]"
                : "border-[#162544] text-[#8b9bb0] hover:border-[#22c55e]/50 hover:text-[#4ade80]"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            Katılıyorum
            {!!m.goingCount && (
              <span className="ml-0.5 text-[10px] opacity-70">{m.goingCount}</span>
            )}
          </button>

          <button
            onClick={() => onRespond(m.id, "not_going")}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[11.5px] font-medium transition-colors ${
              m.myResponse === "not_going"
                ? "border-[#ef4444] bg-[#ef4444]/15 text-[#f87171]"
                : "border-[#162544] text-[#8b9bb0] hover:border-[#ef4444]/50 hover:text-[#f87171]"
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Katılamıyorum
            {!!m.notGoingCount && (
              <span className="ml-0.5 text-[10px] opacity-70">{m.notGoingCount}</span>
            )}
          </button>
        </div>

        {/* Katilimcilar */}
        {!!(m.going?.length || m.notGoing?.length) && (
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            {m.going?.slice(0, 8).map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`g-${u.id}`}
                src={u.avatar ? imgUrl(u.avatar) : "/brand-mark-white.png"}
                alt={`${u.firstName} ${u.lastName}`}
                title={`${u.firstName} ${u.lastName} · katılıyor`}
                className="w-6 h-6 rounded-full object-cover ring-2 ring-[#22c55e]/60"
              />
            ))}
            {m.notGoing?.slice(0, 8).map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`n-${u.id}`}
                src={u.avatar ? imgUrl(u.avatar) : "/brand-mark-white.png"}
                alt={`${u.firstName} ${u.lastName}`}
                title={`${u.firstName} ${u.lastName} · katılamıyor`}
                className="w-6 h-6 rounded-full object-cover ring-2 ring-[#ef4444]/40 grayscale opacity-60"
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function EventCard({
  e,
  onJoin,
  onLeave,
  pending,
}: {
  e: {
    id: string;
    title: string;
    description?: string;
    date: string;
    time?: string;
    location?: string;
    locationUrl?: string | null;
    imageUrl?: string | null;
    kind?: string;
    featured?: boolean;
    maxParticipants?: number;
    currentParticipants?: number;
    isJoined?: boolean;
  };
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  pending: boolean;
}) {
  const kind = e.kind && e.kind.trim() ? e.kind : "Etkinlik";
  const joined = Boolean(e.isJoined);
  const current = e.currentParticipants ?? 0;
  const max = e.maxParticipants || 0;
  const pct = max ? Math.min(100, Math.round((current / max) * 100)) : current > 0 ? 100 : 0;
  const image = e.imageUrl ? imgUrl(e.imageUrl) : null;
  const full = max > 0 && current >= max && !joined;

  return (
    <article
      key={e.id}
      className={`bg-[#0f1d32]/50 border rounded-xl overflow-hidden ${
        e.featured ? "border-[#3b82f6]" : "border-[#162544]"
      }`}
    >
      <div
        className="relative h-[160px] bg-[#0a1628] flex items-center justify-center bg-cover bg-center"
        style={image ? { backgroundImage: `url('${image}')` } : undefined}
      >
        {!image &&
          (kind === "Yarış" ? (
            <Trophy className="w-11 h-11 text-[#6b7d94]" />
          ) : (
            <Car className="w-11 h-11 text-[#6b7d94]" />
          ))}
        <span
          className={`absolute top-2.5 left-2.5 text-[11px] px-2.5 py-0.5 rounded-lg ${
            kind === "Yarış" ? "bg-red-500/15 text-red-400" : "bg-[#3b82f6]/15 text-[#3b82f6]"
          }`}
        >
          {e.featured ? "Öne çıkan · " : ""}
          {kind}
        </span>
        <span className="absolute top-2.5 right-2.5 text-[11px] font-semibold bg-[#0f1d32] border border-[#162544] px-2.5 py-0.5 rounded-lg text-gray-200">
          {countdown(e.date, e.time)}
        </span>
      </div>

      <div className="p-3.5">
        <p className="text-[15px] font-semibold tracking-[-0.01em] text-white">{e.title}</p>
        {e.description && (
          <p className="text-[12.5px] text-[#7a8da4] mt-0.5 line-clamp-2">{e.description}</p>
        )}

        <div className="flex flex-col gap-1 text-[12.5px] text-[#7a8da4] mt-2.5">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#3b82f6]" />
            {new Date(e.date).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {e.time ? ` · ${e.time}` : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#3b82f6]" />
            {e.locationUrl ? (
              <a
                href={e.locationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3b82f6] underline underline-offset-2"
              >
                {e.location || "Konum"}
              </a>
            ) : (
              e.location || "Konum belirtilmedi"
            )}
          </span>
        </div>

        {/* Katilimci cubugu */}
        <div className="h-1.5 rounded-full bg-[#0a1628] mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              full ? "bg-red-500" : "bg-[#3b82f6]"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11.5px] mt-1.5">
          <span className="text-[#7a8da4]">
            <span className="text-white font-medium">{current}</span>
            {max > 0 ? ` / ${max}` : ""} katılımcı
          </span>
          {max > 0 && (
            <span className={full ? "text-red-400" : "text-[#5b6b80]"}>{pct}%</span>
          )}
        </div>

        {/* Katilim */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => (joined ? onLeave(e.id) : onJoin(e.id))}
            disabled={pending || (full && !joined)}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[11.5px] font-medium transition-colors disabled:opacity-50 ${
              joined
                ? "border-[#22c55e] bg-[#22c55e]/15 text-[#4ade80]"
                : "border-[#162544] text-[#8b9bb0] hover:border-[#22c55e]/50 hover:text-[#4ade80]"
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {joined ? "Katılıyorum" : full ? "Dolu" : "Katılıyorum"}
          </button>

          <button
            onClick={() => (joined ? onLeave(e.id) : undefined)}
            disabled={pending || !joined}
            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[11.5px] font-medium transition-colors disabled:opacity-40 ${
              joined
                ? "border-[#162544] text-[#8b9bb0] hover:border-[#ef4444]/50 hover:text-[#f87171]"
                : "border-[#162544] text-[#8b9bb0]"
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Katılmıyorum
          </button>
        </div>
      </div>
    </article>
  );
}

function DayModal({
  label,
  events,
  meetings,
  onClose,
  onOpenUser,
  onDeleteMeeting,
  onRespond,
  onJoinEvent,
  onLeaveEvent,
  canDeleteMeeting,
}: {
  label: string;
  events: {
    id: string;
    title: string;
    description?: string;
    time?: string;
    date: string;
    location?: string;
    locationUrl?: string | null;
    imageUrl?: string | null;
    kind?: string;
    isJoined?: boolean;
  }[];
  meetings: Meeting[];
  onClose: () => void;
  onOpenUser: (u: { id: string; firstName: string; lastName: string; avatar: string | null; carBrand: string | null; carModel: string | null }) => void;
  onDeleteMeeting: (id: string) => void;
  onRespond: (id: string, status: "going" | "not_going") => void;
  onJoinEvent: (id: string) => void;
  onLeaveEvent: (id: string) => void;
  canDeleteMeeting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#0f1d32] border border-[#162544] rounded-2xl premium-shadow w-full max-w-[400px] max-h-[85vh] overflow-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[16px] font-semibold tracking-[-0.01em] text-white">{label}</p>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[13px] border border-[#162544] rounded-lg px-3 py-1.5 text-gray-200 hover:bg-[#0a1628]/80"
          >
            <X className="w-3.5 h-3.5" />
            Kapat
          </button>
        </div>

        {events.length === 0 && meetings.length === 0 && (
          <p className="text-[13px] text-[#7a8da4]">Bu gün için kayıt yok.</p>
        )}

        {events.length > 0 && (
          <div className="space-y-3.5 mb-3">
            {events.map((e) => (
              <EventCard
                key={e.id}
                e={e}
                onJoin={onJoinEvent}
                onLeave={onLeaveEvent}
                pending={false}
              />
            ))}
          </div>
        )}

        {meetings.length > 0 && (
          <div className="space-y-2.5">
            {meetings.map((m) => (
              <MeetingCard
                key={m.id}
                m={m}
                onOpen={onOpenUser}
                onDelete={onDeleteMeeting}
                onRespond={onRespond}
                canDelete={canDeleteMeeting}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSheet({ user, onClose }: { user: RollUserCard; onClose: () => void }) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2);
  const losses = Math.max(0, user.rolls - user.wins);

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-[#0f1d32] border border-[#162544] rounded-2xl premium-shadow w-full max-w-[400px] max-h-[85vh] overflow-auto p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center font-semibold text-lg overflow-hidden shrink-0">
            {user.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl(user.photo)} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-semibold tracking-[-0.01em] text-white truncate">{user.name}</p>
            <p className="text-[13px] text-[#7a8da4]">Üyelik: {user.since}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex items-center gap-1 text-[13px] border border-[#162544] rounded-lg px-3 py-1.5 text-gray-200 hover:bg-[#0a1628]/80"
          >
            <X className="w-3.5 h-3.5" />
            Kapat
          </button>
        </div>

        <div className="h-[150px] rounded-xl bg-[#0a1628] flex items-center justify-center my-4 overflow-hidden">
          {user.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl(user.photo)} alt={user.car} className="w-full h-full object-cover" />
          ) : (
            <Car className="w-12 h-12 text-[#6b7d94]" />
          )}
        </div>

        <p className="text-base font-semibold text-white">{user.car}</p>
        {user.spec && <p className="text-[12px] text-[#7a8da4]">{user.spec}</p>}
        {user.bio && <p className="text-[13px] text-[#7a8da4] mt-2.5">{user.bio}</p>}

        <div className="grid grid-cols-3 gap-2 mt-3.5">
          {[
            { v: user.rolls, l: "Roll" },
            { v: user.wins, l: "Galibiyet" },
            { v: losses, l: "Mağlubiyet" },
          ].map((s) => (
            <div key={s.l} className="bg-[#0a1628]/90 border border-[#162544]/70 rounded-xl p-2.5 text-center">
              <b className="block text-lg text-white">{s.v}</b>
              <span className="text-[12px] text-[#7a8da4]">{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  compact = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-[#0f1d32]/70 border border-[#162544] rounded-2xl premium-shadow flex flex-col items-center justify-center text-center ${
        compact ? "p-6 gap-2" : "p-10 gap-3"
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#3b82f6]/60" />
      </div>
      <h3 className="text-[#8f9fb4] font-medium text-sm">{title}</h3>
      <p className="text-[#7a8da4] text-xs max-w-xs">{description}</p>
    </div>
  );
}

function NewMeetingSheet({
  onClose,
  onSubmit,
  pending,
}: {
  onClose: () => void;
  onSubmit: (d: {
    title: string;
    description: string;
    date: string;
    time: string;
    mapUrl: string;
  }) => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    if (title.trim().length < 2) return setErr("Buluşma adı girin");
    if (!date) return setErr("Tarih seçin");
    setErr(null);
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      date,
      time,
      mapUrl: mapUrl.trim(),
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 80,
      }}
      className="bg-black/70 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{ width: "100%", maxWidth: 430, maxHeight: "85vh" }}
        className="overflow-y-auto rounded-2xl border border-[#162544] bg-[#0c1729] shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#162544]">
          <p className="text-[15px] font-semibold text-white">Yeni Buluşma</p>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#8b9bb0]"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3 pb-8">
          <div className="space-y-1.5">
            <label className="text-[11.5px] text-[#9fb0c4]">Buluşma adı</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Cumartesi kahve & araç buluşması"
              className="w-full h-[44px] rounded-xl bg-[#0a1628] border border-[#162544] px-3 text-[13px] text-white placeholder:text-[#5b6b80] outline-none focus:border-[#f97316]/60"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[11.5px] text-[#9fb0c4]">Tarih</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-[44px] rounded-xl bg-[#0a1628] border border-[#162544] px-3 text-[13px] text-white outline-none focus:border-[#f97316]/60 [color-scheme:dark]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11.5px] text-[#9fb0c4]">Saat</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-[44px] rounded-xl bg-[#0a1628] border border-[#162544] px-3 text-[13px] text-white outline-none focus:border-[#f97316]/60 [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11.5px] text-[#9fb0c4]">Google Maps linki</label>
            <input
              value={mapUrl}
              onChange={(e) => setMapUrl(e.target.value)}
              placeholder="https://maps.google.com/..."
              className="w-full h-[44px] rounded-xl bg-[#0a1628] border border-[#162544] px-3 text-[13px] text-white placeholder:text-[#5b6b80] outline-none focus:border-[#f97316]/60"
            />
            <p className="text-[10px] text-[#5b6b80]">
              Mekanın fotoğrafı otomatik gösterilir
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11.5px] text-[#9fb0c4]">
              Açıklama <span className="text-[#5b6b80]">(opsiyonel)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Buluşma hakkında detaylar"
              className="w-full rounded-xl bg-[#0a1628] border border-[#162544] px-3 py-2.5 text-[13px] text-white placeholder:text-[#5b6b80] outline-none focus:border-[#f97316]/60 resize-none"
            />
          </div>

          {err && <p className="text-[11.5px] text-red-400">{err}</p>}

          <button
            onClick={submit}
            disabled={pending}
            className="w-full h-[46px] rounded-xl bg-[#f97316] text-[13.5px] font-semibold text-black hover:bg-[#fb923c] transition-colors disabled:opacity-60"
          >
            {pending ? "Oluşturuluyor..." : "Buluşma Oluştur"}
          </button>
          <p className="text-center text-[10px] text-[#5b6b80]">
            Tüm üyelere bildirim gönderilecek
          </p>
        </div>
      </div>
    </div>
  );
}
