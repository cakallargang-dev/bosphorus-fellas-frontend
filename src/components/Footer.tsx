import Link from "next/link";
import { Camera, Film, X } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-mancave-border bg-mancave-bg py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-mancave-gold/50 flex items-center justify-center">
              <span className="text-mancave-gold font-bold text-xs">BF</span>
            </div>
            <div>
              <p className="text-sm text-gray-400">
                Bosphorus Fellas © {new Date().getFullYear()}
              </p>
              <p className="text-xs text-gray-600">Ham Güç. Arınmış Ruh.</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/apply"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Başvuru
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="#"
              className="text-gray-600 hover:text-mancave-gold transition-colors"
              aria-label="Instagram"
            >
              <Camera className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-mancave-gold transition-colors"
              aria-label="Youtube"
            >
              <Film className="w-4 h-4" />
            </a>
            <a
              href="#"
              className="text-gray-600 hover:text-mancave-gold transition-colors"
              aria-label="X (Twitter)"
            >
              <X className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
