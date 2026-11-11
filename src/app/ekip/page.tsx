"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { teamApi, type TeamMember } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { SkeletonCard } from "@/components/LoadingSpinner";
import { Search, MapPin, Trophy, Flag, X } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export default function TeamPage() {
  return (
    <AuthGuard>
      <TeamContent />
    </AuthGuard>
  );
}

export function waLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("90")
    ? digits
    : digits.startsWith("0")
    ? `90${digits.slice(1)}`
    : digits.length === 10
    ? `90${digits}`
    : digits;
  return `https://wa.me/${intl}`;
}

export function telLink(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

function TeamContent() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<TeamMember | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["team-directory"],
    queryFn: () => teamApi.list(),
    staleTime: 60_000,
  });

  const members = useMemo(() => {
    const list = data?.data ?? [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        m.car.toLowerCase().includes(needle) ||
        m.spec.toLowerCase().includes(needle)
    );
  }, [data, q]);

  return (
    <Layout>
      <div className="max-w-[430px] mx-auto px-4 pt-4 pb-28">
        <div className="mb-5 animate-fade-in">
          <h1 className="text-[19px] font-semibold tracking-[-0.02em] text-white">Ekip</h1>
          <p className="text-[12px] text-[#7a8da4] mt-1">
            Topluluğun tamamı — araçları, bilgileri ve iletişim.
          </p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7d94]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İsim veya araç ara"
            className="w-full rounded-xl bg-[#0a1628] border border-[#162544] pl-9 pr-3 py-2.5 text-[13px] text-white placeholder:text-[#5b6b80] focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <SkeletonCard className="h-24" />
            <SkeletonCard className="h-24" />
            <SkeletonCard className="h-24" />
          </div>
        ) : members.length === 0 ? (
          <div className="bg-[#0f1d32]/70 border border-[#162544] rounded-2xl premium-shadow p-8 text-center">
            <p className="text-[13px] text-[#7a8da4]">Üye bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m, i) => (
              <article
                key={m.id}
                onClick={() => setOpen(m)}
                style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                className="bg-[#0f1d32]/70 border border-[#162544] rounded-2xl premium-shadow overflow-hidden card-hover press-scale cursor-pointer animate-fade-in"
              >
                <div className="flex items-stretch">
                  <div className="w-[104px] shrink-0 bg-[#0a1628] flex items-center justify-center overflow-hidden">
                    {m.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`${API_BASE}${m.photo}`} alt={m.car} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[22px] font-semibold text-[#3b82f6]/70 tracking-wide">
                        {m.initials}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 p-3">
                    <p className="text-[14px] font-semibold tracking-[-0.01em] text-white truncate">{m.name}</p>
                    <p className="text-[12.5px] text-[#b9c6d8] truncate mt-0.5">{m.car}</p>
                    {m.spec && <p className="text-[11.5px] text-[#7a8da4] truncate">{m.spec}</p>}
                    <p className="text-[11px] text-[#5b6b80] mt-1">Üyelik: {m.since}</p>
                  </div>

                  {m.phone && (
                    <div className="flex flex-col justify-center gap-1.5 pr-3">
                      <a
                        href={waLink(m.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="WhatsApp ile yaz"
                        className="w-9 h-9 rounded-full bg-[#25D366]/12 border border-[#25D366]/25 flex items-center justify-center hover:bg-[#25D366]/20 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#25D366]">
                          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.19 5.06 4.35.71.3 1.26.48 1.69.62.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.86 9.86 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.13h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.21 8.21 0 01-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.22-8.24 8.22z" />
                        </svg>
                      </a>
                      <a
                        href={telLink(m.phone)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Telefonla ara"
                        className="w-9 h-9 rounded-full bg-[#3b82f6]/12 border border-[#3b82f6]/25 flex items-center justify-center hover:bg-[#3b82f6]/20 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-[#3b82f6]">
                          <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.4 21 3 13.6 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {open && <TeamSheet member={open} onClose={() => setOpen(null)} />}
    </Layout>
  );
}

function TeamSheet({ member: m, onClose }: { member: TeamMember; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-[#0f1d32] border border-[#162544] rounded-2xl w-full max-w-[400px] max-h-[88vh] overflow-auto premium-shadow">
        <div className="relative h-[190px] bg-[#0a1628] flex items-center justify-center overflow-hidden">
          {m.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${API_BASE}${m.photo}`} alt={m.car} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[44px] font-semibold text-[#3b82f6]/60 tracking-wide">{m.initials}</span>
          )}
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-[17px] font-semibold tracking-[-0.01em] text-white">{m.name}</p>
          <p className="text-[13px] text-[#b9c6d8] mt-0.5">{m.car}</p>
          {m.spec && <p className="text-[12px] text-[#7a8da4]">{m.spec}</p>}
          {m.bio && <p className="text-[12.5px] text-[#7a8da4] mt-2.5 leading-relaxed">{m.bio}</p>}

          <div className="grid grid-cols-3 gap-2 mt-3.5">
            {[
              { v: m.rolls, l: "Roll", Icon: Flag },
              { v: m.wins, l: "Galibiyet", Icon: Trophy },
              { v: Math.max(0, m.rolls - m.wins), l: "Mağlubiyet", Icon: MapPin },
            ].map((s) => (
              <div key={s.l} className="bg-[#0a1628]/90 border border-[#162544]/70 rounded-xl p-2.5 text-center">
                <b className="block text-[17px] text-white">{s.v}</b>
                <span className="text-[11px] text-[#7a8da4]">{s.l}</span>
              </div>
            ))}
          </div>

          <p className="text-[11.5px] text-[#5b6b80] mt-3">Üyelik: {m.since}</p>

          {m.phone ? (
            <div className="grid grid-cols-2 gap-2 mt-3.5">
              <a
                href={waLink(m.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366]/12 border border-[#25D366]/30 py-2.5 text-[13px] font-medium text-[#25D366] hover:bg-[#25D366]/20 transition-colors press-scale"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.19 5.06 4.35.71.3 1.26.48 1.69.62.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.86 9.86 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2z" />
                </svg>
                WhatsApp
              </a>
              <a
                href={telLink(m.phone)}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#3b82f6]/12 border border-[#3b82f6]/30 py-2.5 text-[13px] font-medium text-[#3b82f6] hover:bg-[#3b82f6]/20 transition-colors press-scale"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.4 21 3 13.6 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
                </svg>
                Ara
              </a>
            </div>
          ) : (
            <p className="text-[12px] text-[#5b6b80] mt-3.5 text-center">Telefon bilgisi yok</p>
          )}
        </div>
      </div>
    </div>
  );
}
