"use client";

import { Home, Building2, LogOut, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  onLogout: () => void;
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/admin",
      label: "Accueil",
      icon: Home,
      exact: true,
    },
    {
      href: "/admin/users",
      label: "Utilisateurs",
      icon: Users,
    },
    {
      href: "/admin/companies",
      label: "Compagnies",
      icon: Building2,
    },
  ];

  return (
    <aside className="w-64 border-r h-screen fixed left-0 top-0 z-40 bg-gradient-to-b from-white via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/10 dark:to-purple-950/10">
      <div className="flex flex-col h-full">
        {/* Logo et titre */}
        <div className="p-6 border-b shrink-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20 backdrop-blur-sm">
          <div className="flex flex-col gap-2">
            <div className="relative group">
              <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
                Allianz
              </h2>
              {/* Effet glow au hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10" />
            </div>
            <span className="text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Administration
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact 
              ? pathname === item.href
              : pathname?.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 transition-all relative overflow-hidden",
                    isActive 
                      ? "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 shadow-md shadow-blue-500/20" 
                      : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Déconnexion */}
        <div className="mt-auto p-4 border-t shrink-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700 hover:border-red-400 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-all"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </Button>
        </div>
      </div>
    </aside>
  );
}

