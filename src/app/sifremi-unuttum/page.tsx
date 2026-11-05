"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import {
  getFirebaseAuth,
  toE164,
  humanizeAuthError,
  authErrorCode,
  isInAppBrowser,
  mountRecaptchaHolder,
  saveVerificationId,
  loadVerificationId,
  verifyPhoneCode,
} from "@/lib/firebase";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, ShieldCheck, Lock, ArrowLeft } from "lucide-react";

type Step = "phone" | "code" | "password";

export default function SifremiUnuttumPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const idTokenRef = useRef<string>("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("Geçerli bir telefon numarası giriniz");
      return;
    }
    setLoading(true);
    try {
      const check = await authApi.checkPhone(phone);
      if (!check.success || !check.data?.exists) {
        toast.error("Bu numara ile kayıtlı hesap bulunamadı");
        setLoading(false);
        return;
      }
      // Uygulama içi tarayıcıda görünür captcha ekranın ortasında açılır
      const { holder, cleanup } = mountRecaptchaHolder();
      try {
        verifierRef.current?.clear();
      } catch {}
      const verifier = new RecaptchaVerifier(getFirebaseAuth(), holder, {
        size: isInAppBrowser() ? "normal" : "invisible",
      });
      verifierRef.current = verifier;
      const conf = await signInWithPhoneNumber(getFirebaseAuth(), toE164(phone), verifier);
      saveVerificationId(phone, conf.verificationId);
      setTimeout(cleanup, 120000);
      setCooldown(60);
      setStep("code");
      toast.success("Doğrulama kodu SMS ile gönderildi");
    } catch (err) {
      toast.error(humanizeAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const vid = loadVerificationId(phone);
    if (!vid) {
      toast.error("Doğrulama oturumu bulunamadı. Kodu tekrar gönderin.");
      setStep("phone");
      return;
    }
    setLoading(true);
    try {
      const cred = await verifyPhoneCode(vid, code);
      idTokenRef.current = await cred.user.getIdToken();
      setStep("password");
    } catch (err) {
      toast.error(`Kod hatalı veya süresi dolmuş (${authErrorCode(err)})`);
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
      const res = await authApi.resetPassword({ idToken: idTokenRef.current, newPassword: password });
      if (res.success) {
        toast.success("Şifreniz güncellendi, giriş yapabilirsiniz");
        router.push("/login");
      } else {
        toast.error(res.message || "Şifre güncellenemedi");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Şifre güncellenemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-mancave-bg">
      <Card className="w-full max-w-md bg-mancave-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-xl">Şifremi Unuttum</CardTitle>
          <CardDescription className="text-mancave-muted">
            {step === "phone" && "Telefon numaranı gir, SMS ile doğrulama kodu gönderelim."}
            {step === "code" && "Telefonuna gelen 6 haneli kodu gir."}
            {step === "password" && "Yeni şifreni belirle."}
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
                onClick={sendCode}
                disabled={loading || cooldown > 0}
                className="text-xs text-mancave-muted hover:text-white disabled:opacity-50"
              >
                {cooldown > 0 ? `Kodu tekrar gönder (${cooldown}s)` : "Kodu tekrar gönder"}
              </button>
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
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Yeni Şifre</Label>
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
                <Label htmlFor="password2" className="text-gray-300">Yeni Şifre Tekrar</Label>
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
                {loading ? "Kaydediliyor..." : "Şifreyi Güncelle"}
              </Button>
            </>
          )}

          <div className="pt-2 border-t border-gray-800 text-center text-sm text-mancave-muted">
            <Link href="/login" className="text-[#3b82f6] hover:underline">Girişe dön</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
