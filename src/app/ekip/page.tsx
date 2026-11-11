"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { teamApi, type TeamMember, imgUrl } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { SkeletonCard } from "@/components/LoadingSpinner";
import { Search, X, Gauge, CalendarDays, CalendarCheck } from "lucide-react";
import { findBrand, brandLogo } from "@/lib/brands";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

/* ---------- Marka logolari (gercek SVG) ---------- */

function BrandBadge({ car, size = 34 }: { car: string; size?: number }) {
  const brand = findBrand(car);

  if (!brand) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-lg bg-[#162544]/60 border border-[#23365c] flex items-center justify-center shrink-0"
      >
        <Gauge className="w-3.5 h-3.5 text-[#6b7d94]" />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg bg-white/[0.07] border border-white/10 flex items-center justify-center shrink-0 p-[7px]"
      title={brand.label}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brandLogo(brand.slug)}
        alt={brand.label}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
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

const WaIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`}>
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.19 5.06 4.35.71.3 1.26.48 1.69.62.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.86 9.86 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.13h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.21 8.21 0 01-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.22-8.24 8.22z" />
  </svg>
);

const TelIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`}>
    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.4 21 3 13.6 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
  </svg>
);

export default function TeamPage() {
  return (
    <AuthGuard>
      <TeamContent />
    </AuthGuard>
  );
}

