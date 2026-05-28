"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { applicationsApi, referansApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { Layout } from "@/components/Layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Car,
  AtSign,
  Briefcase,
  FileText,
  Heart,
  Send,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Ticket,
  Loader2,
  TicketX,
} from "lucide-react";

// ─── Car Data ───────────────────────────────────────────────────────────────

const CAR_BRANDS: Record<string, string[]> = {
  "Alfa Romeo": ["Giulia", "Stelvio", "Tonale"],
  "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "Q3", "Q5", "Q7", "Q8", "RS3", "RS4", "RS5", "RS6", "RS7", "R8", "TT", "e-tron GT"],
  "BMW": ["1 Serisi", "2 Serisi", "3 Serisi", "4 Serisi", "5 Serisi", "6 Serisi", "7 Serisi", "X1", "X3", "X4", "X5", "X6", "X7", "M2", "M3", "M4", "M5", "M8", "Z4"],
  "Mercedes": ["A Serisi", "C Serisi", "E Serisi", "S Serisi", "CLA", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "AMG GT", "EQS"],
  "Porsche": ["718 Cayman", "911 Carrera", "911 Turbo", "911 GT3", "Panamera", "Cayenne", "Macan", "Taycan"],
  "Volkswagen": ["Golf", "Polo", "Passat", "Arteon", "Tiguan", "T-Roc", "Touareg", "Scirocco"],
  "Toyota": ["Corolla", "Camry", "Yaris", "C-HR", "RAV4", "Land Cruiser", "Supra", "GR86", "GT86"],
  "Honda": ["Civic", "Accord", "CR-V", "HR-V", "Jazz", "NSX", "S2000", "Type R"],
  "Ford": ["Focus", "Fiesta", "Mondeo", "Kuga", "Puma", "Mustang", "Ranger"],
  "Nissan": ["Micra", "Juke", "Qashqai", "X-Trail", "370Z", "GT-R"],
  "Mazda": ["Mazda3", "Mazda6", "CX-3", "CX-5", "CX-30", "MX-5"],
  "Tesla": ["Model 3", "Model Y", "Model S", "Model X"],
  "Ferrari": ["Roma", "F8 Tributo", "SF90 Stradale", "296 GTB", "812 Superfast"],
  "Lamborghini": ["Huracan", "Aventador", "Urus", "Revuelto"],
  "Subaru": ["Impreza", "WRX", "BRZ", "Forester", "Outback"],
  "Volvo": ["S60", "S90", "V60", "V90", "XC40", "XC60", "XC90"],
  "Hyundai": ["i10", "i20", "i30", "Bayon", "Kona", "Tucson", "IONIQ 5", "IONIQ 6"],
  "Renault": ["Clio", "Megane", "Talisman", "Kadjar", "Captur", "Arkana"],
  "Diğer": [],
};

// ─── Schema ──────────────────────────────────────────────────────────────────

const applySchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
  email: z.string().min(1, "E-posta zorunludur").email("Geçerli bir e-posta giriniz"),
  phone: z
    .string()
    .min(10, "Geçerli bir telefon numarası giriniz")
    .regex(/^[0-9+\s()-]{10,}$/, "Geçerli bir telefon numarası giriniz"),
  birthDate: z.string().min(1, "Doğum tarihi zorunludur"),
  city: z.string().min(2, "Şehir zorunludur"),
  carBrand: z.string().min(2, "Araç markası zorunludur"),
  carModel: z.string().min(1, "Araç modeli zorunludur"),
  carYear: z
    .string()
    .min(4, "Geçerli bir yıl giriniz")
    .regex(/^\d{4}$/, "Geçerli bir yıl giriniz (örn: 2020)"),
  plateNumber: z.string().optional(),
  instagram: z.string().optional(),
  occupation: z.string().optional(),
  about: z.string().min(20, "Kendinizden en az 20 karakter bahsediniz"),
  expectation: z.string().optional(),
  referansKodu: z.string().min(1, "Referans kodu zorunludur"),
  photo: z.any().optional(),
});

type ApplyFormData = z.infer<typeof applySchema>;

// ─── Step Definitions ───────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Kişisel Bilgiler", icon: User },
  { id: 2, label: "Araç Bilgileri", icon: Car },
  { id: 3, label: "Detaylar", icon: FileText },
];

