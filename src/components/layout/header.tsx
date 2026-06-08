"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { format } from "date-fns";
import Link from "next/link";
import { trackerService } from "@/lib/services";
import { Profile } from "@/types";

export function Header() {
  const { toggleSidebar } = useAppStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  useEffect(() => {
    trackerService.getProfile().then(setProfile).catch(console.error);
  }, []);

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/[0.06] bg-[#0f1117]/80 backdrop-blur-2xl px-4 lg:px-6">
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
        <Link href="/profile">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-semibold text-sm hover:bg-teal-500/20 transition-all duration-200 shadow-sm"
            title="View Profile"
          >
            {getInitials(profile?.full_name)}
          </button>
        </Link>
      </div>
    </header>
  );
}
