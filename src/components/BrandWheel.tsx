"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { X, Check, Search } from "lucide-react";
import { CAR_BRANDS, brandLogo, findBrand } from "@/lib/brands";

const ITEM_H = 46;

/**
 * iOS tarzi dikey tekerlek secici.
 * Ortadaki oge secili; kaydirinca yumusak sekilde oturur.
 */
export function BrandWheel({
  value,
  onChange,
  error,
}: {
  value?: string;
  onChange: (slug: string) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CAR_BRANDS;
    return CAR_BRANDS.filter(
      (b) =>
        b.label.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q)
    );
  }, [query]);

  const selected = findBrand(value);

  // Acilinca secili markaya kaydir
  useEffect(() => {
    if (!open) return;
    const i = Math.max(0, list.findIndex((b) => b.slug === value));
    setIndex(i);
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: i * ITEM_H, behavior: "instant" as ScrollBehavior });
    });
  }, [open, value, list.length]);

  const handleScroll = () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const i = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.min(Math.max(0, i), list.length - 1);
      setIndex(clamped);
      el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    }, 90);
  };

  const scrollToIndex = (i: number) => {
    const el = listRef.current;
    if (!el) return;
    setIndex(i);
    el.scrollTo({ top: i * ITEM_H, behavior: "smooth" });
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
          error
            ? "border-red-500/60 bg-red-500/5"
            : "border-[#162544] bg-[#0a1628] hover:border-[#3b82f6]/50"
        }`}
      >
        {selected ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brandLogo(selected.slug)}
            alt={selected.label}
            className="w-7 h-7 object-contain brightness-0 invert opacity-90"
          />
        ) : (
          <span className="w-7 h-7 rounded-md border border-dashed border-[#2a3a54]" />
        )}
        <span
          className={`text-[13px] ${selected ? "text-white" : "text-[#5b6b80]"}`}
        >
          {selected ? selected.label : "Marka seç"}
        </span>
        <span className="ml-auto text-[11px] text-[#3b82f6]">Değiştir</span>
      </button>
      {error && <p className="text-red-400 text-[11px]">{error}</p>}

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 flex items-end justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-[430px] rounded-t-3xl border-t border-[#162544] bg-[#0c1729] overflow-hidden">
            {/* Baslik */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#162544]">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[13px] text-[#8b9bb0]"
              >
                İptal
              </button>
              <p className="text-[13.5px] font-semibold text-white">Araç Markası</p>
              <button
                type="button"
                onClick={() => {
                  if (list[index]) onChange(list[index].slug);
                  setOpen(false);
                }}
                className="text-[13px] font-semibold text-[#3b82f6]"
              >
                Bitti
              </button>
            </div>

            {/* Arama */}
            <div className="px-4 py-2 border-b border-[#162544]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5b6b80]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Marka ara"
                  className="w-full h-9 pl-8 pr-3 rounded-lg bg-[#0a1628] border border-[#162544] text-[12.5px] text-white placeholder:text-[#5b6b80] outline-none"
                />
              </div>
            </div>

            {/* Tekerlek */}
            <div className="relative h-[230px] select-none">
              {/* orta secim bandi */}
              <div
                className="pointer-events-none absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[46px] rounded-xl border border-[#3b82f6]/40 bg-[#3b82f6]/8"
                style={{ height: ITEM_H }}
              />
              {/* ust/alt solma */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[70px] bg-gradient-to-b from-[#0c1729] to-transparent z-10" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70px] bg-gradient-to-t from-[#0c1729] to-transparent z-10" />

              <div
                ref={listRef}
                onScroll={handleScroll}
                className="h-full overflow-y-scroll no-scrollbar snap-y snap-mandatory"
                style={{
                  paddingTop: ITEM_H * 2,
                  paddingBottom: ITEM_H * 2,
                  scrollSnapType: "y mandatory",
                }}
              >
                {list.map((b, i) => {
                  const mine = value === b.slug;
                  const center = i === index;
                  return (
                    <button
                      key={b.slug}
                      type="button"
                      onClick={() => scrollToIndex(i)}
                      className="flex w-full items-center gap-3 px-6 snap-center"
                      style={{ height: ITEM_H }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={brandLogo(b.slug)}
                        alt={b.label}
                        className={`w-6 h-6 object-contain transition-all ${
                          center
                            ? "brightness-0 invert opacity-100 scale-110"
                            : "brightness-0 invert opacity-35"
                        }`}
                      />
                      <span
                        className={`text-[14px] transition-all ${
                          center ? "text-white font-semibold" : "text-[#7a8da4]"
                        }`}
                      >
                        {b.label}
                      </span>
                      {mine && (
                        <Check className="w-4 h-4 text-[#3b82f6] ml-auto" />
                      )}
                    </button>
                  );
                })}

                {list.length === 0 && (
                  <p className="text-center text-[12.5px] text-[#7a8da4] py-6">
                    Sonuç yok
                  </p>
                )}
              </div>
            </div>

            <div className="px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
              <p className="text-center text-[10.5px] text-[#5b6b80]">
                Kaydırarak seç, ortadaki marka geçerli
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
