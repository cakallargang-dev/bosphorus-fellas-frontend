"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { teamApi, carsApi, financeApi, type TeamMember, type FinanceSummary, type FinanceTransaction, type FinanceAidatStatus, imgUrl } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { SkeletonCard } from "@/components/LoadingSpinner";
import { Search, X, Gauge, CalendarDays, CalendarCheck, MapPin, Hash, Wrench, Check } from "lucide-react";
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
    refetchInterval: 30_000,
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
        m.car.toLowerCase().includes(needle)
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

        <KasaSection />

        <div className="relative mb-3.5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-[#5b6b80]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İsim, araç veya teknik özellik"
            className="w-full rounded-[16px] bg-[#0a1628]/80 border border-[#162544] pl-10 pr-3 py-2.5 text-[13px] text-white placeholder:text-[#4d5c70] focus:outline-none focus:border-[#3b82f6]/40 focus:bg-[#0a1628] transition-all duration-300"
          />
        </div>

        {brands.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 mb-4 -mx-4 px-4">
            <button
              onClick={() => setBrand(null)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11.5px] font-medium border transition-all duration-300 ${
                !brand
                  ? "bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/15 border-[#3b82f6]/40 text-[#60a5fa]"
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
                    ? "bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/15 border-[#3b82f6]/40 text-[#60a5fa]"
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
          <div className="bg-gradient-to-b from-[#0f1d32]/85 to-[#0a1628]/85 border border-[#162544] rounded-[22px] premium-shadow p-10 text-center">
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
                  className="group relative rounded-[22px] overflow-hidden border border-[#162544] bg-[#0f1d32] interactive-card cursor-pointer animate-fade-in"
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
                      {(m.carYear || m.carHp) && (
                        <p className="text-[10.5px] text-white/50 truncate font-mono tracking-tight mt-0.5">
                          {[m.carYear, m.carHp ? `${m.carHp} HP` : null]
                            .filter(Boolean)
                            .join(" · ")}
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

/* ===== KASA — aidat + harcama defteri (premium/editoryal vitrin) ===== */
function KasaSection() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["finance-summary"],
    queryFn: () => financeApi.getSummary(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const summary: FinanceSummary | undefined = data?.data;

  if (isLoading) {
    return <SkeletonCard className="h-40 mb-5" />;
  }

  if (!summary) {
    return null;
  }

  const fmt = (n: number) =>
    n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const balance = summary.balance;
  const totalMovement = summary.totalIncome + summary.totalExpense;
  const incomePct =
    totalMovement > 0 ? Math.round((summary.totalIncome / totalMovement) * 100) : 0;

  const expected = summary.memberCount * summary.monthlyAidat;
  const aidatPct =
    expected > 0
      ? Math.min(100, Math.round((summary.thisMonthIncome / expected) * 100))
      : 0;

  const isNegative = balance < 0;
  const balanceTone = isNegative ? "text-[#f87171]" : "text-[#d4e3ff]";

  const recent = summary.transactions.slice(0, 8);
  const hasMore = summary.totalCount > 8;

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-[#162544] bg-[#0f1d32]/70 premium-shadow">
      {/* 1 — Tam-kanama katman: mavi ışık + okunabilirlik + accent çizgi */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 88% -4%, #3b82f633 0%, transparent 55%)",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#050b16] via-[#050b16]/94 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-[#3b82f6]/80 via-[#3b82f6]/30 to-transparent" />

      <div className="relative">
        {/* 2 — Üst etiket + canlı durum şeridi */}
        <div className="flex items-center justify-between px-5 pt-5">
          <p className="text-[9.5px] font-medium uppercase tracking-[0.24em] text-[#3b82f6]/80">
            Ekip kasası
          </p>
          <span className="flex items-center gap-1.5 text-[9.5px] font-medium uppercase tracking-[0.18em] text-[#5b6b80]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#34d399] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#34d399]" />
            </span>
            Güncel
          </span>
        </div>

        {/* 3 — Bakiye bloğu */}
        <div className="flex items-end justify-between px-5 mt-4">
          <div>
            <p className="text-[10.5px] uppercase tracking-[0.14em] text-[#6b7d94]">
              Kalan bakiye
            </p>
            <p className="flex items-baseline gap-1.5 mt-1">
              <span
                className={`text-[46px] leading-[0.95] font-semibold tracking-tighter tabular-nums ${balanceTone}`}
              >
                {fmt(balance)}
              </span>
              <span className="text-[15px] font-medium text-[#7a8da4]">TL</span>
            </p>
          </div>
          {isNegative && (
            <span className="mb-1 rounded-md border border-[#f87171]/30 bg-[#f87171]/10 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#f87171]">
              Açık
            </span>
          )}
        </div>

        {/* 4 — Üçlü istatistik şeridi */}
        <div className="mt-5 grid grid-cols-3 divide-x divide-white/[0.07] border-t border-white/[0.07]">
          <div className="px-2 pt-4 pb-3">
            <p className="text-[9px] uppercase tracking-[0.16em] text-[#6b7d94]">
              Toplam giriş
            </p>
            <p className="mt-1 text-[15px] font-semibold text-[#34d399] tabular-nums">
              +{fmt(summary.totalIncome)}
            </p>
          </div>
          <div className="px-2 pt-4 pb-3">
            <p className="text-[9px] uppercase tracking-[0.16em] text-[#6b7d94]">
              Toplam çıkış
            </p>
            <p className="mt-1 text-[15px] font-semibold text-[#f87171] tabular-nums">
              −{fmt(summary.totalExpense)}
            </p>
          </div>
          <div className="px-2 pt-4 pb-3">
            <p className="text-[9px] uppercase tracking-[0.16em] text-[#6b7d94]">
              Bu ay aidat
            </p>
            <p className="mt-1 text-[15px] font-semibold text-white tabular-nums">
              {fmt(summary.thisMonthIncome)} TL
            </p>
          </div>
        </div>

        {/* 5 — Giriş/çıkış oran çubuğu */}
        {totalMovement > 0 && (
          <div className="px-5 pb-4">
            <div className="flex items-center justify-between mb-1.5 text-[9px] uppercase tracking-[0.16em]">
              <span className="flex items-center gap-1.5 text-[#6b7d94]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#34d399]" />
                Toplanan
              </span>
              <span className="flex items-center gap-1.5 text-[#6b7d94]">
                Harcanan
                <span className="h-1.5 w-1.5 rounded-full bg-[#f87171]" />
              </span>
            </div>
            <div className="h-[6px] w-full overflow-hidden rounded-full bg-[#f87171]/40">
              <div
                className="h-full rounded-full bg-[#34d399] transition-all duration-700"
                style={{ width: `${incomePct}%` }}
              />
            </div>
          </div>
        )}

        {/* 6 — Aidat durumu bloğu (kim ödedi) */}
        <AidatStatusBlock />

        {/* 7 — Hareket defteri (son 8) */}
        {recent.length === 0 ? (
          <div className="px-5 pb-5">
            <div className="rounded-[14px] border border-dashed border-[#23365c] px-4 py-8 text-center">
              <p className="text-[13px] font-medium text-[#b9c6d8]">Kasa henüz boş</p>
              <p className="mt-1 text-[11px] text-[#5b6b80]">
                İlk aidat ve harcamalar burada görünecek
              </p>
            </div>
          </div>
        ) : (
          <div className="border-t border-white/[0.06]">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <p className="text-[9.5px] uppercase tracking-[0.18em] text-[#6b7d94]">
                Son hareketler
              </p>
              <span className="text-[10px] font-mono text-[#5b6b80] tabular-nums">
                {summary.totalCount} kalem
              </span>
            </div>
            <div>
              {recent.map((t) => (
                <TransactionRow key={t.id} t={t} fmt={fmt} />
              ))}
            </div>

            {/* 8 — Genişletme butonu (tam ekran katman) */}
            {hasMore && (
              <div className="px-5 py-3">
                <button
                  onClick={() => setSheetOpen(true)}
                  className="w-full rounded-[12px] border border-[#23365c] py-2.5 text-[11.5px] font-medium text-[#7a8da4] transition-colors hover:border-[#3b82f6]/40 hover:text-[#b9c6d8]"
                >
                  Tüm hareketler
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {sheetOpen && <TransactionsSheet onClose={() => setSheetOpen(false)} />}
    </section>
  );
}

/* Tek hareket satırı — tür şeridi + kategori + tarih + tutar */
function TransactionRow({
  t,
  fmt,
}: {
  t: FinanceTransaction;
  fmt: (n: number) => string;
}) {
  const isIncome = t.type === "income";
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.05] px-5 py-3 last:border-b-0">
      <span
        className={`h-8 w-[3px] shrink-0 rounded-full ${
          isIncome ? "bg-[#34d399]/80" : "bg-[#f87171]/80"
        }`}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-[#d4e3ff]">
          {t.description || t.category}
        </p>
        <p className="mt-0.5 truncate text-[10.5px] uppercase tracking-wide text-[#5b6b80]">
          {t.category}
          {t.memberName ? (
            <span className="text-[#3b82f6]/70"> · {t.memberName}</span>
          ) : null}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p
          className={`font-mono text-[14px] font-semibold tabular-nums ${
            isIncome ? "text-[#34d399]" : "text-[#f87171]"
          }`}
        >
          {isIncome ? "+" : "−"}
          {fmt(t.amount)} TL
        </p>
        <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-wide text-[#4d5c70]">
          {new Date(t.date)
            .toLocaleDateString("tr-TR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            .toUpperCase()
            .replace(/\./g, "")}
        </p>
      </div>
    </div>
  );
}

/* Son 12 ay etiketi üretir (güncel ay dahil, geriye doğru) */
function lastMonths(count: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d
    .toLocaleDateString("tr-TR", { month: "long", year: "numeric" })
    .toUpperCase();
}

/* ===== Aidat durumu — kim ödedi / kim ödemedi (herkese açık) ===== */
function AidatStatusBlock() {
  const [month, setMonth] = useState<string>("");
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["aidat-status", month],
    queryFn: () => financeApi.getAidatStatus(month || undefined),
    staleTime: 15_000,
  });

  const status: FinanceAidatStatus | undefined = data?.data;

  // aylar — bu ay + geçmiş 5 ay
  const months = useMemo(() => lastMonths(6), []);
  const activeMonth = month || (status?.month ?? months[0] ?? "");

  const members = status?.members ?? [];
  const paidCount = status?.paidCount ?? 0;
  const total = members.length;
  const unpaidCount = Math.max(0, total - paidCount);
  const visible = expanded ? members : members.slice(0, 12);

  return (
    <div className="mx-5 mb-5 rounded-[14px] border border-[#162544] bg-[#0a1628]/70 px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[9.5px] font-medium uppercase tracking-[0.18em] text-[#3b82f6]/80">
          Aidat durumu
        </p>
        {/* Ay seçici (çip şeridi) */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {months.map((ym) => (
            <button
              key={ym}
              onClick={() => setMonth(ym)}
              className={`shrink-0 rounded-md px-2 py-1 text-[9px] font-medium uppercase tracking-wide transition-colors ${
                activeMonth === ym
                  ? "bg-[#3b82f6]/15 text-[#60a5fa] border border-[#3b82f6]/30"
                  : "text-[#6b7d94] border border-transparent hover:text-[#b9c6d8]"
              }`}
            >
              {ym.slice(2, 4)}.{ym.slice(5)}
            </button>
          ))}
        </div>
      </div>

      {/* X/Y özeti */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-medium text-white tabular-nums">
          <span className="font-semibold text-[#34d399]">{paidCount}</span>
          <span className="text-[#6b7d94]"> / {total} ödedi</span>
        </p>
        <div className="h-[5px] flex-1 mx-3 overflow-hidden rounded-full bg-[#162544]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#34d399] transition-all duration-500"
            style={{ width: `${total > 0 ? (paidCount / total) * 100 : 0}%` }}
          />
        </div>
        <p className="text-[10.5px] text-[#5b6b80] tabular-nums shrink-0">
          {unpaidCount} bekliyor
        </p>
      </div>

      {isLoading && members.length === 0 ? (
        <div className="h-16 flex items-center justify-center">
          <p className="text-[11px] text-[#5b6b80]">Yükleniyor…</p>
        </div>
      ) : members.length === 0 ? (
        <p className="text-[11px] text-[#5b6b80]">Onaylı üye yok</p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {visible.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-2 rounded-lg bg-[#0f1d32]/50 border border-[#162544]/60 px-2 py-1.5"
            >
              <span className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/10 border border-[#3b82f6]/20 flex items-center justify-center text-[10px] font-semibold text-[#60a5fa]">
                {m.name
                  .split(" ")
                  .map((s) => s[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="min-w-0 flex-1 truncate text-[11.5px] text-[#d4e3ff]">
                {m.name}
              </span>
              {m.paid ? (
                <span className="shrink-0 flex items-center gap-0.5 text-[9.5px] font-medium text-[#34d399]">
                  <Check className="w-3 h-3" />
                  Ödedi
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-[#23365c] px-1.5 py-0.5 text-[8.5px] uppercase tracking-wide text-[#4d5c70]">
                  Bekliyor
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {members.length > 12 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-full text-center text-[10.5px] font-medium text-[#6b7d94] hover:text-[#b9c6d8] transition-colors"
        >
          {expanded ? "Daralt" : `Tümü (${members.length})`}
        </button>
      )}
    </div>
  );
}

/* ===== Tüm hareketler — tam ekran katman (sayfalı) ===== */
function TransactionsSheet({ onClose }: { onClose: () => void }) {
  const [month, setMonth] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<"" | "income" | "expense">("");
  const [offset, setOffset] = useState(0);
  const [loaded, setLoaded] = useState<FinanceTransaction[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["finance-transactions", month, typeFilter, offset],
    queryFn: () =>
      financeApi.listTransactions({
        month: month || undefined,
        type: typeFilter || undefined,
        limit: 50,
        offset,
      }),
  });

  const page = data?.data;
  const items = page?.items ?? [];
  const total = page?.total ?? 0;
  const hasMore = page?.hasMore ?? false;

  // Filtre değişince sıfırla
  useEffect(() => {
    setOffset(0);
    setLoaded([]);
  }, [month, typeFilter]);

  // Ay/filtre sıfırlanınca yeni sayfayı biriktir
  const display = useMemo(() => {
    if (offset === 0) return items;
    const ids = new Set(loaded.map((t) => t.id));
    return [...loaded, ...items.filter((t) => !ids.has(t.id))];
  }, [items, loaded, offset]);

  useEffect(() => {
    if (!isFetching && display.length > loaded.length) {
      setLoaded(display);
    }
  }, [display, isFetching, loaded.length]);

  const months = useMemo(() => lastMonths(12), []);

  const fmt = (n: number) =>
    n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  return createPortal(
    <div
      className="fixed inset-0 z-[999] bg-[#050b16] overflow-hidden flex flex-col animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Üst başlık */}
      <div className="shrink-0 px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9.5px] font-medium uppercase tracking-[0.24em] text-[#3b82f6]/80">
              Ekip kasası
            </p>
            <h2 className="mt-1 text-[26px] leading-[1.05] font-semibold tracking-[-0.035em] text-white">
              Hareketler
            </h2>
            <p className="mt-1 text-[11px] text-[#5b6b80] tabular-nums">
              {total} kalem
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="tap w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-white hover:bg-white/[0.1] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 h-[1px] bg-gradient-to-r from-[#3b82f6]/40 via-[#162544] to-transparent" />
      </div>

      {/* Filtreler */}
      <div className="shrink-0 px-5 py-3 space-y-2.5">
        {/* Ay çip şeridi (tümü + son 12 ay) */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setMonth("")}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
              month === ""
                ? "bg-[#3b82f6]/15 border-[#3b82f6]/30 text-[#60a5fa]"
                : "bg-[#0a1628]/60 border-[#162544] text-[#6b7d94] hover:text-[#b9c6d8]"
            }`}
          >
            Tümü
          </button>
          {months.map((ym) => (
            <button
              key={ym}
              onClick={() => setMonth(ym)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                month === ym
                  ? "bg-[#3b82f6]/15 border-[#3b82f6]/30 text-[#60a5fa]"
                  : "bg-[#0a1628]/60 border-[#162544] text-[#6b7d94] hover:text-[#b9c6d8]"
              }`}
            >
              {monthLabel(ym)}
            </button>
          ))}
        </div>

        {/* Tür filtresi */}
        <div className="flex gap-1.5">
          {([
            { v: "", label: "Tümü" },
            { v: "income", label: "Giriş" },
            { v: "expense", label: "Çıkış" },
          ] as const).map((f) => (
            <button
              key={f.v}
              onClick={() => setTypeFilter(f.v)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                typeFilter === f.v
                  ? "bg-[#3b82f6]/15 border-[#3b82f6]/30 text-[#60a5fa]"
                  : "bg-[#0a1628]/60 border-[#162544] text-[#6b7d94] hover:text-[#b9c6d8]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && display.length === 0 ? (
          <div className="px-5 pt-12 text-center">
            <p className="text-[12px] text-[#5b6b80]">Yükleniyor…</p>
          </div>
        ) : display.length === 0 ? (
          <div className="px-5 pt-12 text-center">
            <p className="text-[13px] font-medium text-[#b9c6d8]">Bu filtrede kalem yok</p>
          </div>
        ) : (
          <div className="border-t border-white/[0.05]">
            {display.map((t) => (
              <TransactionRow key={t.id} t={t} fmt={fmt} />
            ))}
          </div>
        )}
      </div>

      {/* Alt: daha fazla yükle */}
      <div className="shrink-0 px-5 py-4 border-t border-white/[0.06] bg-[#0a1628]/40">
        {hasMore ? (
          <button
            onClick={() => setOffset((o) => o + 50)}
            disabled={isFetching}
            className="w-full rounded-[12px] border border-[#23365c] py-3 text-[12px] font-medium text-[#7a8da4] transition-colors hover:border-[#3b82f6]/40 hover:text-[#b9c6d8] disabled:opacity-50"
          >
            {isFetching ? "Yükleniyor…" : "Daha fazla yükle"}
          </button>
        ) : (
          <p className="text-center text-[10.5px] text-[#4d5c70] tabular-nums">
            {display.length} / {total} kalem gösteriliyor
          </p>
        )}
      </div>
    </div>,
    document.body
  );
}

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
