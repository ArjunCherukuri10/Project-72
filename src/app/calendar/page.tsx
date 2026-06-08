"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  subMonths,
  addMonths
} from "date-fns";
import { ChevronLeft, ChevronRight, Scale, Apple, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: summaries = [] } = useQuery({
    queryKey: ["dailySummaries"],
    queryFn: trackerService.getDailySummaries,
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Calendar status color coder helper
  const getDayStatusColor = (dateStr: string) => {
    const summary = summaries.find((s) => s.date === dateStr);
    if (!summary) return "bg-white/[0.02] border-white/[0.04]";

    const score = summary.compliance_score || 0;
    if (score >= 80) return "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20";
    if (score >= 50) return "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20";
    return "bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20";
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Daily Calendar</h1>
        <p className="text-white/60">
          Visual color compliance matrix showing days where diet/habit targets were met.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Calendar Grid Card */}
        <Card className="bg-white/[0.02] md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div className="space-y-1">
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <CardDescription>Click a day to view parameters.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-white/40 mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const summary = summaries.find((s) => s.date === dateStr);

                return (
                  <div
                    key={dateStr}
                    className={`aspect-square p-2 border rounded-xl flex flex-col justify-between cursor-pointer transition-all duration-200 ${getDayStatusColor(
                      dateStr
                    )}`}
                  >
                    <span
                      className={`text-xs font-bold ${
                        isToday(day) ? "text-violet-400" : "text-white"
                      }`}
                    >
                      {format(day, "d")}
                    </span>

                    {summary && (
                      <div className="flex justify-end gap-1">
                        {summary.weight && <Scale className="h-3 w-3 text-violet-400" />}
                        {summary.total_calories && <Apple className="h-3 w-3 text-amber-400" />}
                        {summary.compliance_score !== null && (
                          <CheckSquare className="h-3 w-3 text-emerald-400" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Calendar Legend Details Card */}
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Calendar Legend</CardTitle>
            <CardDescription>Understanding your compliance ratings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded bg-emerald-500/20 border border-emerald-500/40" />
              <div>
                <span className="text-sm font-semibold block">Target Met (80%+)</span>
                <span className="text-xs text-white/40">Highly compliant day.</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded bg-amber-500/20 border border-amber-500/40" />
              <div>
                <span className="text-sm font-semibold block">Partial Met (50%+)</span>
                <span className="text-xs text-white/40">Macros/Habits partly hit.</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded bg-rose-500/20 border border-rose-500/40" />
              <div>
                <span className="text-sm font-semibold block">Missed (&lt;50%)</span>
                <span className="text-xs text-white/40">Target missed. Rest or reset day.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
