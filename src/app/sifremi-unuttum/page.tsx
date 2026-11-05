"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, ArrowLeft } from "lucide-react";

const ADMIN_PHONE = "905387735758";

export default function SifremiUnuttumPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-mancave-bg">
      <Card className="w-full max-w-md bg-mancave-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-xl">Şifremi Unuttum</CardTitle>
          <CardDescription className="text-mancave-muted">
            Şifreni yönetim sıfırlıyor, 1 dakikada hallederiz.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-mancave-muted leading-relaxed">
            Kayıtlı telefon numaranı yazıp bize ulaş; yönetim şifreni sıfırlayıp sana iletecek.
          </p>

          <a
            href={`https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(
              "Merhaba, Bosphorus Fellas şifremi sıfırlatmak istiyorum. Telefon numaram: "
            )}`}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <Button className="w-full gap-2">
              <MessageCircle className="w-4 h-4" /> WhatsApp&apos;tan Yaz
            </Button>
          </a>

          <a href={`tel:+${ADMIN_PHONE}`} className="block">
            <Button variant="outline" className="w-full gap-2">
              <Phone className="w-4 h-4" /> 0538 773 57 58
            </Button>
          </a>

          <div className="pt-3 border-t border-gray-800 text-center">
            <Link href="/login" className="text-sm text-mancave-muted hover:text-white inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Girişe dön
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
