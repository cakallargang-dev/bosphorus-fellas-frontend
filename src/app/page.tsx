"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { StatsCard } from "@/components/StatsCard";
import { EventCard } from "@/components/EventCard";
import { SponsorCard } from "@/components/SponsorCard";
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
  const [stats, setStats] = useState<LandingPageStats | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    <div className="min-h-screen flex flex-col bg-mancave-bg">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-mancave-gold/5 via-transparent to-mancave-bg" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08),transparent_70%)]" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-xl border-2 border-mancave-gold flex items-center justify-center bg-mancave-gold/10">
              <Shield className="w-8 h-8 text-mancave-gold" />
            </div>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
            <span className="text-white">BOSPHORUS</span>{" "}
            <span className="text-mancave-gold">FELLAS</span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto font-light">
            Ham Güç. Arınmış Ruh.
          </p>

          <p className="text-base text-gray-500 max-w-xl mx-auto leading-relaxed">
            Premium otomotiv tutkunları için özel bir topluluk. Bosphorus
            Fellas; gücü, estetiği ve kardeşliği bir araya getirir.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/apply">
              <Button
                size="lg"
                className="bg-mancave-gold text-black hover:bg-mancave-gold-light font-semibold px-8 py-6 text-base"
              >
                <Car className="w-5 h-5 mr-2" />
                Aramıza Katıl
              </Button>
            </Link>
            <Link href="/events">
              <Button
                variant="outline"
                size="lg"
                className="border-mancave-border text-gray-300 hover:bg-mancave-surface hover:text-white px-8 py-6 text-base"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Etkinlikler
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-mancave-border flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-mancave-gold" />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && !error && (
        <section className="py-20 px-4 border-t border-mancave-border">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-12">
              Rakamlarla{" "}
              <span className="text-mancave-gold">Bosphorus Fellas</span>
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

      {/* Events Section */}
      {events.length > 0 && (
        <section className="py-20 px-4 border-t border-mancave-border">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-bold text-white">
                Yaklaşan <span className="text-mancave-gold">Etkinlikler</span>
              </h2>
              <Link href="/events">
                <Button
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
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

      {/* Sponsors Section */}
      {sponsors.length > 0 && (
        <section className="py-20 px-4 border-t border-mancave-border">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-12">
              <span className="text-mancave-gold">Sponsorlarımız</span>
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
      <section className="py-24 px-4 border-t border-mancave-border">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">
            Sen de Aramıza{" "}
            <span className="text-mancave-gold">Katıl</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            Premium otomotiv topluluğumuzda yerini al. Etkinliklere katıl, özel
            içeriklere eriş, kardeşliğin bir parçası ol.
          </p>
          <Link href="/apply">
            <Button
              size="lg"
              className="bg-mancave-gold text-black hover:bg-mancave-gold-light font-semibold px-10 py-6 text-base mt-4"
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
