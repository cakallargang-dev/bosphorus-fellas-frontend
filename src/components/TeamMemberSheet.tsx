"use client";

import { useQuery } from "@tanstack/react-query";
import { carsApi, type TeamMember, imgUrl } from "@/lib/api";
import { findBrand, brandLogo } from "@/lib/brands";
import {
  X,
  Gauge,
  CalendarDays,
  CalendarCheck,
  MapPin,
  Hash,
  Wrench,
} from "lucide-react";

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

export const WaIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`}>
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.68-1.63-.93-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.09 3.19 5.06 4.35.71.3 1.26.48 1.69.62.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.86 9.86 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2zm0 18.13h-.01a8.2 8.2 0 01-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.21 8.21 0 01-1.26-4.36c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.13.86 5.82 2.41a8.18 8.18 0 012.41 5.83c0 4.54-3.7 8.22-8.24 8.22z" />
  </svg>
);

export const TelIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`}>
    <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1C10.4 21 3 13.6 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.24.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
  </svg>
);

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-2 py-2 text-center">
      <p className="text-[9.5px] text-[#6b7d94] uppercase tracking-wider">{label}</p>
      <p className="text-[12.5px] text-white font-medium mt-0.5 truncate">{value}</p>
    </div>
  );
}

/**
 * Üyenin garajı — birden fazla aracı varsa yatay kaydırmalı galeri.
 * Tek araç varsa gösterilmez (yukarıdaki ana araç kartı yeterli).
 */
