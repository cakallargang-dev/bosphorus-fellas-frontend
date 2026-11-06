"use client";

import { ShoppingBag, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  monthly: "Aylık Paket",
  yearly: "Yıllık Paket",
  card: "Kart",
  sweatshirt: "Sweatshirt",
  tshirt: "Tshirt",
};

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  return (
    <Card className="bg-mancave-surface border border-gray-800 overflow-hidden hover:border-[#3b82f6]/30 transition-all duration-300 group">
      {/* Image - square aspect ratio */}
      <a
        href={product.shopifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-square overflow-hidden bg-black/50 relative"
      >
        {product.imageUrl ? (
          <img
            src={
              product.imageUrl.startsWith("http")
                ? product.imageUrl
                : `${apiBase}${product.imageUrl}`
            }
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-mancave-muted" />
          </div>
        )}
        {/* Shopify badge */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <ExternalLink className="w-3.5 h-3.5 text-white" />
        </div>
      </a>

      <CardContent className="p-3">
        <h3 className="text-white font-medium text-sm truncate">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-mancave-muted uppercase tracking-wider">
            {CATEGORY_LABELS[product.category] || product.category}
          </span>
          {product.price && (
            <span className="text-[#3b82f6] font-semibold text-sm">
              {product.price}
            </span>
          )}
        </div>
        {product.description && (
          <p className="text-mancave-muted text-xs mt-1.5 line-clamp-2">
            {product.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
