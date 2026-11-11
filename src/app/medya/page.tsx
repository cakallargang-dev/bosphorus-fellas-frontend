"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  mediaApi,
  imgUrl,
  galleryDownloadUrl,
  galleryThumbUrl,
  type GalleryImageItem,
  type YouTubeVideoItem,
} from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { SkeletonCard } from "@/components/LoadingSpinner";
import { Play, X, CalendarDays, ChevronRight, Download, Check } from "lucide-react";

export default function MediaPage() {
  return (
    <AuthGuard>
      <MediaContent />
    </AuthGuard>
  );
}

function MediaContent() {
  const [video, setVideo] = useState<YouTubeVideoItem | null>(null);
  const [photo, setPhoto] = useState<GalleryImageItem | null>(null);

  const videosQuery = useQuery({
    queryKey: ["media", "videos"],
    queryFn: () => mediaApi.videos(),
    staleTime: 5 * 60_000,
  });

  const galleryQuery = useQuery({
    queryKey: ["media", "gallery"],
    queryFn: () => mediaApi.gallery(),
    staleTime: 60_000,
  });

  const videos = videosQuery.data?.data ?? [];
  const photos = galleryQuery.data?.data ?? [];

  return (
    <Layout>
      <div className="max-w-[430px] mx-auto pb-28 animate-fade-in">
        {/* HERO */}
        <div className="relative -mt-4 mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-[#0a1628]">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.18]"
              style={{ backgroundImage: "url('/brand-bg-square.webp')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-[#030711]/70 to-[#030711]/85" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 80% 10%, rgba(59,130,246,0.2) 0%, transparent 60%)",
              }}
            />
          </div>
          <span className="absolute left-0 right-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#3b82f6]/60 to-transparent z-10" />

          <div className="relative z-10 px-5 pt-7 pb-6">
            <p className="text-[9.5px] uppercase tracking-[0.24em] text-[#3b82f6]/80 mb-2">
              Bosphorus Fellas
            </p>
            <h1 className="text-[27px] leading-tight font-semibold tracking-[-0.035em] text-white">
              Medya
            </h1>
            <p className="text-[11.5px] text-white/45 mt-1">
              Videolarımız ve etkinlik fotoğraflarımız
            </p>
          </div>
        </div>

        <div className="px-4">
          {/* ================= VIDEO ================= */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-[3px] h-4 rounded-full bg-[#f04444]" />
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b9c6d8]">
                  YouTube
                </h2>
              </div>
              <a
                href="https://youtube.com/@bosphorus.fellas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10.5px] text-[#3b82f6]/80 hover:text-[#60a5fa] flex items-center gap-0.5"
              >
                Kanal <ChevronRight className="w-3 h-3" />
              </a>
            </div>

            {videosQuery.isLoading ? (
              <div className="space-y-3">
                <SkeletonCard className="h-44" />
                <SkeletonCard className="h-20" />
              </div>
            ) : videos.length === 0 ? (
              <div className="rounded-2xl border border-[#162544] bg-[#0f1d32]/70 p-8 text-center">
                <p className="text-[12.5px] text-[#7a8da4]">
                  Henüz video yok. Admin panelinden yenile.
                </p>
              </div>
            ) : (
              <>
                {/* Öne çıkan video */}
                <button
                  onClick={() => setVideo(videos[0])}
                  className="group relative w-full aspect-video rounded-2xl overflow-hidden border border-[#162544] press-scale"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={videos[0].thumbnail}
                    alt={videos[0].title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030711] via-[#030711]/25 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-12 h-12 rounded-full bg-[#f04444] flex items-center justify-center shadow-lg shadow-[#f04444]/30 group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3.5 text-left">
                    <p className="text-[13px] font-semibold text-white leading-snug line-clamp-2 drop-shadow">
                      {videos[0].title}
                    </p>
                    <p className="text-[10px] text-white/45 mt-1">
                      {new Date(videos[0].publishedAt).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </button>

                {/* Diğer videolar */}
                {videos.length > 1 && (
                  <div className="mt-3 space-y-2">
                    {videos.slice(1).map((v) => (
                      <button
                        key={v.videoId}
                        onClick={() => setVideo(v)}
                        className="group w-full flex gap-3 rounded-xl border border-[#162544] bg-[#0f1d32]/70 p-2 text-left hover:border-[#23365c] transition-colors press-scale"
                      >
                        <div className="relative w-[104px] aspect-video shrink-0 rounded-lg overflow-hidden bg-[#0a1628]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={v.thumbnail}
                            alt={v.title}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                              <Play className="w-2.5 h-2.5 text-white fill-white ml-px" />
                            </span>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className="text-[12px] font-medium text-white leading-snug line-clamp-2">
                            {v.title}
                          </p>
                          <p className="text-[10px] text-[#5b6b80] mt-1">
                            {new Date(v.publishedAt).toLocaleDateString("tr-TR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* ================= GALERI ================= */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-[3px] h-4 rounded-full bg-[#3b82f6]" />
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#b9c6d8]">
                Galeri
              </h2>
              <span className="ml-auto text-[10.5px] text-[#5b6b80] tabular-nums">
                {photos.length} fotoğraf
              </span>
            </div>

            {galleryQuery.isLoading ? (
              <div className="grid grid-cols-3 gap-1.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg skeleton" />
                ))}
              </div>
            ) : photos.length === 0 ? (
              <div className="rounded-2xl border border-[#162544] bg-[#0f1d32]/70 p-8 text-center">
                <p className="text-[12.5px] text-[#7a8da4]">
                  Henüz fotoğraf yok. Admin panelinden ekle.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPhoto(p)}
                    className="group relative aspect-square rounded-lg overflow-hidden bg-[#0a1628] border border-[#162544]/60 press-scale"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={galleryThumbUrl(p.url, 400)}
                      alt={p.caption || "Etkinlik fotoğrafı"}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {p.eventName && (
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-1.5 pt-4 pb-1 text-[8.5px] text-white/80 truncate text-left">
                        {p.eventName}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {video && <VideoModal video={video} onClose={() => setVideo(null)} />}
      {photo && <PhotoModal photo={photo} onClose={() => setPhoto(null)} />}
    </Layout>
  );
}

/* ---------- Video modal ---------- */
function VideoModal({ video, onClose }: { video: YouTubeVideoItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-[430px]">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${video.videoId}?autoplay=1&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        <div className="mt-3 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-white leading-snug">{video.title}</p>
            {video.description && (
              <p className="text-[11.5px] text-[#8b9bb0] mt-1.5 leading-relaxed whitespace-pre-line line-clamp-4">
                {video.description}
              </p>
            )}
            <p className="text-[10.5px] text-[#5b6b80] mt-2 flex items-center gap-1">
              <CalendarDays className="w-3 h-3" />
              {new Date(video.publishedAt).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white shrink-0 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <a
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-[#f04444] py-2.5 text-[12.5px] font-semibold text-white hover:bg-[#d93a3a] transition-colors press-scale"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          YouTube'da aç
        </a>
      </div>
    </div>
  );
}

/* ---------- Foto modal ---------- */
function PhotoModal({ photo, onClose }: { photo: GalleryImageItem; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button
        onClick={onClose}
        aria-label="Kapat"
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="w-full max-w-[430px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgUrl(photo.url)}
          alt={photo.caption || "Etkinlik fotoğrafı"}
          className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
        />
        {(photo.eventName || photo.caption) && (
          <div className="mt-3 text-center">
            {photo.eventName && (
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#3b82f6]/80">
                {photo.eventName}
              </p>
            )}
            {photo.caption && (
              <p className="text-[12.5px] text-white/85 mt-1">{photo.caption}</p>
            )}
          </div>
        )}

        <DownloadButtons photo={photo} />
      </div>
    </div>
  );
}

/* ---------- Indirme: PWA uyumlu ---------- */
function DownloadButtons({ photo }: { photo: GalleryImageItem }) {
  const url = galleryDownloadUrl(photo.url, photo.eventName || photo.caption || undefined) || "";
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");

  async function handleDownload() {
    if (!url) return;
    setState("busy");

    try {
      // 1) Fetch + blob: PWA/standalone modda en guvenilir yol
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error(`${res.status}`);

      const blob = await res.blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      const safe =
        (photo.eventName || photo.caption || "bosphorus-fellas")
          .replace(/[^a-zA-Z0-9-_]/g, "_")
          .slice(0, 50) || "bosphorus-fellas";

      const file = new File([blob], `${safe}.${ext}`, { type: blob.type });

      // 2) iOS/Android paylasim sayfasi (Fotograflara Kaydet sunar)
      const nav = navigator as Navigator & {
        canShare?: (d: { files: File[] }) => boolean;
        share?: (d: { files: File[]; title?: string }) => Promise<void>;
      };

      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        try {
          await nav.share({ files: [file], title: safe });
          setState("done");
          setTimeout(() => setState("idle"), 3000);
          return;
        } catch {
          // kullanici iptal etti -> blob indirmeye dus
        }
      }

      // 3) Blob URL ile indirme
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${safe}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);

      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("failed");
      // 4) Son care: yeni sekmede ac (uzun bas -> Fotograflara Kaydet)
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => setState("idle"), 4000);
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <button
        onClick={handleDownload}
        disabled={state === "busy"}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#3b82f6] py-3 text-[13px] font-semibold text-black hover:bg-[#60a5fa] transition-colors press-scale disabled:opacity-70"
      >
        {state === "busy" ? (
          <>
            <Download className="w-4 h-4 animate-pulse" />
            İndiriliyor...
          </>
        ) : state === "done" ? (
          <>
            <Check className="w-4 h-4" />
            İndirildi
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Fotoğrafı İndir
          </>
        )}
      </button>

      <p className="text-center text-[9.5px] text-white/30 leading-relaxed">
        {state === "failed"
          ? "Yeni sekmede açıldı — fotoğrafa uzun basıp 'Fotoğraflara Kaydet' seç"
          : "Tam çözünürlük · Instagram için hazır"}
      </p>
    </div>
  );
}
