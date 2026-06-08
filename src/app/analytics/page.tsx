"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts";

type TimeRange = "7d" | "30d" | "90d" | "all";

export default function AnalyticsPage() {
  const [range, setRange] = useState<TimeRange>("30d");

  const { data: summaries = [] } = useQuery({
    queryKey: ["dailySummaries"],
    queryFn: trackerService.getDailySummaries,
  });

  const getFilteredData = () => {
    const sorted = [...summaries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    if (range === "7d") return sorted.slice(-7);
    if (range === "30d") return sorted.slice(-30);
    if (range === "90d") return sorted.slice(-90);
    return sorted;
  };

  const chartData = getFilteredData().map((s) => ({
    date: s.date,
    weight: s.weight || 0,
    calories: s.total_calories || 0,
    protein: s.total_protein || 0,
    steps: s.steps || 0,
    sleep: s.sleep_hours || 0,
  }));

  // Average Metrics
  const avgCalories =
    chartData.reduce((sum, item) => sum + item.calories, 0) / (chartData.length || 1);
  const avgProtein =
    chartData.reduce((sum, item) => sum + item.protein, 0) / (chartData.length || 1);
  const avgSteps =
    chartData.reduce((sum, item) => sum + item.steps, 0) / (chartData.length || 1);
  const avgSleep =
    chartData.reduce((sum, item) => sum + item.sleep, 0) / (chartData.length || 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Analytics Center</h1>
          <p className="text-white/60">
            Advanced reports, regression curves, calorie macro correlation, and activity trends.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-white/[0.05] p-1 rounded-xl">
          {(["7d", "30d", "90d", "all"] as TimeRange[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setRange(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200 ${
                range === tab ? "bg-violet-600 text-white shadow" : "text-white/40 hover:text-white"
              }`}
            >
              {tab === "all" ? "All Time" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Avg Calories</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-400">
              {formatNumber(avgCalories, 0)} kcal
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Avg Protein</CardDescription>
            <CardTitle className="text-2xl font-bold text-pink-400">
              {formatNumber(avgProtein, 0)}g
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Avg Steps</CardDescription>
            <CardTitle className="text-2xl font-bold text-indigo-400">
              {formatNumber(avgSteps, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="bg-white/[0.02]">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Avg Sleep</CardDescription>
            <CardTitle className="text-2xl font-bold text-violet-400">
              {formatNumber(avgSleep, 1)} hrs
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Advanced Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Weight Loss Correlation Curve</CardTitle>
            <CardDescription>Weight change rate over current filter window.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f0f1a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                  }}
                />
                <Area type="monotone" dataKey="weight" stroke="#8b5cf6" fill="rgba(139, 92, 246, 0.1)" strokeWidth={2} name="Weight (kg)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Daily Steps Volume</CardTitle>
            <CardDescription>Bar distribution of steps activity.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f0f1a",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="steps" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Steps" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
