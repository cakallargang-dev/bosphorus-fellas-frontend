"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { authApi, referansApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, Lock, ArrowLeft, Ticket } from "lucide-react";
import { Footer } from "@/components/Footer";

type Step = "ref" | "phone" | "password";

export default function KayitPage() {
  const [step, setStep] = useState<Step>("ref");
  const [refCode, setRefCode] = useState("");
  const [refOwner, setRefOwner] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  /** Adım 1 — Referans kodu ZORUNLU. Doğrulanmadan telefona geçilemez. */
  const verifyRef = async () => {
    const code = refCode.trim().toUpperCase();
    if (!code) {
      toast.error("Referans kodu zorunludur");
      return;
    }
    setLoading(true);
    try {
      const res = await referansApi.verifyCode(code);
      if (!res.success) {
        toast.error(res.message || "Geçersiz referans kodu");
        return;
      }
      const owner = (res.data as { ownerName?: string } | undefined)?.ownerName;
      setRefOwner(owner || "Bosphorus Fellas");
      setStep("phone");
      toast.success("Referans kodu doğrulandı");
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Referans kodu doğrulanamadı");
    } finally {
      setLoading(false);
    }
  };

  /** Adım 2 — Telefon. SMS kodu YOK, doğrudan şifreye geçer. */
  const sendCode = () => {
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Geçerli bir telefon numarası giriniz");
      return;
    }
    setStep("password");
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
        referansKodu: refCode.trim().toUpperCase(),
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
    <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-mancave-bg animate-fade-in overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('/brand-bg-square.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030711]/70 via-[#030711]/50 to-[#030711]" />
      </div>
      <Card className="w-full max-w-md bg-mancave-surface border-[#162544]">
        <CardHeader>
          <CardTitle className="text-white text-xl">Üye Kaydı</CardTitle>
          <CardDescription className="text-[#7a8da4]">
            {step === "ref" && "Sadece davetli üyeler kayıt olabilir. Referans kodunu gir."}
            {step === "phone" && "Telefon numaranı gir."}
            {step === "password" && "Son adım: bilgilerini tamamla ve şifreni belirle."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "ref" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="refCode" className="text-[#b9c6d8]">Referans Kodu</Label>
                <div className="relative">
                  <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a8da4]" />
                  <Input
                    id="refCode"
                    placeholder="Örn. FELLAS26"
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect="off"
                    className="pl-10 bg-mancave-bg border-[#162544] text-white uppercase tracking-[0.14em] placeholder:tracking-normal placeholder:text-[#7a8da4]"
                  />
                </div>
                <p className="text-[11.5px] text-[#7a8da4]">
                  Kodu olmayan üyelerden birinden isteyebilirsin.
                </p>
              </div>
              <Button onClick={verifyRef} disabled={loading} className="w-full">
                {loading ? "Doğrulanıyor..." : "Devam Et"}
              </Button>
            </>
          )}

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
            <Link href="/login" className="tap text-[#3b82f6] hover:underline">Giriş yap</Link>
          </div>
        </CardContent>
      </Card>

      <Footer />
    </div>
  );
}
