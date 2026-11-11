"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { teamApi, type TeamMember } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { SkeletonCard } from "@/components/LoadingSpinner";
import { Search, X, Gauge, CalendarDays, CalendarCheck } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

/* ---------- Marka logolari (gercek SVG) ---------- */
type BrandDef = {
  key: string[];
  label: string;
  accent: string;
  svg: React.ReactNode;
};

const LogoBMW = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" strokeWidth="3" />
    <circle cx="24" cy="24" r="15.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M24 8.5 A15.5 15.5 0 0 1 39.5 24 L24 24 Z" fill="currentColor" opacity=".9" />
    <path d="M24 39.5 A15.5 15.5 0 0 1 8.5 24 L24 24 Z" fill="currentColor" opacity=".9" />
  </svg>
);

const LogoAudi = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    {[10, 19, 28, 37].map((cx, i) => (
      <circle key={i} cx={cx} cy="24" r="7" fill="none" stroke="currentColor" strokeWidth="2.2" />
    ))}
  </svg>
);

const LogoMercedes = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2.6" />
    <path d="M24 4 L24 24 M24 24 L37.5 39 M24 24 L10.5 39" stroke="currentColor" strokeWidth="2.6" fill="none" />
  </svg>
);

const LogoVW = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2.6" />
    <path d="M13 13 L19 33 L24 20 L29 33 L35 13" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

const LogoPorsche = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <path d="M24 4 L40 10 V26 C40 36 32 42 24 45 C16 42 8 36 8 26 V10 Z" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M24 10 V39 M11 22 H37" stroke="currentColor" strokeWidth="1.6" opacity=".8" />
  </svg>
);

const LogoTesla = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <path d="M24 6 C16 6 10 9 7 12 C10 13 13 14 15 16 C18 13 21 11 24 11 C27 11 30 13 33 16 C35 14 38 13 41 12 C38 9 32 6 24 6 Z" fill="currentColor" />
    <path d="M24 18 C20 18 17 20 15 22 L18 25 C19.5 23.5 21.5 22.5 24 22.5 C26.5 22.5 28.5 23.5 30 25 L33 22 C31 20 28 18 24 18 Z" fill="currentColor" />
    <path d="M20 30 L24 43 L28 30 C26.5 29 25.2 28.5 24 28.5 C22.8 28.5 21.5 29 20 30 Z" fill="currentColor" />
  </svg>
);

const LogoFord = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <ellipse cx="24" cy="24" rx="22" ry="13" fill="none" stroke="currentColor" strokeWidth="2.6" />
    <text x="24" y="28.5" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="700" fontStyle="italic" fontFamily="serif">Ford</text>
  </svg>
);

const LogoRenault = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <path d="M24 5 L34 18 L34 30 L24 43 L14 30 L14 18 Z" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M24 13 L29 22 L29 26 L24 35 L19 26 L19 22 Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const LogoFiat = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <ellipse cx="24" cy="24" rx="22" ry="15" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <text x="24" y="29" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" fontFamily="sans-serif" letterSpacing="1">FIAT</text>
  </svg>
);

const LogoToyota = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <ellipse cx="24" cy="24" rx="21" ry="14" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <ellipse cx="24" cy="24" rx="10" ry="7.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
    <ellipse cx="24" cy="21" rx="4.5" ry="11" fill="none" stroke="currentColor" strokeWidth="2.2" />
  </svg>
);

const LogoHonda = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <path d="M13 8 V40 M35 8 V40" stroke="currentColor" strokeWidth="3" fill="none" />
    <path d="M13 22 H35" stroke="currentColor" strokeWidth="3" fill="none" />
    <path d="M13 8 C13 8 24 13 35 8" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M13 40 C13 40 24 35 35 40" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const LogoHyundai = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <ellipse cx="24" cy="24" rx="21" ry="14" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M16 16 C20 22 20 26 16 32 M32 16 C28 22 28 26 32 32" stroke="currentColor" strokeWidth="2.6" fill="none" />
  </svg>
);

