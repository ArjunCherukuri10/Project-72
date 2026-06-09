"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatNumber, calculateBMI, getBMICategory, estimateGoalDate } from "@/lib/utils";
import type { Profile } from "@/types";
import { useAppStore } from "@/stores/app-store";
import {
  Scale,
  TrendingDown,
  Flame,
  Award,
  Apple,
  Droplet,
  Footprints,
  Moon,
  TrendingUp,
  Sparkles,
  Calendar,
  Plus,
  CheckCircle,
  HelpCircle,
  Loader2,
  Dumbbell,
  HeartPulse,
  Check
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  BarChart,
  Bar
} from "recharts";
import OnboardingWizard from "@/components/onboarding-wizard";
import DailyCheckinModal from "@/components/daily-checkin-modal";
import { toast } from "sonner";

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [checkinOpen, setCheckinOpen] = useState(false);
  const { selectedDate: todayStr } = useAppStore();

  // Refresh weight & daily summaries each day (24h)
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["weightLogs"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
    }, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [queryClient]);

  // Fetch Core Queries
  const { data: profile, isLoading: profileLoading } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile as any,
  });

  const { data: targets } = useQuery({
    queryKey: ["nutritionTargets"],
    queryFn: trackerService.getNutritionTargets,
  });

  const { data: weightLogs = [] } = useQuery({
    queryKey: ["weightLogs"],
    queryFn: trackerService.getWeightLogs,
  });

  const { data: summaries = [] } = useQuery({
    queryKey: ["dailySummaries"],
    queryFn: trackerService.getDailySummaries,
  });

  const { data: aiWorkoutPlan } = useQuery({
    queryKey: ["aiWorkoutPlan"],
    queryFn: trackerService.getAIWorkoutPlan,
  });

  const { data: aiCardioPlan } = useQuery({
    queryKey: ["aiCardioPlan"],
    queryFn: trackerService.getAICardioPlan,
  });

  const { data: cardioSessions = [] } = useQuery({
    queryKey: ["cardioSessions"],
    queryFn: trackerService.getCardioSessions,
  });

  // Automatically calculate target requirements
  const tgt = useMemo(() => {
    return {
      cal: targets?.calories || 2000,
      pro: targets?.protein || 130,
      carb: targets?.carbs || 220,
      fat: targets?.fat || 65,
      fib: targets?.fiber || 30,
      water: targets?.water_ml || 2500,
      steps: targets?.steps || 10000,
      sleep: targets?.sleep_hours || 7.5
    };
  }, [targets]);

  // Today Summary values
  const todaySummary = useMemo(() => {
    return summaries.find((s) => s.date === todayStr) || null;
  }, [summaries, todayStr]);

  const todayCalories = Math.round(todaySummary?.total_calories || 0);
  const todayProtein = Math.round((todaySummary?.total_protein || 0) * 10) / 10;
  const todayFiber = Math.round((todaySummary?.total_fiber || 0) * 10) / 10;
  const todayWater = Math.round(todaySummary?.water_ml || 0);
  const todaySteps = Math.round(todaySummary?.steps || 0);
  const todaySleep = Math.round((todaySummary?.sleep_hours || 0) * 10) / 10;
  const workoutCompleted = !!todaySummary?.workout_completed;

  // Calculate stats
  const latestWeightLog = useMemo(() => {
  if (!weightLogs || weightLogs.length === 0) return null;
  return weightLogs.reduce((latest, log) => new Date(log.date) > new Date(latest.date) ? log : latest, weightLogs[0]);
}, [weightLogs]);

