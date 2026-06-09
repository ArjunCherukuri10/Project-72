"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Dumbbell, Sparkles, Check, RefreshCw, Settings2, ChevronDown, ChevronUp } from "lucide-react";
import { trackerService } from "@/lib/services";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Profile } from "@/types";

interface WorkoutPreferences {
  goal: string;
  experience: string;
  days: number;
  duration: number;
  gymAccess: string;
  splitPreference: string;
  focusAreas: string;
  injuries: string;
}

export default function AIWorkoutPlannerView() {
  const queryClient = useQueryClient();
  const [activeDay, setActiveDay] = useState("Monday");
  const [generating, setGenerating] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  const [prefs, setPrefs] = useState<WorkoutPreferences>({
    goal: "Weight Loss",
    experience: "beginner",
    days: 4,
    duration: 45,
    gymAccess: "both",
    splitPreference: "auto",
    focusAreas: "",
    injuries: "",
  });

  // Queries
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile as any,
  });

  const { data: plan, isLoading } = useQuery({
    queryKey: ["aiWorkoutPlan"],
    queryFn: trackerService.getAIWorkoutPlan,
  });

  // Sync prefs from profile on first load
  useEffect(() => {
    if (profile) {
      setPrefs((p) => ({
        ...p,
        goal:
          profile.primary_goal ||
          (profile.goal_weight && profile.starting_weight && profile.starting_weight > profile.goal_weight
            ? "Weight Loss"
            : "Muscle Gain"),
        experience: profile.fitness_experience || "beginner",
        days: profile.workout_days_limit || 4,
        duration: profile.workout_duration_limit || 45,
        gymAccess: profile.gym_access || "both",
      }));
    }
  }, [profile]);

  // Auto-select current day
  useEffect(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[new Date().getDay()];
    setTimeout(() => {
      setActiveDay(currentDay === "Sunday" ? "Monday" : currentDay);
    }, 0);
  }, []);

  // Show the preferences form if there's no plan yet
  useEffect(() => {
    if (!isLoading && !plan) {
      setShowPrefs(true);
    }
  }, [isLoading, plan]);

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
          goal: prefs.goal,
          experience: prefs.experience,
          days: prefs.days,
          duration: prefs.duration,
          gymAccess: prefs.gymAccess,
          splitPreference: prefs.splitPreference,
          focusAreas: prefs.focusAreas,
          injuries: prefs.injuries,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate workout plan");
      }

      const newPlan = await response.json();
      await trackerService.saveAIWorkoutPlan(newPlan);
      queryClient.invalidateQueries({ queryKey: ["aiWorkoutPlan"] });
      toast.success("AI Workout Plan generated successfully!");
      setShowPrefs(false);
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
        duration_minutes: prefs.duration || 45,
        notes: `AI Generated ${workout.name}\nExercises:\n${exerciseSummary}`,
        completed: true,
        template_id: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Workout logged successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log workout");
    },
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

  // ─── Preference Form ───
  const PreferencesForm = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Goal */}
        <div className="space-y-1.5">
          <Label htmlFor="wp-goal" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Primary Goal</Label>
          <select
            id="wp-goal"
            value={prefs.goal}
            onChange={(e) => setPrefs({ ...prefs, goal: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="Weight Loss">Weight Loss</option>
            <option value="Muscle Gain">Muscle Gain</option>
            <option value="Strength">Strength</option>
            <option value="Athletic Performance">Athletic Performance</option>
            <option value="General Fitness">General Fitness</option>
            <option value="Body Recomposition">Body Recomposition</option>
          </select>
        </div>

        {/* Experience */}
        <div className="space-y-1.5">
          <Label htmlFor="wp-exp" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Experience Level</Label>
          <select
            id="wp-exp"
            value={prefs.experience}
            onChange={(e) => setPrefs({ ...prefs, experience: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="beginner">Beginner (0–6 months)</option>
            <option value="intermediate">Intermediate (6–24 months)</option>
            <option value="advanced">Advanced (2+ years)</option>
          </select>
        </div>

        {/* Days per week */}
        <div className="space-y-1.5">
          <Label htmlFor="wp-days" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Training Days / Week</Label>
          <select
            id="wp-days"
            value={prefs.days}
            onChange={(e) => setPrefs({ ...prefs, days: parseInt(e.target.value) })}
            className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value={2}>2 days</option>
            <option value={3}>3 days</option>
            <option value={4}>4 days</option>
            <option value={5}>5 days</option>
            <option value={6}>6 days</option>
          </select>
        </div>

        {/* Duration per session */}
        <div className="space-y-1.5">
          <Label htmlFor="wp-dur" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Session Duration</Label>
          <select
            id="wp-dur"
            value={prefs.duration}
            onChange={(e) => setPrefs({ ...prefs, duration: parseInt(e.target.value) })}
            className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={75}>75 minutes</option>
            <option value={90}>90 minutes</option>
          </select>
        </div>

        {/* Equipment / Gym Access */}
        <div className="space-y-1.5">
          <Label htmlFor="wp-gym" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Equipment Access</Label>
          <select
            id="wp-gym"
            value={prefs.gymAccess}
            onChange={(e) => setPrefs({ ...prefs, gymAccess: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="home">Home (Bodyweight / Dumbbells)</option>
            <option value="gym">Full Gym</option>
            <option value="both">Both (Home + Gym)</option>
          </select>
        </div>

        {/* Split Preference */}
        <div className="space-y-1.5">
          <Label htmlFor="wp-split" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Split Preference</Label>
          <select
            id="wp-split"
            value={prefs.splitPreference}
            onChange={(e) => setPrefs({ ...prefs, splitPreference: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="auto">Auto (AI decides best split)</option>
            <option value="ppl">Push / Pull / Legs</option>
            <option value="upper_lower">Upper / Lower</option>
            <option value="full_body">Full Body</option>
            <option value="bro_split">Bro Split (Chest, Back, Shoulders, Arms, Legs)</option>
          </select>
        </div>
      </div>

      {/* Optional fields */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="wp-focus" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Focus Areas <span className="text-white/20">(optional)</span></Label>
          <Input
            id="wp-focus"
            placeholder="e.g. chest, glutes, back"
            value={prefs.focusAreas}
            onChange={(e) => setPrefs({ ...prefs, focusAreas: e.target.value })}
            className="bg-zinc-900 border-white/10"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wp-inj" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Injuries / Limitations <span className="text-white/20">(optional)</span></Label>
          <Input
            id="wp-inj"
            placeholder="e.g. lower back pain, bad knee"
            value={prefs.injuries}
            onChange={(e) => setPrefs({ ...prefs, injuries: e.target.value })}
            className="bg-zinc-900 border-white/10"
          />
        </div>
      </div>

      <div className="pt-1">
        <Button
          onClick={generateWorkoutPlan}
          disabled={generating}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-sm h-10 font-semibold"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1.5" />
          )}
          {plan ? "Regenerate Workout Plan" : "Generate My Workout Plan"}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="bg-white/[0.02] border-white/[0.06] shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <CardTitle className="flex items-center gap-1.5 text-lg">
            <Sparkles className="h-5 w-5 text-violet-400" />
            AI Personalized Workout Plan
          </CardTitle>
          <CardDescription>
            {plan ? `Current split: ${plan.split_name}` : "Configure your preferences and generate a custom routine."}
          </CardDescription>
        </div>
        {plan && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPrefs(!showPrefs)}
            className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 h-8 text-xs"
          >
            {showPrefs ? (
              <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
            ) : (
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />
            )}
            {showPrefs ? "Hide Preferences" : "Customize & Regenerate"}
          </Button>
        )}
      </CardHeader>

      {plan ? (
        <CardContent className="p-6 space-y-6">
          {/* Preference form (collapsible) */}
          {showPrefs && <PreferencesForm />}

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
        <CardContent className="p-6 space-y-6">
          <div className="text-center pb-2">
            <Dumbbell className="h-10 w-10 text-white/20 mx-auto mb-2" />
            <span className="font-bold text-sm text-white block">Configure Your Training Preferences</span>
            <p className="text-xs text-white/40 max-w-sm mx-auto mt-1">
              Set your goals, schedule, and equipment access — the AI builds a personalized split around you.
            </p>
          </div>
          <PreferencesForm />
        </CardContent>
      )}
    </Card>
  );
}