function TeamContent() {
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState<string | null>(null);
  const [open, setOpen] = useState<TeamMember | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["team-directory"],
    queryFn: () => teamApi.list(),
    staleTime: 60_000,
  });

  const all = data?.data ?? [];

  const brands = useMemo(() => {
    const map = new Map<string, number>();
    all.forEach((m) => {
      const b = findBrand(m.car);
      if (b) map.set(b.label, (map.get(b.label) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [all]);

  const members = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((m) => {
      if (brand && findBrand(m.car)?.label !== brand) return false;
      if (!needle) return true;
      return (
        m.name.toLowerCase().includes(needle) ||
        m.car.toLowerCase().includes(needle) ||
        m.spec.toLowerCase().includes(needle)
      );
    });
  }, [all, q, brand]);

  return (
    <Layout>
      <div className="max-w-[430px] mx-auto px-4 pt-4 pb-28 animate-fade-in">
        <div className="relative mb-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand-wordmark.webp"
            alt="Bosphorus Fellas"
            className="h-[26px] w-auto object-contain mb-4 opacity-90"
          />
          <p className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-[#3b82f6]/80">
            Topluluk
          </p>
          <div className="flex items-end justify-between mt-1.5">
            <h1 className="text-[30px] leading-[1.05] font-semibold tracking-[-0.035em] text-white">
              Ekip
            </h1>
            <p className="text-[11px] text-[#5b6b80] pb-1.5 tabular-nums">{all.length} üye</p>
          </div>
          <div className="mt-3 h-[1px] bg-gradient-to-r from-[#3b82f6]/40 via-[#162544] to-transparent" />
        </div>

        <div className="relative mb-3.5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#5b6b80]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İsim, araç veya teknik özellik"
            className="w-full rounded-xl bg-[#0a1628]/80 border border-[#162544] pl-10 pr-3 py-2.5 text-[13px] text-white placeholder:text-[#4d5c70] focus:outline-none focus:border-[#3b82f6]/40 focus:bg-[#0a1628] transition-all duration-300"
          />
        </div>

        {brands.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-4 -mx-4 px-4">
            <button
              onClick={() => setBrand(null)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-medium border transition-all duration-300 ${
                !brand
                  ? "bg-[#3b82f6]/15 border-[#3b82f6]/40 text-[#60a5fa]"
                  : "bg-[#0a1628]/60 border-[#162544] text-[#6b7d94] hover:text-[#b9c6d8]"
              }`}
            >
              Tümü
            </button>
            {brands.map(([label, count]) => (
              <button
                key={label}
                onClick={() => setBrand(brand === label ? null : label)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium border transition-all duration-300 ${
                  brand === label
                    ? "bg-[#3b82f6]/15 border-[#3b82f6]/40 text-[#60a5fa]"
                    : "bg-[#0a1628]/60 border-[#162544] text-[#6b7d94] hover:text-[#b9c6d8]"
                }`}
              >
                {label}
                <span className="text-[10px] opacity-50 tabular-nums">{count}</span>
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
          </div>
        ) : members.length === 0 ? (
          <div className="bg-[#0f1d32]/70 border border-[#162544] rounded-2xl premium-shadow p-10 text-center">
            <p className="text-[13px] text-[#7a8da4]">Eşleşen üye yok.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m, i) => {
              const b = findBrand(m.car);
              return (
                <article
                  key={m.id}
                  onClick={() => setOpen(m)}
                  style={{ animationDelay: `${Math.min(i * 45, 450)}ms` }}
                  className="group relative rounded-2xl overflow-hidden border border-[#162544] bg-[#0f1d32] card-hover press-scale cursor-pointer animate-fade-in"
                >
                  {/* Araç fotoğrafı — kart zemini */}
                  <div className="absolute inset-0 bg-[#0a1628]">
                    {m.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl(m.photo)}
                        alt={m.car}
                        className="w-full h-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.06]"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: `radial-gradient(ellipse at 70% 20%, ${
                            "#3b82f6"
                          }22 0%, transparent 65%)`,
                        }}
                      >
                        <span className="text-[34px] font-semibold text-white/[0.07] tracking-[0.15em]">
                          {m.initials}
                        </span>
                      </div>
                    )}
                    {/* Okunabilirlik katmanı */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#050b16] via-[#050b16]/92 via-45% to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050b16]/85 via-transparent to-transparent" />
                  </div>

                  {/* Marka rengi şerit */}
                  <span
                    style={{ background: "#3b82f6" }}
                    className="absolute left-0 top-0 bottom-0 w-[2.5px] opacity-70 group-hover:opacity-100 transition-opacity duration-300 z-20"
                  />

                  {/* İçerik */}
                  <div className="relative z-10 flex items-center gap-3 px-4 py-4 min-h-[118px]">
                    {/* Sol: logo */}
                    <div className="shrink-0">
                      <BrandBadge car={m.car} size={44} />
                    </div>

                    {/* Orta: metin */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="text-[15px] font-semibold tracking-[-0.015em] text-white truncate drop-shadow">
                          {m.name}
                        </p>
                        <span className="text-[9.5px] text-white/35 uppercase tracking-[0.14em] shrink-0">
                          üye
                        </span>
                      </div>

                      <p className="text-[13.5px] font-medium text-white/90 truncate mt-0.5 drop-shadow">
                        {m.car}
                      </p>
                      {m.spec && (
                        <p className="text-[10.5px] text-white/45 truncate font-mono tracking-tight mt-0.5">
                          {m.spec}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-[10.5px] text-white/45">
                        <span className="flex items-center gap-1">
                          <CalendarCheck className="w-2.5 h-2.5" />
                          {m.events}
                        </span>
                        <span className="flex items-center gap-1 text-[#60a5fa]/90">
                          <Gauge className="w-2.5 h-2.5" />
                          {m.score}/10
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-2.5 h-2.5" />
                          {m.since}
                        </span>
                      </div>
                    </div>

                    {/* Sağ: WhatsApp */}
                    {m.phone && (
                      <a
                        href={waLink(m.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="WhatsApp ile yaz"
                        className="w-9 h-9 rounded-full bg-[#25D366]/12 border border-[#25D366]/30 backdrop-blur-sm flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-[#030711] transition-all duration-300 shrink-0"
                      >
                        <WaIcon className="w-[15px] h-[15px]" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {open && <TeamSheet member={open} onClose={() => setOpen(null)} />}
    </Layout>
  );
}

function TeamSheet({ member: m, onClose }: { member: TeamMember; onClose: () => void }) {
  const b = findBrand(m.car);
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="bg-[#0f1d32] border border-[#162544] rounded-2xl w-full max-w-[400px] max-h-[88vh] overflow-auto premium-shadow">
        <div className="relative h-[210px] bg-[#0a1628] flex items-center justify-center overflow-hidden">
          {m.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl(m.photo)} alt={m.car} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[52px] font-semibold text-[#3b82f6]/50 tracking-tight">{m.initials}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1d32] via-transparent to-transparent" />
          {b && (
            <span className="absolute top-3 left-3 flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-md border border-white/15 bg-black/40 text-[10.5px] font-bold tracking-wider uppercase text-white/85 backdrop-blur">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandLogo(b.slug)}
                alt=""
                className="w-4 h-4 object-contain"
                loading="lazy"
              />
              {b.label}
            </span>
          )}
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 -mt-6 relative">
          <p className="text-[20px] font-semibold tracking-[-0.02em] text-white">{m.name}</p>
          <p className="text-[13px] text-[#b9c6d8] mt-0.5">{m.car}</p>
          {m.spec && <p className="text-[11.5px] text-[#6b7d94] font-mono mt-0.5">{m.spec}</p>}
          {m.bio && <p className="text-[12.5px] text-[#7a8da4] mt-3 leading-relaxed">{m.bio}</p>}

          <div className="mt-4 bg-[#0a1628]/90 border border-[#162544]/70 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3b82f6]/12 border border-[#3b82f6]/20 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4 text-[#3b82f6]" />
            </div>
            <div className="min-w-0">
              <b className="block text-[17px] text-white tabular-nums leading-tight">{m.events}</b>
              <span className="text-[10.5px] text-[#6b7d94]">Katıldığı etkinlik</span>
            </div>
          </div>

          {/* Aktiflik */}
          <div className="mt-2.5 bg-[#0a1628]/90 border border-[#162544]/70 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-[#6b7d94] flex items-center gap-1.5">
                <Gauge className="w-3 h-3 text-[#3b82f6]/70" />
                Katılım puanı
              </span>
              <span className="text-[13px] font-semibold text-white tabular-nums">
                {m.score}
                <span className="text-[#5b6b80] font-normal">/10</span>
              </span>
            </div>
            <div className="flex gap-[3px]">
              {Array.from({ length: 10 }).map((_, i) => (
                <span
                  key={i}
                  className={`flex-1 h-[5px] rounded-full transition-colors duration-300 ${
                    i < m.score ? "bg-[#3b82f6]" : "bg-[#162544]"
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#4d5c70] mt-3 flex items-center gap-1.5">
            <CalendarDays className="w-3 h-3" />
            Üyelik: {m.since}
          </p>

          {m.phone ? (
            <div className="grid grid-cols-2 gap-2 mt-4">
              <a
                href={waLink(m.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-[#25D366] py-2.5 text-[13px] font-semibold text-[#030711] hover:bg-[#20c05c] transition-colors press-scale"
              >
                <WaIcon className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                href={telLink(m.phone)}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 py-2.5 text-[13px] font-semibold text-[#60a5fa] hover:bg-[#3b82f6]/20 transition-colors press-scale"
              >
                <TelIcon className="w-3.5 h-3.5" />
                Ara
              </a>
            </div>
          ) : (
            <p className="text-[12px] text-[#4d5c70] mt-4 text-center">Telefon bilgisi yok</p>
          )}
        </div>
      </div>
    </div>
  );
}
