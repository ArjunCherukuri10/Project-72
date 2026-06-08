"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";
import { toast } from "sonner";
import { Sparkles, FileText, CheckCircle2, AlertTriangle, Play, Loader2, ArrowRight } from "lucide-react";

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [compiling, setCompiling] = useState(false);

  // Queries
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile,
  });

  const { data: targets } = useQuery({
    queryKey: ["nutritionTargets"],
    queryFn: trackerService.getNutritionTargets,
  });

  const { data: summaries = [] } = useQuery({
    queryKey: ["dailySummaries"],
    queryFn: trackerService.getDailySummaries,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["weeklyReviews"],
    queryFn: trackerService.getWeeklyReviews,
  });

  // Calculate current week metrics
  const getWeeklyMetrics = () => {
    const last7Days = summaries.slice(-7);
    if (last7Days.length === 0) return null;

    const avgCalories = last7Days.reduce((sum, item) => sum + (item.total_calories || 0), 0) / last7Days.length;
    const avgProtein = last7Days.reduce((sum, item) => sum + (item.total_protein || 0), 0) / last7Days.length;
    const avgSteps = last7Days.reduce((sum, item) => sum + (item.steps || 0), 0) / last7Days.length;
    const avgSleep = last7Days.reduce((sum, item) => sum + (item.sleep_hours || 0), 0) / last7Days.length;
    const avgCompliance = last7Days.reduce((sum, item) => sum + (item.compliance_score || 0), 0) / last7Days.length;

    const weights = last7Days.map((item) => item.weight).filter((w): w is number => w !== null && w > 0);
    const weightLoss = weights.length > 1 ? weights[0] - weights[weights.length - 1] : 0;

    return {
      avgCalories,
      avgProtein,
      avgSteps,
      avgSleep,
      avgCompliance,
      weightLoss,
      startDate: last7Days[0].date,
      endDate: last7Days[last7Days.length - 1].date,
      rawData: last7Days
    };
  };

  const currentMetrics = getWeeklyMetrics();

  // Mutation to compile and save review
  const compileReview = async () => {
    if (!currentMetrics) {
      toast.error("Not enough tracking data to generate a review yet!");
      return;
    }

    setCompiling(true);
    try {
      const response = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaries: currentMetrics.rawData,
          profile,
          targets
        })
      });

      if (!response.ok) {
        throw new Error("Failed to compile AI review");
      }

      const reviewData = await response.json();

      // Save to localStorage/DB
      await trackerService.addWeeklyReview({
        start_date: currentMetrics.startDate,
        end_date: currentMetrics.endDate,
        avg_compliance_score: Math.round(currentMetrics.avgCompliance),
        avg_calories: Math.round(currentMetrics.avgCalories),
        avg_protein: Math.round(currentMetrics.avgProtein),
        weight_change: reviewData.weightLoss || currentMetrics.weightLoss,
        notes: reviewData.status || "Compiled successfully",
        highlights: reviewData.highlights || [],
        lowlights: reviewData.lowlights || [],
        next_actions: reviewData.nextActions || [],
        workout_consistency: null,
        protein_consistency: null,
        calorie_adherence: null,
        habit_completion: null,
        avg_sleep: null,
        avg_water: null,
        avg_steps: null,
        ai_feedback: null,
      });

      queryClient.invalidateQueries({ queryKey: ["weeklyReviews"] });
      toast.success("AI Weekly review compiled and saved!");
    } catch (err: any) {
      toast.error(err.message || "Review compilation failed");
    } finally {
      setCompiling(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">AI Weekly Review</h1>
          <p className="text-white/60 text-sm">
            Consolidate your tracking parameters and generate actionable guidelines.
          </p>
        </div>

        {currentMetrics && (
          <Button
            onClick={compileReview}
            disabled={compiling}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 text-xs py-2 h-9"
          >
            {compiling ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2 text-violet-300" />
            )}
            Compile Weekly Review
          </Button>
        )}
      </div>

      {currentMetrics ? (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Metrics Card */}
          <Card className="bg-white/[0.02] border-white/[0.06] md:col-span-2 space-y-6">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <CardTitle>Current Week Console</CardTitle>
                <CardDescription>
                  Consolidated figures for {currentMetrics.startDate} to {currentMetrics.endDate}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-[#0a0a14] border border-white/[0.04]">
                <span className="text-xs font-semibold text-white/70">Compliance Index</span>
                <span className="text-xs font-extrabold text-violet-400 font-mono">
                  {Math.round(currentMetrics.avgCompliance)}%
                </span>
              </div>
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-[#0a0a14] border border-white/[0.04]">
                <span className="text-xs font-semibold text-white/70">Weight Delta</span>
                <span className={`text-xs font-extrabold font-mono ${currentMetrics.weightLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {currentMetrics.weightLoss >= 0 ? "-" : "+"}
                  {formatNumber(Math.abs(currentMetrics.weightLoss))} kg
                </span>
              </div>
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-[#0a0a14] border border-white/[0.04]">
                <span className="text-xs font-semibold text-white/70">Mean Calories</span>
                <span className="text-xs font-extrabold text-amber-400 font-mono">
                  {formatNumber(currentMetrics.avgCalories, 0)} kcal
                </span>
              </div>
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-[#0a0a14] border border-white/[0.04]">
                <span className="text-xs font-semibold text-white/70">Mean Protein</span>
                <span className="text-xs font-extrabold text-pink-400 font-mono">
                  {formatNumber(currentMetrics.avgProtein, 0)}g
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Guidelines info card */}
          <Card className="bg-white/[0.02] border-white/[0.06] flex flex-col justify-between p-1">
            <CardHeader>
              <CardTitle className="text-sm">Coaching Intelligence</CardTitle>
              <CardDescription className="text-xs">How weekly review consolidation works.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-white/60">
              <p>
                Our AI consolidates your calorie, protein, activity level, and weight trends to estimate weight-loss efficiency and predict plateaus.
              </p>
              <div className="p-3.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-violet-300">
                <strong>💡 Tip:</strong> Compile your review every Sunday to generate updated diet preferences and next-action splits.
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

      {/* History of Reviews */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">Review Logs History</h3>
        {reviews.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((rev) => (
              <Card key={rev.id} className="bg-white/[0.01] border-white/[0.06] hover:border-violet-500/30 transition-all duration-200">
                <CardHeader className="pb-3 border-b border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/40 font-mono">
                      {rev.start_date} <ArrowRight className="inline h-3 w-3 mx-1" /> {rev.end_date}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                      {rev.notes || "On Track"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] pb-3 border-b border-white/[0.04]">
                    <div>
                      <span className="text-white/40 block">Adherence</span>
                      <strong className="text-white text-xs block mt-0.5">{rev.avg_compliance_score}%</strong>
                    </div>
                    <div>
                      <span className="text-white/40 block">Calorie Avg</span>
                      <strong className="text-amber-400 text-xs block mt-0.5">{rev.avg_calories} kcal</strong>
                    </div>
                    <div>
                      <span className="text-white/40 block">Weight Change</span>
                      <strong className={`text-xs block mt-0.5 ${(rev.weight_change ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {(rev.weight_change ?? 0) >= 0 ? "-" : "+"}
                        {Math.abs(rev.weight_change ?? 0)} kg
                      </strong>
                    </div>
                  </div>

                  {/* Highlights */}
                  {rev.highlights && rev.highlights.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Highlights
                      </span>
                      <ul className="list-disc list-inside text-xs text-white/70 space-y-0.5 pl-1">
                        {rev.highlights.map((h: string, idx: number) => (
                          <li key={idx}>{h}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lowlights */}
                  {rev.lowlights && rev.lowlights.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Focus Areas
                      </span>
                      <ul className="list-disc list-inside text-xs text-white/70 space-y-0.5 pl-1">
                        {rev.lowlights.map((l: string, idx: number) => (
                          <li key={idx}>{l}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {rev.next_actions && rev.next_actions.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5" />
                        Next Week Guidelines
                      </span>
                      <ul className="list-disc list-inside text-xs text-white/70 space-y-0.5 pl-1">
                        {rev.next_actions.map((act: string, idx: number) => (
                          <li key={idx}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-8 border border-white/[0.04] bg-white/[0.01] rounded-2xl flex items-center justify-center text-center text-xs text-white/30">
            No weekly reviews generated yet. Compile your first review!
          </div>
        )}
      </div>
    </div>
  );
}
