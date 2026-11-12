"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { carsApi, type CarItem } from "@/lib/api";
import { BrandWheel } from "@/components/BrandWheel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { findBrand, brandLogo } from "@/lib/brands";
import { Car, Plus, X, Check, Star, Trash2, Pencil } from "lucide-react";

const INPUT =
  "bg-[#0a1628]/80 border-[#162544] rounded-[16px] text-white text-[13px] placeholder:text-[#4d5c70] focus:border-[#3b82f6]/50 focus:bg-[#0a1628] transition-all duration-300";

/* ---------------- Araç formu ---------------- */
function CarForm({
  initial,
  onClose,
  onSaved,
}: {
  initial?: CarItem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [year, setYear] = useState(initial?.year ? String(initial.year) : "");
  const [hp, setHp] = useState(initial?.hp ? String(initial.hp) : "");
  const [plate, setPlate] = useState(initial?.plateNumber ?? "");
  const [features, setFeatures] = useState(initial?.features ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!brand) return setErr("Marka seçin");
    if (!model.trim()) return setErr("Model girin");
    if (plate.trim().length < 5) return setErr("Geçerli bir plaka girin");

    setSaving(true);
    setErr(null);
    try {
      const payload = {
        brand,
        model: model.trim(),
        year: year ? Number(year) : null,
        hp: hp ? Number(hp) : null,
        plateNumber: plate.trim().toUpperCase(),
        features: features.trim() || null,
      };

      if (initial) {
        await carsApi.update(initial.id, payload);
        toast.success("Araç güncellendi");
      } else {
        await carsApi.create(payload);
        toast.success("Araç eklendi");
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Kaydedilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 90 }}
      className="bg-black/70 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{ width: "100%", maxWidth: 430, maxHeight: "88vh" }}
        className="overflow-y-auto rounded-[22px] border border-[#162544] bg-[#0c1729] shadow-2xl"
      >
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#162544]">
          <p className="text-[15px] font-semibold text-white">
            {initial ? "Aracı Düzenle" : "Araç Ekle"}
          </p>
          <button
            onClick={onClose}
            className="tap w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#8b9bb0]"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-3.5 pb-6">
          <div className="space-y-1.5">
            <label className="text-[11.5px] text-[#9fb0c4]">Araç Markası</label>
            <BrandWheel value={brand} onChange={setBrand} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11.5px] text-[#9fb0c4]">Araç Modeli</label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="örn. M3 Competition"
              className={INPUT}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[11.5px] text-[#9fb0c4]">Araç Yılı</label>
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                maxLength={4}
                placeholder="2020"
                className={INPUT}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11.5px] text-[#9fb0c4]">Beygir Gücü</label>
              <Input
                value={hp}
                onChange={(e) => setHp(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder="400"
                className={INPUT}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11.5px] text-[#9fb0c4]">
              Plaka <span className="text-red-400">*</span>
            </label>
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="34 ABC 123"
              className={`${INPUT} uppercase font-mono tracking-wider`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11.5px] text-[#9fb0c4]">
              Araç Özellikleri <span className="text-[#5b6b80]">(opsiyonel)</span>
            </label>
            <Textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              rows={3}
              placeholder="Örn. Stage 2, karbon paket"
              className="bg-[#0a1628]/80 border-[#162544] rounded-[16px] text-white text-[13px] placeholder:text-[#4d5c70] focus:border-[#3b82f6]/50 resize-none"
            />
          </div>

          {err && <p className="text-[11.5px] text-red-400">{err}</p>}

          <Button
            onClick={submit}
            disabled={saving}
            className="w-full rounded-[16px] bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-[#030711] font-bold hover:brightness-110 font-medium py-2.5"
          >
            {saving ? "Kaydediliyor..." : initial ? "Güncelle" : "Aracı Ekle"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Araç listesi ---------------- */
export default function CarsSection() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["cars"],
    queryFn: () => carsApi.list(),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CarItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const cars = data?.data ?? [];

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["cars"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const primaryMut = useMutation({
    mutationFn: (id: string) => carsApi.setPrimary(id),
    onSuccess: () => {
      toast.success("Ana araç güncellendi");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Güncellenemedi"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => carsApi.remove(id),
    onSuccess: () => {
      toast.success("Araç silindi");
      setConfirmDelete(null);
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Silinemedi"),
  });

  return (
    <div className="bg-gradient-to-b from-[#0f1d32]/85 to-[#0a1628]/85 border border-[#162544] rounded-[22px] premium-shadow mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/12 border border-[#3b82f6]/25 flex items-center justify-center">
            <Car className="w-3 h-3 text-[#3b82f6]" />
          </span>
          <p className="text-[14px] font-semibold text-white tracking-tight">Araçlarım</p>
          {cars.length > 0 && (
            <span className="text-[10.5px] text-[#6b7d94] bg-[#0a1628] px-1.5 py-0.5 rounded">
              {cars.length}
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="flex items-center gap-1 rounded-lg border border-[#3b82f6]/40 bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/10 px-2.5 py-1.5 text-[11.5px] font-medium text-[#60a5fa] hover:bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/20 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Araç Ekle
        </button>
      </div>

      <div className="p-3.5 space-y-2.5">
        {isLoading && <p className="text-[12px] text-[#7a8da4] py-2">Yükleniyor...</p>}

        {!isLoading && cars.length === 0 && (
          <div className="text-center py-6">
            <Car className="w-9 h-9 text-[#2a3a54] mx-auto mb-2" />
            <p className="text-[12.5px] text-[#7a8da4]">Henüz araç eklenmedi</p>
            <p className="text-[11px] text-[#4d5c70] mt-0.5">
              İlk aracın otomatik olarak ana araç olur
            </p>
          </div>
        )}

        {cars.map((c) => {
          const b = findBrand(c.brand);
          return (
            <div
              key={c.id}
              className={`relative rounded-[16px] border p-3 transition-colors ${
                c.isPrimary
                  ? "border-[#3b82f6]/45 bg-gradient-to-br from-[#3b82f6] to-[#60a5fa]/[0.07]"
                  : "border-[#162544] bg-[#0a1628]/60"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {b ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={brandLogo(b.slug)}
                    alt={b.label}
                    className="w-8 h-8 object-contain brightness-0 invert opacity-90 mt-0.5"
                    loading="lazy"
                  />
                ) : (
                  <Car className="w-8 h-8 text-[#2a3a54] mt-0.5" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13.5px] font-semibold text-white truncate">
                      {c.brand} {c.model}
                    </p>
                    {c.isPrimary && (
                      <span className="shrink-0 flex items-center gap-0.5 rounded bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] px-1.5 py-[1px] text-[8.5px] font-bold uppercase tracking-wider text-[#030711]">
                        <Star className="w-2 h-2" />
                        Ana
                      </span>
                    )}
                  </div>

                  <div className="mt-1 flex items-center gap-2.5 text-[10.5px] text-[#7a8da4]">
                    {c.year && <span>{c.year}</span>}
                    {c.hp && <span className="text-[#60a5fa]">{c.hp} HP</span>}
                    <span className="font-mono tracking-wider text-white/70">
                      {c.plateNumber}
                    </span>
                  </div>

                  {c.features && (
                    <p className="mt-1.5 text-[11px] text-[#8b9bb0] leading-relaxed line-clamp-2">
                      {c.features}
                    </p>
                  )}
                </div>
              </div>

              {/* aksiyonlar */}
              <div className="mt-2.5 flex items-center gap-1.5">
                {!c.isPrimary && (
                  <button
                    onClick={() => primaryMut.mutate(c.id)}
                    disabled={primaryMut.isPending}
                    className="flex items-center gap-1 rounded-lg border border-[#162544] px-2 py-1 text-[10.5px] text-[#8b9bb0] hover:border-[#3b82f6]/50 hover:text-[#60a5fa] transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3 h-3" />
                    Ana Yap
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditing(c);
                    setFormOpen(true);
                  }}
                  className="flex items-center gap-1 rounded-lg border border-[#162544] px-2 py-1 text-[10.5px] text-[#8b9bb0] hover:border-[#3b82f6]/50 hover:text-[#60a5fa] transition-colors"
                >
                  <Pencil className="w-3 h-3" />
                  Düzenle
                </button>

                {confirmDelete === c.id ? (
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      onClick={() => deleteMut.mutate(c.id)}
                      disabled={deleteMut.isPending}
                      className="rounded-lg bg-red-500 px-2.5 py-1 text-[10.5px] font-semibold text-white disabled:opacity-50"
                    >
                      {deleteMut.isPending ? "..." : "Evet, sil"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="rounded-lg border border-[#162544] px-2 py-1 text-[10.5px] text-[#8b9bb0]"
                    >
                      Vazgeç
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(c.id)}
                    className="ml-auto flex items-center gap-1 rounded-lg border border-[#3a1c1c] px-2 py-1 text-[10.5px] text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Sil
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {formOpen && (
        <CarForm
          initial={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
