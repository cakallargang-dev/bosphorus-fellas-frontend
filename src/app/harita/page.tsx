"use client";

/**
 * Harita — canlı konum + konvoy takibi.
 *
 * Leaflet + OpenStreetMap (CartoDB dark tiles): istemciye sızan API anahtarı yok, ücretsiz.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Map as LeafletMap, Marker, Polyline } from "leaflet";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { imgUrl, locationApi, type LiveMember } from "@/lib/api";
import { startTracking, stopTracking } from "@/lib/location";
import { toast } from "sonner";
import { Navigation, Radio, Power, Clock, Locate, RefreshCw } from "lucide-react";

const ISTANBUL = { lat: 41.0082, lng: 28.9784 };

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const h = Math.floor(min / 60);
  return `${h} sa önce`;
}

/** Pin HTML'i — yuvarlak avatar, altında isim etiketi */
function pinHtml(m: LiveMember): string {
  const photo = m.photo ? imgUrl(m.photo) : null;
  const inner = photo
    ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" />`
    : `<span style="font-size:13px;font-weight:700;color:#60a5fa">${m.initials}</span>`;
  const short = m.name.split(" ")[0];
  return `
    <div style="position:relative;width:52px;height:52px">
      <div style="width:46px;height:46px;border-radius:50%;overflow:hidden;border:2.5px solid #60a5fa;
                  background:#0f1d32;display:flex;align-items:center;justify-content:center;
                  box-shadow:0 0 0 3px rgba(59,130,246,.22),0 4px 14px rgba(0,0,0,.65)">${inner}</div>
      <span style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
                   background:#3b82f6;color:#030711;font-size:9px;font-weight:800;
                   padding:1px 7px;border-radius:8px;white-space:nowrap;
                   box-shadow:0 2px 6px rgba(0,0,0,.5)">${short}</span>
    </div>`;
}

