"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { calculateMacroTargets } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, UtensilsCrossed, Calendar, Search, Trash2, Sparkles, Loader2 } from "lucide-react";
import type { Profile } from "@/types";

function parseServingGrams(serving: string): number {
  const m = serving.match(/(\d+)\s*g/i);
  if (m) return parseInt(m[1]);
  if (serving.includes("egg")) return 50;
  if (serving.includes("scoop")) return 30;
  if (serving.includes("tbsp")) return 14;
  if (serving.includes("slice")) return 30;
  return 100;
}
function isCountable(s: string): boolean { return /per 1 (egg|piece|slice|scoop|white|tbsp)/i.test(s); }

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

export default function NutritionPage() {
  const queryClient = useQueryClient();
  const [selectedMeal, setSelectedMeal] = useState<"breakfast"|"lunch"|"dinner"|"snacks">("breakfast");
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // AI state
  const [aiInput, setAiInput] = useState("");
  const [aiResults, setAiResults] = useState<AIFoodItem[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [mode, setMode] = useState<"manual" | "ai">("ai");

  const { data: foods = [] } = useQuery({ queryKey: ["foodItems"], queryFn: trackerService.getFoodItems });
  const { data: meals = [] } = useQuery({ queryKey: ["mealsToday", date], queryFn: () => trackerService.getNutritionLogsToday(date) });
  const { data: summary } = useQuery({ queryKey: ["dailySummary", date], queryFn: () => trackerService.getDailySummary(date) });

  const selectedFood = foods.find((f) => f.id === selectedFoodId);
  const filteredFoods = useMemo(() =>
    foodSearch ? foods.filter((f) => f.name.toLowerCase().includes(foodSearch.toLowerCase())) : foods,
    [foods, foodSearch]
  );

  // Auto-calculate macros
  const calculated = useMemo(() => {
    if (!selectedFood || !quantity || parseFloat(quantity) <= 0) return null;
    const qty = parseFloat(quantity);
    if (isCountable(selectedFood.serving_size)) {
      return { calories: Math.round(selectedFood.calories*qty), protein: Math.round(selectedFood.protein*qty*10)/10, carbs: Math.round(selectedFood.carbs*qty*10)/10, fat: Math.round(selectedFood.fat*qty*10)/10, fiber: Math.round(selectedFood.fiber*qty*10)/10 };
    }
    const base = parseServingGrams(selectedFood.serving_size);
    const ratio = qty / base;
    return { calories: Math.round(selectedFood.calories*ratio), protein: Math.round(selectedFood.protein*ratio*10)/10, carbs: Math.round(selectedFood.carbs*ratio*10)/10, fat: Math.round(selectedFood.fat*ratio*10)/10, fiber: Math.round(selectedFood.fiber*ratio*10)/10 };
  }, [selectedFood, quantity]);

  const logMealMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFood || !calculated) throw new Error("Select a food and enter quantity");
      return trackerService.addMealItem(date, selectedMeal, selectedFood.id, parseFloat(quantity));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealsToday", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Food logged!");
      setSelectedFoodId(""); setFoodSearch(""); setQuantity("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMealMutation = useMutation({
    mutationFn: async (itemId: string) => {
      trackerService.deleteMealItem(itemId, date);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealsToday", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Item removed");
    },
  });

  const { data: profile } = useQuery<Profile | null>({ queryKey: ["profile"], queryFn: trackerService.getProfile as any });

  // Dynamic TDEE-based targets from profile
  const tgt = useMemo(() => {
    const weight = profile?.starting_weight || 85;
    const height = profile?.height_cm || 175;
    const age = profile?.date_of_birth
      ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / 31557600000)
      : 25;
    const gender = (profile?.gender === "female" ? "female" : "male") as "male" | "female";
    const activity = profile?.activity_level || "moderate";
    return calculateMacroTargets(weight, height, age, gender, activity);
  }, [profile]);
  const cur = { cal: summary?.total_calories||0, pro: summary?.total_protein||0, carb: summary?.total_carbs||0, fat: summary?.total_fat||0, fib: summary?.total_fiber||0 };

  // AI food search
  const handleAISearch = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiResults([]);
    try {
      const res = await fetch("/api/ai-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aiInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "AI request failed");

      const parsed = (data.items || []).map((item: any) => {
        const qtyStr = String(item.quantity || "1 serving");
        const match = qtyStr.match(/^(\d+(?:\.\d+)?)/);
        const baseValue = match ? parseFloat(match[1]) : 1;
        const unit = qtyStr.replace(/^[\d\s.]+/, "").trim() || "serving";
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

  // Log a single AI result item
  const logAIItem = async (item: AIFoodItem) => {
    try {
      const ratio = item.baseValue > 0 ? item.currentValue / item.baseValue : 1;
      const cal = Math.round(item.calories * ratio);
      const pro = Math.round(item.protein * ratio * 10) / 10;
      const carb = Math.round(item.carbs * ratio * 10) / 10;
      const fat = Math.round(item.fat * ratio * 10) / 10;
      const fib = Math.round(item.fiber * ratio * 10) / 10;

      trackerService.addMealItem(date, selectedMeal, `ai-${Date.now()}`, 1, {
        calories: cal,
        protein: pro,
        carbs: carb,
        fat: fat,
        fiber: fib,
        food: { name: `${item.name} (${item.currentValue} ${item.unit})` },
      });
      queryClient.invalidateQueries({ queryKey: ["mealsToday", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", date] });
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">Nutrition Tracker</h1><p className="text-white/60">Describe what you ate or search the database.</p></div>
        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-violet-400"/><Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="w-40"/></div>
      </div>

      {/* Macro Progress Bars */}
      <div className="grid gap-3 sm:grid-cols-5">
        {([["Calories","cal","amber"] as const,["Protein","pro","pink"] as const,["Carbs","carb","violet"] as const,["Fat","fat","teal"] as const,["Fiber","fib","emerald"] as const]).map(([label,key,color])=>(
          <Card key={key} className="bg-white/[0.02]">
            <CardContent className="p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase text-white/40">{label}</p>
              <p className={`text-lg font-bold text-${color}-400`}>{cur[key]} / {tgt[key]}{key==="cal"?" kcal":"g"}</p>
              <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden"><div className={`h-full bg-${color}-500 rounded-full`} style={{width:`${Math.min(100,(cur[key]/tgt[key])*100)}%`}}/></div>
            </CardContent>
          </Card>
        ))}
      </div>

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
              <div className="grid grid-cols-2 gap-2">
                {(["breakfast","lunch","dinner","snacks"] as const).map((m)=>(<Button key={m} variant={selectedMeal===m?"default":"outline"} className="capitalize text-xs rounded-xl h-9" onClick={()=>setSelectedMeal(m)}>{m}</Button>))}
              </div>
            </div>

            {mode === "ai" ? (
              <>
                {/* AI Natural Language Input */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                    Describe what you ate
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder='e.g. "soya chunks with curd and rice"'
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
                    {aiLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Analyze with Gemini AI</>
                    )}
                  </Button>
                </div>

                {/* AI Results */}
                {aiResults.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-white/50 uppercase">Detected Items</Label>
                      <span className="text-[10px] text-violet-400 font-mono">powered by Gemini</span>
                    </div>
                    {aiResults.map((item, idx) => {
                      const ratio = item.baseValue > 0 ? item.currentValue / item.baseValue : 1;
                      const cal = Math.round(item.calories * ratio);
                      const pro = Math.round(item.protein * ratio * 10) / 10;
                      const carb = Math.round(item.carbs * ratio * 10) / 10;
                      const fat = Math.round(item.fat * ratio * 10) / 10;
                      const fib = Math.round(item.fiber * ratio * 10) / 10;

                      return (
                        <div key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-3 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <span className="font-semibold text-white text-sm block">{item.name}</span>
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[10px] text-white/40">Amount:</span>
                                <Input
                                  type="number"
                                  value={item.currentValue}
                                  onChange={(e) => updateAIItemValue(idx, parseFloat(e.target.value) || 0)}
                                  className="w-16 h-7 text-xs px-1 text-center"
                                />
                                <span className="text-[10px] text-violet-400 font-medium">{item.unit}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-violet-400"
                              onClick={() => logAIItem(item)}
                            >
                              <Plus className="h-3 w-3 mr-1" /> Log
                            </Button>
                          </div>
                          <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                            <span className="p-1 rounded bg-amber-500/10 text-amber-400"><strong>{cal}</strong> kcal</span>
                            <span className="p-1 rounded bg-pink-500/10 text-pink-400"><strong>{pro}g</strong> P</span>
                            <span className="p-1 rounded bg-violet-500/10 text-violet-400"><strong>{carb}g</strong> C</span>
                            <span className="p-1 rounded bg-teal-500/10 text-teal-400"><strong>{fat}g</strong> F</span>
                            <span className="p-1 rounded bg-emerald-500/10 text-emerald-400"><strong>{fib}g</strong> Fb</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Total summary + Log All */}
                    <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="space-x-3">
                          <span className="text-amber-400 font-bold">
                            {aiResults.reduce((s, item) => {
                              const r = item.baseValue > 0 ? item.currentValue / item.baseValue : 1;
                              return s + Math.round(item.calories * r);
                            }, 0)} kcal
                          </span>
                          <span className="text-pink-400 font-bold">
                            {aiResults.reduce((s, item) => {
                              const r = item.baseValue > 0 ? item.currentValue / item.baseValue : 1;
                              return s + Math.round(item.protein * r * 10) / 10;
                            }, 0).toFixed(1)}g P
                          </span>
                          <span className="text-violet-400 font-bold">
                            {aiResults.reduce((s, item) => {
                              const r = item.baseValue > 0 ? item.currentValue / item.baseValue : 1;
                              return s + Math.round(item.carbs * r * 10) / 10;
                            }, 0).toFixed(1)}g C
                          </span>
                          <span className="text-teal-400 font-bold">
                            {aiResults.reduce((s, item) => {
                              const r = item.baseValue > 0 ? item.currentValue / item.baseValue : 1;
                              return s + Math.round(item.fat * r * 10) / 10;
                            }, 0).toFixed(1)}g F
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={logAllAIItems}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Log All {aiResults.length} Items to {selectedMeal}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Manual Food Search */}
                <div className="space-y-1">
                  <Label>Search Food</Label>
                  <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/30"/><Input placeholder="Type food name..." value={foodSearch} onChange={(e)=>{setFoodSearch(e.target.value);setSelectedFoodId("");}} className="pl-8"/></div>
                  {foodSearch && !selectedFoodId && (
                    <div className="max-h-40 overflow-y-auto rounded-xl border border-white/[0.06] bg-[#0a0a15] mt-1">
                      {filteredFoods.slice(0,8).map((f)=>(
                        <button key={f.id} onClick={()=>{setSelectedFoodId(f.id);setFoodSearch(f.name);}} className="w-full text-left px-3 py-2 text-sm hover:bg-violet-500/10 border-b border-white/[0.04] last:border-0">
                          <span className="font-semibold">{f.name}</span><span className="text-white/40 ml-2 text-xs">{f.serving_size} · {f.calories} kcal</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedFood && (
                  <>
                    <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs">
                      <span className="font-bold text-violet-400">{selectedFood.name}</span> — {selectedFood.serving_size}
                    </div>
                    <div className="space-y-1">
                      <Label>{isCountable(selectedFood.serving_size) ? "How many?" : "Grams"}</Label>
                      <Input type="number" placeholder={isCountable(selectedFood.serving_size)?"e.g. 3":"e.g. 200"} value={quantity} onChange={(e)=>setQuantity(e.target.value)} autoFocus/>
                    </div>
                    {calculated && (
                      <div className="text-xs grid grid-cols-3 gap-1 text-center">
                        <span className="p-1 rounded bg-white/[0.03]"><strong className="text-amber-400">{calculated.calories}</strong> kcal</span>
                        <span className="p-1 rounded bg-white/[0.03]"><strong className="text-pink-400">{calculated.protein}g</strong> pro</span>
                        <span className="p-1 rounded bg-white/[0.03]"><strong className="text-teal-400">{calculated.fat}g</strong> fat</span>
                      </div>
                    )}
                    <Button className="w-full" onClick={()=>logMealMutation.mutate()} disabled={logMealMutation.isPending || !calculated}>
                      <Plus className="h-4 w-4 mr-2"/> {logMealMutation.isPending ? "Logging..." : "Log Food"}
                    </Button>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Logged Meals */}
        <Card className="bg-white/[0.02] md:col-span-2">
          <CardHeader><CardTitle>Today&apos;s Meals</CardTitle><CardDescription>Logged food intake breakdown.</CardDescription></CardHeader>
          <CardContent className="h-[460px] overflow-y-auto">
            {meals.length > 0 ? (
              <div className="space-y-4">
                {meals.map((meal:any)=>(
                  <div key={meal.id} className="space-y-2">
                    <h4 className="capitalize text-sm font-bold text-violet-400 border-b border-white/[0.04] pb-1">{meal.meal_type}</h4>
                    {meal.items.map((item:any)=>(
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/[0.04] text-xs group">
                        <div><span className="font-semibold text-white">{item.food?.name||"Food"}</span><span className="text-white/40 ml-2">×{item.servings}</span></div>
                        <div className="flex items-center gap-2">
                          <span className="text-white/50">{item.calories} kcal</span>
                          <span className="text-pink-400">{item.protein}g P</span>
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
              <div className="flex h-full flex-col items-center justify-center text-white/30 gap-2"><UtensilsCrossed className="h-8 w-8 text-white/20"/><span className="text-sm">No meals logged for this date.</span></div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
