"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Building2, Users, ScrollText, Heart, AlertTriangle, Coins, Workflow, Wrench, Banknote, LogOut, ChevronLeft, User, Zap, Bot, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";

interface AdminSidebarProps {
  onLogout: () => void;
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const adminNavItems = [
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
    href: "/admin/boost",
    label: "Boost",
    icon: Zap,
  },
  {
    href: "/commun/process",
    label: "Process",
    icon: Workflow,
  },
  {
    href: "/commun/outils",
    label: "Outils",
    icon: Wrench,
    badge: "new",
  },
  {
    href: "/commun/agents-ia",
    label: "Mes agents IA",
    icon: Bot,
    badge: "en formation",
  },
  {
    href: "/admin/test-bots",
    label: "Test des Bots",
    icon: FlaskConical,
  },
  {
    href: "/admin/commissions-agence",
    label: "Commissions Agence",
    icon: Coins,
    separator: true,
  },
  {
    href: "/admin/remunerations",
    label: "Rémunérations",
    icon: Banknote,
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

export function AdminSidebar({ onLogout, isCollapsed, onCollapsedChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { userData } = useAuth();

  return (
    <>
      <aside
        className={cn(
          "border-r h-screen fixed left-0 top-0 z-40 transition-all duration-300",
          "bg-gradient-to-b from-white via-slate-50/30 to-slate-100/30",
          "dark:from-slate-950 dark:via-slate-900/10 dark:to-slate-800/10",
          "hidden lg:block", // Masquer sur mobile/tablette
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header avec logo */}
          <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-slate-500/10 via-slate-600/10 to-slate-700/10 dark:from-slate-600/20 dark:via-slate-700/20 dark:to-slate-800/20 backdrop-blur-sm">
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
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-800 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 -z-10" />
                </div>
                <span className="text-xs font-medium bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
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
            {adminNavItems.map((item, index) => {
              const Icon = item.icon;
              const isComingSoon = (item as { comingSoon?: boolean }).comingSoon;
              const isActive = !isComingSoon && (item.exact
                ? pathname === item.href
                : pathname?.startsWith(item.href));

              return (
                <div key={isComingSoon ? item.label : item.href}>
                  {item.separator && index > 0 && (
                    <div className="my-2 border-t border-slate-200 dark:border-slate-800" />
                  )}
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 transition-all relative",
                      isActive && "bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 hover:from-slate-700 hover:via-slate-800 hover:to-slate-700 text-white shadow-md shadow-slate-500/20",
                      !isActive && "hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-900/30 dark:hover:to-slate-800/30",
                      isCollapsed && "justify-center px-2"
                    )}
                    onClick={() => {
                      if ((item as { comingSoon?: boolean }).comingSoon) {
                        toast.info("Fonctionnalité à venir !");
                        return;
                      }
                      router.push(item.href);
                    }}
                    title={(item as { title?: string }).title ?? (isCollapsed ? item.label : undefined)}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                    {!isCollapsed && (item as { comingSoon?: boolean }).comingSoon && (
                      <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-white shadow-md animate-pulse">
                        à venir
                      </span>
                    )}
                    {!isCollapsed && (item as { badge?: string }).badge === "en formation" && (
                      <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-white shadow-md animate-pulse">
                        en formation
                      </span>
                    )}
                    {!isCollapsed && (item as { badge?: string }).badge === "new" && (
                      <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-md animate-pulse">
                        new
                      </span>
                    )}
                  </Button>
                </div>
              );
            })}
          </nav>

          {/* Footer avec utilisateur connecté, thème et déconnexion */}
          <div className="mt-auto border-t bg-gradient-to-r from-slate-500/5 via-slate-600/5 to-slate-700/5 dark:from-slate-600/10 dark:via-slate-700/10 dark:to-slate-800/10">
            {/* Info utilisateur */}
            {userData && !isCollapsed && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {userData.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {userData.email.split('@')[0]}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="px-2 py-0.5 rounded-full bg-slate-600 text-white text-[10px] font-bold">
                        ADMIN
                      </div>
                      <User className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Avatar seul pour collapsed */}
            {userData && isCollapsed && (
              <div className="p-4 border-b flex justify-center">
                <div 
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white font-bold text-lg shadow-md"
                  title={userData.email}
                >
                  {userData.email.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            
            <div className="p-4 space-y-2">
              <div className={cn("flex gap-2", isCollapsed && "flex-col")}>
                <ThemeToggle />
                {!isCollapsed && (
                  <Button
                    variant="outline"
                    onClick={onLogout}
                    className="flex-1 gap-2 bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700 hover:border-red-400 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                )}
                {isCollapsed && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onLogout}
                    title="Déconnexion"
                    className="bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700 hover:border-red-400 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-all"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Bouton flottant pour rouvrir la sidebar quand elle est collapsed - Desktop uniquement */}
      {isCollapsed && (
        <button
          onClick={() => onCollapsedChange(false)}
          className="hidden lg:flex fixed left-16 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-slate-600 to-slate-800 text-white p-3 rounded-r-xl shadow-2xl hover:shadow-slate-500/50 transition-all duration-300 hover:scale-110 group"
          title="Ouvrir le menu"
        >
          <ChevronLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
          {/* Effet glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-800 opacity-0 group-hover:opacity-50 blur-xl transition-opacity rounded-r-xl -z-10" />
        </button>
      )}

      {/* Bouton flottant pour fermer la sidebar quand elle est ouverte - Desktop uniquement */}
      {!isCollapsed && (
        <button
          onClick={() => onCollapsedChange(true)}
          className="hidden lg:flex fixed left-64 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-slate-700 to-slate-900 text-white p-3 rounded-r-xl shadow-2xl hover:shadow-slate-600/50 transition-all duration-300 hover:scale-110 group"
          title="Fermer le menu"
        >
          <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          {/* Effet glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-900 opacity-0 group-hover:opacity-50 blur-xl transition-opacity rounded-r-xl -z-10" />
        </button>
      )}
    </>
  );
}

