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
    className: "bg-mancave-blue/20 text-mancave-blue border-mancave-blue/30",
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
    <Card className="bg-mancave-card border-mancave-border hover:border-mancave-blue/30 transition-all group">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg bg-mancave-surface border border-mancave-border flex items-center justify-center overflow-hidden shrink-0 group-hover:border-mancave-blue/30 transition-colors">
            {(sponsor.logoUrl || sponsor.logo) ? (
              <img
                src={
                  (sponsor.logoUrl || sponsor.logo || "").startsWith("http")
                    ? (sponsor.logoUrl || sponsor.logo)
                    : `${apiBase}${sponsor.logoUrl || sponsor.logo}`
                }
                alt={sponsor.name}
                className="w-12 h-12 object-contain"
              />
            ) : (
              <span className="text-mancave-blue font-bold text-lg">
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
              <p className="text-mancave-muted text-xs line-clamp-2">
                {sponsor.description}
              </p>
            )}
          </div>
          {(sponsor.websiteUrl || sponsor.website) && (
            <ExternalLink className="w-4 h-4 text-mancave-muted group-hover:text-mancave-blue transition-colors shrink-0" />
          )}
        </div>
      </CardContent>
    </Card>
  );

  const url = sponsor.websiteUrl || sponsor.website;
  if (url) {
    return (
      <a
        href={url}
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
