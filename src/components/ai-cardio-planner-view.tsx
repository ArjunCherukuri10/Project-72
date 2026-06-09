"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, HeartPulse, Sparkles, Check, RefreshCw, Settings2, ChevronUp } from "lucide-react";
import { trackerService } from "@/lib/services";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Profile, AICardioPlan } from "@/types";

interface CardioPreferences {
  goal: string;
  experience: string;
  days: number;
  duration: number;
  preferredActivities: string;
  cardioStyle: string;
  healthConditions: string;
}

export default function AICardioPlannerView() {
  const queryClient = useQueryClient();
  const [activeDay, setActiveDay] = useState("Monday");
  const [generating, setGenerating] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  const [prefs, setPrefs] = useState<CardioPreferences>({
    goal: "Weight Loss",
    experience: "beginner",
    days: 3,
    duration: 30,
    preferredActivities: "",
    cardioStyle: "auto",
    healthConditions: "",
  });

  // Queries
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile as any,
  });

  const { data: plan, isLoading } = useQuery<AICardioPlan | null>({
    queryKey: ["aiCardioPlan"],
    queryFn: trackerService.getAICardioPlan as any,
  });

  // Sync prefs from profile on first load
  useEffect(() => {
    if (profile) {
      const cardioDays = profile.workout_days_limit ? Math.max(1, 7 - profile.workout_days_limit) : 3;
      setPrefs((p) => ({
        ...p,
        goal: profile.primary_goal || "Weight Loss",
        experience: profile.fitness_experience || "beginner",
        days: cardioDays,
        duration: profile.workout_duration_limit || 30,
      }));
    }
  }, [profile]);

  // Automatically select the current day of the week
  useEffect(() => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const currentDay = days[new Date().getDay()];
    setTimeout(() => {
      setActiveDay(currentDay);
    }, 0);
  }, []);

  // Show prefs form if no plan exists
  useEffect(() => {
    if (!isLoading && !plan) {
      setShowPrefs(true);
    }
  }, [isLoading, plan]);

  // Generate Cardio Plan
  const generateCardioPlan = async () => {
    if (!profile) {
      toast.error("Please set your profile info first!");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/ai-cardio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: prefs.goal,
          experience: prefs.experience,
          days: prefs.days,
          duration: prefs.duration,
          preferredActivities: prefs.preferredActivities,
          cardioStyle: prefs.cardioStyle,
          healthConditions: prefs.healthConditions,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate cardio plan");
      }

      const newPlan = await response.json();
      await trackerService.saveAICardioPlan(newPlan);
      queryClient.invalidateQueries({ queryKey: ["aiCardioPlan"] });
      toast.success("AI Cardio Plan generated successfully!");
      setShowPrefs(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate cardio plan");
    } finally {
      setGenerating(false);
    }
  };

  // Log cardio session today
  const logCardioMutation = useMutation({
    mutationFn: async (cardio: any) => {
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
        notes: `AI Session: ${cardio.type}\nIntensity: ${cardio.intensity}\nActivity: ${cardio.activity}\n\nCoaching Tips: ${cardio.description}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardioSessions"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Cardio activity logged successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log activity");
    },
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

  // ─── Preference Form ───
  const PreferencesForm = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Goal */}
        <div className="space-y-1.5">
          <Label htmlFor="cp-goal" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Primary Goal</Label>
          <select
            id="cp-goal"
            value={prefs.goal}
            onChange={(e) => setPrefs({ ...prefs, goal: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="Weight Loss">Weight Loss / Fat Burn</option>
            <option value="Cardiovascular Endurance">Cardiovascular Endurance</option>
            <option value="General Fitness">General Fitness</option>
            <option value="Athletic Performance">Athletic Performance</option>
            <option value="Active Recovery">Active Recovery (Minimal)</option>
          </select>
        </div>

        {/* Experience */}
        <div className="space-y-1.5">
          <Label htmlFor="cp-exp" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Fitness Level</Label>
          <select
            id="cp-exp"
            value={prefs.experience}
            onChange={(e) => setPrefs({ ...prefs, experience: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Cardio days per week */}
        <div className="space-y-1.5">
          <Label htmlFor="cp-days" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Cardio Days / Week</Label>
          <select
            id="cp-days"
            value={prefs.days}
            onChange={(e) => setPrefs({ ...prefs, days: parseInt(e.target.value) })}
            className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value={2}>2 days</option>
            <option value={3}>3 days</option>
            <option value={4}>4 days</option>
            <option value={5}>5 days</option>
            <option value={6}>6 days</option>
            <option value={7}>7 days (daily)</option>
          </select>
        </div>

        {/* Duration */}
        <div className="space-y-1.5">
          <Label htmlFor="cp-dur" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Session Duration</Label>
          <select
            id="cp-dur"
            value={prefs.duration}
            onChange={(e) => setPrefs({ ...prefs, duration: parseInt(e.target.value) })}
            className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value={15}>15 minutes</option>
            <option value={20}>20 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={40}>40 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
          </select>
        </div>

        {/* Cardio Style */}
        <div className="space-y-1.5">
          <Label htmlFor="cp-style" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Preferred Style</Label>
          <select
            id="cp-style"
            value={prefs.cardioStyle}
            onChange={(e) => setPrefs({ ...prefs, cardioStyle: e.target.value })}
            className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="auto">Auto (AI decides mix)</option>
            <option value="liss_only">LISS Only (Steady State)</option>
            <option value="hiit_only">HIIT Only (Intervals)</option>
            <option value="mixed">Mixed LISS + HIIT</option>
            <option value="sport_specific">Sport-Specific Conditioning</option>
          </select>
        </div>

        {/* Preferred Activities */}
        <div className="space-y-1.5">
          <Label htmlFor="cp-act" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Preferred Activities <span className="text-white/20">(optional)</span></Label>
          <Input
            id="cp-act"
            placeholder="e.g. running, cycling, swimming"
            value={prefs.preferredActivities}
            onChange={(e) => setPrefs({ ...prefs, preferredActivities: e.target.value })}
            className="bg-zinc-900 border-white/10"
          />
        </div>
      </div>

      {/* Health conditions */}
      <div className="space-y-1.5">
        <Label htmlFor="cp-health" className="text-[11px] font-bold text-white/50 uppercase tracking-wider">Health Conditions <span className="text-white/20">(optional)</span></Label>
        <Input
          id="cp-health"
          placeholder="e.g. asthma, knee issues, heart condition"
          value={prefs.healthConditions}
          onChange={(e) => setPrefs({ ...prefs, healthConditions: e.target.value })}
          className="bg-zinc-900 border-white/10"
        />
      </div>

      <div className="pt-1">
        <Button
          onClick={generateCardioPlan}
          disabled={generating}
          className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-sm h-10 font-semibold"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1.5" />
          )}
          {plan ? "Regenerate Cardio Plan" : "Generate My Cardio Plan"}
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="bg-white/[0.02] border-white/[0.06] shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <CardTitle className="flex items-center gap-1.5 text-lg">
            <Sparkles className="h-5 w-5 text-sky-400" />
            AI Personalized Cardio Plan
          </CardTitle>
          <CardDescription>
            {plan ? `Current plan: ${plan.plan_name}` : "Configure your cardio preferences and generate a custom plan."}
          </CardDescription>
        </div>
        {plan && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPrefs(!showPrefs)}
            className="border-sky-500/30 text-sky-300 hover:bg-sky-500/10 h-8 text-xs"
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
        <CardContent className="p-6 space-y-6">
          <div className="text-center pb-2">
            <HeartPulse className="h-10 w-10 text-white/20 mx-auto mb-2" />
            <span className="font-bold text-sm text-white block">Configure Your Cardio Preferences</span>
            <p className="text-xs text-white/40 max-w-sm mx-auto mt-1">
              Set your cardio goals, available days, preferred activities, and session style — the AI builds your weekly conditioning plan.
            </p>
          </div>
          <PreferencesForm />
        </CardContent>
      )}
    </Card>
  );
}
