"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { teamApi, type TeamMember } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { SkeletonCard } from "@/components/LoadingSpinner";
import { Search, Trophy, Flag, X, Gauge, CalendarDays } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

/* ---------- Marka rozetleri ---------- */
const BRANDS: { key: string; label: string; accent: string; mono: string }[] = [
  { key: "bmw", label: "BMW", accent: "#0066B1", mono: "BMW" },
  { key: "mercedes", label: "Mercedes", accent: "#9BA3AA", mono: "M" },
  { key: "audi", label: "Audi", accent: "#BB0A30", mono: "A" },
  { key: "porsche", label: "Porsche", accent: "#B12B28", mono: "P" },
  { key: "volkswagen", label: "Volkswagen", accent: "#3D6EB4", mono: "VW" },
  { key: "vw", label: "Volkswagen", accent: "#3D6EB4", mono: "VW" },
  { key: "ford", label: "Ford", accent: "#4A90D9", mono: "F" },
  { key: "renault", label: "Renault", accent: "#EFDF00", mono: "R" },
  { key: "fiat", label: "Fiat", accent: "#96152C", mono: "FIAT" },
  { key: "toyota", label: "Toyota", accent: "#EB0A1E", mono: "T" },
  { key: "honda", label: "Honda", accent: "#E40521", mono: "H" },
  { key: "hyundai", label: "Hyundai", accent: "#4A7EB8", mono: "H" },
  { key: "opel", label: "Opel", accent: "#C9C93A", mono: "O" },
  { key: "seat", label: "Seat", accent: "#E30613", mono: "S" },
  { key: "skoda", label: "Skoda", accent: "#4BA82E", mono: "S" },
  { key: "volvo", label: "Volvo", accent: "#8E9AA6", mono: "V" },
  { key: "mini", label: "MINI", accent: "#C9D4E2", mono: "MINI" },
  { key: "tesla", label: "Tesla", accent: "#E82127", mono: "T" },
  { key: "alfa", label: "Alfa Romeo", accent: "#3E6FA8", mono: "AR" },
  { key: "peugeot", label: "Peugeot", accent: "#3E7AB8", mono: "P" },
  { key: "citroen", label: "Citroën", accent: "#C0564B", mono: "C" },
  { key: "kia", label: "Kia", accent: "#BB162B", mono: "K" },
  { key: "nissan", label: "Nissan", accent: "#C3002F", mono: "N" },
  { key: "mazda", label: "Mazda", accent: "#910A2D", mono: "M" },
  { key: "chevrolet", label: "Chevrolet", accent: "#D1A83B", mono: "C" },
  { key: "dacia", label: "Dacia", accent: "#646B72", mono: "D" },
  { key: "jaguar", label: "Jaguar", accent: "#3E7A5E", mono: "J" },
  { key: "land", label: "Land Rover", accent: "#4A7A5E", mono: "LR" },
  { key: "lexus", label: "Lexus", accent: "#8E9AA6", mono: "L" },
  { key: "mitsubishi", label: "Mitsubishi", accent: "#C1272D", mono: "M" },
  { key: "suzuki", label: "Suzuki", accent: "#2A5FA8", mono: "S" },
  { key: "subaru", label: "Subaru", accent: "#3D6EB4", mono: "S" },
  { key: "cupra", label: "Cupra", accent: "#C96F3A", mono: "C" },
  { key: "lancia", label: "Lancia", accent: "#3E5A8E", mono: "L" },
  { key: "dodge", label: "Dodge", accent: "#C1272D", mono: "D" },
  { key: "jeep", label: "Jeep", accent: "#4A7A3E", mono: "J" },
  { key: "byd", label: "BYD", accent: "#C1272D", mono: "BYD" },
  { key: "mg", label: "MG", accent: "#C1272D", mono: "MG" },
];

function brandOf(car: string) {
  const c = (car || "").toLowerCase();
  return BRANDS.find((b) => c.includes(b.key)) || null;
}

