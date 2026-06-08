"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatNumber, calculateBMI, getBMICategory, estimateGoalDate } from "@/lib/utils";
import type { Profile } from "@/types";
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
  Loader2
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
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

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

  const todayCalories = todaySummary?.total_calories || 0;
  const todayProtein = todaySummary?.total_protein || 0;
  const todayFiber = todaySummary?.total_fiber || 0;
  const todayWater = todaySummary?.water_ml || 0;
  const todaySteps = todaySummary?.steps || 0;
  const todaySleep = todaySummary?.sleep_hours || 0;
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
  // Auto-open Daily Check‑in if there is no weight entry for today
  useEffect(() => {
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

  // Save onboarding mutation
  const saveOnboardingMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Update Profile
      await trackerService.updateProfile(data.profile);
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
      {/* Target Progress Bar */}
      <Card className="relative overflow-hidden border-white/[0.08] bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10">
        <CardContent className="p-6 sm:p-8">
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
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-xs font-bold font-mono">
              <span className="text-white/40">{startingWeight}kg (Start)</span>
              <span className="text-teal-300 font-extrabold">{formatNumber(currentWeight)}kg (Now)</span>
              <span className="text-white/40">{goalWeight}kg (Goal)</span>
            </div>
            <Progress value={lossPercentage} className="h-2.5 bg-white/[0.04]" />
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
        <Card className="bg-white/[0.02] border-white/[0.06] relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-white/40 uppercase">Compliance Score</CardTitle>
            <Award className="h-4 w-4 text-teal-400 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              {complianceScore} / 100
            </div>
            <p className="text-[10px] text-white/40 mt-1">Daily adherence index</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Target Dashboard Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-teal-400" />
            Daily Compliance Indicators
          </h3>
          <span className="text-[10px] text-white/40 font-mono">Today: {todayStr}</span>
        </div>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card className={`bg-white/[0.02] border-white/[0.06] transition-all ${Math.abs(todayCalories - tgt.cal)/tgt.cal <= 0.1 ? "border-amber-500/20 bg-amber-500/[0.01]" : ""}`}>
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-1">
              <Apple className="h-5 w-5 text-amber-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase mt-1">Calories</div>
              <div className="text-sm font-extrabold text-white">{todayCalories} / {tgt.cal}</div>
              <span className="text-[9px] text-white/30 block">kcal</span>
            </CardContent>
          </Card>
          <Card className={`bg-white/[0.02] border-white/[0.06] transition-all ${todayProtein >= tgt.pro * 0.9 ? "border-pink-500/20 bg-pink-500/[0.01]" : ""}`}>
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-1">
              <Flame className="h-5 w-5 text-pink-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase mt-1">Protein</div>
              <div className="text-sm font-extrabold text-white">{todayProtein}g / {tgt.pro}g</div>
              <span className="text-[9px] text-white/30 block">Grams</span>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02] border-white/[0.06]">
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-1">
              <Scale className="h-5 w-5 text-emerald-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase mt-1">Fiber</div>
              <div className="text-sm font-extrabold text-white">{todayFiber}g / {tgt.fib}g</div>
              <span className="text-[9px] text-white/30 block">Grams</span>
            </CardContent>
          </Card>
          <Card className={`bg-white/[0.02] border-white/[0.06] transition-all ${todayWater >= tgt.water ? "border-sky-500/20 bg-sky-500/[0.01]" : ""}`}>
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-1">
              <Droplet className="h-5 w-5 text-sky-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase mt-1">Water</div>
              <div className="text-sm font-extrabold text-white">{todayWater}ml / {tgt.water}ml</div>
              <span className="text-[9px] text-white/30 block">Liters</span>
            </CardContent>
          </Card>
          <Card className={`bg-white/[0.02] border-white/[0.06] transition-all ${todaySteps >= tgt.steps ? "border-indigo-500/20 bg-indigo-500/[0.01]" : ""}`}>
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-1">
              <Footprints className="h-5 w-5 text-indigo-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase mt-1">Steps</div>
              <div className="text-sm font-extrabold text-white">{todaySteps} / {tgt.steps}</div>
              <span className="text-[9px] text-white/30 block">Steps</span>
            </CardContent>
          </Card>
          <Card className={`bg-white/[0.02] border-white/[0.06] transition-all ${todaySleep >= tgt.sleep ? "border-teal-500/20 bg-teal-500/[0.01]" : ""}`}>
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-1">
              <Moon className="h-5 w-5 text-teal-400" />
              <div className="text-[10px] text-white/40 font-bold uppercase mt-1">Sleep</div>
              <div className="text-sm font-extrabold text-white">{todaySleep}h / {tgt.sleep}h</div>
              <span className="text-[9px] text-white/30 block">Hours</span>
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
