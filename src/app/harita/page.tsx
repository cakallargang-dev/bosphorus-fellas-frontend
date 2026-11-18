"use client";

/**
 * Harita — canlı konum + konvoy takibi (Mapbox GL JS).
 *
 * Tema: Mapbox `dark-v11` — uygulamanın koyu kobalt paletiyle uyumlu.
 * Public token env'den gelir: NEXT_PUBLIC_MAPBOX_TOKEN.
 * Token yoksa harita yüklenmez, kullanıcıya bilgi verilir (sessiz gri ekran yok).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Map as MapboxMap, Marker } from "mapbox-gl";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { imgUrl, locationApi, type LiveMember } from "@/lib/api";
import { startTracking, stopTracking } from "@/lib/location";
import { toast } from "sonner";
import { Navigation, Radio, Power, Clock, Locate, RefreshCw } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const ISTANBUL = { lat: 41.0082, lng: 28.9784 };

/** Haritanın sabit zoom'u = "konumuma dön" tuşunun kullandığı seviye */
const FOCUS_ZOOM = 16;

function fmtAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "az önce";
  if (min < 60) return `${min} dk önce`;
  const h = Math.floor(min / 60);
  return `${h} sa önce`;
}

/** Pin DOM'u — yuvarlak avatar + isim etiketi */
function pinEl(m: LiveMember): HTMLDivElement {
  const photo = m.photo ? imgUrl(m.photo) : null;
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;width:52px;height:52px;cursor:pointer";
  wrap.innerHTML = `
    <div style="width:46px;height:46px;border-radius:50%;overflow:hidden;border:2.5px solid #60a5fa;
                background:#0f1d32;display:flex;align-items:center;justify-content:center;
                box-shadow:0 0 0 3px rgba(59,130,246,.22),0 4px 14px rgba(0,0,0,.65)">
      ${
        photo
          ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover" />`
          : `<span style="font-size:13px;font-weight:700;color:#60a5fa">${m.initials}</span>`
      }
    </div>
    <span style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);
                 background:#3b82f6;color:#030711;font-size:9px;font-weight:800;
                 padding:1px 7px;border-radius:8px;white-space:nowrap;
                 box-shadow:0 2px 6px rgba(0,0,0,.5)">${m.name.split(" ")[0]}</span>`;
  return wrap;
}

