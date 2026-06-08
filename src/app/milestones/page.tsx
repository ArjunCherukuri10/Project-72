"use client";

import { useQuery } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Lock, Unlock } from "lucide-react";
import type { Profile } from "@/types";

export default function MilestonesPage() {
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile as any,
  });

  const { data: weightLogs = [] } = useQuery({
    queryKey: ["weightLogs"],
    queryFn: trackerService.getWeightLogs,
  });

  const { data: workouts = [] } = useQuery({
    queryKey: ["workouts"],
    queryFn: trackerService.getWorkouts,
  });

  // Calculate milestones
  const startingWeight = profile?.starting_weight || 94.0;
  const goalWeight = profile?.goal_weight || 72.0;
  const currentWeight = weightLogs[0]?.weight || startingWeight;
  const totalWeightLost = Math.max(0, startingWeight - currentWeight);

  const milestonesList = [
    {
      id: "m1",
      title: "First Workout",
      description: "Log your first workout session.",
      unlocked: workouts.length > 0,
      icon: "🏋️",
    },
    {
      id: "m2",
      title: "7 Day Streak",
      description: "Hit your daily compliance score targets 7 days in a row.",
      unlocked: true, // Mocked for demonstration
      icon: "🔥",
    },
    {
      id: "m3",
      title: "30 Day Streak",
      description: "Hit your daily compliance score targets 30 days in a row.",
      unlocked: false,
      icon: "💎",
    },
    {
      id: "m4",
      title: "5kg Lost",
      description: "Drop 5 kilograms from your starting weight.",
      unlocked: totalWeightLost >= 5,
      icon: "⭐",
    },
    {
      id: "m5",
      title: "10kg Lost",
      description: "Drop 10 kilograms from your starting weight.",
      unlocked: totalWeightLost >= 10,
      icon: "🌟",
    },
    {
      id: "m6",
      title: "Goal Weight Achieved",
      description: "Hit your ultimate target weight of 72kg!",
      unlocked: currentWeight <= goalWeight,
      icon: "🏆",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Milestones & Achievements</h1>
        <p className="text-white/60">
          Unlock achievements automatically as you build consistency and shed weight.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {milestonesList.map((m) => (
          <Card
            key={m.id}
            className={`transition-all duration-300 ${
              m.unlocked
                ? "bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border-violet-500/30 hover:border-violet-500/50"
                : "bg-white/[0.01] border-white/[0.04] opacity-50"
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="text-3xl">{m.icon}</div>
              {m.unlocked ? (
                <div className="flex items-center gap-1 text-[10px] font-bold text-violet-400 uppercase tracking-wider bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                  <Unlock className="h-3 w-3" /> Unlocked
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[10px] font-bold text-white/40 uppercase tracking-wider bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                  <Lock className="h-3 w-3" /> Locked
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-2 mt-2">
              <CardTitle className="text-base font-bold text-white">{m.title}</CardTitle>
              <CardDescription className="text-xs leading-relaxed text-white/50">
                {m.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
