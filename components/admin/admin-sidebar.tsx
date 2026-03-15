"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Building2, Users, ScrollText, Heart, AlertTriangle, Coins, Workflow, Wrench, ChevronLeft, Zap, Bot, Car, Shield, BookOpen, CalendarClock, Settings2, Hash, BarChart3, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarSessionFooter } from "@/components/dashboard/sidebar-session-footer";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";

interface AdminSidebarProps {
  onLogout: () => void;
  isCollapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  countdownSeconds?: number;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string;
  comingSoon?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const adminNavSections: NavSection[] = [
  {
    items: [
      { href: "/admin", label: "Dashboard", icon: Home, exact: true },
    ],
  },
  {
    title: "Pilotage",
    items: [
      { href: "/admin/commercial", label: "Commerciaux", icon: Users },
      { href: "/admin/sante-individuelle", label: "Santé Individuelle", icon: Heart },
      { href: "/admin/sante-collective", label: "Santé Collective", icon: Building2 },
      { href: "/admin/sinistre", label: "Sinistre", icon: AlertTriangle },
      { href: "/admin/boost", label: "Boost", icon: Zap },
      { href: "/admin/commissions-agence", label: "Commissions Agence", icon: Coins },
    ],
  },
  {
    title: "Process",
    items: [
      { href: "/admin/preterme-auto", label: "Prétermes Auto", icon: Car },
      { href: "/admin/preterme-ird", label: "Prétermes IARD", icon: Shield },
      { href: "/admin/mplus3", label: "M+3", icon: CalendarClock, comingSoon: true },
      { href: "/commun/process", label: "Nos Procédures", icon: Workflow },
    ],
  },
  {
    title: "Ressources",
    items: [
      { href: "/admin/bs", label: "BS", icon: BarChart3 },
      { href: "/admin/collaborateurs", label: "Collaborateurs", icon: UsersRound },
      { href: "/commun/outils", label: "Outils", icon: Wrench, badge: "new" },
      { href: "/commun/agents-ia", label: "Mes agents IA", icon: Bot, badge: "en formation" },
      { href: "/commun/courtage", label: "Courtage", icon: BookOpen },
      { href: "/admin/parametres-trello", label: "Paramètres Trello", icon: Settings2 },
      { href: "/admin/parametres-slack", label: "Paramètres Slack", icon: Hash },
      { href: "/admin/companies", label: "Compagnies", icon: Building2 },
      { href: "/admin/users", label: "Utilisateurs", icon: Users },
      { href: "/admin/logs", label: "Journal des logs", icon: ScrollText },
    ],
  },
];

export function AdminSidebar({ onLogout, isCollapsed, onCollapsedChange, countdownSeconds }: AdminSidebarProps) {
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
          "hidden lg:block",
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
          <nav className="flex-1 p-3 overflow-y-auto space-y-1">
            {adminNavSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className={cn(sectionIndex > 0 && "pt-2")}>
                {/* Séparateur + titre de section */}
                {sectionIndex > 0 && (
                  <div className="mb-1">
                    <div className="border-t border-slate-200 dark:border-slate-800 mb-2" />
                    {!isCollapsed && (
                      <span className="px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {section.title}
                      </span>
                    )}
                  </div>
                )}

                {/* Items de la section */}
                <div className="space-y-0.5 mt-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = !item.comingSoon && (item.exact
                      ? pathname === item.href
                      : pathname?.startsWith(item.href));

                    return (
                      <Button
                        key={item.href}
                        variant={isActive ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 transition-all relative h-9",
                          isActive && "bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 hover:from-slate-700 hover:via-slate-800 hover:to-slate-700 text-white shadow-md shadow-slate-500/20",
                          !isActive && "hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-900/30 dark:hover:to-slate-800/30",
                          isCollapsed && "justify-center px-2"
                        )}
                        onClick={() => {
                          if (item.comingSoon) {
                            toast.info("Fonctionnalité à venir !");
                            return;
                          }
                          router.push(item.href);
                        }}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!isCollapsed && (
                          <span className="font-medium text-sm">{item.label}</span>
                        )}
                        {!isCollapsed && item.comingSoon && (
                          <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-white shadow-md animate-pulse">
                            à venir
                          </span>
                        )}
                        {!isCollapsed && item.badge === "en formation" && (
                          <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-white shadow-md animate-pulse">
                            en formation
                          </span>
                        )}
                        {!isCollapsed && item.badge === "new" && (
                          <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-md animate-pulse">
                            new
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Footer */}
          <SidebarSessionFooter
            countdownSeconds={countdownSeconds}
            userData={userData}
            onLogout={onLogout}
            variant="admin"
            isCollapsed={isCollapsed}
          />
        </div>
      </aside>

      {/* Bouton flottant rouvrir */}
      {isCollapsed && (
        <button
          onClick={() => onCollapsedChange(false)}
          className="hidden lg:flex fixed left-16 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-slate-600 to-slate-800 text-white p-3 rounded-r-xl shadow-2xl hover:shadow-slate-500/50 transition-all duration-300 hover:scale-110 group"
          title="Ouvrir le menu"
        >
          <ChevronLeft className="h-5 w-5 rotate-180 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-600 to-slate-800 opacity-0 group-hover:opacity-50 blur-xl transition-opacity rounded-r-xl -z-10" />
        </button>
      )}

      {/* Bouton flottant fermer */}
      {!isCollapsed && (
        <button
          onClick={() => onCollapsedChange(true)}
          className="hidden lg:flex fixed left-64 top-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-slate-700 to-slate-900 text-white p-3 rounded-r-xl shadow-2xl hover:shadow-slate-600/50 transition-all duration-300 hover:scale-110 group"
          title="Fermer le menu"
        >
          <ChevronLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-900 opacity-0 group-hover:opacity-50 blur-xl transition-opacity rounded-r-xl -z-10" />
        </button>
      )}
    </>
  );
}