function BrandBadge({ car, size = 34 }: { car: string; size?: number }) {
  const b = brandOf(car);
  if (!b) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-md bg-[#162544]/60 border border-[#23365c] flex items-center justify-center shrink-0"
      >
        <Gauge className="w-3.5 h-3.5 text-[#6b7d94]" />
      </div>
    );
  }
  return (
    <div
      style={{ width: size, height: size, borderColor: `${b.accent}66`, background: `${b.accent}1a` }}
      className="rounded-md border flex items-center justify-center shrink-0"
      title={b.label}
    >
      <span
        style={{ color: b.accent, fontSize: size * 0.34 }}
        className="font-bold tracking-tighter leading-none"
      >
        {b.mono}
      </span>
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
      const b = brandOf(m.car);
      if (b) map.set(b.label, (map.get(b.label) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [all]);

  const members = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return all.filter((m) => {
      if (brand && brandOf(m.car)?.label !== brand) return false;
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
          <div className="space-y-2.5">
            {members.map((m, i) => {
              const b = brandOf(m.car);
              return (
                <article
                  key={m.id}
                  onClick={() => setOpen(m)}
                  style={{ animationDelay: `${Math.min(i * 45, 450)}ms` }}
                  className="group relative bg-[#0f1d32]/70 border border-[#162544] rounded-2xl overflow-hidden card-hover press-scale cursor-pointer animate-fade-in"
                >
                  <span
                    style={{ background: b ? b.accent : "#3b82f6" }}
                    className="absolute left-0 top-0 bottom-0 w-[2.5px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
                  />

                  <div className="flex items-center gap-3 p-3 pl-4">
                    <div className="relative w-[58px] h-[58px] shrink-0 rounded-xl overflow-hidden bg-[#0a1628] border border-[#162544]/80">
                      {m.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${API_BASE}${m.photo}`}
                          alt={m.car}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-[#3b82f6]/60 tracking-wide">
                          {m.initials}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[14px] font-semibold tracking-[-0.01em] text-white truncate">
                          {m.name}
                        </p>
                        <BrandBadge car={m.car} size={19} />
                      </div>
                      <p className="text-[12.5px] text-[#b9c6d8] truncate mt-0.5">{m.car}</p>
                      {m.spec && (
                        <p className="text-[11px] text-[#6b7d94] truncate font-mono tracking-tight">
                          {m.spec}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[10.5px] text-[#4d5c70]">
                        <span className="flex items-center gap-1">
                          <Flag className="w-2.5 h-2.5" />
                          {m.rolls}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="w-2.5 h-2.5" />
                          {m.wins}
                        </span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-2.5 h-2.5" />
                          {m.since}
                        </span>
                      </div>
                    </div>

                    {m.phone && (
                      <a
                        href={waLink(m.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label="WhatsApp ile yaz"
                        className="w-9 h-9 rounded-full bg-[#25D366]/10 border border-[#25D366]/25 flex items-center justify-center text-[#25D366] hover:bg-[#25D366] hover:text-[#030711] transition-all duration-300 shrink-0"
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
  const b = brandOf(m.car);
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
            <img src={`${API_BASE}${m.photo}`} alt={m.car} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[52px] font-semibold text-[#3b82f6]/50 tracking-tight">{m.initials}</span>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1d32] via-transparent to-transparent" />
          {b && (
            <span
              style={{
                borderColor: `${b.accent}66`,
                background: `${b.accent}22`,
                color: b.accent,
              }}
              className="absolute top-3 left-3 px-2.5 py-1 rounded-md border text-[10.5px] font-bold tracking-wider uppercase backdrop-blur"
            >
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

          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { v: m.rolls, l: "Roll", Icon: Flag },
              { v: m.wins, l: "Galibiyet", Icon: Trophy },
              { v: Math.max(0, m.rolls - m.wins), l: "Mağlubiyet", Icon: Gauge },
            ].map((s) => (
              <div key={s.l} className="bg-[#0a1628]/90 border border-[#162544]/70 rounded-xl p-2.5 text-center">
                <s.Icon className="w-3 h-3 mx-auto text-[#3b82f6]/60 mb-1" />
                <b className="block text-[16px] text-white tabular-nums">{s.v}</b>
                <span className="text-[10.5px] text-[#6b7d94]">{s.l}</span>
              </div>
            ))}
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
