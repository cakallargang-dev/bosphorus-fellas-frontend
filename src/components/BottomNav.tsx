"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Home, UserPlus, LogIn, LayoutDashboard, User } from "lucide-react";

export function BottomNav() {
  const { isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();

  const guestLinks = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/apply", label: "Başvuru", icon: UserPlus },
    { href: "/login", label: "Giriş", icon: LogIn },
  ];

  const memberLinks = [
    { href: isAdmin ? "/admin" : "/dashboard", label: "Panel", icon: LayoutDashboard },
    { href: "/profile", label: "Profil", icon: User },
  ];

  const links = isAuthenticated ? memberLinks : guestLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-mancave-border bg-mancave-bg/95 backdrop-blur-xl safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-0 flex-1 transition-colors ${
                isActive
                  ? "text-mancave-gold"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