function MapContent() {
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const meMarkerRef = useRef<Marker | null>(null);
  const mbRef = useRef<any>(null);

  const { data, refetch, isFetching } = useQuery({
    queryKey: ["live-location"],
    queryFn: () => locationApi.live(),
    refetchInterval: 5_000,
  });

  const members: LiveMember[] = useMemo(() => data?.data ?? [], [data]);

  /* ---------------- Harita kurulumu ---------------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!MAPBOX_TOKEN) {
        setMapError("Harita yapılandırması eksik (Mapbox token yok)");
        return;
      }

      const mb = (await import("mapbox-gl")).default;
      if (cancelled || !mapEl.current || mapRef.current) return;
      mbRef.current = mb;
      mb.accessToken = MAPBOX_TOKEN;

      const map = new mb.Map({
        container: mapEl.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [ISTANBUL.lng, ISTANBUL.lat],
        zoom: FOCUS_ZOOM,
        attributionControl: false,
      });

      map.addControl(new mb.AttributionControl({ compact: true }), "bottom-left");
      map.addControl(new mb.NavigationControl({ showCompass: false }), "bottom-right");

      map.on("load", () => {
        // Konvoy çizgisi katmanı — veri boşken görünmez
        map.addSource("convoy", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } },
        });
        map.addLayer({
          id: "convoy-line",
          type: "line",
          source: "convoy",
          paint: {
            "line-color": "#3b82f6",
            "line-width": 2,
            "line-opacity": 0.55,
            "line-dasharray": [2, 2],
          },
        });
        setMapReady(true);
      });

      map.on("error", (e: any) => {
        const msg = String(e?.error?.message || "");
        if (/token|unauthorized|401|403/i.test(msg)) {
          setMapError("Mapbox token geçersiz veya URL kısıtı engelliyor");
        }
      });

      mapRef.current = map;
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
    const mb = mbRef.current;
    const map = mapRef.current;
    if (!mb || !map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const coords: [number, number][] = [];

    members.forEach((m) => {
      const marker = new mb.Marker({ element: pinEl(m), anchor: "center" })
        .setLngLat([m.lng, m.lat])
        .addTo(map);
      marker.getElement().addEventListener("click", () => setSelected(m.userId));
      markersRef.current.push(marker);
      coords.push([m.lng, m.lat]);
    });

    // Kendi konumum
    if (myPos) {
      if (meMarkerRef.current) meMarkerRef.current.remove();
      const dot = document.createElement("div");
      dot.style.cssText =
        "width:18px;height:18px;border-radius:50%;background:#22c55e;border:3px solid #030711;" +
        "box-shadow:0 0 0 4px rgba(34,197,94,.3)";
      meMarkerRef.current = new mb.Marker({ element: dot, anchor: "center" })
        .setLngLat([myPos.lng, myPos.lat])
        .addTo(map);
      coords.unshift([myPos.lng, myPos.lat]);
    }

    // Konvoy çizgisi
    const src = map.getSource("convoy") as any;
    if (src) {
      src.setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: coords },
      });
    }

    if (coords.length > 0) {
      map.easeTo({ center: coords[0], zoom: FOCUS_ZOOM, duration: 600 });
    }
  }, [members, myPos, mapReady]);

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
    mapRef.current?.easeTo({ center: [lng, lat], zoom: FOCUS_ZOOM, duration: 900 });
    setSelected(null);
  };

  /**
   * Tek noktayı Google Maps'te göster.
   * `search/?api=1&query=` formu konum izni istemez ve noktayı doğrudan açar.
   */
  const searchUrl = (m: LiveMember) => {
    if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng)) return "#";
    return `https://www.google.com/maps/search/?api=1&query=${m.lat.toFixed(6)},${m.lng.toFixed(6)}`;
  };

  return (
    <Layout hideFooter>
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
          <div className="relative h-[420px] w-full overflow-hidden rounded-[26px] border border-[#162544] bg-[#030711] shadow-[0_0_40px_rgba(59,130,246,.08)]">
            <div ref={mapEl} className="absolute inset-0 z-0" />

            <style jsx global>{`
              .mapboxgl-ctrl-attrib {
                background: rgba(3, 7, 17, 0.72) !important;
                color: #6b7d94 !important;
                font-size: 9px !important;
              }
              .mapboxgl-ctrl-attrib a {
                color: #7a8da4 !important;
              }
              .mapboxgl-ctrl-group {
                background: rgba(10, 22, 40, 0.92) !important;
                border: 1px solid #162544 !important;
                border-radius: 12px !important;
                overflow: hidden;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5) !important;
              }
              .mapboxgl-ctrl-group button + button {
                border-top: 1px solid #162544 !important;
              }
              .mapboxgl-ctrl-group button span {
                filter: invert(70%) sepia(12%) saturate(700%) hue-rotate(180deg) brightness(95%);
              }
              .mapboxgl-ctrl-group button:hover {
                background: #162544 !important;
              }
              .mapboxgl-canvas {
                outline: none;
              }
              .mapboxgl-ctrl-logo {
                opacity: 0.35;
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

            {mapError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#030711]/95 px-6 text-center">
                <Radio className="h-6 w-6 text-[#2a3a54]" />
                <p className="text-[12.5px] font-semibold text-white">Harita yüklenemedi</p>
                <p className="text-[11px] leading-relaxed text-[#7a8da4]">{mapError}</p>
              </div>
            )}

            {!mapError && members.length === 0 && mapReady && (
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
                    href={searchUrl(m)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${m.name} için haritada aç`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#162544] text-[#60a5fa] transition hover:bg-[#3b82f6]/15"
                  >
                    <Navigation className="h-4 w-4" />
                  </a>
                </div>
              ))
            )}
          </div>

          <p className="px-1 text-[10.5px] leading-relaxed text-[#6b7d94]">
            Konum yalnızca paylaşım açıkken ve son 30 dakikada görünür. PWA&apos;da uygulama arka
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
