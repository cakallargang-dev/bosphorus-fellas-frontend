"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileImage, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  value?: File | string | null;
  onChange: (file: File | null) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  preview?: boolean;
  label?: string;
  disabled?: boolean;
}

export function FileUpload({
  value,
  onChange,
  accept = { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
  maxSize = 5 * 1024 * 1024,
  preview = true,
  label = "Dosya yüklemek için tıklayın veya sürükleyin",
  disabled = false,
}: FileUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    typeof value === "string" ? value : null
  );
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setUploading(true);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        setUploading(false);
      };
      reader.readAsDataURL(file);
      onChange(file);
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled,
  });

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange(null);
  };

  const displayedPreview =
    previewUrl ||
    (typeof value === "string" && value
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050"}${value}`
      : null);

  if (displayedPreview && preview) {
    return (
      <div className="relative inline-block">
        <img
          src={displayedPreview}
          alt="Preview"
          className="w-32 h-32 rounded-lg object-cover border border-mancave-border"
        />
        {!disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full"
            onClick={handleRemove}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
        ${
          isDragActive
            ? "border-mancave-gold bg-mancave-gold/5"
            : "border-mancave-border hover:border-mancave-gold/50 hover:bg-mancave-gold/5"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-mancave-gold animate-spin" />
          <p className="text-sm text-gray-400">Yükleniyor...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {isDragActive ? (
            <Upload className="w-8 h-8 text-mancave-gold" />
          ) : (
            <FileImage className="w-8 h-8 text-gray-600" />
          )}
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-xs text-gray-600">
            PNG, JPG veya WebP (max {Math.round(maxSize / 1024 / 1024)}MB)
          </p>
        </div>
      )}
    </div>
  );
}
