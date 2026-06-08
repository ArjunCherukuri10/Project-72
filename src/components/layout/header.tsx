"use client";

import { Menu, Plus, Bell, Search } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function Header() {
  const { toggleSidebar, setQuickActionOpen } = useAppStore();
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.06] bg-[#07070f]/80 backdrop-blur-2xl px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200"
        aria-label="Toggle navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Date & greeting */}
      <div className="flex-1 min-w-0">
        <h2 className="text-sm font-medium text-white/90 truncate">
          {today}
        </h2>
        <p className="text-xs text-white/40 hidden sm:block">
          Stay consistent. Every day counts.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:flex text-white/50 hover:text-white"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white/50 hover:text-white relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-violet-500" />
        </Button>
        <Button
          size="sm"
          onClick={() => setQuickActionOpen(true)}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Quick Log</span>
        </Button>
      </div>
    </header>
  );
}
