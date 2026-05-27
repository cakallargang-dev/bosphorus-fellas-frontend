"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { AuthGuard } from "@/components/AuthGuard";
import { Layout } from "@/components/Layout";
import { StatsCard, iconMap } from "@/components/StatsCard";
import { EventCard } from "@/components/EventCard";
import { NewsCard } from "@/components/NewsCard";
import { SponsorCard } from "@/components/SponsorCard";
import { SkeletonCard, SkeletonTable } from "@/components/LoadingSpinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Users,
  TrendingUp,
  Newspaper,
  Star,
  Sparkles,
  Car,
} from "lucide-react";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.getData(),
    staleTime: 30_000,
  });

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "";

  const stats = dashboardData?.data.stats;
  const upcomingEvents = dashboardData?.data.upcomingEvents ?? [];
  const recentNews = dashboardData?.data.recentNews ?? [];
  const sponsors = dashboardData?.data.sponsors ?? [];

  if (isError) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <Car className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl text-white font-semibold mb-2">
            Veri yüklenemedi
          </h2>
          <p className="text-gray-500">
            {error instanceof Error ? error.message : "Bir hata oluştu"}
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10 p-6 rounded-xl bg-gradient-to-br from-[#d4a853]/10 via-transparent to-transparent border border-[#d4a853]/10">
          <Avatar className="w-16 h-16 border-2 border-[#d4a853]/30">
            <AvatarImage
              src={
                user?.avatar
                  ? `${apiBase}${user.avatar}`
                  : undefined
              }
              alt={user?.firstName}
            />
            <AvatarFallback className="bg-[#d4a853]/10 text-[#d4a853] text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">
                Hoş geldin, {user?.firstName}!
              </h1>
              <Sparkles className="w-5 h-5 text-[#d4a853]" />
            </div>
            <p className="text-gray-500">
              Bosphorus Fellas topluluğunda neler oluyor, bir göz at.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#d4a853]" />
            Özet
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Toplam Etkinlik"
                value={stats?.totalEvents ?? 0}
                icon={iconMap.events}
              />
              <StatsCard
                title="Yaklaşan Etkinlik"
                value={stats?.upcomingEvents ?? 0}
                icon={<Calendar className="w-5 h-5" />}
              />
              <StatsCard
                title="Toplam Üye"
                value={stats?.totalMembers ?? 0}
                icon={iconMap.members}
              />
              <StatsCard
                title="Aktif Üye"
                value={stats?.activeMembers ?? 0}
                icon={iconMap.users}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column: Events + News */}
          <div className="lg:col-span-2 space-y-10">
            {/* Upcoming Events */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#d4a853]" />
                Yaklaşan Etkinlikler
              </h2>
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : upcomingEvents.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title="Henüz etkinlik yok"
                  description="Yeni etkinlikler yakında eklenecek. Takipte kalın!"
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

            {/* Recent News */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#d4a853]" />
                Haberler ve Duyurular
              </h2>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} className="h-24" />
                  ))}
                </div>
              ) : recentNews.length === 0 ? (
                <EmptyState
                  icon={Newspaper}
                  title="Henüz haber yok"
                  description="Kulüp haberleri ve duyurular burada görünecek."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentNews.map((news) => (
                    <NewsCard key={news.id} news={news} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Sidebar: Sponsors */}
          <div className="lg:col-span-1">
            <section>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-[#d4a853]" />
                Sponsorlar
              </h2>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} className="h-20" />
                  ))}
                </div>
              ) : sponsors.length === 0 ? (
                <EmptyState
                  icon={Star}
                  title="Henüz sponsor yok"
                  description="Sponsorlarımız burada listelenecek."
                  compact
                />
              ) : (
                <div className="space-y-3">
                  {sponsors.map((sponsor) => (
                    <SponsorCard key={sponsor.id} sponsor={sponsor} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  compact = false,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-gray-900/50 border border-gray-800 rounded-xl flex flex-col items-center justify-center text-center ${
        compact ? "p-6 gap-2" : "p-10 gap-3"
      }`}
    >
      <div className="w-12 h-12 rounded-full bg-[#d4a853]/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-[#d4a853]/60" />
      </div>
      <h3 className="text-gray-400 font-medium text-sm">{title}</h3>
      <p className="text-gray-600 text-xs max-w-xs">{description}</p>
    </div>
  );
}
