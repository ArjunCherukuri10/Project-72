"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Apple, Plus, UtensilsCrossed, Calendar } from "lucide-react";

export default function NutritionPage() {
  const queryClient = useQueryClient();
  const [selectedMeal, setSelectedMeal] = useState<"breakfast" | "lunch" | "dinner" | "snacks">("breakfast");
  const [foodId, setFoodId] = useState("");
  const [servings, setServings] = useState("1");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: foods = [] } = useQuery({
    queryKey: ["foodItems"],
    queryFn: trackerService.getFoodItems,
  });

  const { data: meals = [] } = useQuery({
    queryKey: ["mealsToday", date],
    queryFn: () => trackerService.getNutritionLogsToday(date),
  });

  const { data: summary } = useQuery({
    queryKey: ["dailySummary", date],
    queryFn: () => trackerService.getDailySummary(date),
  });

  const logMealMutation = useMutation({
    mutationFn: async () => {
      if (!foodId || !servings) throw new Error("Select a food and servings amount");
      return trackerService.addMealItem(
        date,
        selectedMeal,
        foodId,
        parseFloat(servings)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealsToday", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Meal item logged!");
      setServings("1");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log meal item");
    },
  });

  // Target targets
  const targetCalories = 1800;
  const targetProtein = 150;
  const targetCarbs = 180;
  const targetFat = 60;
  const targetFiber = 30;

  const currentCalories = summary?.total_calories || 0;
  const currentProtein = summary?.total_protein || 0;
  const currentCarbs = summary?.total_carbs || 0;
  const currentFat = summary?.total_fat || 0;
  const currentFiber = summary?.total_fiber || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Nutrition Tracker</h1>
          <p className="text-white/60">
            Log breakfast, lunch, dinner, snacks, and track calorie/macro percentages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-violet-400" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Target Progress Bar / Circles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-white/[0.02] flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Calories</CardDescription>
            <CardTitle className="text-xl font-bold text-amber-400">{currentCalories} / {targetCalories} kcal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.min(100, (currentCalories / targetCalories) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Protein</CardDescription>
            <CardTitle className="text-xl font-bold text-pink-400">{currentProtein} / {targetProtein}g</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full"
                style={{ width: `${Math.min(100, (currentProtein / targetProtein) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Carbs</CardDescription>
            <CardTitle className="text-xl font-bold text-violet-400">{currentCarbs} / {targetCarbs}g</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full"
                style={{ width: `${Math.min(100, (currentCarbs / targetCarbs) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Fat</CardDescription>
            <CardTitle className="text-xl font-bold text-teal-400">{currentFat} / {targetFat}g</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full"
                style={{ width: `${Math.min(100, (currentFat / targetFat) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.02] flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-semibold uppercase">Fiber</CardDescription>
            <CardTitle className="text-xl font-bold text-emerald-400">{currentFiber} / {targetFiber}g</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, (currentFiber / targetFiber) * 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Log Meal Entry Form */}
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Log Meal</CardTitle>
            <CardDescription>Select food database record to log consumption.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Meal Period</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["breakfast", "lunch", "dinner", "snacks"] as const).map((meal) => (
                  <Button
                    key={meal}
                    variant={selectedMeal === meal ? "default" : "outline"}
                    className="capitalize text-xs rounded-xl h-9"
                    onClick={() => setSelectedMeal(meal)}
                  >
                    {meal}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="foodSelect">Select Food Item</Label>
              <select
                id="foodSelect"
                className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#07070f] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                value={foodId}
                onChange={(e) => setFoodId(e.target.value)}
              >
                <option value="">-- Choose Food --</option>
                {foods.map((food) => (
                  <option key={food.id} value={food.id}>
                    {food.name} ({food.serving_size} - {food.calories} kcal)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="servings">Servings Amount</Label>
              <Input
                id="servings"
                type="number"
                step="0.1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
            </div>

            <Button
              className="w-full mt-2"
              onClick={() => logMealMutation.mutate()}
              disabled={logMealMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" /> Log Food Item
            </Button>
          </CardContent>
        </Card>

        {/* Meal Logs summary */}
        <Card className="bg-white/[0.02] md:col-span-2">
          <CardHeader>
            <CardTitle>Logged Meals</CardTitle>
            <CardDescription>Detail consumption log breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="h-[340px] overflow-y-auto">
            {meals.length > 0 ? (
              <div className="space-y-4">
                {meals.map((meal: any) => (
                  <div key={meal.id} className="space-y-2">
                    <h4 className="capitalize text-sm font-bold text-violet-400 border-b border-white/[0.04] pb-1">
                      {meal.meal_type}
                    </h4>
                    <div className="grid gap-2">
                      {meal.items.map((item: any) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/[0.04] text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white">
                              {item.food?.name || "Unknown Food"}
                            </span>
                            <span className="text-white/40 ml-2">
                              x{item.servings} serving(s)
                            </span>
                          </div>
                          <div className="flex items-center gap-3 font-medium">
                            <span className="text-white/50">{item.calories} kcal</span>
                            <span className="text-pink-400">{item.protein}g Pro</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-white/30 gap-2">
                <UtensilsCrossed className="h-8 w-8 text-white/20" />
                <span className="text-sm">No meals logged for this date.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
