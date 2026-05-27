"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { News } from "@/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Newspaper } from "lucide-react";

interface NewsCardProps {
  news: News;
}

export function NewsCard({ news }: NewsCardProps) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  return (
    <Card className="bg-mancave-card border-mancave-border hover:border-mancave-gold/30 transition-all overflow-hidden group">
      {news.imageUrl && (
        <div className="h-36 overflow-hidden">
          <img
            src={
              news.imageUrl.startsWith("http")
                ? news.imageUrl
                : `${apiBase}${news.imageUrl}`
            }
            alt={news.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded bg-mancave-gold/10 flex items-center justify-center shrink-0 mt-0.5">
            <Newspaper className="w-4 h-4 text-mancave-gold" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-medium text-sm leading-snug line-clamp-2">
              {news.title}
            </h3>
            <p className="text-gray-500 text-xs mt-1.5 line-clamp-3">
              {news.content}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-gray-600">
                {format(new Date(news.createdAt || Date.now()), "d MMM yyyy", { locale: tr })}
              </span>
              {news.authorName && (
                <>
                  <span className="text-gray-700">·</span>
                  <span className="text-xs text-gray-600">
                    {news.authorName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
