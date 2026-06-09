"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Check, RefreshCw, Award, Activity, AlertCircle, Dumbbell } from "lucide-react";
import { trackerService } from "@/lib/services";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Profile, WorkoutSession, AIWorkoutAnalysis } from "@/types";

export default function AIWorkoutAnalysisView() {
  const queryClient = useQueryClient();
  const [analyzing, setAnalyzing] = useState(false);

  // Queries
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile as any,
  });

  const { data: workouts = [] } = useQuery<WorkoutSession[]>({
    queryKey: ["workouts"],
    queryFn: trackerService.getWorkouts,
  });

  const { data: analysis, isLoading } = useQuery<AIWorkoutAnalysis | null>({
    queryKey: ["aiWorkoutAnalysis"],
    queryFn: trackerService.getAIWorkoutAnalysis as any,
  });

  // Execute Analysis Mutation logic
  const runAnalysis = async () => {
    if (!profile) {
      toast.error("Please configure your profile settings first!");
      return;
    }

    setAnalyzing(true);
    try {
      // Send the latest 10 workouts to keep it performant and focus on recent overload progression
      const recentWorkouts = workouts.slice(0, 10);

      const response = await fetch("/api/ai-workout-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          workouts: recentWorkouts,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze workout logs");
      }

      const newAnalysis = await response.json();
      await trackerService.saveAIWorkoutAnalysis(newAnalysis);
      queryClient.invalidateQueries({ queryKey: ["aiWorkoutAnalysis"] });
      toast.success("AI Workout Performance Analysis updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze workout data");
    } finally {
      setAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
        <span className="text-sm text-white/50">Analyzing Training Data...</span>
      </div>
    );
  }

  // Define color styles based on rating
  const getRatingColor = (rating?: string) => {
    const r = (rating || "").toLowerCase();
    if (r.includes("exce")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (r.includes("solid") || r.includes("good")) return "bg-sky-500/10 text-sky-400 border-sky-500/20";
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  return (
    <Card className="bg-white/[0.02] border-white/[0.06] shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <CardTitle className="flex items-center gap-1.5 text-lg">
            <Sparkles className="h-5 w-5 text-teal-400" />
            AI Trainer — Performance Analyst
          </CardTitle>
          <CardDescription>
            Analyzes your completed exercises, sets, reps, and weights to suggest overload improvements.
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={analyzing}
          onClick={runAnalysis}
          className="border-teal-500/30 text-teal-300 hover:bg-teal-500/10 h-8 text-xs font-semibold"
        >
          {analyzing ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          {analysis ? "Re-Analyze History" : "Analyze Logs"}
        </Button>
      </CardHeader>

      {analysis ? (
        <CardContent className="p-6 space-y-6">
          {/* Top Rating Card */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between">
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider block mb-1">Coaching Summary</span>
              <p className="text-xs text-white/80 leading-relaxed font-medium">{analysis.summary}</p>
            </div>
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between text-center items-center">
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-wider block mb-2">Consistency Rating</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRatingColor(analysis.consistency_rating)}`}>
                {analysis.consistency_rating}
              </span>
              <span className="text-[10px] text-white/30 mt-3 font-mono block">Analyzed {workouts.length} recent sessions</span>
            </div>
          </div>

          {/* Key Achievements */}
          {analysis.achievements && analysis.achievements.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-teal-400" />
                Performance Milestones
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {analysis.achievements.map((ach, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 p-3 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                    <div className="w-5 h-5 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-xs text-white/80 font-medium">{ach}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overload Recommendations */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
              <Activity className="h-3.5 w-3.5 text-teal-400" />
              Overload Recommendations & Adjustments
            </h4>
            {analysis.recommendations && analysis.recommendations.length > 0 ? (
              <div className="grid gap-3">
                {analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="rounded-xl border border-white/[0.04] bg-white/[0.01] overflow-hidden">
                    {/* Header */}
                    <div className="bg-white/[0.02] border-b border-white/[0.04] px-4 py-2.5 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <Dumbbell className="h-3.5 w-3.5 text-teal-400" />
                        {rec.exercise}
                      </span>
                      <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2 py-0.5 rounded-lg font-mono">
                        Target progression
                      </span>
                    </div>
                    {/* Progression Row */}
                    <div className="p-4 grid gap-4 sm:grid-cols-2 border-b border-white/[0.04]">
                      <div>
                        <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider block mb-0.5">Last Logged Output</span>
                        <span className="text-xs font-bold text-white/50 font-mono block">{rec.current}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-teal-400/70 font-bold uppercase tracking-wider block mb-0.5">AI Target Suggestion</span>
                        <span className="text-xs font-extrabold text-teal-300 font-mono block">{rec.target}</span>
                      </div>
                    </div>
                    {/* Cue */}
                    <div className="p-3 bg-teal-500/[0.01] px-4 flex gap-2 text-xs">
                      <AlertCircle className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                      <p className="text-white/60 leading-relaxed italic">{rec.coaching_tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] text-center text-xs text-white/40">
                No progression targets generated. Logs did not contain clear weights or reps.
              </div>
            )}
          </div>

          {/* General Coach Advice */}
          {analysis.general_coaching && (
            <div className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3.5 text-xs flex gap-2.5">
              <Sparkles className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-white">General Training Guidelines</span>
                <p className="text-white/60 leading-relaxed mt-0.5">{analysis.general_coaching}</p>
              </div>
            </div>
          )}
        </CardContent>
      ) : (
        <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-3">
          <Activity className="h-10 w-10 text-white/20" />
          <span className="font-bold text-sm text-white">Analyze Your Workouts</span>
          <p className="text-xs text-white/40 max-w-sm">
            Let the AI Analyst inspect your training volume, exercise select splits, and sets/reps performance to formulate progression strategies.
          </p>
          <Button
            onClick={runAnalysis}
            disabled={analyzing}
            className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-xs h-9 font-semibold"
          >
            {analyzing ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1" />
            )}
            Analyze Completed Sessions
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
