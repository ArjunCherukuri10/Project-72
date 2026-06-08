"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Check, Flame, Trophy, Calendar } from "lucide-react";

export default function HabitsPage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: habits = [] } = useQuery({
    queryKey: ["habitDefinitions"],
    queryFn: trackerService.getHabitDefinitions,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["habitLogs", date],
    queryFn: () => trackerService.getHabitLogs(date),
  });

  const toggleMutation = useMutation({
    mutationFn: async (habitId: string) => {
      trackerService.toggleHabit(habitId, date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habitLogs", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", date] });
      toast.success("Habit state updated!");
    },
  });

  const getCompletionPercentage = () => {
    if (habits.length === 0) return 0;
    const completed = logs.filter((l) => l.completed).length;
    return Math.round((completed / habits.length) * 100);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Habit Tracker</h1>
          <p className="text-white/60">
            Build healthy consistency. Mark off completed habits below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-violet-400" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Habit Completion Progress Card */}
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Consistency Overview</CardTitle>
            <CardDescription>Keep a daily rate of 80% or higher.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60">Completion rate</span>
              <span className="text-xl font-bold text-violet-400">
                {getCompletionPercentage()}%
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                style={{ width: `${getCompletionPercentage()}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3">
                <Flame className="h-5 w-5 text-rose-500 mx-auto mb-1" />
                <span className="text-xs text-white/40 block">Current Streak</span>
                <span className="text-sm font-bold text-white">7 Days</span>
              </div>
              <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3">
                <Trophy className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <span className="text-xs text-white/40 block">Habit Adherence</span>
                <span className="text-sm font-bold text-white">88%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Habits interactive checklist */}
        <Card className="bg-white/[0.02] md:col-span-2">
          <CardHeader>
            <CardTitle>Habits Checklist</CardTitle>
            <CardDescription>Track key habits affecting your progress toward 72kg.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {habits.map((habit) => {
              const log = logs.find((l) => l.habit_id === habit.id);
              const completed = log ? log.completed : false;

              return (
                <div
                  key={habit.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-violet-500/25 transition-all duration-200"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{habit.icon || "⚡"}</span>
                    <div>
                      <span className="font-semibold text-white block">{habit.name}</span>
                      <span className="text-[10px] text-white/40 uppercase">
                        {habit.target_frequency}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={completed ? "success" : "outline"}
                    size="icon"
                    className="h-9 w-9 rounded-xl active:scale-95"
                    onClick={() => toggleMutation.mutate(habit.id)}
                  >
                    <Check className={`h-4 w-4 ${completed ? "text-emerald-400" : "text-white/20"}`} />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