const LogoSeat = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <path d="M24 4 C24 4 12 12 9 20 C7 26 11 34 24 34 C37 34 41 26 39 20 C36 12 24 4 24 4 Z" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M24 34 V44 M17 34 L15 42 M31 34 L33 42" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const LogoSkoda = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M13 26 C17 20 22 17 27 18 C30 18.5 32 21 31 23.5 C30 26 26 26.5 23 25.5" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    <circle cx="31" cy="27" r="2.4" fill="currentColor" />
  </svg>
);

const LogoVolvo = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <circle cx="24" cy="26" r="15" fill="none" stroke="currentColor" strokeWidth="2.6" />
    <path d="M33 17 L42 8 M36 8 H42 V14" stroke="currentColor" strokeWidth="2.6" fill="none" />
    <text x="24" y="30" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="700" letterSpacing="1">VOLVO</text>
  </svg>
);

const LogoMini = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M14 20 H34 V22 H27 V26 H34 V28 H27 V32 H25 V28 H18" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinejoin="round" />
  </svg>
);

const LogoAlfa = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M24 6 V42 M6 24 H42" stroke="currentColor" strokeWidth="1.6" opacity=".7" />
    <path d="M13 16 C17 20 17 28 13 32 M35 16 C31 20 31 28 35 32" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const LogoPeugeot = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <path d="M14 8 H34 L31 20 L24 40 L17 20 Z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M18 16 H30" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const LogoCitroen = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <path d="M8 16 L15 26 L24 18 L33 26 L40 16" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    <path d="M8 30 L15 20 L24 28 L33 20 L40 30" stroke="currentColor" strokeWidth="2.8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

const LogoKia = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <ellipse cx="24" cy="24" rx="21" ry="13" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M14 30 V18 M14 24 L20 18 M20 24 L14 30" stroke="currentColor" strokeWidth="2.4" fill="none" />
    <path d="M24 30 V18 M24 18 L24 30" stroke="currentColor" strokeWidth="2.4" />
    <path d="M30 30 L34 18 L37 30" stroke="currentColor" strokeWidth="2.4" fill="none" />
  </svg>
);

const LogoNissan = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <rect x="10" y="19" width="28" height="10" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <text x="24" y="26.8" textAnchor="middle" fill="currentColor" fontSize="6.5" fontWeight="700" letterSpacing=".5">NISSAN</text>
  </svg>
);

const LogoMazda = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <ellipse cx="24" cy="24" rx="21" ry="15" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M11 27 C16 20 20 17 24 17 C28 17 32 20 37 27" stroke="currentColor" strokeWidth="2.4" fill="none" />
    <path d="M24 17 V31" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const LogoLexus = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <ellipse cx="24" cy="24" rx="21" ry="15" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M20 14 V30 H31" stroke="currentColor" strokeWidth="2.6" fill="none" strokeLinecap="round" />
  </svg>
);

const LogoJaguar = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <path d="M13 20 C18 16 24 16 30 19 C33 20.5 34 23 33 25" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <path d="M15 28 H33" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const LogoLandRover = (
  <svg viewBox="0 0 48 48" className="w-full h-full">
    <ellipse cx="24" cy="24" rx="21" ry="13" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <text x="24" y="22" textAnchor="middle" fill="currentColor" fontSize="5.5" fontWeight="700" letterSpacing=".3">LAND</text>
    <text x="24" y="29.5" textAnchor="middle" fill="currentColor" fontSize="5.5" fontWeight="700" letterSpacing=".3">ROVER</text>
  </svg>
);

