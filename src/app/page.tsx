"use client";

import { useQuery } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatNumber, calculateBMI, getBMICategory, estimateGoalDate, calculateMacroTargets } from "@/lib/utils";
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
  TrendingUp
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
import { useMemo } from "react";

export default function Dashboard() {
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile as any,
  });

  const { data: weightLogs = [] } = useQuery({
    queryKey: ["weightLogs"],
    queryFn: trackerService.getWeightLogs,
  });

  const { data: summaries = [] } = useQuery({
    queryKey: ["dailySummaries"],
    queryFn: trackerService.getDailySummaries,
  });

  // Calculate stats
  const currentWeight = weightLogs[0]?.weight || profile?.starting_weight || 94.0;
  const startingWeight = profile?.starting_weight || 94.0;
  const goalWeight = profile?.goal_weight || 72.0;
  const weightLost = Math.max(0, startingWeight - currentWeight);
  const weightRemaining = Math.max(0, currentWeight - goalWeight);
  const heightCm = profile?.height_cm || 180;
  const bmi = calculateBMI(currentWeight, heightCm);
  const estimatedGoalDateObj = estimateGoalDate(currentWeight, goalWeight, 0.5);

  const totalLossNeeded = startingWeight - goalWeight;
  const lossPercentage = totalLossNeeded > 0 ? (weightLost / totalLossNeeded) * 100 : 0;

  // Today stats
  const todayStr = new Date().toISOString().split("T")[0];
  const todaySummary = summaries.find((s) => s.date === todayStr);

  const todayCalories = todaySummary?.total_calories || 0;
  const todayProtein = todaySummary?.total_protein || 0;
  const todayFiber = todaySummary?.total_fiber || 0;
  const todayWater = todaySummary?.water_ml || 0;
  const todaySteps = todaySummary?.steps || 0;
  const todaySleep = todaySummary?.sleep_hours || 0;
  const compliance = todaySummary?.compliance_score || 0;

  // Dynamic TDEE-based targets
  const tgt = useMemo(() => {
    const w = profile?.starting_weight || currentWeight || 80;
    const h = profile?.height_cm || 175;
    const age = profile?.date_of_birth
      ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / 31557600000)
      : 25;
    const g = (profile?.gender === "female" ? "female" : "male") as "male" | "female";
    const act = profile?.activity_level || "moderate";
    return calculateMacroTargets(w, h, age, g, act);
  }, [profile, currentWeight]);

  // Chart data
  const weightChartData = [...weightLogs]
    .reverse()
    .slice(-30)
    .map((log, idx, arr) => {
      // Calculate 7-day moving average
      const slice = arr.slice(Math.max(0, idx - 6), idx + 1);
      const avg = slice.reduce((sum, item) => sum + item.weight, 0) / slice.length;
      return {
        date: log.date,
        weight: log.weight,
        ma7: parseFloat(avg.toFixed(1)),
        goal: goalWeight,
      };
    });

  const caloriesChartData = [...summaries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-7)
    .map((s) => ({
      date: formatNumber(new Date(s.date).getDate(), 0),
      calories: s.total_calories || 0,
      protein: s.total_protein || 0,
    }));

  return (
    <div className="space-y-8">
      {/* Target Progress Bar */}
      <Card className="relative overflow-hidden border-violet-500/20 bg-gradient-to-br from-violet-600/10 via-transparent to-indigo-600/10">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Am I on track to reach 72kg?
              </h1>
              <p className="text-white/60">
                You have lost <span className="text-violet-400 font-semibold">{formatNumber(weightLost)}kg</span>. You are <span className="text-indigo-400 font-semibold">{formatNumber(lossPercentage, 0)}%</span> of the way to your target weight.
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Estimated Goal Date
              </div>
              <div className="text-xl font-bold text-violet-400">
                {estimatedGoalDateObj.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-white/40">{startingWeight}kg</span>
              <span className="text-white">{formatNumber(currentWeight)}kg</span>
              <span className="text-white/40">{goalWeight}kg</span>
            </div>
            <Progress value={lossPercentage} className="h-3 bg-white/[0.05]" />
          </div>
        </CardContent>
      </Card>

      {/* Main KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-white/50">Current Weight</CardTitle>
            <Scale className="h-4 w-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(currentWeight)}kg</div>
            <p className="text-xs text-white/40 mt-1">Starting: {startingWeight}kg</p>
          </CardContent>
        </Card>
        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-white/50">Weight Remaining</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(weightRemaining)}kg</div>
            <p className="text-xs text-white/40 mt-1">Goal: {goalWeight}kg</p>
          </CardContent>
        </Card>
        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-white/50">BMI Status</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(bmi)}</div>
            <p className="text-xs text-white/40 mt-1">{getBMICategory(bmi)}</p>
          </CardContent>
        </Card>
        <Card glow>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-white/50">Compliance Score</CardTitle>
            <Award className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compliance}%</div>
            <p className="text-xs text-white/40 mt-1">Target is 80%+</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Target Dashboard Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Daily Target Summary</h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Card className="bg-white/[0.02]">
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Apple className="h-5 w-5 text-amber-400" />
              <div className="text-xs text-white/40">Calories</div>
              <div className="text-sm font-bold">{todayCalories} / {tgt.cal}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02]">
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Flame className="h-5 w-5 text-red-400" />
              <div className="text-xs text-white/40">Protein</div>
              <div className="text-sm font-bold">{todayProtein}g / {tgt.pro}g</div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02]">
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Scale className="h-5 w-5 text-emerald-400" />
              <div className="text-xs text-white/40">Fiber</div>
              <div className="text-sm font-bold">{todayFiber}g / {tgt.fib}g</div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02]">
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Droplet className="h-5 w-5 text-sky-400" />
              <div className="text-xs text-white/40">Water</div>
              <div className="text-sm font-bold">{todayWater}ml / 3000</div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02]">
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Footprints className="h-5 w-5 text-indigo-400" />
              <div className="text-xs text-white/40">Steps</div>
              <div className="text-sm font-bold">{todaySteps} / 10k</div>
            </CardContent>
          </Card>
          <Card className="bg-white/[0.02]">
            <CardContent className="p-4 flex flex-col items-center text-center justify-center space-y-2">
              <Moon className="h-5 w-5 text-violet-400" />
              <div className="text-xs text-white/40">Sleep</div>
              <div className="text-sm font-bold">{todaySleep}h / 7.5h</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Weight Progression Card */}
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Weight Progression Trend</CardTitle>
            <CardDescription>30 day moving average vs actual weight</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {weightChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke="#71717a" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f0f1a",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#8b5cf6"
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
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Nutrition Trends</CardTitle>
            <CardDescription>Calories vs Protein intake over last 7 days</CardDescription>
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
                      backgroundColor: "#0f0f1a",
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
    </div>
  );
}
