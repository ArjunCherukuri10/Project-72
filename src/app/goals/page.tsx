"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Target, Plus, Sparkles, AlertTriangle, ArrowRight, Calendar, Info } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import type { Profile, WeightLog, Goal } from "@/types";

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"weight" | "nutrition" | "workout" | "habit" | "health">("weight");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("kg");

  // Fetch Queries
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile,
  });

  const { data: weightLogs = [] } = useQuery<WeightLog[]>({
    queryKey: ["weightLogs"],
    queryFn: trackerService.getWeightLogs,
  });

  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: trackerService.getGoals,
  });

  const addGoalMutation = useMutation({
    mutationFn: async () => {
      if (!title) throw new Error("Goal title is required");
      return trackerService.addGoal({
        category,
        title,
        description: null,
        target_value: target ? parseFloat(target) : null,
        current_value: null,
        unit: unit || null,
        start_date: new Date().toISOString().split("T")[0],
        target_date: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal set successfully!");
      setTitle("");
      setTarget("");
    },
  });

  // Projection engine parameters
  const currentWeight = useMemo(() => {
    return weightLogs[0]?.weight || profile?.starting_weight || 80.0;
  }, [weightLogs, profile]);

  const targetWeight = useMemo(() => {
    return profile?.goal_weight || 72.0;
  }, [profile]);

  // Generate 12-week weight projections
  const projections = useMemo(() => {
    const list = [];
    const changeRatePerWeek = 0.5; // safe, recommended standard loss rate
    const totalWeeks = 12;

    let tempWeight = currentWeight;
    const isLoss = currentWeight > targetWeight;

    for (let i = 1; i <= totalWeeks; i++) {
      if (isLoss) {
        tempWeight -= changeRatePerWeek;
      } else {
        tempWeight += changeRatePerWeek; // gain/bulking context
      }

      // Check if we hit/passed target
      const hitTarget = isLoss ? (tempWeight <= targetWeight) : (tempWeight >= targetWeight);

      list.push({
        week: i,
        weight: parseFloat(tempWeight.toFixed(1)),
        hitTarget
      });
    }

    return list;
  }, [currentWeight, targetWeight]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Goals & Weight Projections</h1>
        <p className="text-white/60 text-sm">
          Track custom targets and visualize future weight milestones calculated using safe health parameters.
        </p>
      </div>

      {/* 12-Week Weight Projection engine */}
      <Card className="bg-white/[0.02] border-white/[0.06] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/[0.06]">
          <div>
            <CardTitle className="flex items-center gap-1.5 text-base">
              <Sparkles className="h-4 w-4 text-violet-400" />
              12-Week Weight Projection Engine
            </CardTitle>
            <CardDescription className="text-xs">
              Mifflin-St Jeor TDEE projections assuming a safe 500 kcal daily deficit (0.5kg/week change rate).
            </CardDescription>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-white/40 block">Current Weight</span>
            <strong className="text-white text-sm block font-mono">{currentWeight}kg</strong>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Table */}
            <div className="md:col-span-2 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-white/[0.04] text-white/40">
                    <th className="py-2.5 font-bold uppercase tracking-wider">Week</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-right">Projected Weight</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {projections.map((proj) => (
                    <tr key={proj.week} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-2.5 font-medium text-white/70 font-mono">Week {proj.week}</td>
                      <td className="py-2.5 text-right font-extrabold text-white font-mono">{proj.weight} kg</td>
                      <td className="py-2.5 text-right">
                        {proj.hitTarget ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                            Target Hit
                          </span>
                        ) : (
                          <span className="text-white/30 font-mono">On Track</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Projection Tips card */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-violet-400" />
                  Velocity Warnings
                </span>
                <p className="text-[11px] leading-relaxed text-white/60">
                  Targeting faster weight loss (e.g. &gt;1kg/week) triggers cortisol release, muscle degradation, and metabolic adaptation.
                </p>
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] flex gap-1.5 items-start">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Extreme diets increase recovery time. Project 72 enforces a max safe deficit of 1.0kg/week.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Entry Card */}
        <Card className="bg-white/[0.02] border-white/[0.06]">
          <CardHeader>
            <CardTitle>Set New Goal</CardTitle>
            <CardDescription>Target a specific milestone parameter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="gTitle">Goal Title</Label>
              <Input
                id="gTitle"
                placeholder="e.g. Fit into 32inch Waist Pants"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="gCategory">Category</Label>
              <select
                id="gCategory"
                className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#07070f] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
              >
                <option value="weight">Weight Loss</option>
                <option value="nutrition">Nutrition / Calories</option>
                <option value="workout">Workout / Strength</option>
                <option value="habit">Habit / Routine</option>
                <option value="health">Health / Lab Metrics</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="gTarget">Target Value</Label>
                <Input
                  id="gTarget"
                  type="number"
                  placeholder="72"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="gUnit">Unit</Label>
                <Input
                  id="gUnit"
                  placeholder="kg"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full mt-3"
              onClick={() => addGoalMutation.mutate()}
              disabled={addGoalMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Goal
            </Button>
          </CardContent>
        </Card>

        {/* History Grid */}
        <Card className="bg-white/[0.02] border-white/[0.06] md:col-span-2">
          <CardHeader>
            <CardTitle>Active Goals</CardTitle>
            <CardDescription>Current targets you are tracking progress for.</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px] overflow-y-auto">
            {goals.length > 0 ? (
              <div className="grid gap-3">
                {goals.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-violet-500/30 transition-all duration-200"
                  >
                    <div>
                      <h4 className="font-semibold text-white">{g.title}</h4>
                      <div className="flex gap-4 text-xs text-white/50 mt-1">
                        <span className="capitalize text-violet-400 font-semibold">{g.category}</span>
                        {g.target_value && (
                          <span>
                            Target: {g.target_value} {g.unit}
                          </span>
                        )}
                        <span>Started: {g.start_date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-white/30 gap-2">
                <Target className="h-8 w-8 text-white/20" />
                <span className="text-sm">No active goals found. Set something challenging!</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
