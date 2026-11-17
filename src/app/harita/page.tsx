"use client";

/**
 * Harita — etkinlik pinleri + canlı konum paylaşımı.
 *
 * Neden Leaflet: Google Maps API anahtarı istemciye sızdırılmadan, tamamen ücretsiz.
 * Karolar OpenStreetMap; pinler marka diline uygun (mavi accent).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { imgUrl, locationApi, type LiveMember } from "@/lib/api";
import { startTracking, stopTracking, isNative } from "@/lib/location";
import { toast } from "sonner";
import { MapPin, Navigation, Radio, Power, Users, Clock } from "lucide-react";

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const h = Math.floor(min / 60);
  return `${h} sa önce`;
}

function MapContent() {
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ["live-location"],
    queryFn: () => locationApi.live(),
    refetchInterval: sharing ? 15_000 : 60_000,
  });

  const members: LiveMember[] = useMemo(() => data?.data ?? [], [data]);

  /* ---------------- Konum gönderimi ---------------- */

  const startSharing = useCallback(async () => {
    setBusy(true);
    try {
      await startTracking((p) => setMyPos({ lat: p.lat, lng: p.lng }));
      setSharing(true);
      toast.success("Konum paylaşımı açık");
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Konum alınamadı");
      await stopTracking();
    } finally {
      setBusy(false);
    }
  }, [refetch]);

  const stopSharing = useCallback(async () => {
    await stopTracking();
    setSharing(false);
    try {
      await locationApi.stop();
    } catch {
      /* yut */
    }
    refetch();
  }, [refetch]);

  // Sayfadan çıkınca takibi bırak (paylaşım sunucuda açık kalır — kullanıcı kapatır)
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  /* ---------------- Yol tarifi ---------------- */

  const directionsUrl = (m: LiveMember) =>
    `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`;

  return (
    <Layout>
      <div className="mx-auto max-w-[430px] px-5 pb-28 pt-6">
        <div className="flex flex-col gap-5">
          {/* Başlık */}
          <div className="flex flex-col gap-1.5">
            <span className="font-numeric text-[12px] font-bold tracking-[0.24em] text-[#7a8da4]">
              HARİTA
            </span>
            <div className="flex items-center justify-between">
              <h1 className="font-display text-[30px] font-bold leading-tight tracking-tight text-white">
                Konvoy
              </h1>
              <span className="flex items-center gap-1.5 rounded-[14px] border border-[#60a5fa]/30 bg-[#3b82f6]/15 px-2.5 py-1 font-numeric text-[12px] font-bold text-[#60a5fa]">
                <Radio className="h-3 w-3" />
                {members.length} canlı
              </span>
            </div>
            <div className="mt-1 h-[1.5px] w-full bg-gradient-to-r from-[#3b82f6]/70 via-[#162544] to-transparent" />
          </div>

          {/* Paylaşım kartı */}
          <div
            className="flex flex-col gap-3 rounded-[22px] border p-4"
            style={{
              background: "linear-gradient(180deg,#0f1d32,#0a1628)",
              borderColor: sharing ? "rgba(59,130,246,.45)" : "#162544",
            }}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  sharing ? "bg-[#3b82f6]/20" : "bg-[#162544]/60"
                }`}
              >
                <Navigation
                  className={`h-5 w-5 ${sharing ? "text-[#60a5fa]" : "text-[#7a8da4]"}`}
                />
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15px] font-semibold text-white">Konum paylaşımı</span>
                <span className="truncate text-[12px] text-[#9fb0c4]">
                  {sharing
                    ? myPos
                      ? `${myPos.lat.toFixed(4)}, ${myPos.lng.toFixed(4)}`
                      : "Konum alınıyor…"
                    : "Kapalı — kimse konumunu görmüyor"}
                </span>
              </div>
              <button
                onClick={() => (sharing ? stopSharing() : startSharing())}
                disabled={busy}
                aria-pressed={sharing}
                className={`flex h-10 items-center gap-1.5 rounded-[16px] px-3.5 text-[13px] font-bold transition disabled:opacity-50 ${
                  sharing
                    ? "border border-[#3a1c1c] text-red-400 hover:bg-red-500/10"
                    : "bg-gradient-to-br from-[#3b82f6] to-[#60a5fa] text-[#030711] shadow-[0_6px_20px_rgba(59,130,246,.35)]"
                }`}
              >
                <Power className="h-3.5 w-3.5" />
                {sharing ? "Durdur" : busy ? "..." : "Aç"}
              </button>
            </div>

            <div className="relative h-[210px] w-full overflow-hidden rounded-[18px] border border-[#162544]">
              <iframe
                title="Harita"
                className="absolute inset-0 h-full w-full"
                style={{ border: 0, filter: "invert(1) hue-rotate(180deg) saturate(.85) brightness(.92)" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                  (myPos?.lng ?? 28.97) - 0.06
                }%2C${(myPos?.lat ?? 41.01) - 0.045}%2C${(myPos?.lng ?? 28.97) + 0.06}%2C${
                  (myPos?.lat ?? 41.01) + 0.045
                }&layer=mapnik${myPos ? `&marker=${myPos.lat}%2C${myPos.lng}` : ""}`}
              />
            </div>

            {myPos && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${myPos.lat},${myPos.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#162544] text-[12.5px] font-semibold text-[#9fb0c4] transition hover:border-[#3b82f6]/50 hover:text-[#60a5fa]"
              >
                <MapPin className="h-3.5 w-3.5" />
                Haritada aç
              </a>
            )}
          </div>

          {/* Canlı üyeler */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-[#60a5fa]" />
              <span className="text-[13px] font-semibold text-white">Canlı konumdakiler</span>
            </div>

            {members.length === 0 ? (
              <div className="flex h-[140px] flex-col items-center justify-center gap-2 rounded-[22px] border border-dashed border-[#1d3157] text-[13px] text-[#7a8da4]">
                <Radio className="h-6 w-6 text-[#2a3a54]" />
                Şu an konum paylaşan yok
              </div>
            ) : (
              members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center gap-3 rounded-[20px] border border-[#162544] bg-[#0f1d32]/70 p-3"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#1d3157] bg-[#0a1628]">
                    {m.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imgUrl(m.photo)}
                        alt={m.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[14px] font-bold text-[#60a5fa]">
                        {m.initials}
                      </span>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-[14px] font-semibold text-white">{m.name}</span>
                    <span className="truncate text-[11.5px] text-[#9fb0c4]">{m.car}</span>
                    <span className="flex items-center gap-1 text-[10.5px] text-[#6b7d94]">
                      <Clock className="h-2.5 w-2.5" />
                      {fmtAgo(m.updatedAt)}
                      {m.plateNumber ? ` · ${m.plateNumber}` : ""}
                    </span>
                  </div>
                  <a
                    href={directionsUrl(m)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${m.name} için yol tarifi`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#162544] text-[#60a5fa] transition hover:bg-[#3b82f6]/15"
                  >
                    <Navigation className="h-4 w-4" />
                  </a>
                </div>
              ))
            )}
          </div>

          <p className="px-1 text-[11px] leading-relaxed text-[#6b7d94]">
            Konumun yalnızca paylaşımı açıkken ve son 10 dakika içinde görünür. Durdurduğunda
            listeden kalkarsın.{" "}
            <Link href="/ekip" className="text-[#60a5fa]">
              Ekip sayfası
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default function MapPage() {
  return (
    <AuthGuard>
      <MapContent />
    </AuthGuard>
  );
}