const BRANDS: BrandDef[] = [
  { key: ["bmw"], label: "BMW", accent: "#4A9EE0", svg: LogoBMW },
  { key: ["audi"], label: "Audi", accent: "#E0344D", svg: LogoAudi },
  { key: ["mercedes", "benz"], label: "Mercedes", accent: "#C8D0D8", svg: LogoMercedes },
  { key: ["volkswagen", "vw"], label: "Volkswagen", accent: "#5B93DC", svg: LogoVW },
  { key: ["porsche"], label: "Porsche", accent: "#E04A46", svg: LogoPorsche },
  { key: ["tesla"], label: "Tesla", accent: "#F0444A", svg: LogoTesla },
  { key: ["ford"], label: "Ford", accent: "#6BA6E8", svg: LogoFord },
  { key: ["renault"], label: "Renault", accent: "#F0E03C", svg: LogoRenault },
  { key: ["fiat"], label: "Fiat", accent: "#D9485C", svg: LogoFiat },
  { key: ["toyota"], label: "Toyota", accent: "#F24A56", svg: LogoToyota },
  { key: ["honda"], label: "Honda", accent: "#F04450", svg: LogoHonda },
  { key: ["hyundai"], label: "Hyundai", accent: "#6BA0DC", svg: LogoHyundai },
  { key: ["seat"], label: "Seat", accent: "#F04450", svg: LogoSeat },
  { key: ["skoda"], label: "Skoda", accent: "#6BC44E", svg: LogoSkoda },
  { key: ["volvo"], label: "Volvo", accent: "#A8B4C0", svg: LogoVolvo },
  { key: ["mini"], label: "MINI", accent: "#D8E0EC", svg: LogoMini },
  { key: ["alfa"], label: "Alfa Romeo", accent: "#5B8FD0", svg: LogoAlfa },
  { key: ["peugeot"], label: "Peugeot", accent: "#5B90D0", svg: LogoPeugeot },
  { key: ["citroen", "citroën"], label: "Citroën", accent: "#DC6A5E", svg: LogoCitroen },
  { key: ["kia"], label: "Kia", accent: "#E0485C", svg: LogoKia },
  { key: ["nissan"], label: "Nissan", accent: "#E0485C", svg: LogoNissan },
  { key: ["mazda"], label: "Mazda", accent: "#C0485C", svg: LogoMazda },
  { key: ["lexus"], label: "Lexus", accent: "#A8B4C0", svg: LogoLexus },
  { key: ["jaguar"], label: "Jaguar", accent: "#5BA57E", svg: LogoJaguar },
  { key: ["land"], label: "Land Rover", accent: "#6BA57E", svg: LogoLandRover },
];

function brandOf(car: string) {
  const c = (car || "").toLowerCase();
  return BRANDS.find((b) => b.key.some((k) => c.includes(k))) || null;
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
      style={{
        width: size,
        height: size,
        borderColor: `${b.accent}55`,
        background: `${b.accent}14`,
        color: b.accent,
      }}
      className="rounded-md border flex items-center justify-center shrink-0 p-[5px]"
      title={b.label}
    >
      {b.svg}
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
                      <p className="text-[14px] font-semibold tracking-[-0.01em] text-white truncate">
                        {m.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <BrandBadge car={m.car} size={20} />
                        <p className="text-[12.5px] text-[#b9c6d8] truncate">{m.car}</p>
                      </div>
                      {m.spec && (
                        <p className="text-[11px] text-[#6b7d94] truncate font-mono tracking-tight">
                          {m.spec}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1.5 text-[10.5px] text-[#4d5c70]">
                        <span className="flex items-center gap-1">
                          <CalendarCheck className="w-2.5 h-2.5" />
                          {m.events} etkinlik
                        </span>
                        <span className="flex items-center gap-1 text-[#3b82f6]/70">
                          <Gauge className="w-2.5 h-2.5" />
                          {m.score}/10
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
              className="absolute top-3 left-3 flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-md border text-[10.5px] font-bold tracking-wider uppercase backdrop-blur"
            >
              <span className="w-4 h-4 block">{b.svg}</span>
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
