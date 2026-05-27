"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  X,
  Shield,
  User,
  LogOut,
  Calendar,
  LayoutDashboard,
} from "lucide-react";

const NAV_LINKS = [
  { href: "/events", label: "Etkinlikler", icon: Calendar },
  { href: "/apply", label: "Üyelik Başvurusu", icon: User },
];

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "BF";

  return (
    <nav className="sticky top-0 z-50 border-b border-mancave-border bg-mancave-bg/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="w-9 h-9 rounded border border-mancave-gold flex items-center justify-center group-hover:bg-mancave-gold/10 transition-colors">
              <span className="text-mancave-gold font-bold text-sm">BF</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-semibold text-sm tracking-wider leading-tight">
                BOSPHORUS
              </div>
              <div className="text-mancave-gold text-xs tracking-[0.2em] leading-tight">
                FELLAS
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white hover:bg-mancave-surface"
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* Auth section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 hover:bg-mancave-surface"
                  >
                    <Avatar className="h-8 w-8 border border-mancave-border">
                      <AvatarImage
                        src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : undefined}
                        alt={user?.firstName}
                      />
                      <AvatarFallback className="bg-mancave-gold/10 text-mancave-gold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-300 max-w-[120px] truncate">
                      {user?.firstName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-mancave-card border-mancave-border"
                >
                  <div className="px-3 py-2">
                    <p className="text-sm text-white font-medium truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="bg-mancave-border" />
                  <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-mancave-surface cursor-pointer">
                    <Link href="/dashboard" className="flex items-center">
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Panel
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-mancave-surface cursor-pointer">
                    <Link href="/profile" className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="text-gray-300 focus:text-white focus:bg-mancave-surface cursor-pointer">
                      <Link href="/admin" className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Yönetim
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-mancave-border" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-400 focus:text-red-300 focus:bg-mancave-surface cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-mancave-surface"
                  >
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/apply">
                  <Button
                    size="sm"
                    className="bg-mancave-gold text-black hover:bg-mancave-gold-light font-medium"
                  >
                    Başvur
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-400 hover:text-white hover:bg-mancave-surface"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-mancave-border py-4 space-y-2 animate-in slide-in-from-top-2">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gray-400 hover:text-white hover:bg-mancave-surface"
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}
            <div className="border-t border-mancave-border pt-2 mt-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar className="h-10 w-10 border border-mancave-border">
                      <AvatarImage
                        src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : undefined}
                      />
                      <AvatarFallback className="bg-mancave-gold/10 text-mancave-gold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-white font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-400 hover:text-white hover:bg-mancave-surface"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Panel
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-gray-400 hover:text-white hover:bg-mancave-surface"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profil
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-gray-400 hover:text-white hover:bg-mancave-surface"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Yönetim
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-mancave-surface"
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Çıkış Yap
                  </Button>
                </>
              ) : (
                <div className="space-y-2 px-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="outline"
                      className="w-full border-mancave-border text-gray-300 hover:bg-mancave-surface"
                    >
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link href="/apply" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-mancave-gold text-black hover:bg-mancave-gold-light font-medium">
                      Başvur
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
