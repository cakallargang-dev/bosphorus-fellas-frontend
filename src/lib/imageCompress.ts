"use client";

/**
 * Fotoğrafı tarayıcıda küçültüp JPEG'e çevirir.
 *
 * Neden: kullanıcı 12 MP telefon fotoğrafı (6-8 MB) yükleyince
 * hem yükleme uzun sürüyor hem 5 MB sunucu limitine takılıyordu.
 * Tarayıcıda 1600px'e küçültüp JPEG kalite 0.82'ye indirmek
 * tipik bir fotoğrafı ~250-400 KB'a düşürür — görsel kayıp yok.
 *
 * GIF'ler animasyon kaybı olmasın diye dokunulmadan geçirilir.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.82;

export interface CompressResult {
  file: File;
  originalSize: number;
  newSize: number;
}

export async function compressImage(file: File): Promise<CompressResult> {
  // GIF (animasyon) ve zaten küçük dosyalar → dokunma
  if (file.type === "image/gif" || file.size < 400 * 1024) {
    return { file, originalSize: file.size, newSize: file.size };
  }

  if (!file.type.startsWith("image/")) {
    return { file, originalSize: file.size, newSize: file.size };
  }

  try {
    const bitmap = await createImageBitmap(file);

    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, originalSize: file.size, newSize: file.size };

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );

    if (!blob || blob.size >= file.size) {
      // Küçültme işe yaramadıysa orijinali gönder
      return { file, originalSize: file.size, newSize: file.size };
    }

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    const out = new File([blob], name, { type: "image/jpeg" });

    return { file: out, originalSize: file.size, newSize: out.size };
  } catch {
    // Canvas/bitmap desteklenmiyorsa orijinali gönder
    return { file, originalSize: file.size, newSize: file.size };
  }
}

/** Okunur dosya boyutu: 1.2 MB, 340 KB */
export function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
