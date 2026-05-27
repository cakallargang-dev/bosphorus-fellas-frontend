"use client";

import { Calendar, MapPin, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { Event } from "@/types";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface EventCardProps {
  event: Event;
  onJoin?: (id: string) => void;
  onLeave?: (id: string) => void;
  isJoining?: boolean;
  isLeaving?: boolean;
  showActions?: boolean;
}

const statusBadge: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  upcoming: { label: "Yakında", variant: "default" },
  ongoing: { label: "Devam Ediyor", variant: "secondary" },
  completed: { label: "Tamamlandı", variant: "outline" },
  cancelled: { label: "İptal", variant: "destructive" },
};

export function EventCard({
  event,
  onJoin,
  onLeave,
  isJoining = false,
  isLeaving = false,
  showActions = true,
}: EventCardProps) {
  const status = statusBadge[event.status] || statusBadge.upcoming;
  const isPast = event.status === "completed" || event.status === "cancelled";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  const eventDate = new Date(event.date);

  return (
    <Card className="bg-mancave-card border-mancave-border overflow-hidden hover:border-mancave-gold/30 transition-all duration-300 group">
      {event.imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={
              event.imageUrl.startsWith("http")
                ? event.imageUrl
                : `${apiBase}${event.imageUrl}`
            }
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <Badge
              variant={status.variant}
              className={`text-xs ${
                status.variant === "default"
                  ? "bg-mancave-gold/20 text-mancave-gold border-mancave-gold/30"
                  : ""
              }`}
            >
              {status.label}
            </Badge>
          </div>
        </div>
      )}

      <CardContent className={`${event.imageUrl ? "pt-4" : "pt-5"} pb-3`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-white font-semibold text-base leading-tight line-clamp-2">
            {event.title}
          </h3>
          {!event.imageUrl && (
            <Badge
              variant={status.variant}
              className={`text-xs shrink-0 ${
                status.variant === "default"
                  ? "bg-mancave-gold/20 text-mancave-gold border-mancave-gold/30"
                  : ""
              }`}
            >
              {status.label}
            </Badge>
          )}
        </div>

        {event.description && (
          <p className="text-gray-500 text-sm mt-2 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4 text-mancave-gold/60 shrink-0" />
            <span>
              {format(eventDate, "d MMMM yyyy", { locale: tr })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4 text-mancave-gold/60 shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4 text-mancave-gold/60 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4 text-mancave-gold/60 shrink-0" />
            <span>
              {event.currentParticipants}
              {event.maxParticipants ? ` / ${event.maxParticipants}` : ""} katılımcı
            </span>
          </div>
        </div>
      </CardContent>

      {showActions && !isPast && (
        <CardFooter className="pt-0 pb-4 px-5">
          {event.isJoined ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
              onClick={() => onLeave?.(event.id)}
              disabled={isLeaving}
            >
              {isLeaving ? "Ayrılıyor..." : "Ayrıl"}
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full bg-mancave-gold/10 text-mancave-gold border border-mancave-gold/30 hover:bg-mancave-gold/20 hover:border-mancave-gold/50"
              onClick={() => onJoin?.(event.id)}
              disabled={
                isJoining ||
                (!!event.maxParticipants &&
                  event.currentParticipants >= event.maxParticipants)
              }
            >
              {event.maxParticipants &&
              event.currentParticipants >= event.maxParticipants
                ? "Dolu"
                : isJoining
                ? "Katılıyor..."
                : "Katıl"}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
