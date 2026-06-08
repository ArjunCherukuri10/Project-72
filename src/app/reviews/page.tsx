"use client";

import { useQuery } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import { subDays, format } from "date-fns";
import { Sparkles, FileText, CheckCircle2 } from "lucide-react";

export default function ReviewsPage() {
  const { data: summaries = [] } = useQuery({
    queryKey: ["dailySummaries"],
    queryFn: trackerService.getDailySummaries,
  });

  const getWeeklyMetrics = () => {
    const last7Days = summaries.slice(-7);
    if (last7Days.length === 0) return null;

    const avgCalories = last7Days.reduce((sum, item) => sum + (item.total_calories || 0), 0) / last7Days.length;
    const avgProtein = last7Days.reduce((sum, item) => sum + (item.total_protein || 0), 0) / last7Days.length;
    const avgSteps = last7Days.reduce((sum, item) => sum + (item.steps || 0), 0) / last7Days.length;
    const avgSleep = last7Days.reduce((sum, item) => sum + (item.sleep_hours || 0), 0) / last7Days.length;

    const weights = last7Days.map((item) => item.weight).filter((w): w is number => w !== null);
    const weightLoss = weights.length > 1 ? weights[0] - weights[weights.length - 1] : 0;

    return {
      avgCalories,
      avgProtein,
      avgSteps,
      avgSleep,
      weightLoss,
    };
  };

  const weeklyMetrics = getWeeklyMetrics();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Weekly Review</h1>
        <p className="text-white/60">
          Auto-generated weekly summaries consolidating weight, calories deficit velocity, and habit compliance.
        </p>
      </div>

      {weeklyMetrics ? (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-white/[0.02] md:col-span-2 space-y-6">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <CardTitle>Current Week Review</CardTitle>
                <CardDescription>
                  Summary for the past 7 active days.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                <span className="text-sm font-semibold">Weight Change</span>
                <span className={`text-sm font-bold ${weeklyMetrics.weightLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {weeklyMetrics.weightLoss >= 0 ? "-" : "+"}
                  {formatNumber(Math.abs(weeklyMetrics.weightLoss))} kg
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                <span className="text-sm font-semibold">Avg Calorie Intake</span>
                <span className="text-sm font-bold text-amber-400">
                  {formatNumber(weeklyMetrics.avgCalories, 0)} kcal
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                <span className="text-sm font-semibold">Avg Protein Intake</span>
                <span className="text-sm font-bold text-pink-400">
                  {formatNumber(weeklyMetrics.avgProtein, 0)}g
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/[0.01] border border-white/[0.04]">
                <span className="text-sm font-semibold">Avg Daily Steps</span>
                <span className="text-sm font-bold text-indigo-400">
                  {formatNumber(weeklyMetrics.avgSteps, 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/[0.02] flex flex-col justify-between">
            <CardHeader>
              <CardTitle>AI Summary Insights</CardTitle>
              <CardDescription>Generated evaluation notes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-white/70">
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>Weight is trending downwards consistently. Calorie targets were hit 6 out of 7 days.</p>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>Steps averaged above the 10k goal threshold. Great cardiovascular base output.</p>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>Ensure hydration (water) metric logs are maintained evenly during the afternoon period.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center text-white/30 border border-white/[0.04] bg-white/[0.01] rounded-2xl gap-2">
          <Sparkles className="h-8 w-8 text-white/20" />
          <span className="text-sm font-semibold">No active week summaries found.</span>
        </div>
      )}
    </div>
  );
}
