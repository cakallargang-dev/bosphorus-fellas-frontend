"use client";

import type { ReactNode } from "react";
import { TrendingUp, Users, Award, Star } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

const iconMap: Record<string, ReactNode> = {
  users: <Users className="w-5 h-5" />,
  events: <TrendingUp className="w-5 h-5" />,
  members: <Award className="w-5 h-5" />,
  sponsors: <Star className="w-5 h-5" />,
};

export function StatsCard({
  title,
  value,
  icon,
  trend,
  trendUp,
}: StatsCardProps) {
  return (
    <div className="bg-mancave-card border border-mancave-border rounded-lg p-5 hover:border-mancave-blue/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-mancave-muted uppercase tracking-wider">
          {title}
        </span>
        <div className="text-mancave-blue/60">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {trend && (
        <div
          className={`text-xs mt-2 flex items-center gap-1 ${
            trendUp ? "text-green-500" : "text-red-500"
          }`}
        >
          <span>{trendUp ? "↑" : "↓"}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

export { iconMap };
