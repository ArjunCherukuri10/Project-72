"use client";

import { useEffect, useState } from "react";
import { Menu, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { format, parseISO, addDays, subDays } from "date-fns";
import Link from "next/link";
import { trackerService } from "@/lib/services";
import { Profile } from "@/types";

export function Header() {
  const { toggleSidebar, selectedDate, setSelectedDate } = useAppStore();
  const [profile, setProfile] = useState<Profile | null>(null);

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

  const handlePrevDay = () => {
    const d = parseISO(selectedDate);
    const prev = subDays(d, 1);
    setSelectedDate(format(prev, "yyyy-MM-dd"));
  };

  const handleNextDay = () => {
    const d = parseISO(selectedDate);
    const next = addDays(d, 1);
    setSelectedDate(format(next, "yyyy-MM-dd"));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setSelectedDate(e.target.value);
    }
  };

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const isTodayDate = selectedDate === todayStr;
  const activeDateParsed = parseISO(selectedDate);
  const formattedDisplayDate = format(activeDateParsed, "EEEE, MMMM d, yyyy");

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

      {/* Date & Date Navigation */}
      <div className="flex-1 flex items-center gap-2 md:gap-3 min-w-0">
        <div className="flex items-center bg-white/[0.03] border border-white/[0.08] rounded-xl p-0.5 shadow-sm">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-150"
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div className="relative flex items-center px-2 py-1 gap-2 cursor-pointer hover:bg-white/5 rounded-lg transition-all min-w-[150px] justify-center sm:min-w-[190px]">
            <Calendar className="h-3.5 w-3.5 text-teal-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-white/90 select-none truncate">
              {formattedDisplayDate}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all duration-150"
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {!isTodayDate && (
          <button
            onClick={() => setSelectedDate(todayStr)}
            className="px-2.5 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold hover:bg-teal-500/20 active:scale-95 transition-all duration-150 shrink-0"
          >
            Today
          </button>
        )}
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

