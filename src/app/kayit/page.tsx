"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Ticket, Clock, ArrowRight } from "lucide-react";

const steps = [
  { icon: Ticket, title: "Referans kodu", text: "Bir üyeden davet kodu al." },
  { icon: ShieldCheck, title: "Başvuru formu", text: "Bilgilerini doldur, şifreni belirle." },
  { icon: Clock, title: "Yönetim onayı", text: "Numaran kontrol edilir, hesabın açılır." },
];

export default function KayitPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-mancave-bg">
      <Card className="w-full max-w-md bg-mancave-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-xl">Üyelik Başvurusu</CardTitle>
          <CardDescription className="text-mancave-muted">
            Kulübe katılım referans kodu ve yönetim onayı ile oluyor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={s.title} className="flex items-start gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-[#3b82f6]" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">
                    {i + 1}. {s.title}
                  </p>
                  <p className="text-xs text-mancave-muted">{s.text}</p>
                </div>
              </div>
            ))}
          </div>

          <Link href="/apply" className="block">
            <Button className="w-full gap-2">
              Başvuruya Başla <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          <div className="pt-2 border-t border-gray-800 text-center text-sm text-mancave-muted">
            Hesabın var mı?{" "}
            <Link href="/login" className="text-[#3b82f6] hover:underline">Giriş yap</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