function MapContent() {
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const lineRef = useRef<Polyline | null>(null);
  const LRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["live-location"],
    queryFn: () => locationApi.live(),
    refetchInterval: 20_000,
  });

  const members: LiveMember[] = useMemo(() => data?.data ?? [], [data]);

  /* ---------------- Harita kurulumu ---------------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      LRef.current = L;

      const map = L.map(mapEl.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([ISTANBUL.lat, ISTANBUL.lng], 12);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
        attribution: '&copy; OpenStreetMap &copy; CARTO',
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /* ---------------- Pinleri bas ---------------- */
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (lineRef.current) {
      lineRef.current.remove();
      lineRef.current = null;
    }

    const points: [number, number][] = [];

    members.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], {
        icon: L.divIcon({
          html: pinHtml(m),
          className: "",
          iconSize: [52, 52],
          iconAnchor: [26, 26],
        }),
      })
        .addTo(map)
        .on("click", () => setSelected(m.userId));
      markersRef.current.push(marker);
      points.push([m.lat, m.lng]);
    });

    if (myPos) {
      const me = L.marker([myPos.lat, myPos.lng], {
        icon: L.divIcon({
          html: `<div style="width:18px;height:18px;border-radius:50%;background:#22c55e;
                 border:3px solid #030711;box-shadow:0 0 0 4px rgba(34,197,94,.3)"></div>`,
          className: "",
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      }).addTo(map);
      markersRef.current.push(me);
      points.unshift([myPos.lat, myPos.lng]);
    }

    if (points.length > 1) {
      lineRef.current = L.polyline(points, {
        color: "#3b82f6",
        weight: 2,
        opacity: 0.5,
        dashArray: "6 8",
      }).addTo(map);
    }

    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points).pad(0.35), { animate: true });
    }
  }, [members, myPos, ready]);

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

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  const centerOn = (lat: number, lng: number) => {
    mapRef.current?.flyTo([lat, lng], 16, { duration: 0.9 });
    setSelected(null);
  };

  const directionsUrl = (m: LiveMember) =>
    `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`;

  return (
    <Layout hideFooter>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="mx-auto max-w-[430px] px-4 pb-28 pt-4">
        <div className="flex flex-col gap-3.5">
          {/* Başlık */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="font-numeric text-[10px] font-bold tracking-[0.26em] text-[#7a8da4]">
                HARİTA
              </span>
              <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-white">
                Konvoy
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => refetch()}
                aria-label="Yenile"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#162544] bg-[#0f1d32]/80 text-[#9fb0c4] backdrop-blur"
              >
                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              </button>
              <span className="flex h-9 items-center gap-1.5 rounded-full border border-[#60a5fa]/30 bg-[#3b82f6]/15 px-3 font-numeric text-[12px] font-bold text-[#60a5fa]">
                <Radio className="h-3 w-3" />
                {members.length}
              </span>
            </div>
          </div>

          {/* Harita */}
          <div className="relative h-[420px] w-full overflow-hidden rounded-[26px] border border-[#1d3157] bg-[#0a1628]">
            <div ref={mapEl} className="absolute inset-0 z-0" />

            <style jsx global>{`
              .leaflet-container {
                background: #0a1628;
                font-family: inherit;
              }
              .leaflet-control-attribution {
                background: rgba(3, 7, 17, 0.72) !important;
                color: #6b7d94 !important;
                font-size: 9px !important;
              }
              .leaflet-control-attribution a {
                color: #7a8da4 !important;
              }
              .leaflet-bar a {
                background: #0f1d32 !important;
                color: #9fb0c4 !important;
                border-color: #1d3157 !important;
              }
              .leaflet-bar a:hover {
                background: #162544 !important;
                color: #60a5fa !important;
              }
            `}</style>

            <button
              onClick={() => (sharing ? stopSharing() : startSharing())}
              disabled={busy}
              className={`absolute left-3 top-3 z-20 flex h-11 items-center gap-2 rounded-[18px] px-4 text-[13px] font-bold backdrop-blur-md transition disabled:opacity-60 ${
                sharing
                  ? "border border-[#22c55e]/50 bg-[#030711]/78 text-[#22c55e]"
                  : "border border-[#1d3157] bg-[#030711]/78 text-white"
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              {sharing ? "Paylaşılıyor" : busy ? "Açılıyor…" : "Konumumu paylaş"}
            </button>

            {myPos && (
              <button
                onClick={() => centerOn(myPos.lat, myPos.lng)}
                aria-label="Konumuma dön"
                className="absolute bottom-3 left-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-[#1d3157] bg-[#030711]/80 text-[#60a5fa] backdrop-blur-md"
              >
                <Locate className="h-4 w-4" />
              </button>
            )}

            {members.length === 0 && (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 rounded-[18px] border border-[#162544] bg-[#030711]/88 px-4 py-3 text-center backdrop-blur-md">
                <p className="text-[12.5px] font-semibold text-white">Kimse konum paylaşmıyor</p>
                <p className="mt-0.5 text-[11px] text-[#7a8da4]">
                  Düğmeyle aç — diğer üyeler de açınca burada görünür
                </p>
              </div>
            )}
          </div>

          {/* Canlı liste */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#7a8da4]">
                Canlı konumdakiler
              </span>
              <span className="font-numeric text-[11.5px] text-[#6b7d94]">
                {members.length} kişi
              </span>
            </div>

            {members.length === 0 ? (
              <div className="flex h-[110px] flex-col items-center justify-center gap-1.5 rounded-[22px] border border-dashed border-[#1d3157] text-[12.5px] text-[#7a8da4]">
                <Radio className="h-5 w-5 text-[#2a3a54]" />
                Şu an paylaşan yok
              </div>
            ) : (
              members.map((m) => (
                <div
                  key={m.userId}
                  className={`flex items-center gap-3 rounded-[20px] border p-2.5 transition ${
                    selected === m.userId
                      ? "border-[#3b82f6]/60 bg-[#3b82f6]/10"
                      : "border-[#162544] bg-[#0f1d32]/70"
                  }`}
                >
                  <button
                    onClick={() => centerOn(m.lat, m.lng)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border border-[#1d3157] bg-[#0a1628]">
                      {m.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imgUrl(m.photo)}
                          alt={m.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-[13px] font-bold text-[#60a5fa]">
                          {m.initials}
                        </span>
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-[13.5px] font-semibold text-white">
                        {m.name}
                      </span>
                      <span className="truncate text-[11px] text-[#9fb0c4]">{m.car}</span>
                      <span className="flex items-center gap-1 text-[10px] text-[#6b7d94]">
                        <Clock className="h-2.5 w-2.5" />
                        {fmtAgo(m.updatedAt)}
                        {m.plateNumber ? ` · ${m.plateNumber}` : ""}
                      </span>
                    </div>
                  </button>
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

          <p className="px-1 text-[10.5px] leading-relaxed text-[#6b7d94]">
            Konum yalnızca paylaşım açıkken ve son 10 dakikada görünür. PWA&apos;da uygulama arka
            plana düşünce paylaşım durur.{" "}
            <Link href="/ekip" className="text-[#60a5fa]">
              Ekip
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