const PRELIMINARY_STEPS = [
  { id: 1, label: "KVKK", icon: ShieldCheck },
  { id: 2, label: "Referans", icon: Ticket },
  { id: 3, label: "Başvuru Formu", icon: FileText },
];

const PRELIMINARY_MAIN_MAP: Record<number, number> = {
  1: 1, // KVKK → prelim step 1
  2: 2, // Referans → prelim step 2
  3: 3, // Başvuru → prelim step 3 (maps to main form)
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function ApplyPage() {
  // Preliminary flow
  const [preliminaryStep, setPreliminaryStep] = useState(1);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [referenceCode, setReferenceCode] = useState("");
  const [refValidation, setRefValidation] = useState<{
    status: "idle" | "loading" | "valid" | "invalid";
    ownerName?: string;
    error?: string;
  }>({ status: "idle" });

  // Main form
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    mode: "onTouched",
  });

  const selectedCarBrand = watch("carBrand");
  const selectedCarModel = watch("carModel");
  const isCustomBrand = selectedCarBrand === "Diğer";

  const fieldsPerStep: Record<number, (keyof ApplyFormData)[]> = {
    1: ["firstName", "lastName", "email", "phone", "birthDate", "city"],
    2: ["carBrand", "carModel", "carYear"],
    3: ["instagram", "occupation", "about", "expectation"],
  };

  // ── Preliminary navigation ──────────────────────────────────────────────

  const handlePrelimNextKVKK = () => {
    setPreliminaryStep(2);
  };

  const handlePrelimNextReferans = () => {
    if (referenceCode.trim() && refValidation.status === "valid") {
      setValue("referansKodu", referenceCode.trim(), { shouldValidate: true });
      setPreliminaryStep(3);
    }
  };

  // Verify reference code via API
  const handleVerifyCode = async (code: string) => {
    const trimmed = code.trim().toUpperCase();
    setReferenceCode(trimmed);

    if (trimmed.length < 8) {
      setRefValidation({ status: "idle" });
      return;
    }

    setRefValidation({ status: "loading" });

    try {
      const result = await referansApi.verifyCode(trimmed);
      setRefValidation({
        status: "valid",
        ownerName: result.data.ownerName,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Geçersiz referans kodu";
      setRefValidation({ status: "invalid", error: message });
    }
  };

  // ── Main form navigation ────────────────────────────────────────────────

  const handleNext = async () => {
    const fields = fieldsPerStep[step];
    const valid = await trigger(fields);
    if (valid) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const onSubmit = async (data: ApplyFormData) => {
    setIsSubmitting(true);
    try {
      await applicationsApi.submit({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        birthDate: data.birthDate,
        city: data.city,
        carBrand: data.carBrand,
        carModel: data.carModel,
        carYear: parseInt(data.carYear, 10),
        plateNumber: data.plateNumber || undefined,
        instagram: data.instagram || undefined,
        occupation: data.occupation || undefined,
        about: data.about,
        expectation: data.expectation || undefined,
        referansKodu: data.referansKodu || undefined,
        photo: photoFile || undefined,
      } as Parameters<typeof applicationsApi.submit>[0]);
      setIsSuccess(true);
      toast.success("Başvurunuz başarıyla gönderildi!");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Başvuru gönderilirken bir hata oluştu";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Success View ────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center px-4">
          <Card className="w-full max-w-lg bg-gray-900/50 backdrop-blur border-gray-800 text-center">
            <CardContent className="pt-12 pb-10">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Başvurunuz Alındı!
              </h2>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Bosphorus Fellas ailesine katılmak için ilk adımı attınız.
                Başvurunuz yönetim ekibimiz tarafından incelenecek ve en kısa
                sürede size dönüş yapılacaktır.
              </p>

              <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#3b82f6]" />
                  <span className="text-[#3b82f6] text-sm font-medium">
                    Başvuru Durumu
                  </span>
                </div>
                <p className="text-gray-300 text-sm text-left">
                  Başvurular genellikle <strong>2-5 iş günü</strong> içerisinde
                  değerlendirilir. Başvurunuz onaylandığında e-posta adresinize
                  giriş bilgileriniz gönderilecektir.
                </p>
              </div>

              <Button
                onClick={() => {
                  setIsSuccess(false);
                  window.scrollTo(0, 0);
                }}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                Yeni Başvuru
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ── Preliminary Step Indicator ──────────────────────────────────────────

  const renderPreliminarySteps = () => {
    const activeMap: Record<number, number> = { 1: 1, 2: 2, 3: 3 };
    const currentActive = activeMap[preliminaryStep] || 3;

    return (
      <div className="flex items-center justify-center gap-2 mb-10">
        {PRELIMINARY_STEPS.map((ps, idx) => {
          const isActive = ps.id === currentActive;
          const isDone = currentActive > ps.id;
          return (
            <div key={ps.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6]"
                    : isDone
                    ? "bg-green-500/10 border border-green-500/30 text-green-500"
                    : "bg-gray-900/50 border border-gray-800 text-mancave-muted"
                }`}
              >
                <ps.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{ps.label}</span>
              </div>
              {idx < PRELIMINARY_STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-mancave-muted" />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════════════
  // PRELIMINARY STEP 1: KVKK Consent
  // ═══════════════════════════════════════════════════════════════════════

  if (preliminaryStep === 1) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-[#3b82f6]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Üyelik Başvurusu
            </h1>
            <p className="text-mancave-muted">
              Bosphorus Fellas ailesine katılmak için aşağıdaki formu doldurun
            </p>
          </div>

          {/* Preliminary Step Indicators */}
          {renderPreliminarySteps()}

          <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                KVKK Aydınlatma Metni
              </CardTitle>
              <CardDescription className="text-mancave-muted">
                Lütfen aşağıdaki metni okuyun ve kabul edin
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Scrollable KVKK text */}
              <div className="bg-mancave-surface border border-gray-800 rounded-lg p-5 max-h-64 overflow-y-auto text-sm text-gray-300 leading-relaxed">
                <p>
                  6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK)
                  kapsamında, başvuru formunda paylaştığınız kişisel
                  verileriniz (ad, soyad, e-posta, telefon, doğum tarihi,
                  şehir, araç bilgileri, Instagram, meslek ve fotoğraf)
                  Bosphorus Fellas üyelik değerlendirme süreci kapsamında
                  işlenecektir. Verileriniz üçüncü kişilerle
                  paylaşılmayacak olup, üyelik başvurunuzun
                  değerlendirilmesi amacıyla saklanacaktır.
                </p>
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={kvkkAccepted}
                  onChange={(e) => setKvkkAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-700 bg-mancave-surface text-[#3b82f6] focus:ring-[#3b82f6]/50 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors select-none">
                  KVKK Aydınlatma Metni&apos;ni okudum ve kabul ediyorum.
                </span>
              </label>

              {/* Devam button */}
              <Button
                onClick={handlePrelimNextKVKK}
                disabled={!kvkkAccepted}
                className="w-full bg-[#3b82f6] text-black hover:bg-[#60a5fa] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Devam
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PRELIMINARY STEP 2: Reference Code
  // ═══════════════════════════════════════════════════════════════════════

  if (preliminaryStep === 2) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mb-4">
              <Heart className="w-7 h-7 text-[#3b82f6]" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Üyelik Başvurusu
            </h1>
            <p className="text-mancave-muted">
              Bosphorus Fellas ailesine katılmak için aşağıdaki formu doldurun
            </p>
          </div>

          {/* Preliminary Step Indicators */}
          {renderPreliminarySteps()}

          <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">
                Referans Kodu
              </CardTitle>
              <CardDescription className="text-mancave-muted">
                Başvuru yapabilmek için bir üyemizin referans koduna ihtiyacınız var
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="prelimRefCode" className="text-gray-300">
                  Referans Kodu <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="prelimRefCode"
                  placeholder="8 haneli referans kodunu giriniz"
                  value={referenceCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setReferenceCode(val);
                    if (val.length >= 8) {
                      handleVerifyCode(val);
                    } else {
                      setRefValidation({ status: "idle" });
                    }
                  }}
                  maxLength={8}
                  className="bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50 uppercase"
                />

                {/* Validation status */}
                {refValidation.status === "loading" && (
                  <p className="text-[#3b82f6] text-xs flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Kod kontrol ediliyor...
                  </p>
                )}
                {refValidation.status === "valid" && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-green-400 text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Geçerli referans kodu
                    </p>
                    {refValidation.ownerName && (
                      <p className="text-green-400/70 text-xs mt-1">
                        Davet eden: {refValidation.ownerName}
                      </p>
                    )}
                  </div>
                )}
                {refValidation.status === "invalid" && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm flex items-center gap-1.5">
                      <TicketX className="w-4 h-4" />
                      {refValidation.error || "Geçersiz referans kodu"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handlePrelimNextReferans}
                  disabled={refValidation.status !== "valid"}
                  className="w-full bg-[#3b82f6] text-black hover:bg-[#60a5fa] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Devam
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MAIN FORM (preliminaryStep === 3)
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-14 h-14 rounded-full bg-[#3b82f6]/10 flex items-center justify-center mb-4">
            <Heart className="w-7 h-7 text-[#3b82f6]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Üyelik Başvurusu
          </h1>
          <p className="text-mancave-muted">
            Bosphorus Fellas ailesine katılmak için aşağıdaki formu doldurun
          </p>
        </div>

        {/* Preliminary Step Indicators */}
        {renderPreliminarySteps()}

        {/* Main form step indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  step === s.id
                    ? "bg-[#3b82f6]/10 border border-[#3b82f6]/30 text-[#3b82f6]"
                    : step > s.id
                    ? "bg-green-500/10 border border-green-500/30 text-green-500"
                    : "bg-gray-900/50 border border-gray-800 text-mancave-muted"
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-mancave-muted" />
              )}
            </div>
          ))}
        </div>

        <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              {STEPS[step - 1].label}
            </CardTitle>
            <CardDescription className="text-mancave-muted">
              {step === 1 && "Kişisel bilgilerinizi giriniz"}
              {step === 2 && "Aracınız hakkında bilgi veriniz"}
              {step === 3 && "Kendinizden bahsedin ve fotoğrafınızı yükleyin"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* STEP 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-300">
                        Ad <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        placeholder="Adınız"
                        className="bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50"
                        {...register("firstName")}
                      />
                      {errors.firstName && (
                        <p className="text-red-400 text-xs">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-300">
                        Soyad <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        placeholder="Soyadınız"
                        className="bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50"
                        {...register("lastName")}
                      />
                      {errors.lastName && (
                        <p className="text-red-400 text-xs">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">
                        E-posta <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="ornek@email.com"
                          className="pl-10 bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50"
                          {...register("email")}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-red-400 text-xs">{errors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">
                        Telefon <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                        <Input
                          id="phone"
                          placeholder="0555 555 55 55"
                          className="pl-10 bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50"
                          {...register("phone")}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-red-400 text-xs">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate" className="text-gray-300">
                        Doğum Tarihi <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                        <Input
                          id="birthDate"
                          type="date"
                          className="pl-10 bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50 [color-scheme:dark]"
                          {...register("birthDate")}
                        />
                      </div>
                      {errors.birthDate && (
                        <p className="text-red-400 text-xs">{errors.birthDate.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-gray-300">
                        Şehir <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                        <Input
                          id="city"
                          placeholder="İstanbul"
                          className="pl-10 bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50"
                          {...register("city")}
                        />
                      </div>
                      {errors.city && (
                        <p className="text-red-400 text-xs">{errors.city.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Car Info */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Car Brand */}
                    <div className="space-y-2">
                      <Label htmlFor="carBrand" className="text-gray-300">
                        Marka <span className="text-red-400">*</span>
                      </Label>
                      <Select
                        value={selectedCarBrand || ""}
                        onValueChange={(value) => {
                          setValue("carBrand", value || "", { shouldValidate: true });
                          setValue("carModel", "", { shouldValidate: false });
                        }}
                      >
                        <SelectTrigger
                          className="w-full bg-mancave-surface border-gray-800 text-white data-placeholder:text-mancave-muted focus:border-[#3b82f6]/50 pl-10"
                        >
                          <Car className="absolute left-3 w-4 h-4 text-mancave-muted" />
                          <SelectValue placeholder="Marka seçiniz" />
                        </SelectTrigger>
                        <SelectContent className="bg-mancave-card border-gray-800 text-white max-h-60">
                          {Object.keys(CAR_BRANDS).map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.carBrand && (
                        <p className="text-red-400 text-xs">{errors.carBrand.message}</p>
                      )}
                    </div>

                    {/* Car Model */}
                    <div className="space-y-2">
                      <Label htmlFor="carModel" className="text-gray-300">
                        Model <span className="text-red-400">*</span>
                      </Label>
                      {selectedCarBrand && !isCustomBrand ? (
                        <Select
                          value={selectedCarModel || ""}
                          onValueChange={(value) => {
                            setValue("carModel", value || "", { shouldValidate: true });
                          }}
                        >
                          <SelectTrigger className="w-full bg-mancave-surface border-gray-800 text-white data-placeholder:text-mancave-muted focus:border-[#3b82f6]/50">
                            <SelectValue placeholder="Model seçiniz" />
                          </SelectTrigger>
                          <SelectContent className="bg-mancave-card border-gray-800 text-white max-h-60">
                            {(CAR_BRANDS[selectedCarBrand] || []).map((model) => (
                              <SelectItem key={model} value={model}>
                                {model}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id="carModel"
                          placeholder={isCustomBrand ? "Model giriniz" : "Önce marka seçiniz"}
                          disabled={!isCustomBrand && !selectedCarBrand}
                          className="bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50 disabled:opacity-50"
                          value={selectedCarModel || ""}
                          onChange={(e) =>
                            setValue("carModel", e.target.value, { shouldValidate: true })
                          }
                        />
                      )}
                      {errors.carModel && (
                        <p className="text-red-400 text-xs">{errors.carModel.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Car Year */}
                    <div className="space-y-2">
                      <Label htmlFor="carYear" className="text-gray-300">
                        Yıl <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="carYear"
                        placeholder="2024"
                        maxLength={4}
                        className="bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50"
                        {...register("carYear")}
                      />
                      {errors.carYear && (
                        <p className="text-red-400 text-xs">{errors.carYear.message}</p>
                      )}
                    </div>

                    {/* Plate Number */}
                    <div className="space-y-2">
                      <Label htmlFor="plateNumber" className="text-gray-300">
                        Araç Plakası
                      </Label>
                      <Input
                        id="plateNumber"
                        placeholder="34 ABC 123"
                        className="bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50 uppercase"
                        {...register("plateNumber")}
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-mancave-surface border border-gray-800">
                    <div className="flex items-start gap-3">
                      <Car className="w-5 h-5 text-[#3b82f6] mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-300 font-medium">
                          Aracınız kulübümüzün bir parçası
                        </p>
                        <p className="text-xs text-mancave-muted mt-1">
                          Bosphorus Fellas&apos;ta her marka ve model araca açığız.
                          Önemli olan otomobil tutkusu!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Details + Photo */}
              {step === 3 && (
                <div className="space-y-4 animate-in fade-in-50 slide-in-from-right-2 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="instagram" className="text-gray-300">
                        Instagram
                      </Label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                        <Input
                          id="instagram"
                          placeholder="kullaniciadi"
                          className="pl-10 bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50"
                          {...register("instagram")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupation" className="text-gray-300">
                        Meslek
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mancave-muted" />
                        <Input
                          id="occupation"
                          placeholder="Yazılım Mühendisi"
                          className="pl-10 bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50"
                          {...register("occupation")}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about" className="text-gray-300">
                      Kendinden Bahset <span className="text-red-400">*</span>
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-mancave-muted" />
                      <Textarea
                        id="about"
                        placeholder="Bize kendinden, otomobil tutkundan ve neden aramıza katılmak istediğinden bahset..."
                        rows={4}
                        className="pl-10 bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50 resize-none"
                        {...register("about")}
                      />
                    </div>
                    {errors.about && (
                      <p className="text-red-400 text-xs">{errors.about.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectation" className="text-gray-300">
                      Kulüpten Beklentilerin
                    </Label>
                    <Textarea
                      id="expectation"
                      placeholder="Bu kulüpte neler yapmak, nasıl katkıda bulunmak istersin?"
                      rows={3}
                      className="bg-mancave-surface border-gray-800 text-white placeholder:text-mancave-muted focus:border-[#3b82f6]/50 resize-none"
                      {...register("expectation")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300">Fotoğraf</Label>
                    <FileUpload
                      value={photoFile}
                      onChange={setPhotoFile}
                      label="Profil fotoğrafınızı yükleyin"
                    />
                    <p className="text-xs text-mancave-muted">
                      Yüzünüzün net göründüğü bir fotoğraf tercih ediniz
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Geri
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-[#3b82f6] text-black hover:bg-[#60a5fa] font-medium"
                  >
                    İleri
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#3b82f6] text-black hover:bg-[#60a5fa] font-medium"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Gönderiliyor...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Başvuruyu Gönder
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
