"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, UtensilsCrossed, Calendar, Search, Trash2, Sparkles, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIMealPlannerView from "@/components/ai-meal-planner-view";
import { useAppStore } from "@/stores/app-store";
import { Progress } from "@/components/ui/progress";

interface AIFoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  baseValue: number;
  unit: string;
  currentValue: number;
}

function parseServingGrams(serving: string): number {
  const m = serving.match(/(\d+)\s*g/i);
  if (m) return parseInt(m[1]);
  if (serving.includes("egg")) return 50;
  if (serving.includes("scoop")) return 30;
  if (serving.includes("tbsp")) return 14;
  if (serving.includes("slice")) return 30;
  return 100;
}

function isCountable(s: string): boolean {
  return /per 1 (egg|piece|slice|scoop|white|tbsp)/i.test(s);
}

export default function NutritionPage() {
  const queryClient = useQueryClient();
  const { selectedDate: date, setSelectedDate: setDate } = useAppStore();
  const [selectedMeal, setSelectedMeal] = useState<"breakfast" | "lunch" | "dinner" | "snacks">("breakfast");

  // Mode: "ai" or "manual"
  const [mode, setMode] = useState<"ai" | "manual">("ai");

  // AI search state
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AIFoodItem[]>([]);

  // Manual search state
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [quantity, setQuantity] = useState("100");

  // Queries
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: trackerService.getProfile,
  });

  const { data: targets } = useQuery({
    queryKey: ["nutritionTargets"],
    queryFn: trackerService.getNutritionTargets,
  });

  const { data: meals = [] } = useQuery({
    queryKey: ["mealsToday", date],
    queryFn: () => trackerService.getMealLogs(date),
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ["foodSearch", search],
    queryFn: () => (search.length > 1 ? trackerService.searchFoods(search) : []),
    enabled: search.length > 1,
  });

  // Target values
  const tgt = useMemo(() => {
    return {
      cal: targets?.calories || 2000,
      pro: targets?.protein || 130,
      carb: targets?.carbs || 220,
      fat: targets?.fat || 65,
      fib: targets?.fiber || 30,
    };
  }, [targets]);

  // Current values logged today
  const cur = useMemo(() => {
    let cal = 0, pro = 0, carb = 0, fat = 0, fib = 0;
    meals.forEach((m: any) => {
      m.items.forEach((item: any) => {
        cal += item.calories || 0;
        pro += item.protein || 0;
        carb += item.carbs || 0;
        fat += item.fat || 0;
        fib += item.fiber || 0;
      });
    });
    return { cal, pro, carb, fat, fib };
  }, [meals]);

  // Manual Log calculations
  const calculated = useMemo(() => {
    if (!selectedFood) return null;
    const baseGrams = parseServingGrams(selectedFood.serving_size);
    const countMode = isCountable(selectedFood.serving_size);
    const inputVal = parseFloat(quantity) || 0;

    let ratio = 1;
    if (countMode) {
      ratio = inputVal;
    } else {
      ratio = inputVal / 100; // base is 100g in DB
    }

    return {
      calories: Math.round(selectedFood.calories * ratio),
      protein: Math.round(selectedFood.protein * ratio * 10) / 10,
      carbs: Math.round(selectedFood.carbs * ratio * 10) / 10,
      fat: Math.round(selectedFood.fat * ratio * 10) / 10,
      fiber: Math.round(selectedFood.fiber * ratio * 10) / 10,
    };
  }, [selectedFood, quantity]);

  // AI food analysis
  const handleAISearch = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    try {
      const response = await fetch("/api/ai-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiInput }),
      });

      if (!response.ok) {
        throw new Error("Failed to reach AI");
      }

      const resData = await response.json();
      const items = Array.isArray(resData) ? resData : (resData?.items || []);
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("No food items detected by AI. Try describing the meal in detail.");
      }

      const parsed: AIFoodItem[] = items.map((item: any) => {
        const qtyStr = String(item.quantity || "100g");
        const match = qtyStr.match(/^(\d+(?:\.\d+)?)/);
        const baseValue = match ? parseFloat(match[1]) : 100;
        const unit = qtyStr.replace(/^[\d\s.]+/, "").trim() || "g";
        return {
          ...item,
          baseValue,
          unit,
          currentValue: baseValue,
        };
      });

      setAiResults(parsed);
    } catch (err: any) {
      toast.error(err.message || "Failed to analyze food");
    } finally {
      setAiLoading(false);
    }
  };

  const updateAIItemValue = (index: number, val: number) => {
    setAiResults((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, currentValue: val } : item))
    );
  };

  // Log single AI item
  const logAIItem = async (item: AIFoodItem) => {
    try {
      const ratio = item.baseValue > 0 ? item.currentValue / item.baseValue : 1;
      const cal = Math.round(item.calories * ratio);
      const pro = Math.round(item.protein * ratio * 10) / 10;
      const carb = Math.round(item.carbs * ratio * 10) / 10;
      const fat = Math.round(item.fat * ratio * 10) / 10;
      const fib = Math.round(item.fiber * ratio * 10) / 10;
      const roundedVal = Math.round(item.currentValue * 10) / 10;

      await trackerService.addMealItem(date, selectedMeal, `ai-${Date.now()}`, 1, {
        calories: cal,
        protein: pro,
        carbs: carb,
        fat: fat,
        fiber: fib,
        food: { name: `${item.name} (${roundedVal} ${item.unit})` },
      });
      queryClient.invalidateQueries({ queryKey: ["mealsToday", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success(`Logged: ${item.name}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Log all AI items at once
  const logAllAIItems = async () => {
    for (const item of aiResults) {
      await logAIItem(item);
    }
    setAiResults([]);
    setAiInput("");
    toast.success("All items logged!");
  };

  // Mutations
  const logMealMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFood || !calculated) return;
      const countMode = isCountable(selectedFood.serving_size);
      const servings = parseFloat(quantity) || 1;

      return trackerService.addMealItem(date, selectedMeal, selectedFood.id, servings, {
        calories: calculated.calories,
        protein: calculated.protein,
        carbs: calculated.carbs,
        fat: calculated.fat,
        fiber: calculated.fiber,
        food: selectedFood,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealsToday", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Food logged successfully!");
      setSelectedFood(null);
      setSearch("");
      setQuantity("100");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log food");
    },
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (itemId: string) => {
      return trackerService.deleteMealLogItem(itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealsToday", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Item removed");
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nutrition Tracker</h1>
          <p className="text-white/60">Describe what you ate or search the database.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-violet-400" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
        </div>
      </div>

      {/* Macro Progress Bars */}
      <div className="grid gap-3 sm:grid-cols-5">
        {([
          ["Calories", "cal", "amber"] as const,
          ["Protein", "pro", "pink"] as const,
          ["Carbs", "carb", "violet"] as const,
          ["Fat", "fat", "teal"] as const,
          ["Fiber", "fib", "emerald"] as const,
        ] as const).map(([label, key, color]) => (
          <Card key={key} className="bg-white/[0.02]">
            <CardContent className="p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase text-white/40">{label}</p>
              <p className={`text-lg font-bold ${
                color === "amber" ? "text-amber-400" :
                color === "pink" ? "text-pink-400" :
                color === "violet" ? "text-violet-400" :
                color === "teal" ? "text-teal-400" :
                "text-emerald-400"
              }`}>
                {key === "cal" ? Math.round(cur[key]) : Math.round(cur[key] * 10) / 10} / {tgt[key]}
                {key === "cal" ? " kcal" : "g"}
              </p>
              <Progress
                value={Math.min(100, (cur[key] / tgt[key]) * 100)}
                className="h-1.5 bg-white/[0.04]"
                indicatorClassName={
                  color === "amber" ? "bg-amber-500" :
                  color === "pink" ? "bg-pink-500" :
                  color === "violet" ? "bg-violet-500" :
                  color === "teal" ? "bg-teal-500" :
                  "bg-emerald-500"
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="tracker" className="space-y-6">
        <TabsList className="bg-white/[0.04] p-1 rounded-xl">
          <TabsTrigger value="tracker" className="text-xs rounded-lg font-medium">Nutrition Log</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs rounded-lg flex items-center gap-1 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            AI Meal Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Log Meal Card */}
            <Card className="bg-white/[0.02]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Log Food
                  <div className="flex gap-1">
                    <Button
                      variant={mode === "ai" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs rounded-lg"
                      onClick={() => setMode("ai")}
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> AI
                    </Button>
                    <Button
                      variant={mode === "manual" ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs rounded-lg"
                      onClick={() => setMode("manual")}
                    >
                      <Search className="h-3 w-3 mr-1" /> Manual
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {mode === "ai" ? "Describe what you ate in plain language" : "Search → quantity → log"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Meal</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["breakfast", "lunch", "dinner", "snacks"] as const).map((m) => (
                      <Button
                        key={m}
                        variant={selectedMeal === m ? "default" : "outline"}
                        className="capitalize text-xs rounded-xl h-8 px-1"
                        onClick={() => setSelectedMeal(m)}
                      >
                        {m}
                      </Button>
                    ))}
                  </div>
                </div>

                {mode === "ai" ? (
                  <>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 text-xs text-white/70">
                        <Sparkles className="h-3.5 w-3.5 text-violet-400 animate-pulse" />
                        What did you eat?
                      </Label>
                      <div className="relative">
                        <Input
                          placeholder='e.g. "curd and rice with soya chunks"'
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
                          className="pr-10"
                        />
                        {aiLoading && (
                          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-violet-400" />
                        )}
                      </div>
                      <Button
                        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
                        onClick={handleAISearch}
                        disabled={aiLoading || !aiInput.trim()}
                      >
                        {aiLoading ? "Analyzing..." : "Analyze food"}
                      </Button>
                    </div>

                    {aiResults.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                        <div className="flex flex-col gap-1">
                          <Label className="text-xs text-violet-400 font-bold uppercase flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Detected Items
                          </Label>
                          <span className="text-[10px] text-white/40">Adjust the grams/quantity for each item below before saving:</span>
                        </div>
                        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                          {aiResults.map((item, idx) => {
                            const ratio = item.baseValue > 0 ? item.currentValue / item.baseValue : 1;
                            const currentCals = Math.round(item.calories * ratio);
                            const currentPro = Math.round(item.protein * ratio * 10) / 10;

                            return (
                              <div key={idx} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-3 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-white">{item.name}</span>
                                  <span className="text-[10px] text-white/40 font-mono">Base: {item.quantity}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 items-center">
                                  <div className="flex items-center gap-1.5 bg-[#0a0a14] border border-white/[0.06] rounded-lg px-2 py-1">
                                    <Input
                                      type="number"
                                      value={item.currentValue}
                                      onChange={(e) => updateAIItemValue(idx, parseFloat(e.target.value) || 0)}
                                      className="h-6 w-12 text-xs border-0 bg-transparent p-0 text-center font-bold focus-visible:ring-0 text-white"
                                    />
                                    <span className="text-[10px] text-white/40 font-mono truncate">{item.unit}</span>
                                  </div>
                                  <div className="text-right text-[11px]">
                                    <span className="text-amber-400 font-bold block">{currentCals} kcal</span>
                                    <span className="text-pink-400 font-bold block mt-0.5">{currentPro}g Protein</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <Button
                          variant="secondary"
                          className="w-full bg-violet-600/10 border border-violet-500/20 text-violet-300 hover:bg-violet-600/20 text-xs"
                          onClick={logAllAIItems}
                        >
                          Log All ({aiResults.length} items)
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="foodSearch">Search Database</Label>
                      <Input id="foodSearch" placeholder="Search foods..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    {searchResults.length > 0 && (
                      <div className="border border-white/[0.06] bg-[#07070f] rounded-xl max-h-40 overflow-y-auto p-1 divide-y divide-white/[0.04]">
                        {searchResults.map((f: any) => (
                          <button
                            key={f.id}
                            className="w-full text-left px-3 py-2 text-xs text-white/80 hover:bg-white/[0.04] transition-all flex items-center justify-between"
                            onClick={() => setSelectedFood(f)}
                          >
                            <span>{f.name}</span>
                            <span className="text-[10px] text-white/40 font-mono">{f.serving_size}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {selectedFood && (
                      <>
                        <div className="p-3 rounded-xl border border-white/[0.06] bg-white/[0.01] space-y-1 text-xs">
                          <span className="font-bold text-white block">{selectedFood.name}</span>
                          <span className="text-white/40 block">Serving base: {selectedFood.serving_size}</span>
                        </div>
                        <div className="space-y-1">
                          <Label>{isCountable(selectedFood.serving_size) ? "How many?" : "Grams"}</Label>
                          <Input type="number" placeholder={isCountable(selectedFood.serving_size) ? "e.g. 3" : "e.g. 200"} value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus />
                        </div>
                        {calculated && (
                          <div className="text-xs grid grid-cols-3 gap-1 text-center">
                            <span className="p-1 rounded bg-white/[0.03]"><strong className="text-amber-400">{calculated.calories}</strong> kcal</span>
                            <span className="p-1 rounded bg-white/[0.03]"><strong className="text-pink-400">{calculated.protein}g</strong> pro</span>
                            <span className="p-1 rounded bg-white/[0.03]"><strong className="text-teal-400">{calculated.fat}g</strong> fat</span>
                          </div>
                        )}
                        <Button className="w-full" onClick={() => logMealMutation.mutate()} disabled={logMealMutation.isPending || !calculated}>
                          <Plus className="h-4 w-4 mr-2" /> {logMealMutation.isPending ? "Logging..." : "Log Food"}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Logged Meals */}
            <Card className="bg-white/[0.02] md:col-span-2">
              <CardHeader>
                <CardTitle>Today&apos;s Meals</CardTitle>
                <CardDescription>Logged food intake breakdown.</CardDescription>
              </CardHeader>
              <CardContent className="h-[460px] overflow-y-auto">
                {meals.length > 0 ? (
                  <div className="space-y-4">
                    {meals.map((meal: any) => (
                      <div key={meal.id} className="space-y-2">
                        <h4 className="capitalize text-sm font-bold text-violet-400 border-b border-white/[0.04] pb-1">{meal.meal_type}</h4>
                        {meal.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/[0.04] text-xs group">
                            <div>
                              <span className="font-semibold text-white">{item.food?.name || "Food"}</span>
                              <span className="text-white/40 ml-2">
                                {isCountable(item.food?.serving_size || "") 
                                  ? `×${Math.round(item.servings * 100) / 100}` 
                                  : (item.food?.serving_size === "1 serving" || item.food?.name?.includes("("))
                                    ? (item.servings === 1 ? null : `×${Math.round(item.servings * 100) / 100}`)
                                    : `${Math.round(item.servings * 10) / 10}g`
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white/50">{Math.round(item.calories || 0)} kcal</span>
                              <span className="text-pink-400">{Math.round((item.protein || 0) * 10) / 10}g P</span>
                              <button
                                onClick={() => deleteMealMutation.mutate(item.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition-all"
                                title="Remove item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
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
        </TabsContent>

        <TabsContent value="ai">
          <AIMealPlannerView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