function MemberGarage({ userId, fallbackPhoto }: { userId: string; fallbackPhoto: string | null }) {
  const { data, isLoading } = useQuery({
    queryKey: ["member-cars", userId],
    queryFn: () => carsApi.byMember(userId),
    staleTime: 60_000,
  });

  const cars = data?.data ?? [];

  // Tek araç veya yükleniyor → ekstra bölüm gösterme
  if (isLoading || cars.length <= 1) return null;

  return (
    <div className="mt-3.5">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#6b7d94]">
          Garaj
        </span>
        <span className="font-mono text-[10.5px] text-[#6b7d94]">{cars.length} araç</span>
      </div>
      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2.5 pb-1">
          {cars.map((c) => {
            const cover = c.coverPhoto || c.photos?.[0] || fallbackPhoto;
            return (
              <div
                key={c.id}
                className="relative w-[148px] shrink-0 overflow-hidden rounded-[14px] border border-[#162544] bg-[#0a1628]"
              >
                <div className="h-[86px] w-full bg-[#0a1628]">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgUrl(cover)} alt={c.model} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Gauge className="h-5 w-5 text-[#2a3a54]" />
                    </div>
                  )}
                </div>
                {c.isPrimary && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-[#3b82f6] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#030711]">
                    Ana
                  </span>
                )}
                <div className="px-2 py-1.5">
                  <p className="truncate text-[11.5px] font-semibold text-white">
                    {c.brand} {c.model}
                  </p>
                  <p className="truncate font-mono text-[9.5px] tracking-tight text-[#7a8da4]">
                    {[c.year, c.hp ? `${c.hp} HP` : null, c.plateNumber]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Ekip / üye profil modalı — araç fotoğrafı hero + taşan profil fotoğrafı +
 * isim/araç/ilçe/bio + 3'lü stat + plaka + istatistik satırları +
 * WhatsApp/Ara butonları. Ekip sayfası ve sohbette avatar tıklayınca ortak kullanılır.
 */
export function TeamMemberSheet({
  member: m,
  onClose,
}: {
  member: TeamMember;
  onClose: () => void;
}) {
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
      <div className="bg-[#0f1d32] border border-[#162544] rounded-[22px] w-full max-w-[400px] max-h-[88vh] overflow-auto premium-shadow">
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
            className="tap absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 -mt-6 relative">
          <div className="flex items-end gap-3">
            {/* Profil fotoğrafı — araç fotoğrafının üstüne taşar */}
            <div className="relative shrink-0">
              <div className="w-[62px] h-[62px] rounded-full overflow-hidden border-[3px] border-[#0f1d32] bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/10 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,.5)]">
                {m.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl(m.avatar)}
                    alt={m.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[19px] font-semibold text-[#3b82f6]">{m.initials}</span>
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1 pb-1">
              <p className="text-[20px] font-semibold tracking-[-0.02em] text-white truncate">{m.name}</p>
              <p className="text-[13px] text-[#b9c6d8] mt-0.5 truncate">{m.car}</p>
            </div>
          </div>

          {/* Ilce */}
          {(m.district || m.city) && (
            <p className="text-[11.5px] text-[#7a8da4] mt-1.5 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#3b82f6]/70" />
              {m.district || m.city}
            </p>
          )}

          {m.bio && <p className="text-[12.5px] text-[#7a8da4] mt-3 leading-relaxed">{m.bio}</p>}

          {/* Arac bilgileri */}
          {(m.carYear || m.carHp || m.plateNumber || m.carFeatures) && (
            <div className="mt-3.5 bg-[#0a1628]/90 border border-[#162544]/70 rounded-[16px] overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-[#162544]/70">
                <StatCell label="Model" value={m.carModel || "-"} />
                <StatCell label="Yıl" value={m.carYear ? String(m.carYear) : "-"} />
                <StatCell label="Güç" value={m.carHp ? `${m.carHp} HP` : "-"} />
              </div>
              {m.plateNumber && (
                <div className="border-t border-[#162544]/70 px-3 py-2 flex items-center justify-between">
                  <span className="text-[10.5px] text-[#6b7d94] flex items-center gap-1.5">
                    <Hash className="w-3 h-3 text-[#3b82f6]/70" />
                    Plaka
                  </span>
                  <span className="text-[12px] font-mono tracking-wider text-white bg-[#162544]/60 px-2 py-0.5 rounded">
                    {m.plateNumber}
                  </span>
                </div>
              )}
              {m.carFeatures && (
                <div className="border-t border-[#162544]/70 px-3 py-2.5">
                  <span className="text-[10.5px] text-[#6b7d94] flex items-center gap-1.5 mb-1">
                    <Wrench className="w-3 h-3 text-[#3b82f6]/70" />
                    Araç Özellikleri
                  </span>
                  <p className="text-[12px] text-[#b9c6d8] leading-relaxed whitespace-pre-wrap">
                    {m.carFeatures}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ===== GARAJ — tüm araçlar ===== */}
          <MemberGarage userId={m.id} fallbackPhoto={m.carPhoto} />

          <div className="mt-4 bg-[#0a1628]/90 border border-[#162544]/70 rounded-[16px] p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/12 border border-[#3b82f6]/20 flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4 text-[#3b82f6]" />
            </div>
            <div className="min-w-0">
              <b className="block text-[17px] text-white tabular-nums leading-tight">{m.events}</b>
              <span className="text-[10.5px] text-[#6b7d94]">Katıldığı etkinlik</span>
            </div>
          </div>

          {/* Aktiflik */}
          <div className="mt-2.5 bg-[#0a1628]/90 border border-[#162544]/70 rounded-[16px] p-3">
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
                    i < m.score ? "bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]" : "bg-[#162544]"
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
                className="tap flex items-center justify-center gap-1.5 rounded-[16px] bg-[#25D366] py-2.5 text-[13px] font-semibold text-[#030711] hover:bg-[#20c05c] transition-colors press-scale"
              >
                <WaIcon className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                href={telLink(m.phone)}
                className="tap flex items-center justify-center gap-1.5 rounded-[16px] border border-[#3b82f6]/30 bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/10 py-2.5 text-[13px] font-semibold text-[#60a5fa] hover:bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/20 transition-colors press-scale"
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
