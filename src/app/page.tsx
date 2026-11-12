"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { StatsCard } from "@/components/StatsCard";
import { EventCard } from "@/components/EventCard";
import { SponsorCard } from "@/components/SponsorCard";
import { useAuth } from "@/lib/auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { landingApi } from "@/lib/api";
import type { LandingPageStats, Event, Sponsor } from "@/types";
import {
  Shield,
  Users,
  Calendar,
  Award,
  ArrowRight,
  Car,
  Star,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<LandingPageStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    async function fetchData() {
      try {
        const [statsRes, eventsRes, sponsorsRes] = await Promise.all([
          landingApi.getStats(),
          landingApi.getEvents(),
          landingApi.getSponsors(),
        ]);
        setStats(statsRes.data);
        setEvents(eventsRes.data);
        setSponsors(sponsorsRes.data);
      } catch (err) {
        setError("Veriler yüklenirken bir hata oluştu");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen flex flex-col bg-mancave-bg animate-fade-in">

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.35]"
          style={{ backgroundImage: "url('/brand-bg-wide.webp')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030711]/40 via-mancave-bg/70 to-mancave-bg" />
        <div className="glow-radial absolute inset-0 opacity-70" />
        <div className="grid-floor absolute bottom-0 left-0 right-0 h-[280px] opacity-60" />
        <span className="top-hairline absolute inset-0" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand-mark-hero.webp"
            alt="Bosphorus Fellas"
            className="w-[132px] h-[132px] object-contain mx-auto mb-6 drop-shadow-[0_0_60px_rgba(59,130,246,0.3)]"
          />

          <h1 className="sr-only">Bosphorus Fellas</h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand-wordmark.webp"
            alt="Bosphorus Fellas"
            className="w-[300px] sm:w-[420px] max-w-full h-auto mx-auto"
          />

          <p className="font-display text-2xl sm:text-3xl text-[#c3cfdd] max-w-2xl mx-auto font-bold tracking-[-0.02em]">
            Ham Güç. <span className="text-gradient">Arınmış Ruh.</span>
          </p>

          <p className="text-base text-[#7a8da4] max-w-xl mx-auto leading-relaxed">
            Premium otomotiv tutkunları için özel bir topluluk. Bosphorus
            Fellas; gücü, estetiği ve kardeşliği bir araya getirir.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/apply">
              <Button
                size="lg"
                className="btn-gradient px-8 py-6 text-base"
              >
                <Car className="w-5 h-5 mr-2" />
                Aramıza Katıl
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                variant="outline"
                size="lg"
                className="btn-soft px-8 py-6 text-base"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-mancave-border flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-mancave-blue" />
          </div>
        </div>
      </section>

      {/* Stats — only for authenticated users */}
      {isAuthenticated && stats && !error && (
        <section className="py-20 px-4 border-t border-mancave-border">
          <div className="max-w-6xl mx-auto">
            <h2 className="heading-display text-center mb-12">
              Rakamlarla{" "}
              <span className="text-[#60a5fa]">Bosphorus Fellas</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatsCard
                icon={<Users className="w-5 h-5" />}
                title="Toplam Üye"
                value={stats.totalMembers}
              />
              <StatsCard
                icon={<Star className="w-5 h-5" />}
                title="Aktif Üye"
                value={stats.activeMembers}
              />
              <StatsCard
                icon={<Calendar className="w-5 h-5" />}
                title="Toplam Etkinlik"
                value={stats.totalEvents}
              />
              <StatsCard
                icon={<Award className="w-5 h-5" />}
                title="Yaklaşan Etkinlik"
                value={stats.upcomingEvents}
              />
            </div>
          </div>
        </section>
      )}

      {/* Events — only for authenticated users */}
      {isAuthenticated && events.length > 0 && (
        <section className="py-20 px-4 border-t border-mancave-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="heading-display">
                Yaklaşan <span className="text-[#60a5fa]">Etkinlikler</span>
              </h2>
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="text-[#8f9fb4] hover:text-white"
                >
                  Tümü <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sponsors — only for authenticated users */}
      {isAuthenticated && sponsors.length > 0 && (
        <section className="py-20 px-4 border-t border-mancave-border">
          <div className="max-w-6xl mx-auto">
            <h2 className="heading-display text-center mb-12">
              <span className="text-[#60a5fa]">Sponsorlarımız</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sponsors.map((sponsor) => (
                <SponsorCard key={sponsor.id} sponsor={sponsor} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative overflow-hidden py-24 px-4 border-t border-mancave-border">
        <div className="glow-radial absolute inset-0 opacity-40" />
        <div className="relative max-w-3xl mx-auto text-center space-y-6">
          <h2 className="heading-display text-[30px]">
            Sen de Aramıza{" "}
            <span className="text-[#60a5fa]">Katıl</span>
          </h2>
          <p className="text-[#8f9fb4] max-w-lg mx-auto">
            Premium otomotiv topluluğumuzda yerini al. Etkinliklere katıl, özel
            içeriklere eriş, kardeşliğin bir parçası ol.
          </p>
          <Link href="/apply">
            <Button
              size="lg"
              className="btn-gradient px-10 py-6 text-base mt-4"
            >
              <Shield className="w-5 h-5 mr-2" />
              Başvuru Yap
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
