"use client";

import { useState } from "react";
import { Calendar, MapPin, Clock, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  const [showParticipants, setShowParticipants] = useState(false);
  const status = statusBadge[event.status] || statusBadge.upcoming;
  const isPast = event.status === "completed" || event.status === "cancelled";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";
  const participants = event.participants ?? [];
  const hasParticipants = participants.length > 0;

  const eventDate = event.date ? new Date(event.date) : null;
  const isInvalidDate = eventDate && isNaN(eventDate.getTime());

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
              {eventDate && !isInvalidDate ? format(eventDate, "d MMMM yyyy", { locale: tr }) : "-"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4 text-mancave-gold/60 shrink-0" />
            <span>{event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="w-4 h-4 text-mancave-gold/60 shrink-0" />
            <a
              href={event.locationUrl || `https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-mancave-gold hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {event.location}
            </a>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4 text-mancave-gold/60 shrink-0" />
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="flex items-center gap-1 hover:text-mancave-gold transition-colors"
            >
              <span>
                {event.currentParticipants}
                {event.maxParticipants ? ` / ${event.maxParticipants}` : ""} katılımcı
              </span>
              {hasParticipants && (
                showParticipants ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )
              )}
            </button>
          </div>

          {/* Participants list */}
          {showParticipants && hasParticipants && (
            <div className="mt-2 pt-2 border-t border-white/5">
              <div className="flex flex-wrap gap-1.5">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 bg-white/5 rounded-full pr-2.5"
                    title={p.userName}
                  >
                    <Avatar className="w-5 h-5">
                      <AvatarImage
                        src={p.userAvatar ? `${apiBase}${p.userAvatar}` : undefined}
                      />
                      <AvatarFallback className="text-[10px] bg-mancave-gold/20 text-mancave-gold">
                        {p.userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-400">{p.userName}</span>
                  </div>
                ))}
                {event.currentParticipants > participants.length && (
                  <span className="text-xs text-gray-600 self-center">
                    +{event.currentParticipants - participants.length} kişi daha
                  </span>
                )}
              </div>
            </div>
          )}
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
