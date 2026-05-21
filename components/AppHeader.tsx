'use client';

import React from "react";
import { usePathname } from "next/navigation";
import { Grid3X3, LayoutDashboard } from "lucide-react";

const navItems = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
];

export default function AppHeader() {
  const pathname = usePathname();
  const isCommandCenter = pathname === "/";
  const isHome = pathname === "/";

  return (
    <header className="border-b" style={{ borderColor: "var(--color-border, #2d3748)", background: "rgba(10, 14, 39, 0.7)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <a href="/" className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-xs font-black text-white">A</span>
              </div>
              <span className="font-bold text-sm hidden sm:block" style={{ color: "var(--color-text-primary, #f8fafc)" }}>Andwell</span>
            </a>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = item.href === "/" ? isHome : pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      active
                        ? "bg-blue-600/20 text-blue-400"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </a>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/10 text-blue-400 border border-blue-600/20 hover:bg-blue-600/20 transition-all"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">v1.0</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
