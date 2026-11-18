"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Home, UserPlus, LogIn, LayoutDashboard, Shield, Users, User, Film, Map, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/lib/api";
import { countUnreadChannels } from "@/lib/chatRead";

export function BottomNav() {
  const { isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();

  const guestLinks = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/kayit", label: "Kayıt", icon: UserPlus },
    { href: "/login", label: "Giriş", icon: LogIn },
  ];

  const memberLinks = [
    { href: "/dashboard", label: "Anasayfa", icon: Home },
    ...(isAdmin ? [{ href: "/admin", label: "Panel", icon: Shield }] : []),
    { href: "/ekip", label: "Ekip", icon: Users },
    { href: "/harita", label: "Harita", icon: Map },
    { href: "/chat", label: "Sohbet", icon: MessageCircle },
    { href: "/medya", label: "Medya", icon: Film },
    { href: "/profile", label: "Profil", icon: User },
  ];

  const links = isAuthenticated ? memberLinks : guestLinks;

  /**
   * Okunmamış sohbet rozeti.
   * 60 sn'de bir tazelenir; sekme değişiminde de yenilenir (staleTime 0).
   * Hata olursa rozet sessizce gizlenir — nav bozulmasın.
   */
  const { data: activity } = useQuery({
    queryKey: ["chat-activity", pathname],
    queryFn: () => chatApi.getActivity(),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchInterval: 60_000,
    retry: false,
  });

  const unread = activity?.data ? countUnreadChannels(activity.data) : 0;

  /**
   * Klavye açıkken nav gizlenir.
   * Sohbet sayfası <html>'e `kb-open` sınıfı ekliyor; CSS ile opacity 0
   * ve pointer-events none yapıyoruz (display:none yerine, geçiş yumuşak).
   */
  const [kbOpen, setKbOpen] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setKbOpen(el.classList.contains("kb-open"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return (
    <nav
      className={`fixed left-0 right-0 z-[60] mx-auto transition-opacity duration-150 ${kbOpen ? "pointer-events-none opacity-0" : "opacity-100"} w-[calc(100%-1.5rem)] max-w-[406px] rounded-[22px] border border-[#162544] bg-[#0a1628]/95 shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(59,130,246,0.06)]`}
      style={{
        // iOS Safari'de backdrop-filter + scroll kombinasyonu nav'ı kaydırıyordu.
        // Sabit konumu GPU katmanına alıp backdrop-filter'ı kaldırdık (bg opak yapıldı).
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
        transform: "translate3d(0,0,0)",
        willChange: "transform",
        isolation: "isolate",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <div className="flex items-center justify-around h-[60px] px-1">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 min-w-0 flex-1 rounded-[16px] ${
                isActive
                  ? "text-[#60a5fa]"
                  : "text-[#7a8da4] hover:-translate-y-0.5 hover:text-[#b9c6d8]"
              }`}
            >
              {isActive && (
                <span className="animate-pulse-soft absolute inset-x-1.5 inset-y-0.5 -z-10 rounded-[14px] bg-[#3b82f6]/12 ring-1 ring-[#3b82f6]/25" />
              )}
              <span className="relative">
                <link.icon
                  className={`w-[19px] h-[19px] transition-transform duration-300 ${isActive ? "scale-110" : ""}`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                {/* Okunmamış sohbet rozeti */}
                {link.href === "/chat" && unread > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#ef4444] px-1 text-[9px] font-bold leading-none text-white shadow-[0_0_0_2px_#0a1628]">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              <span className="text-[9.5px] font-medium tracking-[0.02em] truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
