"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Sponsor } from "@/types";
import { ExternalLink } from "lucide-react";

interface SponsorCardProps {
  sponsor: Sponsor;
}

const tierStyles: Record<string, { label: string; className: string }> = {
  platinum: {
    label: "Platin",
    className:
      "bg-gradient-to-r from-gray-300 to-gray-100 text-black border-gray-400",
  },
  gold: {
    label: "Altın",
    className: "bg-mancave-gold/20 text-mancave-gold border-mancave-gold/30",
  },
  silver: {
    label: "Gümüş",
    className: "bg-gray-400/20 text-gray-400 border-gray-400/30",
  },
  bronze: {
    label: "Bronz",
    className:
      "bg-amber-700/20 text-amber-600 border-amber-700/30",
  },
};

export function SponsorCard({ sponsor }: SponsorCardProps) {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
  const tier = tierStyles[sponsor.tier] || tierStyles.bronze;

  const content = (
    <Card className="bg-mancave-card border-mancave-border hover:border-mancave-gold/30 transition-all group">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-mancave-surface border border-mancave-border flex items-center justify-center overflow-hidden shrink-0 group-hover:border-mancave-gold/30 transition-colors">
            {sponsor.logoUrl ? (
              <img
                src={
                  sponsor.logoUrl.startsWith("http")
                    ? sponsor.logoUrl
                    : `${apiBase}${sponsor.logoUrl}`
                }
                alt={sponsor.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <span className="text-mancave-gold font-bold text-lg">
                {sponsor.name[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-medium text-sm truncate">
                {sponsor.name}
              </h3>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 ${tier.className}`}
              >
                {tier.label}
              </Badge>
            </div>
            {sponsor.description && (
              <p className="text-gray-500 text-xs line-clamp-2">
                {sponsor.description}
              </p>
            )}
          </div>
          {sponsor.websiteUrl && (
            <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-mancave-gold transition-colors shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (sponsor.websiteUrl) {
    return (
      <a
        href={sponsor.websiteUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {content}
      </a>
    );
  }

  return content;
}
