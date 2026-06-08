"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Scale,
  Ruler,
  Apple,
  UtensilsCrossed,
  Dumbbell,
  HeartPulse,
  CheckSquare,
  Activity,
  Target,
  BarChart3,
  FileText,
  Trophy,
  Settings,
  ChevronLeft,
  Flame,
  X,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Calendar,
  Scale,
  Ruler,
  Apple,
  UtensilsCrossed,
  Dumbbell,
  HeartPulse,
  CheckSquare,
  Activity,
  Target,
  BarChart3,
  FileText,
  Trophy,
  Settings,
  User,
};

const navItems = [
  { title: "Dashboard", href: "/", icon: "LayoutDashboard" },
  { title: "Profile", href: "/profile", icon: "User" },
  { title: "Calendar", href: "/calendar", icon: "Calendar" },
  { title: "Weight", href: "/weight", icon: "Scale" },
  { title: "Measurements", href: "/measurements", icon: "Ruler" },
  { title: "Food Database", href: "/food", icon: "Apple" },
  { title: "Nutrition", href: "/nutrition", icon: "UtensilsCrossed" },
  { title: "Workouts", href: "/workouts", icon: "Dumbbell" },
  { title: "Cardio", href: "/cardio", icon: "HeartPulse" },
  { title: "Habits", href: "/habits", icon: "CheckSquare" },
  { title: "Health", href: "/health", icon: "Activity" },
  { title: "Goals", href: "/goals", icon: "Target" },
  { title: "Analytics", href: "/analytics", icon: "BarChart3" },
  { title: "Reviews", href: "/reviews", icon: "FileText" },
  { title: "Milestones", href: "/milestones", icon: "Trophy" },
  { title: "Settings", href: "/settings", icon: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapse } =
    useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setMounted(true);
    }, 0);
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[#161b22]/95 backdrop-blur-2xl transition-all duration-300 lg:relative",
          sidebarCollapsed ? "w-[72px]" : "w-[260px]",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 shadow-lg shadow-teal-500/25">
              <Flame className="h-5 w-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="text-base font-bold text-white tracking-tight">
                  Project 72
                </span>
                <span className="text-[10px] text-white/40 font-medium tracking-wider uppercase">
                  Health OS
                </span>
              </motion.div>
            )}
          </Link>
          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon];
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-teal-500/10 text-teal-400 shadow-sm font-semibold"
                      : "text-white/50 hover:text-white hover:bg-white/[0.06]"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-gradient-to-b from-teal-400 to-emerald-500"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  {Icon && (
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                        isActive
                          ? "text-teal-400"
                          : "text-white/40 group-hover:text-white/70"
                      )}
                    />
                  )}
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.title}</span>
                  )}
                </Link>
              );

              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return link;
            })}
          </nav>
        </ScrollArea>

        {/* Sign Out Button */}
        {mounted && !(process.env.NEXT_PUBLIC_SUPABASE_URL || "").includes("placeholder") && (
          <div className="px-3 py-1 border-t border-white/[0.06]">
            <button
              onClick={async () => {
                document.cookie = "p72_demo_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC";
                const { createClient } = await import("@/lib/supabase/client");
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = "/auth/login";
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        )}

        {/* Collapse toggle - desktop only */}
        <div className="hidden lg:flex border-t border-white/[0.06] p-3">
          <button
            onClick={toggleSidebarCollapse}
            className="flex w-full items-center justify-center rounded-xl p-2 text-white/40 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-300",
                sidebarCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
