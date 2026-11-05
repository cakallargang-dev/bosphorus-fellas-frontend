"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  { href: "/apply", label: "Üyelik Başvurusu", icon: User },
];

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "BF";

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e6eaf3] bg-[#f5f7fb]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="w-9 h-9 rounded border border-mancave-blue flex items-center justify-center group-hover:bg-mancave-blue/10 transition-colors">
              <span className="text-[#3b82f6] font-bold text-sm">BF</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-[#0f1420] font-semibold text-sm tracking-wider leading-tight">
                BOSPHORUS
              </div>
              <div className="text-[#3b82f6] text-xs tracking-[0.2em] leading-tight">
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
                  className="text-[#4a5568] hover:text-[#0f1420] hover:bg-white"
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
                <DropdownMenuTrigger>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-2 hover:bg-white"
                    tabIndex={-1}
                  >
                    <Avatar className="h-8 w-8 border border-[#e6eaf3]">
                      <AvatarImage
                        src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : undefined}
                        alt={user?.firstName}
                      />
                      <AvatarFallback className="bg-mancave-blue/10 text-[#3b82f6] text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-[#2c3648] max-w-[120px] truncate">
                      {user?.firstName}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-white border-[#e6eaf3]"
                >
                  <div className="px-3 py-2">
                    <p className="text-sm text-[#0f1420] font-medium truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-[#6b7688] truncate">
                      {user?.phone}
                    </p>
                  </div>
                  <DropdownMenuSeparator className="bg-mancave-border" />
                  <DropdownMenuItem onClick={() => router.push("/dashboard")} className="text-[#2c3648] focus:text-[#0f1420] focus:bg-white cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Panel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile")} className="text-[#2c3648] focus:text-[#0f1420] focus:bg-white cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profil
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => router.push("/admin")} className="text-[#2c3648] focus:text-[#0f1420] focus:bg-white cursor-pointer">
                      <Shield className="w-4 h-4 mr-2" />
                      Yönetim
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-mancave-border" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-400 focus:text-red-300 focus:bg-white cursor-pointer"
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
                    className="text-[#4a5568] hover:text-[#0f1420] hover:bg-white"
                  >
                    Giriş Yap
                  </Button>
                </Link>
                <Link href="/apply">
                  <Button
                    size="sm"
                    className="bg-mancave-blue text-black hover:bg-mancave-blue-light font-medium"
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
            className="md:hidden text-[#4a5568] hover:text-[#0f1420] hover:bg-white"
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
          <div className="md:hidden border-t border-[#e6eaf3] py-4 space-y-2 animate-in slide-in-from-top-2">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-[#4a5568] hover:text-[#0f1420] hover:bg-white"
                >
                  <link.icon className="w-4 h-4 mr-2" />
                  {link.label}
                </Button>
              </Link>
            ))}
            <div className="border-t border-[#e6eaf3] pt-2 mt-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar className="h-10 w-10 border border-[#e6eaf3]">
                      <AvatarImage
                        src={user?.avatar ? `${process.env.NEXT_PUBLIC_API_URL}${user.avatar}` : undefined}
                      />
                      <AvatarFallback className="bg-mancave-blue/10 text-[#3b82f6] text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-[#0f1420] font-medium">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-[#6b7688]">{user?.phone}</p>
                    </div>
                  </div>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-[#4a5568] hover:text-[#0f1420] hover:bg-white"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Panel
                    </Button>
                  </Link>
                  <Link href="/profile" onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-[#4a5568] hover:text-[#0f1420] hover:bg-white"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profil
                    </Button>
                  </Link>
                  {isAdmin && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-[#4a5568] hover:text-[#0f1420] hover:bg-white"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Yönetim
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-white"
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
                      className="w-full border-[#e6eaf3] text-[#2c3648] hover:bg-white"
                    >
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link href="/apply" onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-mancave-blue text-black hover:bg-mancave-blue-light font-medium">
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
