"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";
import { ScreenshotProtection } from "@/components/ScreenshotProtection";

type Step = "phone" | "code" | "password";

export default function SifremiUnuttumPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [ticket, setTicket] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Geçerli bir telefon numarası giriniz");
      return;
    }
    setLoading(true);
    try {
      const check = await authApi.checkPhone(phone);
      if (!check.success || !check.data?.exists) {
        toast.error("Bu numara ile kayıtlı hesap bulunamadı");
        return;
      }
      const res = await authApi.otpSend(phone);
      if (!res.success) {
        toast.error(res.message || "Kod gönderilemedi");
        return;
      }
      setCooldown(60);
      setStep("code");
      toast.success("Doğrulama kodu gönderildi");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Kod gönderilemedi");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.replace(/\D/g, "").length !== 6) {
      toast.error("6 haneli kodu giriniz");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.otpVerify(phone, code);
      if (!res.success || !res.data?.idToken) {
        toast.error(res.message || "Kod doğrulanamadı");
        return;
      }
      setTicket(res.data.idToken);
      setStep("password");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Kod doğrulanamadı");
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    if (password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }
    if (password !== password2) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.resetPassword({ idToken: ticket, newPassword: password });
      if (res.success) {
        toast.success("Şifreniz güncellendi, giriş yapabilirsiniz");
        router.push("/login");
      } else {
        toast.error(res.message || "Şifre güncellenemedi");
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Şifre güncellenemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-mancave-bg animate-fade-in overflow-hidden">
      <ScreenshotProtection />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/brand-bg-square.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030711]/70 via-[#030711]/50 to-[#030711]" />
      </div>
      <Card className="w-full max-w-md bg-mancave-surface border-[#162544]">
        <CardHeader>
          <CardTitle className="text-white text-xl">Şifremi Unuttum</CardTitle>
          <CardDescription className="text-[#7a8da4]">
            {step === "phone" && "Telefon numaranı gir, doğrulama kodu gönderelim."}
            {step === "code" && "Telefonuna gelen 6 haneli kodu gir."}
            {step === "password" && "Yeni şifreni belirle."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "phone" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[#b9c6d8]">Cep Telefonu</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8da4]" />
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="05XX XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 bg-mancave-bg border-[#162544] text-white placeholder:text-[#7a8da4]"
                  />
                </div>
              </div>
              <Button onClick={sendCode} disabled={loading} className="w-full">
                {loading ? "Gönderiliyor..." : "Doğrulama Kodu Gönder"}
              </Button>
            </>
          )}

          {step === "code" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="code" className="text-[#b9c6d8]">SMS / WhatsApp Kodu</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8da4]" />
                  <Input
                    id="code"
                    inputMode="numeric"
                    placeholder="6 haneli kod"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="pl-10 bg-mancave-bg border-[#162544] text-white tracking-widest placeholder:text-[#7a8da4]"
                  />
                </div>
              </div>
              <Button onClick={verifyCode} disabled={loading} className="w-full">
                {loading ? "Doğrulanıyor..." : "Kodu Doğrula"}
              </Button>
              <button
                onClick={sendCode}
                disabled={loading || cooldown > 0}
                className="text-xs text-[#7a8da4] hover:text-white disabled:opacity-50"
              >
                {cooldown > 0 ? `Kodu tekrar gönder (${cooldown}s)` : "Kodu tekrar gönder"}
              </button>
              <button
                onClick={() => setStep("phone")}
                className="text-xs text-[#7a8da4] hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Numarayı değiştir
              </button>
            </>
          )}

          {step === "password" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#b9c6d8]">Yeni Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8da4]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="En az 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-mancave-bg border-[#162544] text-white placeholder:text-[#7a8da4]"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password2" className="text-[#b9c6d8]">Yeni Şifre Tekrar</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8da4]" />
                  <Input
                    id="password2"
                    type="password"
                    placeholder="Şifreyi tekrar giriniz"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="pl-10 bg-mancave-bg border-[#162544] text-white placeholder:text-[#7a8da4]"
                  />
                </div>
              </div>
              <Button onClick={finish} disabled={loading} className="w-full">
                {loading ? "Güncelleniyor..." : "Şifreyi Güncelle"}
              </Button>
            </>
          )}

          <div className="pt-2 border-t border-[#162544] text-center text-sm text-[#7a8da4]">
            <Link href="/login" className="hover:text-white">Girişe dön</Link>
          </div>
        </CardContent>
      </Card>

      <Footer />
    </div>
  );
}
