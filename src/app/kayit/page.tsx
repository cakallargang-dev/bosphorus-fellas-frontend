"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { getFirebaseAuth, toE164, humanizeAuthError } from "@/lib/firebase";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, ShieldCheck, Lock, ArrowLeft } from "lucide-react";

type Step = "phone" | "code" | "password";

export default function KayitPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const idTokenRef = useRef<string>("");

  const sendCode = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Geçerli bir telefon numarası giriniz");
      return;
    }
    setLoading(true);
    try {
      // reCAPTCHA container'ı her denemede yeniden oluşturulur;
      // React render'ı mevcut elementi silerse "client element has been removed" hatası çıkar.
      const holder = document.createElement("div");
      holder.id = "recaptcha-holder-kayit-" + Date.now();
      document.body.appendChild(holder);
      const verifier = new RecaptchaVerifier(getFirebaseAuth(), holder, { size: "invisible" });
      confirmationRef.current = await signInWithPhoneNumber(
        getFirebaseAuth(),
        toE164(phone),
        verifier
      );
      setTimeout(() => holder.remove(), 120000);
      setStep("code");
      toast.success("Doğrulama kodu SMS ile gönderildi");
    } catch (err) {
      toast.error(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationRef.current) return;
    if (code.replace(/\D/g, "").length < 6) {
      toast.error("6 haneli kodu giriniz");
      return;
    }
    setLoading(true);
    try {
      const cred = await confirmationRef.current.confirm(code.trim());
      idTokenRef.current = await cred.user.getIdToken();
      setStep("password");
    } catch {
      toast.error("Kod hatalı veya süresi dolmuş");
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
      if (res.success && res.data?.token) {
        localStorage.setItem("mancave_token", res.data.token);
        toast.success("Kaydınız tamamlandı, hoş geldiniz!");
        window.location.href = "/dashboard";
      } else {
        toast.error(res.message || "Kayıt tamamlanamadı");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kayıt tamamlanamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-mancave-bg">
      <Card className="w-full max-w-md bg-mancave-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-xl">Üye Kaydı</CardTitle>
          <CardDescription className="text-mancave-muted">
            {step === "phone" && "Telefon numaranı gir, SMS ile doğrulama kodu gönderelim."}
            {step === "code" && "Telefonuna gelen 6 haneli kodu gir."}
            {step === "password" && "Son adım: bilgilerini tamamla ve şifreni belirle."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "phone" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">Cep Telefonu</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="05XX XXX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 bg-mancave-bg border-gray-800 text-white placeholder:text-mancave-muted"
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
                <Label htmlFor="code" className="text-gray-300">SMS Kodu</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                  <Input
                    id="code"
                    inputMode="numeric"
                    placeholder="6 haneli kod"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="pl-10 bg-mancave-bg border-gray-800 text-white tracking-widest placeholder:text-mancave-muted"
                  />
                </div>
              </div>
              <Button onClick={verifyCode} disabled={loading} className="w-full">
                {loading ? "Doğrulanıyor..." : "Kodu Doğrula"}
              </Button>
              <button
                onClick={() => setStep("phone")}
                className="text-xs text-mancave-muted hover:text-white flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> Numarayı değiştir
              </button>
            </>
          )}

          {step === "password" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-300">Ad</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="bg-mancave-bg border-gray-800 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-300">Soyad</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="bg-mancave-bg border-gray-800 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Şifre</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="En az 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-mancave-bg border-gray-800 text-white placeholder:text-mancave-muted"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password2" className="text-gray-300">Şifre Tekrar</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                  <Input
                    id="password2"
                    type="password"
                    placeholder="Şifreyi tekrar giriniz"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    className="pl-10 bg-mancave-bg border-gray-800 text-white placeholder:text-mancave-muted"
                  />
                </div>
              </div>
              <Button onClick={finish} disabled={loading} className="w-full">
                {loading ? "Kaydediliyor..." : "Kaydı Tamamla"}
              </Button>
            </>
          )}

          <div className="pt-2 border-t border-gray-800 text-center text-sm text-mancave-muted">
            Hesabın var mı?{" "}
            <Link href="/login" className="text-[#3b82f6] hover:underline">Giriş yap</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
