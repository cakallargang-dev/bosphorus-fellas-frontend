"use client";

import { useState, useMemo } from "react";
import { CAR_BRANDS, brandLogo, findBrand } from "@/lib/brands";
import { Search, Check, ChevronDown, X } from "lucide-react";

interface Props {
  value?: string;
  onChange: (slug: string) => void;
  error?: string;
}

/** Arac markasi secici — logo izgarali modal */
export function BrandSelect({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const selected = findBrand(value);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return CAR_BRANDS;
    return CAR_BRANDS.filter(
      (b) =>
        b.label.toLowerCase().includes(query) ||
        b.keys.some((k) => k.includes(query))
    );
  }, [q]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full h-[46px] flex items-center gap-2.5 rounded-[16px] border px-3 transition-colors text-left ${
          error
            ? "border-red-500/60 bg-red-500/5"
            : "border-[#162544] bg-[#0a1628] hover:border-[#23365c]"
        }`}
      >
        {selected ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={brandLogo(selected.slug)}
              alt={selected.label}
              className="w-6 h-6 object-contain shrink-0"
            />
            <span className="text-[13px] text-white flex-1 truncate">{selected.label}</span>
          </>
        ) : (
          <span className="text-[13px] text-[#5b6b80] flex-1">Marka seçin</span>
        )}
        <ChevronDown className="w-4 h-4 text-[#5b6b80] shrink-0" />
      </button>

      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}

      {open && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="w-full max-w-[430px] max-h-[82vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-[#162544] bg-[#080f1c] overflow-hidden">
            {/* Baslik */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#162544]">
              <h3 className="text-[14px] font-semibold text-white">Araç Markası</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#8b9bb0] hover:bg-white/10"
                aria-label="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Arama */}
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 rounded-[16px] border border-[#162544] bg-[#0a1628] px-3 h-[40px]">
                <Search className="w-4 h-4 text-[#5b6b80] shrink-0" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Marka ara"
                  className="flex-1 bg-transparent text-[13px] text-white placeholder:text-[#5b6b80] outline-none"
                />
                {q && (
                  <button type="button" onClick={() => setQ("")} aria-label="Temizle">
                    <X className="w-3.5 h-3.5 text-[#5b6b80]" />
                  </button>
                )}
              </div>
            </div>

            {/* Izgara */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-3 gap-2">
                {list.map((b) => {
                  const active = selected?.slug === b.slug;
                  return (
                    <button
                      key={b.slug}
                      type="button"
                      onClick={() => {
                        onChange(b.slug);
                        setOpen(false);
                        setQ("");
                      }}
                      className={`relative flex flex-col items-center justify-center gap-2 rounded-[16px] border px-1 py-3 transition-colors press-scale ${
                        active
                          ? "border-[#3b82f6] bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/12"
                          : "border-[#162544] bg-[#0f1d32]/60 hover:border-[#23365c]"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={brandLogo(b.slug)}
                        alt={b.label}
                        className="w-9 h-9 object-contain"
                        loading="lazy"
                      />
                      <span className="text-[10px] text-[#b9c6d8] text-center leading-tight truncate w-full">
                        {b.label}
                      </span>
                      {active && (
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {list.length === 0 && (
                <p className="text-center text-[12px] text-[#5b6b80] py-8">
                  Marka bulunamadı
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
