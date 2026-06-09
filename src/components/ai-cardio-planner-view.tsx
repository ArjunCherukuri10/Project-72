"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, HeartPulse, Sparkles, Check, RefreshCw } from "lucide-react";
import { trackerService } from "@/lib/services";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Profile, AICardioPlan } from "@/types";

export default function AICardioPlannerView() {
  const queryClient = useQueryClient();
  const [activeDay, setActiveDay] = useState("Monday");
  const [generating, setGenerating] = useState(false);

  // Queries
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile as any,
  });

  const { data: plan, isLoading } = useQuery<AICardioPlan | null>({
    queryKey: ["aiCardioPlan"],
    queryFn: trackerService.getAICardioPlan as any,
  });

  // Automatically select the current day of the week
  useEffect(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[new Date().getDay()];
    setTimeout(() => {
      setActiveDay(currentDay);
    }, 0);
  }, []);

  // Generate Cardio Plan
  const generateCardioPlan = async () => {
    if (!profile) {
      toast.error("Please set your profile info first!");
      return;
    }

    setGenerating(true);
    try {
      // Determine cardio frequency and preferred duration from profile or defaults
      const cardioDays = profile.workout_days_limit ? Math.max(1, 7 - profile.workout_days_limit) : 3; // e.g. 7 - 4 strength days = 3 cardio days
      const cardioDuration = profile.workout_duration_limit || 30;

      const response = await fetch("/api/ai-cardio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: profile.primary_goal || "Improve Fitness",
          experience: profile.fitness_experience || "beginner",
          days: cardioDays,
          duration: cardioDuration,
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate cardio plan");
      }

      const newPlan = await response.json();
      await trackerService.saveAICardioPlan(newPlan);
      queryClient.invalidateQueries({ queryKey: ["aiCardioPlan"] });
      toast.success("AI Cardio Plan generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate cardio plan");
    } finally {
      setGenerating(false);
    }
  };

  // Log cardio session today
  const logCardioMutation = useMutation({
    mutationFn: async (cardio: any) => {
      // Map activity types to match CardioType: walking, running, cycling, treadmill, stair_climber, swimming, custom
      const activityLower = (cardio.activity || "").toLowerCase();
      let type: any = "custom";
      if (activityLower.includes("walk")) type = "walking";
      else if (activityLower.includes("run") || activityLower.includes("jog")) type = "running";
      else if (activityLower.includes("cycl") || activityLower.includes("bike")) type = "cycling";
      else if (activityLower.includes("treadmill")) type = "treadmill";
      else if (activityLower.includes("stair") || activityLower.includes("climber")) type = "stair_climber";
      else if (activityLower.includes("swim")) type = "swimming";

      return trackerService.addCardioSession({
        date: new Date().toISOString().split("T")[0],
        type,
        duration_minutes: cardio.duration_minutes || 30,
        distance_km: null,
        calories_burned: cardio.target_calories || null,
        avg_pace: null,
        notes: `AI Session: ${cardio.type}\nIntensity: ${cardio.intensity}\nActivity: ${cardio.activity}\n\nCoaching Tips: ${cardio.description}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardioSessions"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Cardio activity logged successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log activity");
    }
  });

  const activeDayCardio = plan?.weekly_split?.find((d: any) => d.day === activeDay);
  const isRest = !activeDayCardio || activeDayCardio.type.toLowerCase().includes("rest") || activeDayCardio.activity.toLowerCase().includes("none");

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Loader2 className="h-8 w-8 text-sky-400 animate-spin" />
        <span className="text-sm text-white/50">Loading Cardio Plan...</span>
      </div>
    );
  }

  return (
    <Card className="bg-white/[0.02] border-white/[0.06] shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <CardTitle className="flex items-center gap-1.5 text-lg">
            <Sparkles className="h-5 w-5 text-sky-400" />
            AI Personalized Cardio Plan
          </CardTitle>
          <CardDescription>
            {plan ? `Current plan: ${plan.plan_name}` : "Create a custom aerobic plan tailored to your health objectives."}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={generating}
          onClick={generateCardioPlan}
          className="border-sky-500/30 text-sky-300 hover:bg-sky-500/10 h-8 text-xs"
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
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((dayName) => {
              const d = plan.weekly_split?.find((x: any) => x.day === dayName) || { day: dayName, type: "Rest", activity: "None" };
              const isActive = activeDay === d.day;
              const isRestDay = d.type.toLowerCase().includes("rest") || d.activity.toLowerCase().includes("none");
              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setActiveDay(d.day)}
                  className={`flex-1 min-w-[70px] py-2 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? "bg-sky-600 text-white shadow-lg"
                      : "text-white/40 hover:text-white/80 hover:bg-white/[0.02]"
                  }`}
                >
                  <span className="block">{d.day.substring(0, 3)}</span>
                  <span className={`text-[9px] block font-normal capitalize ${isActive ? "text-sky-200" : isRestDay ? "text-white/20" : "text-sky-400/60"}`}>
                    {isRestDay ? "Rest" : d.type}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Day Cardio Detail */}
          {activeDayCardio && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">
                    {isRest ? "Rest & Active Recovery" : `${activeDayCardio.activity} Session`}
                  </h3>
                  <span className="text-xs text-white/40 capitalize">
                    {isRest ? "Rest Day" : `Style: ${activeDayCardio.type} (${activeDayCardio.intensity})`}
                  </span>
                </div>
                {!isRest && (
                  <Button
                    size="sm"
                    className="bg-sky-600 hover:bg-sky-500 h-8 text-xs font-semibold"
                    disabled={logCardioMutation.isPending}
                    onClick={() => logCardioMutation.mutate(activeDayCardio)}
                  >
                    {logCardioMutation.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-1" />
                    )}
                    Log Today
                  </Button>
                )}
              </div>

              {isRest ? (
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-8 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Check className="h-6 w-6" />
                  </div>
                  <span className="font-bold text-sm text-white">Cardiovascular Recovery Day</span>
                  <p className="text-xs text-white/40 max-w-sm">
                    No intense cardio session scheduled for today. Allow your heart rate to normalize, practice mobility, or take a light stroll.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cardio details block */}
                  <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.04] pb-3">
                      <div>
                        <span className="text-[10px] text-white/30 font-bold uppercase block">Planned Duration</span>
                        <span className="text-lg font-extrabold text-sky-400">{activeDayCardio.duration_minutes} mins</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/30 font-bold uppercase block">Target Burn</span>
                        <span className="text-lg font-extrabold text-amber-400">~{activeDayCardio.target_calories || 200} kcal</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/30 font-bold uppercase block">Intensity Zone</span>
                        <span className="text-sm font-bold text-teal-300 block mt-1">{activeDayCardio.intensity}</span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-white/30 font-bold uppercase block">Session Protocol</span>
                      <p className="text-xs text-white/70 leading-relaxed">{activeDayCardio.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progression Guide */}
          {plan.coaching_tips && (
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 text-xs flex gap-2">
              <HeartPulse className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-white">Cardio Coaching Insights</span>
                <p className="text-white/60 leading-relaxed mt-0.5">{plan.coaching_tips}</p>
              </div>
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-3">
          <HeartPulse className="h-10 w-10 text-white/20" />
          <span className="font-bold text-sm text-white">No active cardio split</span>
          <p className="text-xs text-white/40 max-w-sm">
            Generate an AI-driven weekly cardio plan tailored to your profile goals, fitness experience, and schedule constraints.
          </p>
          <Button
            onClick={generateCardioPlan}
            disabled={generating}
            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-xs h-9 font-semibold"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1" />
            )}
            Build custom cardio plan
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
