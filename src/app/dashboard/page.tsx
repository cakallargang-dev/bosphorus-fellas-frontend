"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, eventsApi, rollApi, type RollRequest, type RollUserCard } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { SponsorCard } from "@/components/SponsorCard";
import { SkeletonCard } from "@/components/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Car, Trophy, Sparkles, Star, ShoppingBag, Calendar, Plus, X, MapPin } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
const DAY = 86400000;


export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
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

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.getData(),
    staleTime: 30_000,
  });

  const { data: rollData } = useQuery({
    queryKey: ["roll-requests"],
    queryFn: () => rollApi.list(),
    staleTime: 15_000,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["roll-requests"] });
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

  const createRoll = useMutation({
    mutationFn: (data: { title: string; date: string; place: string; mapUrl: string }) =>
      rollApi.create(data),
    onSuccess: () => {
      toast.success("Talep açıldı");
      setNewRoll(false);
      refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Talep açılamadı"),
  });

  const deleteRoll = useMutation({
    mutationFn: (id: string) => rollApi.remove(id),
    onSuccess: () => {
      toast.success("Talep silindi");
      refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Silinemedi"),
  });

  const joinRoll = useMutation({
    mutationFn: (id: string) => rollApi.join(id),
    onSuccess: () => {
      toast.success("Talebe katıldınız");
      refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Katılım başarısız"),
  });

  const leaveRoll = useMutation({
    mutationFn: (id: string) => rollApi.leave(id),
    onSuccess: () => {
      toast.success("Talepten ayrıldınız");
      refresh();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Ayrılma başarısız"),
  });

  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "";
  const events = dashboardData?.data.upcomingEvents ?? [];
  const products = dashboardData?.data.products ?? [];
  const sponsors = dashboardData?.data.sponsors ?? [];
  const rollRequests = (rollData?.data ?? []) as RollRequest[];


  return (
    <Layout>
      <div className="max-w-[430px] mx-auto px-4 pb-10">
        {/* Hoş geldin */}
        <div className="flex items-center gap-3 mt-2 mb-6 p-4 rounded-xl bg-gradient-to-br from-[#3b82f6]/10 via-transparent to-transparent border border-[#3b82f6]/10">
          <Avatar className="w-12 h-12 border-2 border-[#3b82f6]/30">
            <AvatarImage src={user?.avatar ? `${API_BASE}${user.avatar}` : undefined} alt={user?.firstName} />
            <AvatarFallback className="bg-[#3b82f6]/10 text-[#3b82f6] text-sm">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold text-white truncate">Hoş geldin, {user?.firstName}</h1>
              <Sparkles className="w-4 h-4 text-[#3b82f6] shrink-0" />
            </div>
            <p className="text-xs text-mancave-muted">Toplulukta neler oluyor, bir göz at.</p>
          </div>
        </div>

        {/* Yaklaşan etkinlikler */}
        <section className="mb-8">
          <h2 className="text-[15px] font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#3b82f6]" />
            Yaklaşan etkinlikler
          </h2>

          {isLoading ? (
            <SkeletonCard className="h-64" />
          ) : events.length === 0 ? (
            <EmptyState icon={Calendar} title="Etkinlik yok" description="Yaklaşan etkinlik bulunmuyor." />
          ) : (
            <div className="space-y-3.5">
              {events.map((e) => {
                const kind = e.kind || "Buluşma";
                const joined = (e as { isJoined?: boolean }).isJoined;
                const current = (e as { currentParticipants?: number }).currentParticipants ?? 0;
                const max = e.maxParticipants || 0;
                const pct = max ? Math.min(100, Math.round((current / max) * 100)) : 0;
                const left = max ? max - current : 0;
                const image = e.imageUrl ? `${API_BASE}${e.imageUrl}` : null;
                return (
                  <article
                    key={e.id}
                    className={`bg-gray-900/50 border rounded-xl overflow-hidden ${
                      e.featured ? "border-[#3b82f6]" : "border-gray-800"
                    }`}
                  >
                    <div
                      className="relative h-[110px] bg-gray-800 flex items-center justify-center bg-cover bg-center"
                      style={image ? { backgroundImage: `url('${image}')` } : undefined}
                    >
                      {!image &&
                        (kind === "Yarış" ? (
                          <Trophy className="w-11 h-11 text-gray-500" />
                        ) : (
                          <Car className="w-11 h-11 text-gray-500" />
                        ))}
                      <span
                        className={`absolute top-2.5 left-2.5 text-[12px] px-2.5 py-0.5 rounded-lg ${
                          kind === "Yarış"
                            ? "bg-red-500/15 text-red-400"
                            : kind === "Deneme"
                            ? "bg-amber-500/15 text-amber-400"
                            : "bg-[#3b82f6]/15 text-[#3b82f6]"
                        }`}
                      >
                        {e.featured ? "Öne çıkan · " : ""}
                        {kind}
                      </span>
                      <span className="absolute top-2.5 right-2.5 text-[12px] font-semibold bg-gray-900 border border-gray-800 px-2.5 py-0.5 rounded-lg text-gray-200">
                        {countdown(e.date, e.time)}
                      </span>
                    </div>

                    <div className="p-3.5">
                      <p className="text-[17px] font-semibold text-white">{e.title}</p>
                      {e.description && (
                        <p className="text-[13px] text-mancave-muted mt-0.5">{e.description}</p>
                      )}
                      <div className="flex flex-col gap-1 text-[13px] text-mancave-muted mt-2.5">
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

                      <div className="h-1.5 rounded bg-gray-800 mt-3 overflow-hidden">
                        <div className="h-full bg-[#3b82f6] transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-[13px] text-mancave-muted mt-1.5">
                        <span>
                          {current} / {max || "∞"} katılımcı
                        </span>
                        {max ? <span>{left}</span> : null}
                      </div>

                      <button
                        onClick={() => (joined ? leaveEvent.mutate(e.id) : joinEvent.mutate(e.id))}
                        disabled={joinEvent.isPending || leaveEvent.isPending}
                        className={`w-full mt-3 rounded-lg border py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                          joined
                            ? "border-red-500 text-red-400 hover:bg-red-500/10"
                            : "border-[#3b82f6] text-[#3b82f6] hover:bg-[#3b82f6]/10"
                        }`}
                      >
                        {joined ? "Ayrıl" : "Katıl"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Deneme talepleri */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-semibold text-white">Deneme talepleri</h2>
            <button
              onClick={() => setNewRoll(true)}
              disabled={createRoll.isPending}
              className="flex items-center gap-1 text-[13px] border border-gray-700 rounded-lg px-3 py-1.5 text-gray-200 hover:bg-gray-800/60 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Talep aç
            </button>
          </div>

          {rollRequests.length === 0 ? (
            <EmptyState
              icon={Car}
              title="Henüz talep yok"
              description="İlk roll talebini sen aç, rakip beklemeye başlasın."
            />
          ) : (
            <div className="space-y-3.5">
              {rollRequests.map((r) => {
                const matched = Boolean(r.opponent);
                return (
                  <article key={r.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-3.5">
                    <p className="text-[17px] font-semibold text-white">{r.title}</p>
                    <div className="flex gap-3.5 flex-wrap text-[13px] text-mancave-muted mt-1">
                      <span>{r.date}</span>
                      {r.mapUrl ? (
                        <a
                          href={r.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#3b82f6] underline underline-offset-2"
                        >
                          {r.place} · Haritada aç
                        </a>
                      ) : (
                        <span>{r.place}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_44px_minmax(0,1fr)] items-center gap-1.5 mt-3.5">
                      <CarBox user={r.creator} isMe={r.isMine} onOpen={setSheet} />
                      <div className="text-center text-xl font-bold text-red-500 tracking-wide">VS</div>
                      {r.opponent ? (
                        <CarBox user={r.opponent} isMe={r.isJoined} onOpen={setSheet} />
                      ) : (
                        <div className="rounded-[10px] border border-dashed border-gray-700 min-h-[150px] flex items-center justify-center p-2">
                          <p className="text-[12px] text-mancave-muted text-center">Rakip bekleniyor</p>
                        </div>
                      )}
                    </div>

                    {r.canDelete ? (
                      <button
                        onClick={() => deleteRoll.mutate(r.id)}
                        className="w-full mt-3 rounded-lg border border-gray-600 py-2 text-sm text-gray-200 hover:bg-gray-800/60"
                      >
                        {r.isMine ? "Talebi sil" : "Sil (admin)"}
                      </button>
                    ) : matched && r.isJoined ? (
                      <button
                        onClick={() => leaveRoll.mutate(r.id)}
                        className="w-full mt-3 rounded-lg border border-red-500 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        Ayrıl
                      </button>
                    ) : matched ? (
                      <p className="text-center text-[12px] text-mancave-muted mt-3">Eşleşme tamamlandı</p>
                    ) : (
                      <button
                        onClick={() => joinRoll.mutate(r.id)}
                        className="w-full mt-3 rounded-lg border border-[#3b82f6] py-2 text-sm text-[#3b82f6] hover:bg-[#3b82f6]/10"
                      >
                        Katıl
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Sponsorlar */}
        <section className="mb-8">
          <h2 className="text-[15px] font-semibold text-white mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-[#3b82f6]" />
            Sponsorlar
          </h2>
          {isLoading ? (
            <SkeletonCard className="h-20" />
          ) : sponsors.length === 0 ? (
            <EmptyState icon={Star} title="Henüz sponsor yok" description="Sponsorlarımız burada listelenecek." compact />
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
          <h2 className="text-[15px] font-semibold text-white mb-3 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#3b82f6]" />
            MANCAVE Market
          </h2>
          {isLoading ? (
            <SkeletonCard className="h-40" />
          ) : products.length === 0 ? (
            <EmptyState icon={ShoppingBag} title="Henüz ürün yok" description="Market ürünleri yakında burada." compact />
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

      {newRoll && (
        <NewRollSheet
          onClose={() => setNewRoll(false)}
          onSubmit={(d) => createRoll.mutate(d)}
          pending={createRoll.isPending}
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
      className="bg-gray-800/70 rounded-[10px] p-2 text-center min-h-[150px] flex flex-col justify-center cursor-pointer transition-colors hover:outline hover:outline-1 hover:outline-[#3b82f6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#3b82f6]"
    >
      <div className="h-16 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center mb-1.5 overflow-hidden">
        {user.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`${API_BASE}${user.photo}`} alt={user.car} className="w-full h-full object-cover" />
        ) : (
          <Car className="w-7 h-7 text-[#3b82f6]" />
        )}
      </div>
      <p className="text-[13px] font-semibold text-white truncate">{user.car}</p>
      {user.spec && <p className="text-[12px] text-mancave-muted truncate">{user.spec}</p>}
      <p className="text-[12px] text-[#3b82f6] truncate">
        {user.name}
        {isMe ? " (sen)" : ""} · Profil
      </p>
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
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-[400px] max-h-[85vh] overflow-auto p-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] flex items-center justify-center font-semibold text-lg overflow-hidden shrink-0">
            {user.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${API_BASE}${user.photo}`} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[17px] font-semibold text-white truncate">{user.name}</p>
            <p className="text-[13px] text-mancave-muted">Üyelik: {user.since}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex items-center gap-1 text-[13px] border border-gray-700 rounded-lg px-3 py-1.5 text-gray-200 hover:bg-gray-800/60"
          >
            <X className="w-3.5 h-3.5" />
            Kapat
          </button>
        </div>

        <div className="h-[150px] rounded-xl bg-gray-800 flex items-center justify-center my-4 overflow-hidden">
          {user.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${API_BASE}${user.photo}`} alt={user.car} className="w-full h-full object-cover" />
          ) : (
            <Car className="w-12 h-12 text-gray-500" />
          )}
        </div>

        <p className="text-base font-semibold text-white">{user.car}</p>
        {user.spec && <p className="text-[12px] text-mancave-muted">{user.spec}</p>}
        {user.bio && <p className="text-[13px] text-mancave-muted mt-2.5">{user.bio}</p>}

        <div className="grid grid-cols-3 gap-2 mt-3.5">
          {[
            { v: user.rolls, l: "Roll" },
            { v: user.wins, l: "Galibiyet" },
            { v: losses, l: "Mağlubiyet" },
          ].map((s) => (
            <div key={s.l} className="bg-gray-800/70 rounded-[10px] p-2.5 text-center">
              <b className="block text-lg text-white">{s.v}</b>
              <span className="text-[12px] text-mancave-muted">{s.l}</span>
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
      className={`bg-gray-900/50 border border-gray-800 rounded-xl flex flex-col items-center justify-center text-center ${
        compact ? "p-6 gap-2" : "p-10 gap-3"
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#3b82f6]/60" />
      </div>
      <h3 className="text-gray-400 font-medium text-sm">{title}</h3>
      <p className="text-mancave-muted text-xs max-w-xs">{description}</p>
    </div>
  );
}

function NewRollSheet({
  onClose,
  onSubmit,
  pending,
}: {
  onClose: () => void;
  onSubmit: (d: { title: string; date: string; place: string; mapUrl: string }) => void;
  pending: boolean;
}) {
  const OPTIONS = ["50-150 dostluk denemesi", "100-200 dostluk denemesi"];
  const [title, setTitle] = useState(OPTIONS[0]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [mapUrl, setMapUrl] = useState("");

  const submit = () => {
    if (!date) {
      toast.error("Tarih seçin");
      return;
    }
    const label = `${new Date(`${date}T00:00:00`).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}${time ? ` · ${time}` : ""}`;
    onSubmit({ title, date: label, place: place.trim(), mapUrl: mapUrl.trim() });
  };

  const inputCls =
    "block w-full min-w-0 max-w-full appearance-none rounded-lg bg-gray-800/70 border border-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#3b82f6] [color-scheme:dark]";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-[400px] p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[17px] font-semibold text-white">Talep aç</p>
          <button
            onClick={onClose}
            className="text-[13px] border border-gray-700 rounded-lg px-3 py-1.5 text-gray-200 hover:bg-gray-800/60"
          >
            Kapat
          </button>
        </div>

        <label className="block text-[13px] text-mancave-muted mb-1">Deneme türü</label>
        <select
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`${inputCls} mb-3`}
        >
          {OPTIONS.map((o) => (
            <option key={o} value={o} className="bg-gray-900">
              {o}
            </option>
          ))}
        </select>

        <div className="mb-3">
          <label className="block text-[13px] text-mancave-muted mb-1">Tarih</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="mb-3">
          <label className="block text-[13px] text-mancave-muted mb-1">Saat</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputCls}
          />
        </div>

        <label className="block text-[13px] text-mancave-muted mb-1">Konum</label>
        <input
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          placeholder="Anadolu yakası"
          className={`${inputCls} mb-3`}
        />

        <label className="block text-[13px] text-mancave-muted mb-1">Google Maps linki</label>
        <input
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
          placeholder="https://maps.app.goo.gl/..."
          className={`${inputCls} mb-4`}
        />

        <button
          onClick={submit}
          disabled={pending}
          className="w-full rounded-lg border border-[#3b82f6] py-2.5 text-sm font-medium text-[#3b82f6] hover:bg-[#3b82f6]/10 disabled:opacity-50"
        >
          {pending ? "Kaydediliyor..." : "Talebi oluştur"}
        </button>
      </div>
    </div>
  );
}
