"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useWebPush } from "@/lib/useWebPush";
import { authApi, referansApi, imgUrl, carsApi, type CarItem } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { FileUpload } from "@/components/FileUpload";
import { BrandWheel } from "@/components/BrandWheel";
import {
  Camera,
  Car,
  ChevronRight,
  Copy,
  LogOut,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";

/* ============================================================
   Tasarım token'ları — "Profil / Garaj"
   bg #030711 · surface #0a1628 · card #0f1d32 · border #162544
   çizgi #1d3157 · mavi #3b82f6 · açık mavi #60a5fa
   ============================================================ */

const SURFACE_PANEL = "linear-gradient(180deg,rgba(15,29,50,.85),rgba(10,22,40,.85))";

const FIELD =
  "h-[52px] w-full rounded-2xl border border-[#162544] bg-[#0f1d32] px-4 text-[15px] text-white placeholder:text-[#7a8da4] outline-none transition-colors focus:border-[#3b82f6]/60";

const FIELD_LABEL = "text-[14px] font-bold text-white";

const GRADIENT_BTN =
  "h-[56px] w-full rounded-[18px] bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-[15px] font-bold text-[#030711] shadow-[0_8px_24px_rgba(59,130,246,.38)] active:scale-[0.99] transition-transform disabled:opacity-60";

/* ---------------- Yardımcılar ---------------- */

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

function StatCell({
  value,
  label,
  suffix,
  bordered,
}: {
  value: string;
  label: string;
  suffix?: string;
  bordered?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-1 ${
        bordered ? "border-x border-[#162544]" : ""
      }`}
    >
      <span className="font-numeric text-[20px] font-bold leading-none text-white">
        {value}
        {suffix && <span className="text-[13px] text-[#7a8da4]">{suffix}</span>}
      </span>
      <span className="text-[11.5px] font-medium tracking-[0.06em] text-[#9fb0c4]">
        {label}
      </span>
    </div>
  );
}

/* ---------------- Alt sayfa (ortada modal — proje kuralı) ---------------- */

function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}
      className="flex items-center justify-center bg-[#030711]/80 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{ width: "100%", maxWidth: 430, maxHeight: "90vh" }}
        className="flex flex-col overflow-hidden rounded-[28px] border border-[#1d3157] shadow-2xl"
      >
        <div
          className="flex flex-col overflow-y-auto px-5 pb-5 pt-4"
          style={{ background: "linear-gradient(180deg,#0f1d32,#0a1628 40%)" }}
        >
          <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-[#162544]" />
          <div className="mb-4 flex items-center gap-3.5">
            <h2 className="flex-1 font-display text-[22px] font-bold text-white">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Kapat"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f1d32] text-[#9fb0c4] transition-colors hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Araç formu (Araç Ekle / Düzenle) ---------------- */

function CarSheet({
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
        features: initial?.features ?? null,
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
    <Sheet title={initial ? "Aracı Düzenle" : "Araç Ekle"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex justify-between text-[14px] font-bold text-white">
            <span>Fotoğraflar</span>
            <span className="font-semibold text-[#9fb0c4]">0/5</span>
          </div>
          <button
            type="button"
            onClick={() => toast.info("Araç fotoğrafı henüz desteklenmiyor")}
            className="flex h-[84px] flex-col items-center justify-center gap-1 rounded-[24px] border-[1.5px] border-dashed border-[#162544] bg-[#0f1d32] text-[13.5px] font-semibold text-[#9fb0c4]"
          >
            <Camera className="mb-0.5 h-5 w-5 text-[#60a5fa]" />
            Fotoğraf ekle
            <span className="text-[12px] font-medium text-[#9fb0c4]/70">
              İlk fotoğraf kapak olur
            </span>
          </button>
        </div>

        <div className="flex flex-col gap-[7px]">
          <span className={FIELD_LABEL}>Marka</span>
          <BrandWheel value={brand} onChange={setBrand} />
        </div>

        <div className="flex flex-col gap-[7px]">
          <label htmlFor="car-model" className={FIELD_LABEL}>
            Model
          </label>
          <input
            id="car-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Örn. F80 M3"
            className={FIELD}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-[7px]">
            <label htmlFor="car-year" className={FIELD_LABEL}>
              Yıl
            </label>
            <input
              id="car-year"
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={4}
              placeholder="2017"
              className={FIELD}
            />
          </div>
          <div className="flex flex-1 flex-col gap-[7px]">
            <label htmlFor="car-hp" className={FIELD_LABEL}>
              Beygir Gücü
            </label>
            <input
              id="car-hp"
              value={hp}
              onChange={(e) => setHp(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="431"
              className={FIELD}
            />
          </div>
        </div>

        <div className="flex flex-col gap-[7px]">
          <label htmlFor="car-plate" className={FIELD_LABEL}>
            Plaka
          </label>
          <div className="flex h-[52px] overflow-hidden rounded-2xl border border-[#162544] bg-[#0f1d32]">
            <span className="flex items-center bg-[#1e3a9e] px-3.5 text-[14px] font-extrabold text-white">
              TR
            </span>
            <input
              id="car-plate"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="34 ABC 123"
              className="flex-1 border-0 bg-transparent px-4 font-numeric text-[16px] font-bold tracking-wider text-white outline-none placeholder:text-[#7a8da4]"
            />
          </div>
        </div>

        {err && <p className="text-[12.5px] text-red-400">{err}</p>}

        <button onClick={submit} disabled={saving} className={`mt-2 ${GRADIENT_BTN}`}>
          {saving ? "Kaydediliyor..." : initial ? "Güncelle" : "Aracı Kaydet"}
        </button>
      </div>
    </Sheet>
  );
}

/* ---------------- Profil düzenleme ---------------- */

const profileSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  birthDate: z.string().optional(),
  district: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre zorunludur"),
    newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır"),
    confirmPassword: z.string().min(1, "Şifre tekrarı zorunludur"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

function PasswordSheet({ onClose }: { onClose: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) });
  const [saving, setSaving] = useState(false);

  const submit = async (data: PasswordFormData) => {
    setSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success("Şifre değiştirildi");
      reset();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Şifre değiştirilemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title="Şifre Değiştir" onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-[7px]">
          <label className={FIELD_LABEL}>Mevcut Şifre</label>
          <input
            type="password"
            placeholder="••••••••"
            className={FIELD}
            {...register("currentPassword")}
          />
          {errors.currentPassword && (
            <p className="text-[12px] text-red-400">{errors.currentPassword.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-[7px]">
          <label className={FIELD_LABEL}>Yeni Şifre</label>
          <input
            type="password"
            placeholder="••••••••"
            className={FIELD}
            {...register("newPassword")}
          />
          {errors.newPassword && (
            <p className="text-[12px] text-red-400">{errors.newPassword.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-[7px]">
          <label className={FIELD_LABEL}>Yeni Şifre (Tekrar)</label>
          <input
            type="password"
            placeholder="••••••••"
            className={FIELD}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-[12px] text-red-400">{errors.confirmPassword.message}</p>
          )}
        </div>
        <button type="submit" disabled={saving} className={`mt-2 ${GRADIENT_BTN}`}>
          {saving ? "Değiştiriliyor..." : "Şifreyi Değiştir"}
        </button>
      </form>
    </Sheet>
  );
}

function EditProfileSheet({
  onClose,
  onOpenPassword,
}: {
  onClose: () => void;
  onOpenPassword: () => void;
}) {
  const { user, refreshProfile } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const avatarPreview = useObjectUrl(avatarFile);

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      birthDate: user?.birthDate ?? "",
      district: user?.district ?? "",
    },
  });

  const submit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      await authApi.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate || undefined,
        district: data.district || undefined,
        avatar: removeAvatar ? null : avatarFile || undefined,
      });
      await refreshProfile();
      toast.success("Profil güncellendi");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Güncellenemedi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet title="Profili Düzenle" onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0f1d32] font-display text-[19px] font-bold text-[#60a5fa]">
            {avatarPreview || (user?.avatar && !removeAvatar) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview || imgUrl(user?.avatar)}
                alt={initials}
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="flex flex-1 items-center gap-2">
            <FileUpload
              value={removeAvatar ? null : avatarFile || user?.avatar || null}
              onChange={(file) => {
                setAvatarFile(file);
                setRemoveAvatar(file === null);
              }}
              label="Fotoğrafı değiştir"
            />
            {(user?.avatar || avatarFile) && !removeAvatar && (
              <button
                type="button"
                onClick={() => {
                  setAvatarFile(null);
                  setRemoveAvatar(true);
                }}
                className="shrink-0 text-[14px] font-medium text-[#9fb0c4] hover:text-white"
              >
                Kaldır
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-[7px]">
            <label htmlFor="firstName" className={FIELD_LABEL}>
              İsim
            </label>
            <input id="firstName" placeholder="Ad" className={FIELD} {...register("firstName")} />
            {errors.firstName && (
              <p className="text-[12px] text-red-400">{errors.firstName.message}</p>
            )}
          </div>
          <div className="flex flex-1 flex-col gap-[7px]">
            <label htmlFor="lastName" className={FIELD_LABEL}>
              Soyisim
            </label>
            <input id="lastName" placeholder="Soyad" className={FIELD} {...register("lastName")} />
            {errors.lastName && (
              <p className="text-[12px] text-red-400">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-[7px]">
          <label className={FIELD_LABEL}>Telefon</label>
          <input
            value={user?.phone ?? ""}
            disabled
            className={`${FIELD} cursor-not-allowed text-[#7a8da4]`}
          />
          <span className="text-[12.5px] font-medium text-[#9fb0c4]">
            Telefon numarası değiştirilemez.
          </span>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-[7px]">
            <label htmlFor="district" className={FIELD_LABEL}>
              İlçe
            </label>
            <input id="district" placeholder="İlçe" className={FIELD} {...register("district")} />
          </div>
          <div className="flex flex-1 flex-col gap-[7px]">
            <label htmlFor="birthDate" className={FIELD_LABEL}>
              Doğum tarihi
            </label>
            <input
              id="birthDate"
              type="date"
              className={`${FIELD} [color-scheme:dark]`}
              {...register("birthDate")}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenPassword}
          className="flex h-[52px] items-center justify-between rounded-2xl border-[1.5px] border-[#162544] bg-[#0a1628] px-4 text-[15px] font-semibold text-white"
        >
          Şifreyi değiştir
          <ChevronRight className="h-4 w-4 text-[#7a8da4]" />
        </button>

        <button type="submit" disabled={saving} className={`mt-2 ${GRADIENT_BTN}`}>
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </Sheet>
  );
}

/* ---------------- Referans kodu ---------------- */

function ReferenceRow() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCode = useCallback(async () => {
    setLoading(true);
    try {
      const res = await referansApi.getCode();
      setCode(res.data.code);
      setExpiresAt(res.data.expiresAt);
    } catch {
      /* sessiz */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCode();
  }, [fetchCode]);

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Referans kodu kopyalandı!");
    } catch {
      toast.error("Kopyalanamadı");
    }
  };

  return (
    <section
      className="flex items-center gap-3 rounded-[22px] border border-[#162544] p-4"
      style={{ background: SURFACE_PANEL }}
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <span className="text-[11.5px] font-medium tracking-[0.12em] text-[#9fb0c4]">
          REFERANS KODUN
        </span>
        {loading ? (
          <span className="h-6 w-28 animate-pulse rounded bg-[#162544]" />
        ) : code && !isExpired ? (
          <>
            <span className="font-numeric text-[22px] font-bold tracking-[0.14em] text-white">
              {code}
            </span>
            {expiresAt && (
              <span className="text-[12px] text-[#9fb0c4]">
                Son kullanma:{" "}
                {new Date(expiresAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </>
        ) : (
          <button
            onClick={fetchCode}
            className="self-start text-[13.5px] font-semibold text-[#60a5fa]"
          >
            Yeni kod oluştur
          </button>
        )}
      </div>

      {code && !isExpired && (
        <button
          onClick={copy}
          className="flex h-11 shrink-0 items-center gap-2 rounded-[14px] bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] px-[18px] text-[14px] font-bold text-[#030711] shadow-[0_6px_18px_rgba(59,130,246,.35)]"
        >
          <Copy className="h-4 w-4" />
          Kopyala
        </button>
      )}
    </section>
  );
}

/* ---------------- Sayfa ---------------- */

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const push = useWebPush();
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [carOpen, setCarOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarItem | null>(null);
  const [carIndex, setCarIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: carsData } = useQuery({
    queryKey: ["cars"],
    queryFn: () => carsApi.list(),
  });

  const cars = useMemo(() => carsData?.data ?? [], [carsData]);

  // Ana araç önce
  const ordered = useMemo(() => {
    const primary = cars.filter((c) => c.isPrimary);
    return [...primary, ...cars.filter((c) => !c.isPrimary)];
  }, [cars]);

  const safeIndex = Math.min(carIndex, Math.max(0, ordered.length - 1));
  const active = ordered[safeIndex];

  useEffect(() => {
    if (carIndex > ordered.length - 1) setCarIndex(0);
  }, [ordered.length, carIndex]);

  const refreshCars = () => {
    queryClient.invalidateQueries({ queryKey: ["cars"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    setConfirmDelete(false);
  };

  const primaryMut = useMutation({
    mutationFn: (id: string) => carsApi.setPrimary(id),
    onSuccess: () => {
      toast.success("Ana araç güncellendi");
      refreshCars();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Güncellenemedi"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => carsApi.remove(id),
    onSuccess: () => {
      toast.success("Araç silindi");
      setCarIndex(0);
      refreshCars();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Silinemedi"),
  });

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const eventsCount = String(user?.eventCount ?? 0);
  const sinceText = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("tr-TR", {
        month: "short",
        year: "2-digit",
      })
    : "—";

  // Vitrinde model adı öne çıkar: aracın modeli, yoksa kullanıcının araç modeli
  const displayModel = active
    ? active.model || active.brand
    : user?.carModel || user?.carBrand || "—";
  const displayBrand = active ? active.brand : user?.carBrand;
  const displayYear = active?.year ?? user?.carYear ?? null;

  return (
    <Layout>
      <div className="mx-auto max-w-[430px] px-5 pb-28 pt-6">
        <div className="flex flex-col gap-6">
          {/* ===== HERO ===== */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-numeric text-[12px] font-bold tracking-[0.24em] text-[#7a8da4]">
                HESABIM
              </span>
              <button
                onClick={() => setEditOpen(true)}
                className="flex h-10 items-center gap-2 rounded-[20px] border border-[#162544] px-4 text-[13.5px] font-semibold text-white"
                style={{ background: SURFACE_PANEL }}
              >
                <Pencil className="h-3.5 w-3.5 text-[#60a5fa]" />
                Düzenle
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="h-[76px] w-[76px] shrink-0 rounded-full p-[3px] shadow-[0_0_28px_rgba(59,130,246,.35)]"
                style={{
                  background: "conic-gradient(from 200deg,#3b82f6,#60a5fa,#162544,#3b82f6)",
                }}
              >
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-[3px] border-[#030711] bg-[#0f1d32]">
                  {user?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imgUrl(user.avatar)}
                      alt={initials}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="font-display text-[24px] font-bold text-[#60a5fa]">
                      {initials}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <h1 className="truncate font-display text-[26px] font-bold leading-tight text-white">
                  {user?.firstName} {user?.lastName}
                </h1>
                <span className="font-numeric text-[13px] text-[#9fb0c4]">{user?.phone}</span>
              </div>
            </div>

            {/* İstatistik şeridi */}
            <div
              className="flex rounded-[22px] border border-[#162544] py-4"
              style={{ background: SURFACE_PANEL }}
            >
              <StatCell value={eventsCount} label="ETKİNLİK" />
              <StatCell
                value={String(user?.activeScore ?? 0)}
                suffix="/10"
                label="AKTİFLİK"
                bordered
              />
              <StatCell value={sinceText} label="ÜYELİK" />
            </div>
          </div>

          {/* ===== GARAJIM ===== */}
          <section className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="font-display text-[22px] font-bold text-white">Garajım</h2>
                <span className="rounded-[10px] border border-[#60a5fa]/30 bg-[#3b82f6]/15 px-2 py-0.5 font-numeric text-[12px] font-bold text-[#60a5fa]">
                  {ordered.length}
                </span>
              </div>
              <button
                onClick={() => {
                  setEditingCar(null);
                  setCarOpen(true);
                }}
                className="flex h-10 items-center gap-1.5 rounded-[20px] bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] pl-3 pr-4 text-[14px] font-bold text-[#030711] shadow-[0_6px_20px_rgba(59,130,246,.4)]"
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} />
                Araç Ekle
              </button>
            </div>

            {ordered.length === 0 ? (
              <button
                onClick={() => {
                  setEditingCar(null);
                  setCarOpen(true);
                }}
                className="flex h-[330px] w-full flex-col items-center justify-center gap-2.5 rounded-[30px] border border-dashed border-[#1d3157] text-[13px] text-[#7a8da4]"
                style={{
                  background:
                    "radial-gradient(260px 200px at 80% 0%,rgba(59,130,246,.2),transparent 70%),linear-gradient(180deg,#0f1d32,#050b16)",
                }}
              >
                <Car className="h-8 w-8 text-[#2a3a54]" />
                Henüz araç eklenmedi
                <span className="text-[12px] text-[#4d5c70]">
                  İlk aracın otomatik olarak ana araç olur
                </span>
              </button>
            ) : (
              <div
                className="relative h-[330px] shrink-0 overflow-hidden rounded-[30px] border border-[#1d3157]"
                style={{
                  background:
                    "radial-gradient(260px 200px at 80% 0%,rgba(59,130,246,.38),transparent 70%),linear-gradient(180deg,#0f1d32,#050b16)",
                }}
              >
                {/* Izgara zemin */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[210px]"
                  style={{
                    background:
                      "repeating-linear-gradient(90deg,rgba(96,165,250,.14) 0 1px,transparent 1px 36px),repeating-linear-gradient(0deg,rgba(96,165,250,.14) 0 1px,transparent 1px 36px)",
                    WebkitMaskImage: "linear-gradient(180deg,transparent,#000)",
                    maskImage: "linear-gradient(180deg,transparent,#000)",
                  }}
                />

                {/* Üst bar */}
                <div className="absolute left-4 right-4 top-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 rounded-[14px] border border-[#162544] bg-[#030711]/55 px-3 py-1.5 text-[12px] font-semibold text-[#f1f5f9]">
                      <i
                        className={`block h-[7px] w-[7px] rounded-full ${
                          active?.isPrimary
                            ? "bg-[#60a5fa] shadow-[0_0_8px_#60a5fa]"
                            : "bg-[#7a8da4]"
                        }`}
                      />
                      {active?.isPrimary ? "Ana araç" : "Araç"}
                    </span>
                    <span className="font-numeric text-[12px] font-bold text-[#9fb0c4]">
                      {safeIndex + 1}/{Math.max(ordered.length, 5)}
                    </span>
                  </div>

                  {/* Carousel göstergesi */}
                  <div className="flex gap-[5px]">
                    {ordered.map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => setCarIndex(i)}
                        aria-label={`${c.brand} ${c.model}`}
                        className={`block h-[3px] flex-1 rounded-[2px] transition-colors ${
                          i === safeIndex ? "bg-[#60a5fa]" : "bg-[#162544]"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Orta: foto alanı */}
                <div className="absolute left-0 right-0 top-[104px] flex flex-col items-center gap-2 text-[12.5px] text-[#7a8da4]">
                  <Car className="h-8 w-8" strokeWidth={1.4} />
                  Araç fotoğrafı
                </div>

                {/* Alt cam panel */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 rounded-[22px] border border-[#1d3157] bg-[#030711]/[0.62] px-4 py-3.5 backdrop-blur-md">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-numeric text-[13px] font-bold tracking-[0.22em] text-[#60a5fa]">
                      {displayYear ?? "—"}
                    </span>
                    <span className="truncate font-display text-[34px] font-bold leading-[1.05] tracking-[-0.02em] text-white">
                      {displayModel}
                    </span>
                    <span className="truncate text-[11px] font-medium uppercase tracking-[0.1em] text-[#9fb0c4]">
                      {displayBrand}
                    </span>
                  </div>
                  {active?.plateNumber && (
                    <div className="flex h-8 shrink-0 items-center overflow-hidden rounded-[9px] bg-white">
                      <span className="flex h-full items-center bg-[#1e3a9e] px-2 text-[12px] font-bold text-white">
                        TR
                      </span>
                      <span className="px-2.5 font-numeric text-[13px] font-bold tracking-[0.12em] text-[#111]">
                        {active.plateNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Aktif araç aksiyonları */}
            {active && (
              <div className="flex items-center gap-2">
                {!active.isPrimary && (
                  <button
                    onClick={() => primaryMut.mutate(active.id)}
                    disabled={primaryMut.isPending}
                    className="flex items-center gap-1.5 rounded-xl border border-[#162544] px-3 py-2 text-[12px] text-[#8b9bb0] transition-colors hover:border-[#3b82f6]/50 hover:text-[#60a5fa] disabled:opacity-50"
                  >
                    <Star className="h-3 w-3" />
                    Ana Yap
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingCar(active);
                    setCarOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-[#162544] px-3 py-2 text-[12px] text-[#8b9bb0] transition-colors hover:border-[#3b82f6]/50 hover:text-[#60a5fa]"
                >
                  <Pencil className="h-3 w-3" />
                  Düzenle
                </button>
                {confirmDelete ? (
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      onClick={() => deleteMut.mutate(active.id)}
                      disabled={deleteMut.isPending}
                      className="rounded-lg bg-red-500 px-2.5 py-1.5 text-[11.5px] font-semibold text-white disabled:opacity-50"
                    >
                      {deleteMut.isPending ? "..." : "Evet, sil"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-lg border border-[#162544] px-2 py-1.5 text-[11.5px] text-[#8b9bb0]"
                    >
                      Vazgeç
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="ml-auto flex items-center gap-1.5 rounded-xl border border-[#3a1c1c] px-3 py-2 text-[12px] text-red-400 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" />
                    Sil
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ===== REFERANS KODU ===== */}
          <ReferenceRow />

          {/* ===== BİLDİRİMLER ===== */}
          <div
            className="flex items-center gap-3.5 rounded-[22px] border border-[#162544] p-4"
            style={{ background: SURFACE_PANEL }}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3b82f6]/15">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#60a5fa"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0" />
              </svg>
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-semibold text-white">Bildirimler</span>
              <span className="truncate text-[12.5px] text-[#9fb0c4]">
                {push.status === "granted"
                  ? "Etkinlik ve duyurular açık"
                  : push.status === "denied"
                    ? "Tarayıcı ayarlarından izin ver"
                    : push.status === "unsupported"
                      ? "Bu tarayıcı desteklemiyor"
                      : "Etkinlik ve duyurular"}
              </span>
            </div>
            <button
              role="switch"
              aria-checked={push.status === "granted"}
              aria-label="Bildirimler"
              disabled={push.busy || push.status === "unsupported"}
              onClick={() => (push.status === "granted" ? push.disable() : push.enable())}
              className="flex h-11 w-[52px] shrink-0 items-center disabled:opacity-40"
            >
              <span
                className={`flex h-7 w-12 items-center rounded-full border px-[3px] transition-colors ${
                  push.status === "granted"
                    ? "border-[#3b82f6] bg-[#3b82f6]/30"
                    : "border-[#162544] bg-[#0f1d32]"
                }`}
              >
                <i
                  className={`block h-5 w-5 rounded-full transition-transform ${
                    push.status === "granted"
                      ? "translate-x-[20px] bg-[#60a5fa]"
                      : "bg-[#7a8da4]"
                  }`}
                />
              </span>
            </button>
          </div>

          {push.error && (
            <p className="-mt-3 text-[12px] leading-relaxed text-[#e0b070]">{push.error}</p>
          )}

          {/* ===== ÇIKIŞ ===== */}
          <button
            onClick={logout}
            className="flex h-[52px] items-center justify-center gap-2 rounded-[18px] border border-[#5b1f2a] bg-[#7f1d1d]/[0.12] text-[15px] font-bold text-[#f87171]"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* ===== ALT SAYFALAR ===== */}
      {editOpen && (
        <EditProfileSheet
          onClose={() => setEditOpen(false)}
          onOpenPassword={() => setPasswordOpen(true)}
        />
      )}
      {passwordOpen && <PasswordSheet onClose={() => setPasswordOpen(false)} />}
      {carOpen && (
        <CarSheet
          initial={editingCar}
          onClose={() => {
            setCarOpen(false);
            setEditingCar(null);
          }}
          onSaved={refreshCars}
        />
      )}
    </Layout>
  );
}