const currentWeight = latestWeightLog?.weight ?? profile?.starting_weight ?? 80.0;
const startingWeight = profile?.starting_weight ?? 80.0;
const goalWeight = profile?.goal_weight ?? 72.0;
const weightLost = startingWeight - currentWeight;
  const weightRemaining = Math.max(0, currentWeight - goalWeight);
  const heightCm = profile?.height_cm || 175;
  const bmi = calculateBMI(currentWeight, heightCm);

  // Dynamic estimated goal date based on rate
  // Auto-open Daily Check‑in if there is no weight entry for today, only if selected date is today
  useEffect(() => {
    const realToday = new Date().toISOString().split("T")[0];
    if (todayStr !== realToday) return;

    const hasToday = weightLogs.some((log) => log.date === todayStr);
    if (!hasToday && !checkinOpen) {
      setCheckinOpen(true);
    }
  }, [weightLogs, todayStr, checkinOpen]);
  const weeklyWeightChangeRate = currentWeight > goalWeight ? 0.5 : 0.2; // 0.5kg/week loss or 0.2kg/week gain

  const estimatedGoalDateObj = useMemo(() => {
    return estimateGoalDate(currentWeight, goalWeight, weeklyWeightChangeRate);
  }, [currentWeight, goalWeight, weeklyWeightChangeRate]);

  const totalLossNeeded = Math.abs(startingWeight - goalWeight);
  const lostSoFar = Math.abs(startingWeight - currentWeight);
  const lossPercentage = totalLossNeeded > 0 ? Math.min(100, Math.round((lostSoFar / totalLossNeeded) * 100)) : 0;
  const greeting = useMemo(() => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good morning";
    if (hrs < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "Not set";
    try {
      const parts = dateStr.split("-");
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate compliance score out of 100
  const complianceScore = useMemo(() => {
    let score = 0;

    // 1. Calories (25 pts): within +/- 10% of target calories
    const calorieDiffRatio = Math.abs(todayCalories - tgt.cal) / tgt.cal;
    if (todayCalories > 0) {
      if (calorieDiffRatio <= 0.1) score += 25;
      else if (calorieDiffRatio <= 0.2) score += 15;
    }

    // 2. Protein (25 pts): >= 90% of target
    if (todayProtein > 0) {
      if (todayProtein >= tgt.pro * 0.9) score += 25;
      else if (todayProtein >= tgt.pro * 0.7) score += 15;
    }

    // 3. Workout completed (20 pts): binary
    if (workoutCompleted) {
      score += 20;
    }

    // 4. Steps (15 pts): linear up to target
    if (todaySteps > 0) {
      score += Math.min(15, Math.round((todaySteps / tgt.steps) * 15));
    }

    // 5. Water (10 pts): linear up to target
    if (todayWater > 0) {
      score += Math.min(10, Math.round((todayWater / tgt.water) * 10));
    }

    // 6. Sleep (5 pts): linear up to target
    if (todaySleep > 0) {
      score += Math.min(5, Math.round((todaySleep / tgt.sleep) * 5));
    }

    return score;
  }, [todayCalories, todayProtein, workoutCompleted, todaySteps, todayWater, todaySleep, tgt]);

  // Sync computed compliance score to trackerService/local storage if changed
  useEffect(() => {
    if (todaySummary && todaySummary.compliance_score !== complianceScore) {
      trackerService.updateDailySummaryField(todayStr, {
        compliance_score: complianceScore
      });
    }
  }, [complianceScore, todaySummary, todayStr]);

  // AI Daily Coach Suggestions logic
  const activeDayOfWeek = useMemo(() => {
    try {
      const parts = todayStr.split("-");
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return d.toLocaleDateString("en-US", { weekday: "long" });
    } catch {
      return new Date().toLocaleDateString("en-US", { weekday: "long" });
    }
  }, [todayStr]);

  const todayWorkout = useMemo(() => {
    if (!aiWorkoutPlan?.weekly_split) return null;
    return aiWorkoutPlan.weekly_split.find((w: any) => w.day === activeDayOfWeek) || null;
  }, [aiWorkoutPlan, activeDayOfWeek]);

  const todayCardio = useMemo(() => {
    if (!aiCardioPlan?.weekly_split) return null;
    return aiCardioPlan.weekly_split.find((c: any) => c.day === activeDayOfWeek) || null;
  }, [aiCardioPlan, activeDayOfWeek]);

  const cardioCompleted = useMemo(() => {
    return cardioSessions.some((c: any) => c.date === todayStr);
  }, [cardioSessions, todayStr]);

  // Log Suggested Workout
  const logRecommendedWorkoutMutation = useMutation({
    mutationFn: async (workout: any) => {
      const exerciseSummary = workout.exercises
        .map((e: any) => `${e.name}: ${e.sets}×${e.reps}`)
        .join(" | ");

      return trackerService.addWorkoutSession({
        name: workout.name,
        type: workout.type,
        date: todayStr,
        duration_minutes: profile?.workout_duration_limit || 45,
        notes: `AI Recommended ${workout.name}\nExercises:\n${exerciseSummary}`,
        completed: true,
        template_id: null
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Suggested workout logged successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log workout");
    }
  });

  // Log Suggested Cardio
  const logRecommendedCardioMutation = useMutation({
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
        date: todayStr,
        type,
        duration_minutes: cardio.duration_minutes || 30,
        distance_km: null,
        calories_burned: cardio.target_calories || null,
        avg_pace: null,
        notes: `AI Recommended ${cardio.type} (${cardio.intensity})\nDescription: ${cardio.description}`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardioSessions"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Suggested cardio logged successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log cardio");
    }
  });

  const isRestCardio = (c: any) => {
    return !c || c.type?.toLowerCase().includes("rest") || c.activity?.toLowerCase().includes("none");
  };

  // Save onboarding mutation
  const saveOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Update Profile (incorporating all onboarding goal data)
      const completeProfile = {
        ...data.profile,
        primary_goal: data.goal.primary_goal,
        target_date: data.goal.target_date,
        recommended_date: data.goal.recommended_date,
        recommended_weekly_change: data.goal.recommended_weekly_change,
        recommended_deficit: data.goal.recommended_deficit,
      };
      await trackerService.updateProfile(completeProfile);
      // 2. Update Nutrition targets
      await trackerService.updateNutritionTargets({
        calories: data.targets.calories,
        protein: data.targets.protein,
        carbs: data.targets.carbs,
        fat: data.targets.fat,
        fiber: data.targets.fiber,
        water_ml: data.targets.water,
        steps: data.targets.steps,
        sleep_hours: data.targets.sleep
      });
      // 3. Add initial weight log if not already there
      const existingLogs = await trackerService.getWeightLogs();
      if (existingLogs.length === 0) {
        await trackerService.addWeightLog(data.profile.starting_weight, todayStr, undefined, "Onboarding Setup");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["nutritionTargets"] });
      queryClient.invalidateQueries({ queryKey: ["weightLogs"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Welcome aboard! Your Health OS is ready.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save onboarding settings");
    }
  });

  // Chart data formatting
  const weightChartData = useMemo(() => {
    return [...weightLogs]
      .reverse()
      .slice(-30)
      .map((log, idx, arr) => {
        const slice = arr.slice(Math.max(0, idx - 6), idx + 1);
        const avg = slice.reduce((sum, item) => sum + item.weight, 0) / slice.length;
        return {
          date: log.date,
          weight: log.weight,
          ma7: parseFloat(avg.toFixed(1)),
          goal: goalWeight,
        };
      });
  }, [weightLogs, goalWeight]);

  const caloriesChartData = useMemo(() => {
    return [...summaries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7)
      .map((s) => ({
        date: s.date.split("-")[2] || s.date,
        calories: s.total_calories || 0,
        protein: s.total_protein || 0,
      }));
  }, [summaries]);

  if (profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f1117]">
        <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
      </div>
    );
  }

  // Force onboarding wizard overlay if onboarding not completed
  if (profile && !profile.has_completed_onboarding) {
    return (
      <OnboardingWizard
        onComplete={(data) => saveOnboardingMutation.mutate(data)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Time-Based Welcome Greeting */}
      <div className="flex flex-col gap-1 sm:gap-1.5 animate-in fade-in slide-in-from-top-4 duration-300">
        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          {greeting}, {profile?.full_name || "User"}!
        </h2>
        <p className="text-white/60 text-xs sm:text-sm">
          Welcome back to your health dashboard.
        </p>
      </div>

      {/* Target Progress Bar */}
      <Card className="relative overflow-hidden border-white/[0.08] bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10 animate-in fade-in duration-300">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Am I on track to reach {goalWeight}kg?
              </h1>
              <p className="text-white/60 text-sm">
                You have lost <span className="text-teal-400 font-bold">{formatNumber(Math.abs(weightLost))}kg</span>. You are <span className="text-emerald-400 font-bold">{lossPercentage}%</span> of the way to your target weight.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-left md:text-right">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  Estimated Completion Date
                </div>
                <div className="text-lg font-extrabold text-teal-400">
                  {estimatedGoalDateObj.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold font-mono">
              <span className="text-white/40">{startingWeight}kg (Start)</span>
              <span className="text-teal-300 font-extrabold">{formatNumber(currentWeight)}kg (Now)</span>
              <span className="text-white/40">{goalWeight}kg (Goal)</span>
            </div>
            <Progress value={lossPercentage} className="h-2.5 bg-white/[0.04]" />
          </div>

          {/* User Target Date vs Recommended Date vs Estimated Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/[0.06] pt-5 text-xs">
            <div className="p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
              <span className="text-white/40 block font-medium uppercase tracking-wider text-[10px]">Your Target Date</span>
              <span className="text-white font-bold text-sm block mt-1">
                {formatDate(profile?.target_date)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/[0.02] border border-emerald-500/10">
              <span className="text-emerald-500/50 block font-medium uppercase tracking-wider text-[10px]">Recommended Date</span>
              <span className="text-emerald-400 font-bold text-sm block mt-1">
                {formatDate(profile?.recommended_date)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/[0.02] border border-teal-500/10">
              <span className="text-teal-500/50 block font-medium uppercase tracking-wider text-[10px]">Dynamic Estimate</span>
              <span className="text-teal-400 font-bold text-sm block mt-1">
                {estimatedGoalDateObj.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-white/40 uppercase">Current Weight</CardTitle>
            <Scale className="h-4 w-4 text-teal-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{formatNumber(currentWeight)}kg</div>
            <p className="text-[10px] text-white/40 mt-1">Starting: {startingWeight}kg</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-white/40 uppercase">Weight Remaining</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{formatNumber(weightRemaining)}kg</div>
            <p className="text-[10px] text-white/40 mt-1">Goal: {goalWeight}kg</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-white/40 uppercase">BMI Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{formatNumber(bmi)}</div>
            <p className="text-[10px] text-white/40 mt-1">{getBMICategory(bmi)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white/[0.02] border-white/[0.06] relative overflow-hidden flex flex-col justify-between">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-white/40 uppercase">Compliance Score</CardTitle>
            <Award className="h-4 w-4 text-teal-400 animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              {complianceScore} / 100
            </div>
            <p className="text-[10px] text-white/40 mt-1">Daily adherence index</p>
            <Progress value={complianceScore} className="h-1.5 bg-white/[0.04] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* AI Coach Daily Recommendation Widget */}
      <div className="grid gap-6 md:grid-cols-2 animate-in fade-in duration-300">
        <Card className="bg-gradient-to-r from-violet-950/20 to-indigo-950/20 border-violet-500/20 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Dumbbell className="h-24 w-24 text-violet-400" />
          </div>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-violet-300">
                <Sparkles className="h-4 w-4 text-violet-400" />
                AI Suggested Workout
              </CardTitle>
              <CardDescription className="text-white/40 text-[11px] mt-0.5">
                Based on your {aiWorkoutPlan ? aiWorkoutPlan.split_name : "active split"} for {activeDayOfWeek}
              </CardDescription>
            </div>
            {todayWorkout && todayWorkout.type !== "rest" && !workoutCompleted && (
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-500 text-xs font-semibold h-8"
                onClick={() => logRecommendedWorkoutMutation.mutate(todayWorkout)}
                disabled={logRecommendedWorkoutMutation.isPending}
              >
                {logRecommendedWorkoutMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1" />
                )}
                Log Session
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {todayWorkout ? (
              todayWorkout.type === "rest" ? (
                <div className="flex items-center gap-3 py-2 text-emerald-400">
                  <Check className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-semibold">Active Recovery / Rest Day scheduled today. Focus on mobility!</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                    <div>
                      <span className="font-extrabold text-sm text-white block">{todayWorkout.name}</span>
                      <span className="text-[10px] text-white/40 capitalize">Split: {todayWorkout.type} • {profile?.workout_duration_limit || 45} mins</span>
                    </div>
                    {workoutCompleted && (
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Logged
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/50 space-y-1">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-white/30 block">Exercises scheduled:</span>
                    <div className="flex flex-wrap gap-1">
                      {todayWorkout.exercises?.slice(0, 4).map((ex: any, i: number) => (
                        <span key={i} className="bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-lg text-[10px] font-medium">
                          {ex.name} ({ex.sets}x{ex.reps})
                        </span>
                      ))}
                      {todayWorkout.exercises?.length > 4 && (
                        <span className="text-white/30 px-1 text-[10px] self-center">
                          +{todayWorkout.exercises.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-white/40">No AI Workout Plan generated yet.</p>
                <Button
                  size="sm"
                  variant="link"
                  className="text-violet-400 hover:text-violet-300 text-xs font-semibold h-auto p-0 mt-1"
                  onClick={() => window.location.href = "/workouts"}
                >
                  Create Workout Split &rarr;
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-sky-950/20 to-indigo-950/20 border-sky-500/20 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <HeartPulse className="h-24 w-24 text-sky-400" />
          </div>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-sky-300">
                <Sparkles className="h-4 w-4 text-sky-400" />
                AI Suggested Cardio
              </CardTitle>
              <CardDescription className="text-white/40 text-[11px] mt-0.5">
                Based on your conditioning split for {activeDayOfWeek}
              </CardDescription>
            </div>
            {todayCardio && !isRestCardio(todayCardio) && !cardioCompleted && (
              <Button
                size="sm"
                className="bg-sky-600 hover:bg-sky-500 text-xs font-semibold h-8"
                onClick={() => logRecommendedCardioMutation.mutate(todayCardio)}
                disabled={logRecommendedCardioMutation.isPending}
              >
                {logRecommendedCardioMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5 mr-1" />
                )}
                Log Session
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {todayCardio ? (
              isRestCardio(todayCardio) ? (
                <div className="flex items-center gap-3 py-2 text-emerald-400">
                  <Check className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-semibold">Active Recovery / Rest scheduled today. Let your heart rate settle.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                    <div>
                      <span className="font-extrabold text-sm text-white block">{todayCardio.activity} Session</span>
                      <span className="text-[10px] text-white/40 capitalize">Intensity: {todayCardio.type} ({todayCardio.intensity}) • {todayCardio.duration_minutes} mins</span>
                    </div>
                    {cardioCompleted && (
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Logged
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-white/70 leading-relaxed bg-white/[0.01] border border-white/[0.03] p-2 rounded-lg">
                    <span className="font-bold text-[9px] uppercase tracking-wider text-white/30 block mb-0.5">Protocol:</span>
                    {todayCardio.description}
                  </div>
                </div>
              )
            ) : (
              <div className="py-4 text-center">
                <p className="text-xs text-white/40">No AI Cardio Plan generated yet.</p>
                <Button
                  size="sm"
                  variant="link"
                  className="text-sky-400 hover:text-sky-300 text-xs font-semibold h-auto p-0 mt-1"
                  onClick={() => window.location.href = "/cardio"}
                >
                  Create Cardio Plan &rarr;
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Target Dashboard Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-teal-400" />
            Daily Compliance Indicators
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 font-mono">Date: {todayStr}</span>
            <Button
              onClick={() => setCheckinOpen(true)}
              size="sm"
              className="h-8 text-xs font-semibold shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Log Day Stats
            </Button>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card className={`bg-white/[0.02] border-white/[0.06] transition-all hover:border-amber-500/30 ${Math.abs(todayCalories - tgt.cal)/tgt.cal <= 0.1 ? "border-amber-500/20 bg-amber-500/[0.01]" : ""}`}>
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Apple className="h-5 w-5 text-amber-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase">Calories</div>
              <div className="text-sm font-extrabold text-white">{todayCalories} / {tgt.cal}</div>
              <span className="text-[9px] text-white/30 block font-mono">kcal</span>
              <Progress value={Math.min(100, (todayCalories / tgt.cal) * 100)} className="h-1.5 bg-white/[0.04] w-full" indicatorClassName="bg-amber-500" />
            </CardContent>
          </Card>
          <Card className={`bg-white/[0.02] border-white/[0.06] transition-all hover:border-pink-500/30 ${todayProtein >= tgt.pro * 0.9 ? "border-pink-500/20 bg-pink-500/[0.01]" : ""}`}>
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Flame className="h-5 w-5 text-pink-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase">Protein</div>
              <div className="text-sm font-extrabold text-white">{todayProtein}g / {tgt.pro}g</div>
              <span className="text-[9px] text-white/30 block font-mono">Grams</span>
              <Progress value={Math.min(100, (todayProtein / tgt.pro) * 100)} className="h-1.5 bg-white/[0.04] w-full" indicatorClassName="bg-pink-500" />
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06] transition-all hover:border-emerald-500/30">
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Scale className="h-5 w-5 text-emerald-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase">Fiber</div>
              <div className="text-sm font-extrabold text-white">{todayFiber}g / {tgt.fib}g</div>
              <span className="text-[9px] text-white/30 block font-mono">Grams</span>
              <Progress value={Math.min(100, (todayFiber / tgt.fib) * 100)} className="h-1.5 bg-white/[0.04] w-full" indicatorClassName="bg-emerald-500" />
            </CardContent>
          </Card>
          <Card className={`bg-white/[0.02] border-white/[0.06] transition-all hover:border-sky-500/30 ${todayWater >= tgt.water ? "border-sky-500/20 bg-sky-500/[0.01]" : ""}`}>
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Droplet className="h-5 w-5 text-sky-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase">Water</div>
              <div className="text-sm font-extrabold text-white">{todayWater}ml / {tgt.water}ml</div>
              <span className="text-[9px] text-white/30 block font-mono">Liters</span>
              <Progress value={Math.min(100, (todayWater / tgt.water) * 100)} className="h-1.5 bg-white/[0.04] w-full" indicatorClassName="bg-sky-500" />
            </CardContent>
          </Card>
          <Card className={`bg-white/[0.02] border-white/[0.06] transition-all hover:border-indigo-500/30 ${todaySteps >= tgt.steps ? "border-indigo-500/20 bg-indigo-500/[0.01]" : ""}`}>
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Footprints className="h-5 w-5 text-indigo-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase">Steps</div>
              <div className="text-sm font-extrabold text-white">{todaySteps} / {tgt.steps}</div>
              <span className="text-[9px] text-white/30 block font-mono">Steps</span>
              <Progress value={Math.min(100, (todaySteps / tgt.steps) * 100)} className="h-1.5 bg-white/[0.04] w-full" indicatorClassName="bg-indigo-500" />
            </CardContent>
          </Card>
          <Card className={`bg-white/[0.02] border-white/[0.06] transition-all hover:border-teal-500/30 ${todaySleep >= tgt.sleep ? "border-teal-500/20 bg-teal-500/[0.01]" : ""}`}>
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Moon className="h-5 w-5 text-teal-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase">Sleep</div>
              <div className="text-sm font-extrabold text-white">{todaySleep}h / {tgt.sleep}h</div>
              <span className="text-[9px] text-white/30 block font-mono">Hours</span>
              <Progress value={Math.min(100, (todaySleep / tgt.sleep) * 100)} className="h-1.5 bg-white/[0.04] w-full" indicatorClassName="bg-teal-500" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weight Progression Card */}
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-sm">Weight Progression Trend</CardTitle>
            <CardDescription className="text-xs">30 day moving average vs actual weight</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {weightChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161b22",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#14b8a6"
                    fillOpacity={1}
                    fill="url(#weightGrad)"
                    strokeWidth={2}
                    name="Weight"
                  />
                  <Line
                    type="monotone"
                    dataKey="ma7"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    name="7 Day MA"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-white/30 text-sm">
                No weight logs recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calories and Protein Intake Card */}
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader>
            <CardTitle className="text-sm">Nutrition Trends</CardTitle>
            <CardDescription className="text-xs">Calories vs Protein intake over last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {caloriesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={caloriesChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#161b22",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="calories" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Calories" />
                  <Bar dataKey="protein" fill="#ec4899" radius={[4, 4, 0, 0]} name="Protein (g)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-white/30 text-sm">
                No nutrition logged yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Check-in Modal */}
      <DailyCheckinModal
        open={checkinOpen}
        onOpenChange={setCheckinOpen}
        currentDateStr={todayStr}
      />
    </div>
  );
}
