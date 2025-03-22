"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  LineChart,
  Settings,
  History,
  Shield,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Trading", href: "/dashboard/trading", icon: LineChart },
  { name: "History", href: "/dashboard/history", icon: History },
  { name: "Security", href: "/dashboard/security", icon: Shield },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "bg-white/50 backdrop-blur-xl border-r-2 border-black/5 px-6 py-8",
        className
      )}
    >
      <div className="mb-12 px-2">
        <h1 className="text-2xl font-bold tracking-tight">Chamillionaire 🦎</h1>
        <p className="text-sm text-black/50 mt-1">
          Adapt Holding to the Market
        </p>
      </div>
      <nav className="space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all",
                isActive
                  ? "bg-black text-white shadow-lg shadow-black/10"
                  : "text-black/60 hover:bg-black/5 hover:text-black"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
