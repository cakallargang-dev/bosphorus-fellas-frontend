"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Home, UserPlus, LogIn, LayoutDashboard, Shield, Users, User, Film } from "lucide-react";

export function BottomNav() {
  const { isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();

  const guestLinks = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/apply", label: "Başvuru", icon: UserPlus },
    { href: "/login", label: "Giriş", icon: LogIn },
  ];

  const memberLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ...(isAdmin ? [{ href: "/admin", label: "Panel", icon: Shield }] : []),
    { href: "/ekip", label: "Ekip", icon: Users },
    { href: "/medya", label: "Medya", icon: Film },
    { href: "/profile", label: "Profil", icon: User },
  ];

  const links = isAuthenticated ? memberLinks : guestLinks;

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-50 mx-auto w-[calc(100%-1.5rem)] max-w-[406px] rounded-[22px] border border-[#162544] bg-[#0a1628]/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(59,130,246,0.06)] safe-area-inset-bottom">
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
              <link.icon
                className={`w-[19px] h-[19px] transition-transform duration-300 ${isActive ? "scale-110" : ""}`}
                strokeWidth={isActive ? 2.2 : 1.8}
              />
              <span className="text-[9.5px] font-medium tracking-[0.02em] truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
