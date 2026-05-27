"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { applicationsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "@/components/FileUpload";
import { Layout } from "@/components/Layout";
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
} from "lucide-react";

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
  instagram: z.string().optional(),
  occupation: z.string().optional(),
  about: z.string().min(20, "Kendinizden en az 20 karakter bahsediniz"),
  expectation: z.string().optional(),
  photo: z.any().optional(),
});

type ApplyFormData = z.infer<typeof applySchema>;

const STEPS = [
  { id: 1, label: "Kişisel Bilgiler", icon: User },
  { id: 2, label: "Araç Bilgileri", icon: Car },
  { id: 3, label: "Detaylar", icon: FileText },
];

export default function ApplyPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<ApplyFormData>({
    resolver: zodResolver(applySchema),
    mode: "onTouched",
  });

  const fieldsPerStep: Record<number, (keyof ApplyFormData)[]> = {
    1: ["firstName", "lastName", "email", "phone", "birthDate", "city"],
    2: ["carBrand", "carModel", "carYear"],
    3: ["instagram", "occupation", "about", "expectation"],
  };

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
        instagram: data.instagram || undefined,
        occupation: data.occupation || undefined,
        about: data.about,
        expectation: data.expectation || undefined,
        photo: photoFile || undefined,
      });
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

              <div className="bg-[#d4a853]/10 border border-[#d4a853]/20 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#d4a853]" />
                  <span className="text-[#d4a853] text-sm font-medium">
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

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="mx-auto w-14 h-14 rounded-full bg-[#d4a853]/10 flex items-center justify-center mb-4">
            <Heart className="w-7 h-7 text-[#d4a853]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Üyelik Başvurusu
          </h1>
          <p className="text-gray-500">
            Bosphorus Fellas ailesine katılmak için aşağıdaki formu doldurun
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  step === s.id
                    ? "bg-[#d4a853]/10 border border-[#d4a853]/30 text-[#d4a853]"
                    : step > s.id
                    ? "bg-green-500/10 border border-green-500/30 text-green-500"
                    : "bg-gray-900/50 border border-gray-800 text-gray-600"
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-700" />
              )}
            </div>
          ))}
        </div>

        <Card className="bg-gray-900/50 backdrop-blur border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              {STEPS[step - 1].label}
            </CardTitle>
            <CardDescription className="text-gray-500">
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
                        className="bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50"
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
                        className="bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50"
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
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="ornek@email.com"
                          className="pl-10 bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50"
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
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <Input
                          id="phone"
                          placeholder="0555 555 55 55"
                          className="pl-10 bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50"
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
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <Input
                          id="birthDate"
                          type="date"
                          className="pl-10 bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50 [color-scheme:dark]"
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
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <Input
                          id="city"
                          placeholder="İstanbul"
                          className="pl-10 bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50"
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="carBrand" className="text-gray-300">
                        Marka <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <Input
                          id="carBrand"
                          placeholder="BMW"
                          className="pl-10 bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50"
                          {...register("carBrand")}
                        />
                      </div>
                      {errors.carBrand && (
                        <p className="text-red-400 text-xs">{errors.carBrand.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carModel" className="text-gray-300">
                        Model <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="carModel"
                        placeholder="M4 Competition"
                        className="bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50"
                        {...register("carModel")}
                      />
                      {errors.carModel && (
                        <p className="text-red-400 text-xs">{errors.carModel.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carYear" className="text-gray-300">
                        Yıl <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        id="carYear"
                        placeholder="2024"
                        maxLength={4}
                        className="bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50"
                        {...register("carYear")}
                      />
                      {errors.carYear && (
                        <p className="text-red-400 text-xs">{errors.carYear.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-[#111] border border-gray-800">
                    <div className="flex items-start gap-3">
                      <Car className="w-5 h-5 text-[#d4a853] mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-300 font-medium">
                          Aracınız kulübümüzün bir parçası
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
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
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <Input
                          id="instagram"
                          placeholder="kullaniciadi"
                          className="pl-10 bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50"
                          {...register("instagram")}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="occupation" className="text-gray-300">
                        Meslek
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                        <Input
                          id="occupation"
                          placeholder="Yazılım Mühendisi"
                          className="pl-10 bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50"
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
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                      <Textarea
                        id="about"
                        placeholder="Bize kendinden, otomobil tutkundan ve neden aramıza katılmak istediğinden bahset..."
                        rows={4}
                        className="pl-10 bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50 resize-none"
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
                      className="bg-[#111] border-gray-800 text-white placeholder:text-gray-600 focus:border-[#d4a853]/50 resize-none"
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
                    <p className="text-xs text-gray-600">
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
                    className="bg-[#d4a853] text-black hover:bg-[#e2c278] font-medium"
                  >
                    İleri
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#d4a853] text-black hover:bg-[#e2c278] font-medium"
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
