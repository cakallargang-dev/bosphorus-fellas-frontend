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
import { LogIn, Mail, Lock, Car, ScanFace } from "lucide-react";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta adresi zorunludur")
    .email("Geçerli bir e-posta adresi giriniz"),
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
      localStorage.setItem("mancave_biometric_email", data.email);
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
        const email = localStorage.getItem("mancave_biometric_email");
        const pass = localStorage.getItem("mancave_biometric_pass");
        if (email && pass) {
          await login({ email, password: pass });
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-mancave-bg px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 group">
        <div className="w-12 h-12 rounded border border-[#3b82f6] flex items-center justify-center group-hover:bg-[#3b82f6]/10 transition-colors">
          <Car className="w-6 h-6 text-[#3b82f6]" />
        </div>
        <div>
          <div className="text-white font-semibold text-lg tracking-wider leading-tight">
            BOSPHORUS
          </div>
          <div className="text-[#3b82f6] text-sm tracking-[0.2em] leading-tight">
            FELLAS
          </div>
        </div>
      </Link>

      <Card className="w-full max-w-md bg-gray-900/50 backdrop-blur border-gray-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-10 h-10 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mb-3">
            <LogIn className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <CardTitle className="text-white text-xl">Giriş Yap</CardTitle>
          <CardDescription className="text-mancave-muted">
            Bosphorus Fellas topluluğuna hoş geldiniz
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">
                E-posta
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ornek@email.com"
                  className="pl-10 bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50 focus:ring-[#3b82f6]/20"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Şifre
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50 focus:ring-[#3b82f6]/20"
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs">
                  {errors.password.message}
                </p>
              )}
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
                    <span className="w-full border-t border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-mancave-bg px-2 text-gray-600">veya</span>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleBiometricLogin}
                  disabled={bioLogging}
                  className="w-full bg-white/5 text-white border border-gray-700 hover:bg-white/10 font-medium"
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

          <div className="mt-6 pt-4 border-t border-gray-800 text-center">
            <p className="text-sm text-mancave-muted">
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
