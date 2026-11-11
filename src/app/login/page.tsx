"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { isBiometricAvailable, authenticateWithBiometric } from "@/lib/native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogIn, Phone, Lock, Car, ScanFace } from "lucide-react";

const loginSchema = z.object({
  phone: z
    .string()
    .min(10, "Telefon numarası zorunludur")
    .regex(/^[0-9+\s()-]{10,}$/, "Geçerli bir telefon numarası giriniz"),
  password: z
    .string()
    .min(1, "Şifre zorunludur")
    .min(6, "Şifre en az 6 karakter olmalıdır"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [bioLogging, setBioLogging] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Redirect if already authenticated (in useEffect to follow Rules of Hooks)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(isAdmin ? "/admin" : "/dashboard");
    }
  }, [isAuthenticated, isLoading, isAdmin, router]);

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      await login(data);
      toast.success("Başarıyla giriş yaptınız!");
      // Save credentials for biometric auth
      localStorage.setItem("mancave_biometric_phone", data.phone);
      localStorage.setItem("mancave_biometric_pass", data.password);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Giriş yapılırken bir hata oluştu";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check biometric availability
  useEffect(() => {
    isBiometricAvailable().then(setBiometricReady);
  }, []);

  const handleBiometricLogin = async () => {
    setBioLogging(true);
    try {
      const ok = await authenticateWithBiometric();
      if (ok) {
        // Get stored credentials from keychain
        const phone = localStorage.getItem("mancave_biometric_phone");
        const pass = localStorage.getItem("mancave_biometric_pass");
        if (phone && pass) {
          await login({ phone, password: pass });
          toast.success("Face ID ile giriş yapıldı!");
        } else {
          toast.error("Face ID verisi bulunamadı. Lütfen önce manuel giriş yapın.");
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Face ID doğrulaması başarısız");
    } finally {
      setBioLogging(false);
    }
  };

  // Show loading state

  if (isLoading) return null;
  if (isAuthenticated) return null;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-mancave-bg px-4 animate-fade-in overflow-hidden">
      {/* Marka arka plani */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url('/brand-bg-square.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030711]/70 via-[#030711]/50 to-[#030711]" />
      </div>

      {/* Logo */}
      <Link href="/" className="mb-9 group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand-mark-hero.webp"
          alt="Bosphorus Fellas"
          className="w-[104px] h-[104px] object-contain drop-shadow-[0_0_40px_rgba(59,130,246,0.28)] transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <Card className="w-full max-w-md bg-[#0f1d32]/50 backdrop-blur border-[#162544]">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-10 h-10 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mb-3">
            <LogIn className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <CardTitle className="text-white text-xl">Giriş Yap</CardTitle>
          <CardDescription className="text-[#7a8da4]">
            Bosphorus Fellas topluluğuna hoş geldiniz
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Telefon */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[#b9c6d8]">
                Telefon
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8da4]" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="05XX XXX XX XX"
                  className="pl-10 bg-mancave-surface border-[#162544] text-white placeholder:text-[#7a8da4] focus:border-[#3b82f6]/50 focus:ring-[#3b82f6]/20"
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-red-400 text-xs">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#b9c6d8]">
                Şifre
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8da4]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-mancave-surface border-[#162544] text-white placeholder:text-[#7a8da4] focus:border-[#3b82f6]/50 focus:ring-[#3b82f6]/20"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-xs -mt-1">
              <Link href="/sifremi-unuttum" className="text-[#7a8da4] hover:text-white">
                Şifremi unuttum
              </Link>
              <Link href="/kayit" className="text-[#3b82f6] hover:underline">
                Kayıt ol
              </Link>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#3b82f6] text-black hover:bg-[#60a5fa] font-medium h-11"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Giriş yapılıyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Giriş Yap
                </span>
              )}
            </Button>

            {/* Face ID Button */}
            {biometricReady && (
              <>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[#162544]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-mancave-bg px-2 text-[#4d5c70]">veya</span>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={bioLogging}
                  className="w-full bg-white/5 text-white border border-[#162544] hover:bg-white/10 font-medium"
                >
                  {bioLogging ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Doğrulanıyor...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ScanFace className="w-4 h-4" />
                      Face ID ile Giriş
                    </span>
                  )}
                </Button>
              </>
            )}
          </form>

          <div className="mt-6 pt-4 border-t border-[#162544] text-center">
            <p className="text-sm text-[#7a8da4]">
              Henüz üye değil misiniz?{" "}
              <Link
                href="/apply"
                className="text-[#3b82f6] hover:underline font-medium"
              >
                Başvuru yapın
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
