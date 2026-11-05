"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Home, UserPlus, LogIn, LayoutDashboard, Shield, MessageCircle, User } from "lucide-react";

export function BottomNav() {
  const { isAuthenticated, isAdmin } = useAuth();
  const pathname = usePathname();

  const guestLinks = [
    { href: "/", label: "Ana Sayfa", icon: Home },
    { href: "/apply", label: "Başvuru", icon: UserPlus },
    { href: "/login", label: "Giriş", icon: LogIn },
  ];

  const memberLinks = [
    { href: "/dashboard", label: "Keşfet", icon: LayoutDashboard },
    ...(isAdmin ? [{ href: "/admin", label: "Panel", icon: Shield }] : []),
    { href: "/chat", label: "Sohbet", icon: MessageCircle },
    { href: "/profile", label: "Profil", icon: User },
  ];

  const links = isAuthenticated ? memberLinks : guestLinks;
  const left = links.slice(0, Math.ceil(links.length / 2));
  const right = links.slice(Math.ceil(links.length / 2));

  const item = (link: { href: string; label: string; icon: typeof Home }) => {
    const isActive = pathname === link.href;
    return (
      <Link
        key={link.href}
        href={link.href}
        className={`flex flex-col items-center justify-center gap-1 flex-1 min-w-0 py-2 transition-colors ${
          isActive ? "text-[#3b82f6]" : "text-[#8b95a7]"
        }`}
      >
        <link.icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.4 : 1.8} />
        <span className="text-[10px] font-medium truncate">{link.label}</span>
      </Link>
    );
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="max-w-[430px] mx-auto px-3 pb-3 pointer-events-auto">
        <nav className="relative bg-white border border-[#e6eaf3] shadow-[0_-4px_24px_rgba(15,20,32,0.08)] rounded-[26px] px-2">
          <div className="flex items-center">
            {left.map(item)}

            <Link
              href={isAuthenticated ? "/dashboard" : "/apply"}
              aria-label="Hızlı işlem"
              className="w-[58px] h-[58px] -mt-6 shrink-0 rounded-full bg-[#3b82f6] text-white flex items-center justify-center shadow-[0_6px_18px_rgba(59,130,246,0.45)]"
            >
              <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v8M8 12h8" strokeLinecap="round" />
              </svg>
            </Link>

            {right.map(item)}
          </div>
        </nav>
      </div>
    </div>
  );
}
