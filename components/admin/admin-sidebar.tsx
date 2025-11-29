"use client";

import { Home, Building2, LogOut, Users, User, ScrollText, ChevronLeft, ChevronRight, Heart, AlertTriangle, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/firebase/use-auth";
import Image from "next/image";

interface AdminSidebarProps {
  onLogout: () => void;
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

export function AdminSidebar({ onLogout, isCollapsed, onCollapsedChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const { userData } = useAuth();

  const navItems = [
    {
      href: "/admin",
      label: "Dashboard",
      icon: Home,
      exact: true,
    },
    {
      href: "/admin/commercial",
      label: "Commerciaux",
      icon: Users,
    },
    {
      href: "/admin/sante-individuelle",
      label: "Santé Individuelle",
      icon: Heart,
    },
    {
      href: "/admin/sante-collective",
      label: "Santé Collective",
      icon: Building2,
    },
    {
      href: "/admin/sinistre",
      label: "Sinistre",
      icon: AlertTriangle,
    },
    {
      href: "/admin/commissions-agence",
      label: "Commissions Agence",
      icon: Coins,
      separator: true, // Séparateur avant cet item
    },
    {
      href: "/admin/companies",
      label: "Compagnies",
      icon: Building2,
    },
    {
      href: "/admin/users",
      label: "Utilisateurs",
      icon: Users,
    },
    {
      href: "/admin/logs",
      label: "Journal des logs",
      icon: ScrollText,
    },
  ];

  return (
    <>
      <aside className={cn(
        "border-r h-screen fixed left-0 top-0 z-40 transition-all duration-300",
        "bg-gradient-to-b from-white via-blue-50/30 to-purple-50/30 dark:from-slate-950 dark:via-blue-950/10 dark:to-purple-950/10",
        "hidden lg:block", // Masquer sur mobile/tablette
        isCollapsed ? "w-16" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Header avec logo */}
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20 backdrop-blur-sm">
            {!isCollapsed ? (
              <div className="flex flex-col gap-1 flex-1">
                <div className="relative group">
                  <Image
                    src="/allianz.svg"
                    alt="Allianz"
                    width={100}
                    height={24}
                    className="h-6 w-auto brightness-0 dark:brightness-100 transition-all duration-300 group-hover:scale-105"
                  />
                  {/* Effet glow au hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10" />
                </div>
                <span className="text-xs font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Administration
                </span>
              </div>
            ) : (
              <div className="relative group mx-auto">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110 p-1">
                  <Image
                    src="/favicon.png"
                    alt="Allianz"
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onCollapsedChange(!isCollapsed)}
              className="h-8 w-8 hover:bg-white/50 dark:hover:bg-black/50"
            >
              <ChevronLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  isCollapsed && "rotate-180"
                )}
              />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? pathname === item.href
                : pathname?.startsWith(item.href);

              return (
                <div key={item.href}>
                  {/* Séparateur visuel avant certains items */}
                  {item.separator && !isCollapsed && (
                    <div className="my-3 border-t border-muted" />
                  )}
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 transition-all relative overflow-hidden",
                        isActive 
                          ? "bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 text-white font-semibold hover:from-blue-700 hover:via-purple-700 hover:to-blue-700 shadow-md shadow-blue-500/20" 
                          : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </nav>

          {/* Utilisateur connecté et déconnexion */}
          <div className="mt-auto shrink-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 dark:from-blue-600/10 dark:via-purple-600/10 dark:to-pink-600/10">
            {/* Info utilisateur */}
            {userData && !isCollapsed && (
              <div className="p-4 border-t border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {userData.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {userData.email.split('@')[0]}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-[10px] font-bold">
                        ADMIN
                      </div>
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Info utilisateur collapsed */}
            {userData && isCollapsed && (
              <div className="p-2 border-t border-b">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md mx-auto">
                  {userData.email.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            
            {/* Bouton déconnexion */}
            <div className="p-4">
              <Button
                variant="outline"
                className={cn(
                  "w-full gap-3 bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700 hover:border-red-400 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-all",
                  isCollapsed ? "justify-center px-2" : "justify-start"
                )}
                onClick={onLogout}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!isCollapsed && "Déconnexion"}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Bouton flottant pour ouvrir la sidebar - Desktop uniquement */}
      {isCollapsed && (
        <button
          onClick={() => onCollapsedChange(false)}
          className="hidden lg:flex fixed left-16 top-1/2 -translate-y-1/2 z-50 h-12 w-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-r-lg shadow-lg transition-all duration-300 items-center justify-center group"
          aria-label="Ouvrir la sidebar"
        >
          <ChevronRight className="h-4 w-4 group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Bouton flottant pour fermer la sidebar - Desktop uniquement */}
      {!isCollapsed && (
        <button
          onClick={() => onCollapsedChange(true)}
          className="hidden lg:flex fixed left-64 top-1/2 -translate-y-1/2 z-50 h-12 w-6 bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-700 hover:to-rose-700 text-white rounded-r-lg shadow-lg transition-all duration-300 items-center justify-center group"
          aria-label="Fermer la sidebar"
        >
          <ChevronLeft className="h-4 w-4 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </>
  );
}

