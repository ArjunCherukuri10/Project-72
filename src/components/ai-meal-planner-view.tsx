"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Apple, Sparkles, Check, RefreshCw, Plus } from "lucide-react";
import { trackerService } from "@/lib/services";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Profile } from "@/types";

export default function AIMealPlannerView() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);

  // Queries
  const { data: profile } = useQuery<Profile | null>({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile as any,
  });

  const { data: targets } = useQuery({
    queryKey: ["nutritionTargets"],
    queryFn: trackerService.getNutritionTargets,
  });

  const { data: plan, isLoading } = useQuery({
    queryKey: ["aiMealPlan"],
    queryFn: trackerService.getAIMealPlan,
  });

  // Generate Meal Mutation
  const generateMealPlan = async () => {
    if (!profile) {
      toast.error("Please set your profile info first!");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/ai-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calories: targets?.calories || 2000,
          protein: targets?.protein || 130,
          preference: profile.diet_preference || "non_vegetarian",
          budget: profile.budget_preference || "medium",
          allergies: profile.allergies || "",
          goal: profile.goal_weight && profile.starting_weight && profile.starting_weight > profile.goal_weight ? "Lose Weight" : "Muscle Gain"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate meal plan");
      }

      const newPlan = await response.json();
      await trackerService.saveAIMealPlan(newPlan);
      queryClient.invalidateQueries({ queryKey: ["aiMealPlan"] });
      toast.success("AI Meal Plan template generated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate plan");
    } finally {
      setGenerating(false);
    }
  };

  // Log meal instantly
  const logMealMutation = useMutation({
    mutationFn: async ({ meal, type }: { meal: any; type: string }) => {
      const dateStr = new Date().toISOString().split("T")[0];
      return trackerService.addMealItem(dateStr, type as any, "custom", 1, {
        calories: meal.macros.calories,
        protein: meal.macros.protein,
        carbs: meal.macros.carbs,
        fat: meal.macros.fat,
        fiber: meal.macros.fiber,
        food: { name: meal.description }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Meal logged successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log meal");
    }
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
        <span className="text-sm text-white/50">Loading Meal Plan...</span>
      </div>
    );
  }

  return (
    <Card className="bg-white/[0.02] border-white/[0.06] shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-white/[0.06]">
        <div>
          <CardTitle className="flex items-center gap-1.5 text-lg">
            <Sparkles className="h-5 w-5 text-violet-400" />
            AI Day Meal Planner
          </CardTitle>
          <CardDescription>
            {plan ? "A clean template tailored to your daily caloric & protein goals." : "Generate a customized nutrition guide."}
          </CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={generating}
          onClick={generateMealPlan}
          className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 h-8 text-xs"
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          )}
          {plan ? "Regenerate" : "Generate Plan"}
        </Button>
      </CardHeader>

      {plan ? (
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {((plan as any).meals || (plan as any).meal_plan?.meals || [])?.map((meal: any, idx: number) => {
              const mealTypeMap: Record<string, string> = {
                "Breakfast": "breakfast",
                "Lunch": "lunch",
                "Dinner": "dinner",
                "Snacks": "snacks",
                "Snack": "snacks"
              };
              const normalizedType = mealTypeMap[meal.name] || "breakfast";

              return (
                <div key={idx} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-4 flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white block capitalize">{meal.name}</span>
                      <span className="text-[10px] text-white/40 font-mono">{meal.time}</span>
                    </div>

                    <div className="space-y-1">
                      <strong className="text-xs text-violet-400 font-semibold block">{meal.description}</strong>
                      <ul className="list-disc list-inside text-[11px] text-white/60 space-y-0.5 mt-1.5">
                        {meal.ingredients?.map((ing: string, i: number) => (
                          <li key={i}>{ing}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.04] pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-amber-400 font-semibold">{meal.macros.calories} kcal</span>
                      <span className="text-white/20">•</span>
                      <span className="text-pink-400 font-semibold">{meal.macros.protein}g P</span>
                      <span className="text-white/20">•</span>
                      <span className="text-violet-400 font-semibold">{meal.macros.carbs}g C</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={logMealMutation.isPending}
                      onClick={() => logMealMutation.mutate({ meal, type: normalizedType })}
                      className="h-7 text-[10px] text-violet-300 hover:text-violet-200 hover:bg-violet-600/10 px-2.5 rounded-lg"
                    >
                      <Plus className="w-3 h-3 mr-1" /> Log Meal
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      ) : (
        <CardContent className="p-10 flex flex-col items-center justify-center text-center gap-3">
          <Apple className="h-10 w-10 text-white/20" />
          <span className="font-bold text-sm text-white">No active meal templates</span>
          <p className="text-xs text-white/40 max-w-sm">
            Generate a personalized nutrition plan today.
          </p>
          <Button
            onClick={generateMealPlan}
            disabled={generating}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-xs h-9"
          >
            {generating ? (
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 mr-1" />
            )}
            Build custom nutrition guide
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
