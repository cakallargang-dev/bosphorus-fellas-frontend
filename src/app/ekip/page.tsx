"use client";

import { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { teamApi, financeApi, type TeamMember, type FinanceSummary, type FinanceTransaction, type FinanceAidatStatus, imgUrl } from "@/lib/api";
import { TeamMemberSheet, waLink, telLink, WaIcon, TelIcon } from "@/components/TeamMemberSheet";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { SkeletonCard } from "@/components/LoadingSpinner";
import { X, Gauge, CalendarDays, CalendarCheck, Check, Clock, ChevronLeft, ChevronRight, ChevronDown, Users } from "lucide-react";
import { findBrand, brandLogo } from "@/lib/brands";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

// Kasa verileri için TEK başlangıç tabanı — 2026 Kasım öncesi hiçbir kayıt/ay gösterilmez.
const FINANCE_START_MONTH = "2026-11";
const FINANCE_START_AT = new Date("2026-11-01T00:00:00.000Z").getTime();

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

export default function TeamPage() {
  return (
    <AuthGuard>
      <TeamContent />
    </AuthGuard>
  );
}

function TeamContent() {
  const [open, setOpen] = useState<TeamMember | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["team-directory"],
    queryFn: () => teamApi.list(),
    refetchInterval: 30_000,
  });

  const all = data?.data ?? [];

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

        <div className="flex items-center justify-between mb-3.5 mt-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-[#3b82f6]/80">
            Üyeler
          </p>
          <p className="text-[10.5px] font-mono text-[#5b6b80] tabular-nums">
            {all.length}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
            <SkeletonCard className="h-28" />
          </div>
        ) : all.length === 0 ? (
          <div className="bg-gradient-to-b from-[#0f1d32]/85 to-[#0a1628]/85 border border-[#162544] rounded-[22px] premium-shadow p-10 text-center">
            <p className="text-[13px] text-[#7a8da4]">Henüz üye yok.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {all.map((m, i) => {
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

      {open && <TeamMemberSheet member={open} onClose={() => setOpen(null)} />}
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

  const isNegative = balance < 0;
  const balanceTone = isNegative ? "text-[#f87171]" : "text-[#d4e3ff]";

  const recent = summary.transactions
    .filter((t) => new Date(t.date).getTime() >= FINANCE_START_AT)
    .slice(0, 8);
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

        {/* 4 — İstatistik şeridi */}
        <div className="mt-5 grid grid-cols-2 divide-x divide-white/[0.07] border-t border-white/[0.07]">
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
        </div>

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

/* FINANCE_START_MONTH'tan başlayıp İLERİYE doğru ay etiketleri üretir (ilki Kasım 2026).
 * Bu ay saatini aşarsa geri düşer ki geçmiş ay hiç üretilmesin. */
function forwardMonths(count: number): string[] {
  const out: string[] = [];
  const [sy, sm] = FINANCE_START_MONTH.split("-").map(Number);
  const now = new Date();
  const cur = new Date(now.getFullYear(), now.getMonth(), 1);
  const base = new Date(sy, sm - 1, 1);
  const start = base > cur ? base : cur;
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
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

const TR_MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

// "Kasım 2026" (başlıkta / cümle içinde, title case)
function monthLabelTitle(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return ym;
  return `${TR_MONTHS[m - 1]} ${y}`;
}

/* ===== Aidat durumu — kim ödedi / kim ödemedi (herkese açık) ===== */
function AidatStatusBlock() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<string>("");
  const [expandedPaid, setExpandedPaid] = useState(false);
  const [expandedUnpaid, setExpandedUnpaid] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["aidat-status", month],
    queryFn: () => financeApi.getAidatStatus(month || undefined),
    staleTime: 15_000,
  });

  const status: FinanceAidatStatus | undefined = data?.data;

  // ay seçici: FINANCE_START_MONTH (Kasım 2026) ile başla, ok butonlarıyla İLERİ/GERİ gezin (geri = başlangıç ayında durur)
  const months = useMemo(() => {
    const out: string[] = [];
    const [sy, sm] = FINANCE_START_MONTH.split("-").map(Number);
    for (let i = 0; i <= 24; i++) {
      const d = new Date(sy, sm - 1 + i, 1);
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return out;
  }, []);
  const activeMonth = month || (status?.month ?? months[0] ?? "");

  const members = status?.members ?? [];
  const paidCount = status?.paidCount ?? 0;
  const total = members.length || (status?.expected ?? 0);
  const unpaidCount = Math.max(0, total - paidCount);

  const paid = members.filter((m) => m.paid);
  const unpaid = members.filter((m) => !m.paid);
  const paidVisible = expandedPaid ? paid : paid.slice(0, 6);
  const unpaidVisible = expandedUnpaid ? unpaid : unpaid.slice(0, 6);

  // ay seçici: aktif ayın aylar dizisindeki konumuna göre ileri/geri gezin
  const activeIdx = months.indexOf(activeMonth) >= 0 ? months.indexOf(activeMonth) : 0;
  const canPrev = activeIdx > 0 && activeMonth !== FINANCE_START_MONTH; // geri (geçmiş) — başlangıç ayında durur
  const canNext = activeIdx < months.length - 1; // ileri (gelecek)
  const shiftMonth = (dir: 1 | -1) => {
    const next = months[activeIdx + dir];
    if (next) setMonth(next);
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const paidDateLabel = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d
      .toLocaleDateString("tr-TR", { month: "short" })
      .replace(".", "")
      .toUpperCase();
    return `${day} ${mon}`;
  };

  return (
    <div className="mx-5 mb-5 overflow-hidden rounded-xl border border-[#162544] bg-[#0f1d32]/70 premium-shadow">
      {/* ------ Kapalı/tek satır başlık (tıklanabilir) ------ */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#0f1d32]/60"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10">
          <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-semibold tracking-tight text-[#d4e3ff]">
            {monthLabelTitle(activeMonth)} Aidatı
          </span>
          <span className="mt-0.5 block text-[10.5px] text-[#7a8da4] tabular-nums">
            {paidCount}/{total} ödedi
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#7a8da4] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* ------ Açık gövde (katlanır) ------ */}
      {open && (
        <div className="animate-fade-in">
          {/* Ay seçici + üst editoryal katman */}
          <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
            <div>
              <p className="text-[9.5px] font-semibold uppercase tracking-[0.24em] text-[#3b82f6]">
                Aidat Durumu
              </p>
              <p className="mt-0.5 text-[10px] text-[#7a8da4]">
                Bu ayki katılım defteri
              </p>
            </div>

            {/* Ay seçici — ok butonlu, ortada ay-yıl */}
            <div className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-[#0a1628]/60 px-1 py-1">
              <button
                onClick={() => shiftMonth(-1)}
                disabled={!canPrev}
                aria-label="Önceki ay"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#7a8da4] transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-[#7a8da4]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-[86px] text-center font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#d4e3ff] tabular-nums">
                {monthLabel(activeMonth)}
              </span>
              <button
                onClick={() => shiftMonth(1)}
                disabled={!canNext}
                aria-label="Sonraki ay"
                className="flex h-7 w-7 items-center justify-center rounded-full text-[#7a8da4] transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-[#7a8da4]"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* ------ Liste ------ */}
          <div className="mt-2">
            {isLoading && members.length === 0 ? (
              <div className="flex h-24 items-center justify-center">
                <p className="text-[11px] text-[#5b6b80]">Yükleniyor…</p>
              </div>
            ) : members.length === 0 ? (
              <div className="flex h-24 flex-col items-center justify-center gap-1.5 px-4">
                <Users className="h-5 w-5 text-[#4d5c70]" />
                <p className="text-[11px] text-[#5b6b80]">Bu ay için üye kaydı yok</p>
              </div>
            ) : (
              <div>
                {/* Ödeyenler */}
                <SectionHeader
                  title="Ödedi"
                  count={paid.length}
                  dot="bg-[#34d399]"
                  text="text-[#34d399]"
                />
                <div className="border-b border-white/[0.05]">
                  {paidVisible.map((m) => (
                    <MemberRow
                      key={m.id}
                      m={m}
                      initials={initials(m.name)}
                      status="paid"
                      dateLabel={paidDateLabel(m.paidAt)}
                    />
                  ))}
                  {paid.length > 6 && (
                    <ExpandButton
                      onClick={() => setExpandedPaid((v) => !v)}
                      expanded={expandedPaid}
                      count={paid.length}
                    />
                  )}
                </div>

                {/* Bekleyenler */}
                <div className="bg-amber-500/[0.04]">
                  <div className="border-t border-b border-white/[0.05]">
                    <SectionHeader
                      title="Bekliyor"
                      count={unpaid.length}
                      dot="bg-[#fbbf24]"
                      text="text-[#fbbf24]"
                    />
                    <div className="border-b border-white/[0.05]">
                      {unpaidVisible.map((m) => (
                        <MemberRow
                          key={m.id}
                          m={m}
                          initials={initials(m.name)}
                          status="waiting"
                          dateLabel=""
                        />
                      ))}
                      {unpaid.length > 6 && (
                        <ExpandButton
                          onClick={() => setExpandedUnpaid((v) => !v)}
                          expanded={expandedUnpaid}
                          count={unpaid.length}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  count,
  dot,
  text,
}: {
  title: string;
  count: number;
  dot: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 pb-2 pt-3">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d4e3ff]">
        {title}
      </p>
      <span className={`font-mono text-[10px] tabular-nums ${text}`}>{count}</span>
    </div>
  );
}

function MemberRow({
  m,
  initials,
  status,
  dateLabel,
}: {
  m: { id: string; name: string; avatar: string | null };
  initials: string;
  status: "paid" | "waiting";
  dateLabel: string;
}) {
  const avatar = imgUrl(m.avatar);
  return (
    <div className="flex min-h-[48px] items-center gap-3 border-b border-white/[0.05] px-4 py-2">
      {/* Avatar */}
      {avatar ? (
        <img
          src={avatar}
          alt={m.name}
          className="h-9 w-9 shrink-0 rounded-full border border-white/[0.08] object-cover"
        />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#3b82f6]/20 bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/10 text-[11px] font-semibold text-[#60a5fa]">
          {initials}
        </span>
      )}

      {/* İsim + tarih/alt satır */}
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#d4e3ff]">
        {m.name}
      </span>
      {status === "paid" && dateLabel && (
        <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-wide text-[#5b6b80] tabular-nums">
          {dateLabel}
        </span>
      )}

      {/* Durum rozeti */}
      {status === "paid" ? (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#34d399]/30 bg-[#34d399]/10">
          <Check className="h-3.5 w-3.5 text-[#34d399]" />
        </span>
      ) : (
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#fbbf24]/30 bg-[#fbbf24]/10">
          <Clock className="h-3.5 w-3.5 text-[#fbbf24]" />
        </span>
      )}
    </div>
  );
}

function ExpandButton({
  onClick,
  expanded,
  count,
}: {
  onClick: () => void;
  expanded: boolean;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1 py-2 text-[10px] font-medium text-[#7a8da4] transition-colors hover:text-[#d4e3ff]"
    >
      {expanded ? "Daralt" : `Tümünü gör (${count})`}
      <ChevronRight
        className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
      />
    </button>
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
  const items = (page?.items ?? []).filter(
    (t) => new Date(t.date).getTime() >= FINANCE_START_AT
  );
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

  const months = useMemo(() => forwardMonths(12), []);

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
