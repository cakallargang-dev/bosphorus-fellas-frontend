"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, ShieldCheck, Lock, ArrowLeft } from "lucide-react";

type Step = "phone" | "code" | "password";

export default function KayitPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const idTokenRef = useRef<string>("");

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
      // Kod backend'den gönderilir (WhatsApp/SMS) — tarayıcı doğrulaması yok
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
      idTokenRef.current = res.data.idToken;
      setStep("password");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Kod doğrulanamadı");
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Ad ve soyad zorunludur");
      return;
    }
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
      const res = await authApi.register({
        phone,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
        idToken: idTokenRef.current,
      });
      const token = (res.data as { token?: string } | undefined)?.token;
      if (res.success && token) {
        localStorage.setItem("mancave_token", token);
        toast.success("Kaydınız tamamlandı, hoş geldiniz!");
        window.location.href = "/dashboard";
      } else {
        toast.success(res.message || "Kaydınız alındı, onay bekleniyor");
        window.location.href = "/login";
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Kayıt tamamlanamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-mancave-bg animate-fade-in">
      <Card className="w-full max-w-md bg-mancave-surface border-[#162544]">
        <CardHeader>
          <CardTitle className="text-white text-xl">Üye Kaydı</CardTitle>
          <CardDescription className="text-[#7a8da4]">
            {step === "phone" && "Telefon numaranı gir, doğrulama kodu gönderelim."}
            {step === "code" && "Telefonuna gelen 6 haneli kodu gir."}
            {step === "password" && "Son adım: bilgilerini tamamla ve şifreni belirle."}
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[#b9c6d8]">Ad</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-mancave-bg border-[#162544] text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[#b9c6d8]">Soyad</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-mancave-bg border-[#162544] text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#b9c6d8]">Şifre</Label>
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
                <Label htmlFor="password2" className="text-[#b9c6d8]">Şifre Tekrar</Label>
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
                {loading ? "Kaydediliyor..." : "Kaydı Tamamla"}
              </Button>
            </>
          )}

          <div className="pt-2 border-t border-[#162544] text-center text-sm text-[#7a8da4]">
            Hesabın var mı?{" "}
            <Link href="/login" className="text-[#3b82f6] hover:underline">Giriş yap</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
