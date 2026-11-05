"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink, Copy, X } from "lucide-react";

type Props = {
  onClose: () => void;
};

/** iOS Safari / Android Chrome'da açmayı dener. */
function openExternal(): boolean {
  const url = window.location.href;
  const ua = navigator.userAgent;
  try {
    if (/Android/i.test(ua)) {
      const bare = url.replace(/^https?:\/\//, "");
      window.location.href = `intent://${bare}#Intent;scheme=https;package=com.android.chrome;end`;
      return true;
    }
    if (/iPhone|iPad|iPod/i.test(ua)) {
      // iOS'ta uygulama içi tarayıcıdan Safari'yi açmanın çalışan yolu
      window.location.href = `x-safari-${url}`;
      return true;
    }
  } catch {}
  return false;
}

/**
 * Instagram / Telegram / Facebook gibi uygulama içi tarayıcılarda
 * reCAPTCHA çalışmadığı için Firebase telefon doğrulaması (SMS)
 * gönderilemiyor. Kullanıcıyı sistem tarayıcısına yönlendirir.
 */
export function InAppBrowserNotice({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#e6eaf3] bg-white p-5 text-left">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-[#0f1420] font-semibold text-lg leading-tight">
            SMS için tarayıcı gerekiyor
          </h2>
          <button onClick={onClose} aria-label="Kapat" className="text-[#6b7688] hover:text-[#0f1420]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-[#6b7688] leading-relaxed">
          Şu an Instagram / Telegram gibi bir uygulamanın iç tarayıcısındasınız. Bu tarayıcılar
          güvenlik doğrulamasını (reCAPTCHA) engellediği için SMS kodu gönderilemiyor.
        </p>

        <ol className="mt-3 space-y-1 text-sm text-[#6b7688] list-decimal list-inside">
          <li>Aşağıdaki butona bas → sayfa Safari/Chrome&apos;da açılır</li>
          <li>Aynı numarayı gir, kodu gönder</li>
          <li>Gelen 6 haneli kodu yaz</li>
        </ol>

        <Button
          onClick={() => {
            if (!openExternal()) {
              toast.error("Tarayıcı açılamadı. Adresi kopyalayıp Safari/Chrome'a yapıştırın.");
            }
          }}
          className="w-full mt-4 gap-2"
        >
          <ExternalLink className="w-4 h-4" /> Tarayıcıda Aç
        </Button>

        <Button
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              toast.success("Bağlantı kopyalandı — Safari/Chrome'a yapıştırın");
            } catch {
              toast.error("Kopyalanamadı. Adres çubuğundaki linki elle kopyalayın.");
            }
          }}
          className="w-full mt-2 gap-2"
        >
          <Copy className="w-4 h-4" /> Bağlantıyı Kopyala
        </Button>

        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-[#6b7688] hover:text-[#0f1420]"
        >
          Yine de dene
        </button>
      </div>
    </div>
  );
}
