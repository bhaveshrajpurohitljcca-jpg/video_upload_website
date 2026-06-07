'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Menu, X, Video, LogOut, LayoutDashboard, User, ShieldAlert } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Gallery', href: '/gallery' },
  ];

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'admin') return { name: 'Admin Dashboard', href: '/dashboard/admin' };
    if (user.role === 'judge') return { name: 'Judge Dashboard', href: '/dashboard/judge' };
    return { name: 'Student Dashboard', href: '/dashboard/student' };
  };

  const dashboardLink = getDashboardLink();

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/8 bg-background/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/20 group-hover:scale-105 transition-all">
                <Video className="h-5 w-5 text-black" />
              </div>
              <span className="text-sm font-extrabold tracking-widest text-white uppercase font-heading">
                Creators<span className="text-primary">Bootcamp</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-xs font-semibold uppercase tracking-wider transition-colors hover:text-white ${
                  isActive(link.href) ? 'text-primary' : 'text-zinc-400'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {dashboardLink && (
              <Link
                href={dashboardLink.href}
                className={`text-xs font-semibold uppercase tracking-wider transition-colors hover:text-white flex items-center gap-1.5 ${
                  isActive(dashboardLink.href) ? 'text-primary' : 'text-zinc-400'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                {dashboardLink.name}
              </Link>
            )}
          </div>

          {/* Auth Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-zinc-300">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold max-w-[120px] truncate">
                    {user.full_name || user.name || user.email}
                  </span>
                  <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary uppercase">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary py-2 px-4 text-xs font-bold">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-background/95 backdrop-blur-lg px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-base font-semibold transition-colors ${
                isActive(link.href) ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {link.name}
            </Link>
          ))}

          {dashboardLink && (
            <Link
              href={dashboardLink.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block rounded-lg px-3 py-2 text-base font-semibold transition-colors flex items-center gap-2 ${
                isActive(dashboardLink.href) ? 'bg-primary/10 text-primary' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              {dashboardLink.name}
            </Link>
          )}

          <hr className="border-white/5 my-2" />

          {user ? (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-zinc-300">
                <User className="h-4 w-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="truncate font-semibold">{user.full_name || user.name || user.email}</p>
                  <p className="text-[10px] text-primary uppercase font-bold">{user.role}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 font-semibold transition-colors text-sm"
              >
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-lg border border-white/10 py-2 text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="btn-primary py-2 text-center text-sm font-semibold"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
export default Navbar;
