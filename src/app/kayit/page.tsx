"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Phone, Lock, User } from "lucide-react";

export default function KayitPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);

  const finish = async () => {
    if (phone.replace(/\D/g, "").length < 10) {
      toast.error("Geçerli bir telefon numarası giriniz");
      return;
    }
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
        idToken: "",
      });
      if (res.success && res.data?.token) {
        localStorage.setItem("mancave_token", res.data.token);
        toast.success("Kaydınız tamamlandı, hoş geldiniz!");
        window.location.href = "/dashboard";
      } else {
        toast.error(res.message || "Kayıt tamamlanamadı");
      }
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Kayıt tamamlanamadı");
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
            Bilgilerini gir, şifreni belirle. Hepsi bu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-gray-300">Ad</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="pl-10 bg-mancave-bg border-gray-800 text-white"
                />
              </div>
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

          <div className="pt-2 border-t border-gray-800 text-center text-sm text-mancave-muted">
            Hesabın var mı?{" "}
            <Link href="/login" className="text-[#3b82f6] hover:underline">Giriş yap</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
