"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Dumbbell, Sparkles, Plus, Check, RefreshCw } from "lucide-react";
import { trackerService } from "@/lib/services";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Profile } from "@/types";

export default function AIWorkoutPlannerView() {
  const queryClient = useQueryClient();
  const [activeDay, setActiveDay] = useState("Monday");
  const [generating, setGenerating] = useState(false);

  // Queries
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile as any,
  });

  const { data: plan, isLoading } = useQuery({
    queryKey: ["aiWorkoutPlan"],
    queryFn: trackerService.getAIWorkoutPlan,
  });

  // Automatically select the current day of the week
  useEffect(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[new Date().getDay()];
    setActiveDay(currentDay === "Sunday" ? "Monday" : currentDay); // default to Monday if Sunday rest
  }, []);

  // Generate Workout Mutation
  const generateWorkoutPlan = async () => {
    if (!profile) {
      toast.error("Please set your profile info first!");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/ai-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: profile.goal_weight && profile.starting_weight && profile.starting_weight > profile.goal_weight ? "Weight Loss" : "Muscle Gain",
          experience: profile.fitness_experience || "beginner",
          days: profile.workout_days_limit || 4,
          duration: profile.workout_duration_limit || 45,
          gymAccess: profile.gym_access || "both"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate workout plan");
      }

      const newPlan = await response.json();
      await trackerService.saveAIWorkoutPlan(newPlan);
      queryClient.invalidateQueries({ queryKey: ["aiWorkoutPlan"] });
      toast.success("AI Workout Plan generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  // Log workout today
  const logWorkoutMutation = useMutation({
    mutationFn: async (workout: any) => {
      const exerciseSummary = workout.exercises
        .map((e: any) => `${e.name}: ${e.sets}×${e.reps}`)
        .join(" | ");

      return trackerService.addWorkoutSession({
        name: workout.name,
        type: workout.type,
        date: new Date().toISOString().split("T")[0],
        duration_minutes: profile?.workout_duration_limit || 45,
        notes: `AI Generated ${workout.name}\nExercises:\n${exerciseSummary}`,
        completed: true,
        template_id: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Workout logged successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log workout");
    }
  });

  const activeDayWorkout = plan?.weekly_split?.find((d: any) => d.day === activeDay);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
        <span className="text-sm text-white/50">Loading Workout Plan...</span>
      </div>
    );
  }

  return (
    <Card className="bg-white/[0.02] border-white/[0.06] shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <CardTitle className="flex items-center gap-1.5 text-lg">
            <Sparkles className="h-5 w-5 text-violet-400" />
            AI Personalized Workout Plan
          </CardTitle>
          <CardDescription>
            {plan ? `Current split: ${plan.split_name}` : "Generate a custom routine tailored to your goals & availability."}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={generating}
          onClick={generateWorkoutPlan}
          className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 h-8 text-xs"
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          {plan ? "Regenerate" : "Generate Plan"}
        </Button>
      </CardHeader>

      {plan ? (
        <CardContent className="p-6 space-y-6">
          {/* Day selectors */}
          <div className="flex flex-wrap gap-1.5 bg-white/[0.02] p-1 rounded-xl">
            {plan.weekly_split.map((d: any) => {
              const isActive = activeDay === d.day;
              const isRest = d.type === "rest";
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setActiveDay(d.day)}
                  className={`flex-1 min-w-[70px] py-2 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? "bg-violet-600 text-white shadow-lg"
                      : "text-white/40 hover:text-white/80 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="block">{d.day.substring(0, 3)}</span>
                  <span className={`text-[9px] block font-normal capitalize ${isActive ? "text-violet-200" : isRest ? "text-white/20" : "text-violet-400/60"}`}>
                    {isRest ? "Rest" : d.type}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Day Workout Detail */}
          {activeDayWorkout && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{activeDayWorkout.name}</h3>
                  <span className="text-xs text-white/40 capitalize">Split type: {activeDayWorkout.type}</span>
                </div>
                {activeDayWorkout.type !== "rest" && (
                  <Button
                    size="sm"
                    className="bg-violet-600 hover:bg-violet-500 h-8 text-xs"
                    disabled={logWorkoutMutation.isPending}
                    onClick={() => logWorkoutMutation.mutate(activeDayWorkout)}
                  >
                    {logWorkoutMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    Log Today
                  </Button>
                )}
              </div>

              {activeDayWorkout.type === "rest" ? (
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-8 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Check className="h-6 w-6" />
                  </div>
                  <span className="font-bold text-sm text-white">Active Recovery Day</span>
                  <p className="text-xs text-white/40 max-w-sm">
                    Rest is just as crucial as training. Focus on mobility, hydration, and stretching today.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeDayWorkout.exercises?.map((ex: any, idx: number) => (
                    <div key={idx} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-400 text-sm font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="font-semibold text-white text-sm block">{ex.name}</span>
                          <span className="text-[10px] text-white/40 block mt-0.5">{ex.notes}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-violet-300 block">{ex.sets} × {ex.reps}</span>
                        <span className="text-[9px] text-white/30 font-mono">Rest: {ex.rest_seconds || 90}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Progression Guide */}
          {plan.progression_guidance && (
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 text-xs flex gap-2">
              <Dumbbell className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-white">Progression Guidelines</span>
                <p className="text-white/60 leading-relaxed mt-0.5">{plan.progression_guidance}</p>
              </div>
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-3">
          <Dumbbell className="h-10 w-10 text-white/20" />
          <span className="font-bold text-sm text-white">No active training split</span>
          <p className="text-xs text-white/40 max-w-sm">
            Generate a personalized workout split. The planner takes into account your experience level, access, and schedule constraints.
          </p>
          <Button
            onClick={generateWorkoutPlan}
            disabled={generating}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs h-9"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1" />
            )}
            Build custom training routine
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
