"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useWebPush } from "@/lib/useWebPush";
import { authApi, referansApi, imgUrl } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { FileUpload } from "@/components/FileUpload";
import CarsSection from "@/components/CarsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  MapPin,
  Car,
  Save,
  Lock,
  Camera,
  LogOut,
  Copy,
  Check,
  Share2,
  Clock,
  Bell,
  Pencil,
  Calendar,
  Gauge,
  Hash,
  Wrench,
  CalendarCheck,
  CalendarDays,
} from "lucide-react";

function StatBox({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="py-2.5 text-center">
      <p
        className={`font-semibold text-white tabular-nums leading-none ${
          small ? "text-[11px]" : "text-[15px]"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[8.5px] uppercase tracking-[0.16em] text-[#6b7d94]">
        {label}
      </p>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  multiline,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-7 h-7 shrink-0 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center mt-0.5">
        <Icon className="w-3.5 h-3.5 text-[#3b82f6]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] text-[#7a8da4]">{label}</p>
        <p
          className={`text-[13px] text-white ${
            multiline ? "whitespace-pre-wrap leading-relaxed" : "truncate"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

const profileSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  birthDate: z.string().optional(),
  district: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function ReferenceCodeCard() {
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchCode = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await referansApi.getCode();
      setCode(res.data.code);
      setExpiresAt(res.data.expiresAt);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
      setHasFetched(true);
    }
  }, []);

  useEffect(() => {
    fetchCode();
  }, [fetchCode]);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Referans kodu kopyalandı!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Kopyalanamadı");
    }
  };

  const formatExpiry = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false;

  return (
    <Card className="bg-[#0f1d32]/70 border-[#162544] rounded-2xl premium-shadow mb-4 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#3b82f6]" />
          Referans Kodun
        </CardTitle>
        <CardDescription className="text-[#7a8da4]">
          Arkadaşlarını davet etmek için referans kodunu paylaş
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-3 py-4">
            <div className="w-5 h-5 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
            <p className="text-[#8f9fb4] text-sm">Kod oluşturuluyor...</p>
          </div>
        ) : code && !isExpired ? (
          <div className="space-y-4">
            {/* Code display */}
            <div className="bg-mancave-surface border border-[#162544] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <code className="text-3xl font-mono font-bold text-[#3b82f6] tracking-[0.2em]">
                  {code}
                </code>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="border-[#162544] text-[#b9c6d8] hover:bg-[#0a1628] gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Kopyala
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Expiry info */}
            <div className="flex items-center gap-2 text-sm text-[#7a8da4]">
              <Clock className="w-4 h-4" />
              <span>
                Son kullanma:{" "}
                <span className="text-[#9fb0c4] text-[11.5px] font-medium">
                  {expiresAt ? formatExpiry(expiresAt) : "—"}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-[#8f9fb4] text-sm mb-3">
              {isExpired
                ? "Referans kodunun süresi dolmuş."
                : "Henüz bir referans kodun yok."}
            </p>
            <Button
              onClick={fetchCode}
              variant="outline"
              className="border-[#3b82f6]/30 text-[#3b82f6] hover:bg-[#3b82f6]/10"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Yeni Kod Oluştur
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifre zorunludur"),
    newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalıdır"),
    confirmPassword: z.string().min(1, "Şifre tekrarı zorunludur"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}

function ProfileContent() {
  const { user, refreshProfile, logout } = useAuth();
  const push = useWebPush();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordResult, setPasswordResult] = useState<"success" | "error" | null>(null);
  const [passwordMessage, setPasswordMessage] = useState("");

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "";

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    watch: watchProfile,
    setValue: setValueProfile,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      birthDate: (user as any)?.birthDate ?? "",
      district: user?.district ?? "",
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsSavingProfile(true);
    try {
      await authApi.updateProfile({
        firstName: data.firstName,
        lastName: data.lastName,
        birthDate: data.birthDate || undefined,
        district: data.district || undefined,
        avatar: removeAvatar ? null : avatarFile || undefined,
      });
      await refreshProfile();
      setAvatarFile(null);
      setRemoveAvatar(false);
      toast.success("Profil başarıyla güncellendi!");
      setIsEditing(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Profil güncellenirken bir hata oluştu"
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true);
    setPasswordResult(null);
    setPasswordMessage("");
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordResult("success");
      setPasswordMessage("Şifreniz başarıyla değiştirildi.");
      resetPassword();
      toast.success("Şifre değiştirildi!");
    } catch (err) {
      setPasswordResult("error");
      setPasswordMessage(
        err instanceof Error ? err.message : "Şifre değiştirilemedi"
      );
      toast.error(
        err instanceof Error ? err.message : "Şifre değiştirilemedi"
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const carText = [user?.carBrand, user?.carModel].filter(Boolean).join(" ") || "Araç eklenmedi";

  const eventsCount = String((user as any)?.eventCount ?? (user as any)?.stats?.events ?? 0);
  const sinceText = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" })
    : "—";

  const avatarPreview = removeAvatar ? null : avatarFile ? URL.createObjectURL(avatarFile) : null;

  return (
    <Layout>
      <div className="max-w-[430px] mx-auto pb-28 animate-fade-in">
        {/* ================= HERO ================= */}
        <div className="relative -mt-4 mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-[#0a1628]">
            {(avatarPreview || user?.avatar) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarPreview || imgUrl(user?.avatar)}
                alt={user?.firstName || "profil"}
                className="w-full h-full object-cover opacity-30 scale-110"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#050b16] via-[#050b16]/95 via-50% to-[#0a1628]/25" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-transparent to-[#030711]/70" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 82% 12%, rgba(59,130,246,0.24) 0%, transparent 60%)",
              }}
            />
          </div>

          <span className="absolute left-0 right-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#3b82f6]/60 to-transparent z-10" />

          <div className="relative z-10 px-5 pt-7 pb-5">
            <p className="text-[9.5px] uppercase tracking-[0.24em] text-[#3b82f6]/80 mb-3">
              Hesabım
            </p>

            <div className="flex items-end gap-4">
              <div className="relative shrink-0">
                <Avatar className="w-[68px] h-[68px] border border-[#3b82f6]/30 ring-1 ring-white/5">
                  <AvatarImage src={avatarPreview || imgUrl(user?.avatar)} alt={user?.firstName} />
                  <AvatarFallback className="bg-[#0f1d32] text-[#60a5fa] text-[18px] font-semibold tracking-wide">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#3b82f6] border-2 border-[#050b16] flex items-center justify-center">
                  <Camera className="w-3 h-3 text-[#030711]" />
                </div>
              </div>

              <div className="min-w-0 flex-1 pb-1">
                <h1 className="text-[22px] leading-tight font-semibold tracking-[-0.03em] text-white truncate drop-shadow">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-[12px] text-white/55 truncate mt-0.5 font-mono tracking-tight">
                  {user?.phone}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4 pt-3.5 border-t border-white/[0.07] text-[10.5px] text-white/45">
              <span className="flex items-center gap-1.5 min-w-0 truncate">
                <Car className="w-3 h-3 text-[#3b82f6]/70 shrink-0" />
                <span className="truncate">{carText}</span>
              </span>
              {user?.city && (
                <span className="flex items-center gap-1.5 shrink-0">
                  <MapPin className="w-3 h-3 text-[#3b82f6]/70" />
                  {user.city}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="px-4">
        {/* ===== PROFİL KARTI (Ekip kartı stili) ===== */}
        {!isEditing && (
        <div className="mb-4">
          <article
            className="relative rounded-2xl overflow-hidden border border-[#162544] bg-[#0f1d32] premium-shadow"
          >
            {/* Araç fotoğrafı — kart zemini */}
            <div className="absolute inset-0 bg-[#0a1628]">
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgUrl(user.avatar)}
                  alt={user?.firstName ?? ""}
                  className="w-full h-full object-cover object-top"
                  style={{ filter: "blur(0.5px) brightness(0.95)" }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    background: "radial-gradient(ellipse at 70% 20%, #3b82f622 0%, transparent 65%)",
                  }}
                >
                  <span className="text-[38px] font-semibold text-white/[0.07] tracking-[0.15em]">
                    {initials}
                  </span>
                </div>
              )}
              {/* Okunabilirlik katmanı */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#050b16] via-[#050b16]/92 via-45% to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050b16]/85 via-transparent to-transparent" />
            </div>

            {/* Marka rengi şerit */}
            <span className="absolute left-0 top-0 bottom-0 w-[2.5px] bg-[#3b82f6] opacity-70 z-20" />

            {/* İçerik */}
            <div className="relative z-10 flex items-center gap-3 px-4 py-4 min-h-[132px]">
              {/* Sol: avatar */}
              <div className="shrink-0">
                <div className="relative">
                  <Avatar className="w-[56px] h-[56px] rounded-xl border border-[#3b82f6]/35">
                    <AvatarImage
                      src={imgUrl(user?.avatar)}
                      alt={user?.firstName}
                      className="rounded-xl object-cover"
                    />
                    <AvatarFallback className="rounded-xl bg-[#0b1626] text-[#60a5fa] text-[17px] font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {user?.role === "admin" && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-[#3b82f6] px-1.5 py-[1px] text-[7px] font-bold uppercase tracking-[0.1em] text-[#030711]">
                      Yönetici
                    </span>
                  )}
                </div>
              </div>

              {/* Orta: metin */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-[15px] font-semibold tracking-[-0.015em] text-white truncate drop-shadow">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <span className="text-[9.5px] text-white/35 uppercase tracking-[0.14em] shrink-0">
                    üye
                  </span>
                </div>

                <p className="text-[13.5px] font-medium text-white/90 truncate mt-0.5 drop-shadow">
                  {[user?.carBrand, user?.carModel].filter(Boolean).join(" ") || "Araç eklenmedi"}
                </p>
                {(user?.carYear || user?.carHp) && (
                  <p className="text-[10.5px] text-white/50 truncate font-mono tracking-tight mt-0.5">
                    {[user?.carYear, user?.carHp ? `${user.carHp} HP` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-2 text-[10.5px] text-white/45">
                  <span className="flex items-center gap-1">
                    <CalendarCheck className="w-2.5 h-2.5" />
                    {eventsCount}
                  </span>
                  <span className="flex items-center gap-1 text-[#60a5fa]/90">
                    <Gauge className="w-2.5 h-2.5" />
                    {user?.activeScore ?? 0}/10
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-2.5 h-2.5" />
                    {sinceText}
                  </span>
                </div>
              </div>

              {/* Sağ: plaka */}
              {user?.plateNumber && (
                <div className="shrink-0">
                  <span className="rounded border border-white/20 bg-white/[0.06] px-1.5 py-[2px] text-[9.5px] font-mono tracking-[0.1em] text-white/85 backdrop-blur-sm">
                    {user.plateNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Düzenle */}
            <div className="relative z-10 px-4 pb-3">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-[#3b82f6]/35 bg-[#3b82f6]/10 backdrop-blur py-2 text-[11.5px] font-semibold text-[#60a5fa] hover:bg-[#3b82f6]/20 active:scale-[0.99] transition-all"
              >
                <Pencil className="w-3 h-3" />
                Profil Bilgilerini Düzenle
              </button>
            </div>
          </article>
        </div>
        )}

        {/* Profile Card */}
        <Card className="bg-[#0f1d32]/70 border-[#162544] rounded-2xl premium-shadow mb-4 overflow-hidden">
          <CardHeader className="pb-4 border-b border-white/[0.06] relative">
            <CardTitle className="text-white text-[14px] font-semibold flex items-center gap-2 tracking-tight">
              <span className="w-6 h-6 rounded-md bg-[#3b82f6]/12 border border-[#3b82f6]/25 flex items-center justify-center">
                <User className="w-3 h-3 text-[#3b82f6]" />
              </span>
              Profil Bilgileri
            </CardTitle>
            <CardDescription className="text-[#7a8da4] text-[11.5px]">
              Bilgilerini güncel tut, ekip seni tanısın.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-5">
            <form
              onSubmit={handleProfileSubmit(onProfileSubmit)}
              className="space-y-5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[#9fb0c4] text-[11.5px] font-medium">Profil Fotoğrafı</Label>
                  {removeAvatar ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveAvatar(false);
                        setAvatarFile(null);
                      }}
                      className="text-[11px] text-[#60a5fa] hover:text-[#93c5fd]"
                    >
                      Geri al
                    </button>
                  ) : (
                    user?.avatar && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setRemoveAvatar(true);
                        }}
                        className="text-[11px] text-red-400 hover:text-red-300"
                      >
                        Fotoğrafı Kaldır
                      </button>
                    )
                  )}
                </div>
                <FileUpload
                  value={removeAvatar ? null : avatarFile || user?.avatar || null}
                  onChange={(file) => {
                    setAvatarFile(file);
                    setRemoveAvatar(file === null);
                  }}
                  label="Yeni fotoğraf yüklemek için tıklayın"
                />
              </div>

              <Separator className="bg-[#0a1628]" />

              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-[#9fb0c4] text-[11.5px] font-medium">
                  İsim Soyisim
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      id="firstName"
                      placeholder="Ad"
                      className="bg-[#0a1628]/80 border-[#162544] rounded-xl text-white text-[13px] focus:border-[#3b82f6]/50 focus:bg-[#0a1628] transition-all duration-300"
                      {...registerProfile("firstName")}
                    />
                    {profileErrors.firstName && (
                      <p className="text-red-400 text-[11px] mt-1">
                        {profileErrors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Input
                      id="lastName"
                      placeholder="Soyad"
                      className="bg-[#0a1628]/80 border-[#162544] rounded-xl text-white text-[13px] focus:border-[#3b82f6]/50 focus:bg-[#0a1628] transition-all duration-300"
                      {...registerProfile("lastName")}
                    />
                    {profileErrors.lastName && (
                      <p className="text-red-400 text-[11px] mt-1">
                        {profileErrors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[#9fb0c4] text-[11.5px] font-medium">Telefon</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8da4]" />
                  <Input
                    value={user?.phone ?? ""}
                    disabled
                    className="pl-10 bg-[#0f1d32]/60 border-[#162544] text-[#7a8da4] cursor-not-allowed"
                  />
                </div>
                <p className="text-[10.5px] text-[#7a8da4]">Telefon numarası değiştirilemez</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="district" className="text-[#9fb0c4] text-[11.5px] font-medium">
                  İlçe
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8da4]" />
                  <Input
                    id="district"
                    placeholder="Kadıköy"
                    className="pl-10 bg-[#0a1628]/80 border-[#162544] rounded-xl text-white text-[13px] focus:border-[#3b82f6]/50 focus:bg-[#0a1628] transition-all duration-300"
                    {...registerProfile("district")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-[#9fb0c4] text-[11.5px] font-medium">
                  Doğum Tarihi
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8da4]" />
                  <Input
                    id="birthDate"
                    type="date"
                    className="pl-10 block min-w-0 bg-[#0a1628]/80 border-[#162544] rounded-xl text-white text-[13px] focus:border-[#3b82f6]/50 [color-scheme:dark]"
                    {...registerProfile("birthDate")}
                  />
                </div>
              </div>

              <div className="pt-1 flex gap-2">
                <Button
                  type="submit"
                  disabled={isSavingProfile || (!isProfileDirty && !avatarFile && !removeAvatar)}
                  className="w-full bg-[#3b82f6] text-white hover:bg-[#2563eb] font-medium rounded-xl py-2.5 press-scale"
                >
                  {isSavingProfile ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Kaydediliyor...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Kaydet
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Reference Code Card */}
        <ReferenceCodeCard />

        {/* Password Card */}
        <Card className="bg-[#0f1d32]/70 border-[#162544] rounded-2xl premium-shadow mb-4 overflow-hidden">
          <CardHeader className="pb-4 border-b border-white/[0.06]">
            <CardTitle className="text-white text-[14px] font-semibold flex items-center gap-2 tracking-tight">
              <span className="w-6 h-6 rounded-md bg-[#3b82f6]/12 border border-[#3b82f6]/25 flex items-center justify-center">
                <Lock className="w-3 h-3 text-[#3b82f6]" />
              </span>
              Şifre Değiştir
            </CardTitle>
            <CardDescription className="text-[#7a8da4] text-[11.5px]">
              Hesap güvenliğin için güçlü bir şifre kullan.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handlePasswordSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-[#9fb0c4] text-[11.5px] font-medium">
                  Mevcut Şifre
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  className="bg-[#0a1628]/80 border-[#162544] rounded-xl text-white text-[13px] focus:border-[#3b82f6]/50 focus:bg-[#0a1628] transition-all duration-300"
                  {...registerPassword("currentPassword")}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-red-400 text-xs">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-[#9fb0c4] text-[11.5px] font-medium">
                    Yeni Şifre
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    className="bg-[#0a1628]/80 border-[#162544] rounded-xl text-white text-[13px] focus:border-[#3b82f6]/50 focus:bg-[#0a1628] transition-all duration-300"
                    {...registerPassword("newPassword")}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-400 text-xs">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#9fb0c4] text-[11.5px] font-medium">
                    Yeni Şifre (Tekrar)
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="bg-[#0a1628]/80 border-[#162544] rounded-xl text-white text-[13px] focus:border-[#3b82f6]/50 focus:bg-[#0a1628] transition-all duration-300"
                    {...registerPassword("confirmPassword")}
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-red-400 text-xs">
                      {passwordErrors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {passwordResult && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    passwordResult === "success"
                      ? "bg-green-500/10 border border-green-500/20 text-green-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}
                >
                  {passwordMessage}
                </div>
              )}

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-[#3b82f6] text-white hover:bg-[#2563eb] font-medium rounded-xl py-2.5 press-scale"
                >
                  {isChangingPassword ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Değiştiriliyor...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Şifreyi Değiştir
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Bildirimler */}
        <Card className="bg-[#0f1d32]/70 border-[#162544] rounded-2xl premium-shadow mb-4 overflow-hidden">
          <CardHeader className="pb-4 border-b border-white/[0.06]">
            <CardTitle className="text-white text-[14px] font-semibold flex items-center gap-2 tracking-tight">
              <span className="w-6 h-6 rounded-md bg-[#3b82f6]/12 border border-[#3b82f6]/25 flex items-center justify-center">
                <Bell className="w-3 h-3 text-[#3b82f6]" />
              </span>
              Bildirimler
            </CardTitle>
            <CardDescription className="text-[#7a8da4] text-[11.5px]">
              Yeni etkinlik, hatırlatma ve duyurular için push bildirimi al.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">

            {push.status === "granted" ? (
              <div className="space-y-2">
                <p className="text-xs text-[#25D366] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25D366]" />
                  Bildirimler açık
                </p>
                <Button
                  onClick={push.disable}
                  disabled={push.busy}
                  variant="outline"
                  className="w-full border-[#162544] text-[#9fb0c4] hover:bg-[#162544]/60"
                >
                  Bildirimleri kapat
                </Button>
              </div>
            ) : push.status === "denied" ? (
              <p className="text-xs text-[#e08080] leading-relaxed">
                Bildirim izni reddedilmiş. Tarayıcı/telefon ayarlarından bu site için izni
                açman gerekiyor.
              </p>
            ) : push.status === "unsupported" ? (
              <p className="text-xs text-[#7a8da4]">Bu tarayıcı bildirimleri desteklemiyor.</p>
            ) : (
              <Button
                onClick={push.enable}
                disabled={push.busy || push.status === "loading"}
                className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white"
              >
                {push.busy ? "Açılıyor..." : "Bildirimleri aç"}
              </Button>
            )}

            {push.error && (
              <p className="text-xs text-[#e0b070] leading-relaxed">{push.error}</p>
            )}
          </CardContent>
        </Card>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-[#0f1d32]/50 py-3 text-[13px] font-medium text-red-400/90 hover:bg-red-500/10 hover:border-red-500/35 transition-all duration-300 press-scale"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
        </div>
      </div>
    </Layout>
  );
}
