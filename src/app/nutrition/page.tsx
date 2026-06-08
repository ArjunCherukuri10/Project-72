"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, UtensilsCrossed, Calendar, Search } from "lucide-react";

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

export default function NutritionPage() {
  const queryClient = useQueryClient();
  const [selectedMeal, setSelectedMeal] = useState<"breakfast"|"lunch"|"dinner"|"snacks">("breakfast");
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

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
    const ratio = qty / parseServingGrams(selectedFood.serving_size);
    return { calories: Math.round(selectedFood.calories*ratio), protein: Math.round(selectedFood.protein*ratio*10)/10, carbs: Math.round(selectedFood.carbs*ratio*10)/10, fat: Math.round(selectedFood.fat*ratio*10)/10, fiber: Math.round(selectedFood.fiber*ratio*10)/10 };
  }, [selectedFood, quantity]);

  const logMealMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFoodId || !quantity) throw new Error("Select food and enter quantity");
      const qty = parseFloat(quantity);
      const countable = selectedFood ? isCountable(selectedFood.serving_size) : false;
      const servings = countable ? qty : qty / parseServingGrams(selectedFood?.serving_size || "100g");
      return trackerService.addMealItem(date, selectedMeal, selectedFoodId, servings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mealsToday", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummary", date] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Food logged!");
      setQuantity(""); setSelectedFoodId(""); setFoodSearch("");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const tgt = { cal: 1800, pro: 150, carb: 180, fat: 60, fib: 30 };
  const cur = { cal: summary?.total_calories||0, pro: summary?.total_protein||0, carb: summary?.total_carbs||0, fat: summary?.total_fat||0, fib: summary?.total_fiber||0 };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight">Nutrition Tracker</h1><p className="text-white/60">Search food → enter grams/count → log it.</p></div>
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
          <CardHeader><CardTitle>Log Food</CardTitle><CardDescription>Search → quantity → log</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Meal</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["breakfast","lunch","dinner","snacks"] as const).map((m)=>(<Button key={m} variant={selectedMeal===m?"default":"outline"} className="capitalize text-xs rounded-xl h-9" onClick={()=>setSelectedMeal(m)}>{m}</Button>))}
              </div>
            </div>

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
          </CardContent>
        </Card>

        {/* Logged Meals */}
        <Card className="bg-white/[0.02] md:col-span-2">
          <CardHeader><CardTitle>Today&apos;s Meals</CardTitle><CardDescription>Logged food intake breakdown.</CardDescription></CardHeader>
          <CardContent className="h-[360px] overflow-y-auto">
            {meals.length > 0 ? (
              <div className="space-y-4">
                {meals.map((meal:any)=>(
                  <div key={meal.id} className="space-y-2">
                    <h4 className="capitalize text-sm font-bold text-violet-400 border-b border-white/[0.04] pb-1">{meal.meal_type}</h4>
                    {meal.items.map((item:any)=>(
                      <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/[0.04] text-xs">
                        <div><span className="font-semibold text-white">{item.food?.name||"Food"}</span><span className="text-white/40 ml-2">×{item.servings}</span></div>
                        <div className="flex gap-3 font-medium"><span className="text-white/50">{item.calories} kcal</span><span className="text-pink-400">{item.protein}g P</span></div>
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
