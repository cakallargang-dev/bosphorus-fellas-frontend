"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import { applicationsApi, referansApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/FileUpload";
import { Layout } from "@/components/Layout";
import {
  User,
  Phone,
  Lock,
  Calendar,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Ticket,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

const schema = z
  .object({
    firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
    lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
    phone: z
      .string()
      .min(10, "Telefon numarası zorunludur")
      .regex(/^[0-9+\s()-]{10,}$/, "Geçerli bir telefon numarası giriniz"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
    confirmPassword: z.string().min(6, "Şifre tekrarı zorunludur"),
    birthDate: z.string().min(1, "Doğum tarihi zorunludur"),
    district: z.string().min(2, "İlçe zorunludur"),
    referansKodu: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

const INPUT =
  "pl-10 bg-[#0a1628]/80 border-[#162544] text-white text-[13px] placeholder:text-[#5b6b80] focus:border-[#3b82f6]/50 h-[46px] rounded-xl";

export default function ApplyPage() {
  const router = useRouter();
  const [photo, setPhoto] = useState<File | null>(null);
  const [kvkk, setKvkk] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refState, setRefState] = useState<{
    checking: boolean;
    valid: boolean | null;
    message: string;
  }>({ checking: false, valid: null, message: "" });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const refCode = watch("referansKodu");

  // Referans kodu canli kontrol
  useEffect(() => {
    const code = (refCode || "").trim();
    if (code.length < 4) {
      setRefState({ checking: false, valid: null, message: "" });
      return;
    }
    setRefState({ checking: true, valid: null, message: "" });
    const t = setTimeout(async () => {
      try {
        const res = await referansApi.verifyCode(code);
        setRefState({
          checking: false,
          valid: true,
          message: `Referans: ${res.data?.ownerName ?? "geçerli"}`,
        });
      } catch {
        setRefState({ checking: false, valid: false, message: "Kod doğrulanamadı" });
      }
    }, 600);
    return () => clearTimeout(t);
  }, [refCode]);

  const onSubmit = async (data: FormData) => {
    if (!kvkk) {
      toast.error("KVKK aydınlatma metnini onaylamanız gerekiyor");
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("firstName", data.firstName);
      form.append("lastName", data.lastName);
      form.append("phone", data.phone);
      form.append("password", data.password);
      form.append("birthDate", data.birthDate);
      form.append("district", data.district);
      if (data.referansKodu) form.append("referansKodu", data.referansKodu);
      if (photo) form.append("photo", photo);

      await applicationsApi.submit(form as any);
      toast.success("Kaydınız tamamlandı! Şimdi giriş yapabilirsiniz.");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kayıt tamamlanamadı");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-[430px] mx-auto px-4 py-6">
        <div className="mb-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand-wordmark.webp"
            alt="Bosphorus Fellas"
            className="h-9 mx-auto opacity-90 mb-4"
          />
          <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-white">Aramıza Katıl</h1>
          <p className="text-[12px] text-[#7a8da4] mt-1">
            Bosphorus Fellas üyeliği için formu doldur
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Fotoğraf */}
          <div className="space-y-2">
            <Label className="text-[#9fb0c4] text-[11.5px] font-medium">Profil Fotoğrafı</Label>
            <FileUpload
              value={photo}
              onChange={(f) => setPhoto(f)}
              label="Fotoğraf yüklemek için tıklayın"
            />
          </div>

          {/* İsim Soyisim */}
          <div className="space-y-2">
            <Label className="text-[#9fb0c4] text-[11.5px] font-medium">İsim Soyisim</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6b80]" />
                <Input placeholder="Ad" className={INPUT} {...register("firstName")} />
              </div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6b80]" />
                <Input placeholder="Soyad" className={INPUT} {...register("lastName")} />
              </div>
            </div>
            {(errors.firstName || errors.lastName) && (
              <p className="text-red-400 text-[11px]">
                {errors.firstName?.message || errors.lastName?.message}
              </p>
            )}
          </div>

          {/* Doğum tarihi */}
          <div className="space-y-2">
            <Label className="text-[#9fb0c4] text-[11.5px] font-medium">Doğum Tarihi</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6b80]" />
              <Input
                type="date"
                className={`${INPUT} block min-w-0 [color-scheme:dark]`}
                {...register("birthDate")}
              />
            </div>
            {errors.birthDate && (
              <p className="text-red-400 text-[11px]">{errors.birthDate.message}</p>
            )}
          </div>

          {/* İlçe */}
          <div className="space-y-2">
            <Label className="text-[#9fb0c4] text-[11.5px] font-medium">İlçe</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6b80]" />
              <Input placeholder="Kadıköy" className={INPUT} {...register("district")} />
            </div>
            {errors.district && (
              <p className="text-red-400 text-[11px]">{errors.district.message}</p>
            )}
          </div>

          {/* Telefon */}
          <div className="space-y-2">
            <Label className="text-[#9fb0c4] text-[11.5px] font-medium">Telefon</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6b80]" />
              <Input
                inputMode="tel"
                placeholder="0555 555 55 55"
                className={INPUT}
                {...register("phone")}
              />
            </div>
            {errors.phone && <p className="text-red-400 text-[11px]">{errors.phone.message}</p>}
          </div>

          {/* Şifre */}
          <div className="space-y-2">
            <Label className="text-[#9fb0c4] text-[11.5px] font-medium">Şifre</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6b80]" />
              <Input
                type={showPass ? "text" : "password"}
                placeholder="En az 6 karakter"
                className={INPUT}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5b6b80]"
                aria-label="Şifreyi göster"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-[11px]">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-[#9fb0c4] text-[11.5px] font-medium">Şifre Tekrar</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6b80]" />
              <Input
                type={showPass ? "text" : "password"}
                placeholder="Şifreyi tekrar gir"
                className={INPUT}
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-red-400 text-[11px]">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Referans kodu */}
          <div className="space-y-2">
            <Label className="text-[#9fb0c4] text-[11.5px] font-medium">
              Referans Kodu <span className="text-[#5b6b80]">(opsiyonel)</span>
            </Label>
            <div className="relative">
              <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5b6b80]" />
              <Input
                placeholder="BF-XXXX"
                className={`${INPUT} uppercase`}
                {...register("referansKodu")}
              />
            </div>
            {refState.message && (
              <p
                className={`text-[11px] flex items-center gap-1 ${
                  refState.valid ? "text-[#4ade80]" : "text-red-400"
                }`}
              >
                {refState.valid && <Check className="w-3 h-3" />}
                {refState.message}
              </p>
            )}
          </div>

          {/* KVKK */}
          <button
            type="button"
            onClick={() => setKvkk(!kvkk)}
            className="w-full flex items-start gap-2.5 rounded-xl border border-[#162544] bg-[#0a1628]/60 p-3 text-left"
          >
            <span
              className={`mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                kvkk ? "bg-[#3b82f6] border-[#3b82f6]" : "border-[#2a3a54]"
              }`}
            >
              {kvkk && <Check className="w-3 h-3 text-[#030711]" />}
            </span>
            <span className="text-[11.5px] leading-relaxed text-[#9fb0c4]">
              <Link href="/kvkk" target="_blank" className="text-[#60a5fa] underline">
                KVKK Aydınlatma Metni
              </Link>
              &apos;ni okudum, kişisel verilerimin işlenmesini onaylıyorum.
            </span>
          </button>

          <Button
            type="submit"
            disabled={submitting || !kvkk || refState.valid === false}
            className="w-full h-[48px] bg-[#3b82f6] text-white hover:bg-[#2563eb] font-semibold rounded-xl"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Kaydediliyor...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Kayıt Ol
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </Button>

          <p className="text-center text-[12px] text-[#7a8da4]">
            Hesabın var mı?{" "}
            <Link href="/login" className="text-[#60a5fa] font-medium">
              Giriş yap
            </Link>
          </p>

          <p className="text-center text-[10.5px] text-[#4d5c70] flex items-center justify-center gap-1.5 pt-1">
            <ShieldCheck className="w-3 h-3" />
            Bilgileriniz güvenle saklanır
          </p>
        </form>
      </div>
    </Layout>
  );
}
