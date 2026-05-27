"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { eventsApi } from "@/lib/api";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { EventCard } from "@/components/EventCard";
import { SkeletonCard } from "@/components/LoadingSpinner";
import { Calendar, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_OPTIONS = [
  { value: "all", label: "Tümü" },
  { value: "upcoming", label: "Yakında" },
  { value: "ongoing", label: "Devam Eden" },
  { value: "completed", label: "Tamamlanan" },
  { value: "cancelled", label: "İptal" },
];

export default function EventsPage() {
  return (
    <AuthGuard>
      <EventsContent />
    </AuthGuard>
  );
}

function EventsContent() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["events", statusFilter],
    queryFn: () =>
      eventsApi.list({
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
    staleTime: 15_000,
  });

  const joinMutation = useMutation({
    mutationFn: (id: string) => eventsApi.join(id),
    onMutate: (id) => setJoiningId(id),
    onSuccess: () => {
      toast.success("Etkinliğe katıldınız!");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Katılma işlemi başarısız oldu"
      );
    },
    onSettled: () => setJoiningId(null),
  });

  const leaveMutation = useMutation({
    mutationFn: (id: string) => eventsApi.leave(id),
    onMutate: (id) => setLeavingId(id),
    onSuccess: () => {
      toast.success("Etkinlikten ayrıldınız!");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Ayrılma işlemi başarısız oldu"
      );
    },
    onSettled: () => setLeavingId(null),
  });

  const events = data?.data ?? [];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-6 h-6 text-[#d4a853]" />
              Etkinlikler
            </h1>
            <p className="text-gray-500 mt-1">
              Bosphorus Fellas etkinliklerini keşfedin ve katılın
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? 'all')}>
              <SelectTrigger className="w-40 bg-[#111] border-gray-800 text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-gray-800">
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="text-gray-300 focus:bg-[#d4a853]/10 focus:text-[#d4a853]"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : isError ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-lg text-white font-semibold mb-2">
              Etkinlikler yüklenemedi
            </h2>
            <p className="text-gray-500 text-sm">
              {error instanceof Error ? error.message : "Bir hata oluştu"}
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-12 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-[#d4a853]/10 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-[#d4a853]/60" />
            </div>
            <h2 className="text-lg text-gray-400 font-medium mb-2">
              Henüz etkinlik yok
            </h2>
            <p className="text-gray-600 text-sm">
              {statusFilter === "all"
                ? "Yakında yeni etkinlikler eklenecek. Takipte kalın!"
                : "Bu kategoride etkinlik bulunamadı. Filtreyi değiştirmeyi deneyin."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onJoin={(id) => joinMutation.mutate(id)}
                onLeave={(id) => leaveMutation.mutate(id)}
                isJoining={joiningId === event.id}
                isLeaving={leavingId === event.id}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
