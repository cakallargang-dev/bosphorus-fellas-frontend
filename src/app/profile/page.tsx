"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { authApi, referansApi } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
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
} from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  phone: z.string().optional(),
  city: z.string().optional(),
  carBrand: z.string().optional(),
  carModel: z.string().optional(),
  plateNumber: z.string().optional(),
  about: z.string().optional(),
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
    <Card className="bg-gray-900/50 backdrop-blur border-gray-800 mb-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#3b82f6]" />
          Referans Kodun
        </CardTitle>
        <CardDescription className="text-mancave-muted">
          Arkadaşlarını davet etmek için referans kodunu paylaş
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-3 py-4">
            <div className="w-5 h-5 border-2 border-[#3b82f6]/30 border-t-[#3b82f6] rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Kod oluşturuluyor...</p>
          </div>
        ) : code && !isExpired ? (
          <div className="space-y-4">
            {/* Code display */}
            <div className="bg-mancave-surface border border-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <code className="text-3xl font-mono font-bold text-[#3b82f6] tracking-[0.2em]">
                  {code}
                </code>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800 gap-2"
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
            <div className="flex items-center gap-2 text-sm text-mancave-muted">
              <Clock className="w-4 h-4" />
              <span>
                Son kullanma:{" "}
                <span className="text-gray-300">
                  {expiresAt ? formatExpiry(expiresAt) : "—"}
                </span>
              </span>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-gray-400 text-sm mb-3">
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
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [passwordResult, setPasswordResult] = useState<"success" | "error" | null>(null);
  const [passwordMessage, setPasswordMessage] = useState("");

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "";

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors, isDirty: isProfileDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      phone: user?.phone ?? "",
      city: user?.city ?? "",
      carBrand: user?.carBrand ?? "",
      carModel: user?.carModel ?? "",
      plateNumber: user?.plateNumber ?? "",
      about: "",
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
        phone: data.phone || undefined,
        city: data.city || undefined,
        carBrand: data.carBrand || undefined,
        carModel: data.carModel || undefined,
        plateNumber: data.plateNumber || undefined,
        avatar: removeAvatar ? (null as unknown as File) : avatarFile || undefined,
      });
      await refreshProfile();
      setAvatarFile(null);
      setRemoveAvatar(false);
      toast.success("Profil başarıyla güncellendi!");
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

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <User className="w-6 h-6 text-[#3b82f6]" />
            Profil Ayarları
          </h1>
          <p className="text-mancave-muted mt-1">
            Profil bilgilerinizi güncelleyin ve şifrenizi değiştirin
          </p>
        </div>

        {/* Profile Card */}
        <Card className="bg-gray-900/50 backdrop-blur border-gray-800 mb-6">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-2 border-[#3b82f6]/30">
                  <AvatarImage
                    src={
                      user?.avatar
                        ? `${apiBase}${user.avatar}`
                        : undefined
                    }
                    alt={user?.firstName}
                  />
                  <AvatarFallback className="bg-[#3b82f6]/10 text-[#3b82f6] text-xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#3b82f6] flex items-center justify-center">
                  <Camera className="w-3 h-3 text-black" />
                </div>
              </div>
              <div>
                <CardTitle className="text-white">
                  {user?.firstName} {user?.lastName}
                </CardTitle>
                <CardDescription className="text-mancave-muted">
                  {user?.email}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handleProfileSubmit(onProfileSubmit)}
              className="space-y-5"
            >
              {/* Avatar upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Profil Fotoğrafı</Label>
                  {user?.avatar && (
                    <button type="button" onClick={() => { setAvatarFile(null); setRemoveAvatar(true); }} className="text-xs text-red-400 hover:text-red-300">Fotoğrafı Kaldır</button>
                  )}
                </div>
                <FileUpload
                  value={avatarFile || user?.avatar || null}
                  onChange={setAvatarFile}
                  label="Yeni fotoğraf yüklemek için tıklayın"
                />
              </div>

              <Separator className="bg-gray-800" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-300">
                    Ad
                  </Label>
                  <Input
                    id="firstName"
                    className="bg-mancave-surface border-gray-800 text-white focus:border-[#3b82f6]/50"
                    {...registerProfile("firstName")}
                  />
                  {profileErrors.firstName && (
                    <p className="text-red-400 text-xs">
                      {profileErrors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300">
                    Soyad
                  </Label>
                  <Input
                    id="lastName"
                    className="bg-mancave-surface border-gray-800 text-white focus:border-[#3b82f6]/50"
                    {...registerProfile("lastName")}
                  />
                  {profileErrors.lastName && (
                    <p className="text-red-400 text-xs">
                      {profileErrors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  E-posta
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                  <Input
                    id="email"
                    value={user?.email ?? ""}
                    disabled
                    className="pl-10 bg-mancave-surface/50 border-gray-800 text-mancave-muted cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-mancave-muted">
                  E-posta adresiniz değiştirilemez
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-300">
                    Telefon
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                    <Input
                      id="phone"
                      placeholder="0555 555 55 55"
                      className="pl-10 bg-mancave-surface border-gray-800 text-white focus:border-[#3b82f6]/50"
                      {...registerProfile("phone")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-gray-300">
                    Şehir
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                    <Input
                      id="city"
                      placeholder="İstanbul"
                      className="pl-10 bg-mancave-surface border-gray-800 text-white focus:border-[#3b82f6]/50"
                      {...registerProfile("city")}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="carBrand" className="text-gray-300">
                  Araç Markası
                </Label>
                <div className="relative">
                  <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                  <Input
                    id="carBrand"
                    placeholder="BMW"
                    className="pl-10 bg-mancave-surface border-gray-800 text-white focus:border-[#3b82f6]/50"
                    {...registerProfile("carBrand")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carModel" className="text-gray-300">
                  Araç Modeli
                </Label>
                <Input
                  id="carModel"
                  placeholder="M3"
                  className="bg-mancave-surface border-gray-800 text-white focus:border-[#3b82f6]/50"
                  {...registerProfile("carModel")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plateNumber" className="text-gray-300">
                  Plaka
                </Label>
                <Input
                  id="plateNumber"
                  placeholder="34 ABC 123"
                  className="bg-mancave-surface border-gray-800 text-white focus:border-[#3b82f6]/50"
                  {...registerProfile("plateNumber")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about" className="text-gray-300">
                  Hakkımda
                </Label>
                <Textarea
                  id="about"
                  placeholder="Kendinden kısaca bahset..."
                  rows={3}
                  className="bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50 resize-none"
                  {...registerProfile("about")}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSavingProfile || (!isProfileDirty && !avatarFile && !removeAvatar)}
                  className="bg-[#3b82f6] text-black hover:bg-[#60a5fa] font-medium"
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
        <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#3b82f6]" />
              Şifre Değiştir
            </CardTitle>
            <CardDescription className="text-mancave-muted">
              Hesap güvenliğiniz için güçlü bir şifre kullanın
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              onSubmit={handlePasswordSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-300">
                  Mevcut Şifre
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  className="bg-mancave-surface border-gray-800 text-white focus:border-[#3b82f6]/50"
                  {...registerPassword("currentPassword")}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-red-400 text-xs">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-300">
                    Yeni Şifre
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    className="bg-mancave-surface border-gray-800 text-white focus:border-[#3b82f6]/50"
                    {...registerPassword("newPassword")}
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-red-400 text-xs">
                      {passwordErrors.newPassword.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">
                    Yeni Şifre (Tekrar)
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="bg-mancave-surface border-gray-800 text-white focus:border-[#3b82f6]/50"
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

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-[#3b82f6] text-black hover:bg-[#60a5fa] font-medium"
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

        {/* Logout */}
        <Card className="bg-gray-900/50 backdrop-blur border-red-500/20">
          <CardContent className="pt-6">
            <Button
              onClick={logout}
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Çıkış Yap
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
