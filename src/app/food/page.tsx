"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Star, Search, Sparkles } from "lucide-react";

/** Parse serving_size string to extract the gram weight for ratio calc */
function parseServingGrams(serving: string): number {
  const match = serving.match(/(\d+)\s*g/i);
  if (match) return parseInt(match[1]);
  if (serving.includes("egg")) return 50;
  if (serving.includes("scoop")) return 30;
  if (serving.includes("tbsp")) return 14;
  if (serving.includes("slice")) return 30;
  if (serving.includes("piece")) {
    const m = serving.match(/(\d+)\s*g/i);
    return m ? parseInt(m[1]) : 100;
  }
  return 100; // default per 100g
}

/** Check if a food is "countable" (eggs, roti, idli, bread slices, etc.) */
function isCountable(serving: string): boolean {
  return /per 1 (egg|piece|slice|scoop|white|tbsp)/i.test(serving);
}

export default function FoodDatabasePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("");

  const { data: foods = [] } = useQuery({
    queryKey: ["foodItems"],
    queryFn: trackerService.getFoodItems,
  });

  const favoriteMutation = useMutation({
    mutationFn: async (id: string) => { await trackerService.toggleFoodFavorite(id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["foodItems"] }); },
  });

  const filteredFoods = useMemo(() =>
    foods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())),
    [foods, search]
  );

  const selectedFood = foods.find((f) => f.id === selectedId);

  // Calculate macros based on quantity entered
  const calculated = useMemo(() => {
    if (!selectedFood || !quantity || parseFloat(quantity) <= 0) return null;
    const qty = parseFloat(quantity);
    const countable = isCountable(selectedFood.serving_size);

    if (countable) {
      // qty = number of items (e.g., 3 eggs)
      return {
        label: `${qty} × ${selectedFood.name}`,
        calories: Math.round(selectedFood.calories * qty),
        protein: Math.round(selectedFood.protein * qty * 10) / 10,
        carbs: Math.round(selectedFood.carbs * qty * 10) / 10,
        fat: Math.round(selectedFood.fat * qty * 10) / 10,
        fiber: Math.round(selectedFood.fiber * qty * 10) / 10,
      };
    } else {
      // qty = grams, base values are per serving_size grams
      const baseGrams = parseServingGrams(selectedFood.serving_size);
      const ratio = qty / baseGrams;
      return {
        label: `${qty}g of ${selectedFood.name}`,
        calories: Math.round(selectedFood.calories * ratio),
        protein: Math.round(selectedFood.protein * ratio * 10) / 10,
        carbs: Math.round(selectedFood.carbs * ratio * 10) / 10,
        fat: Math.round(selectedFood.fat * ratio * 10) / 10,
        fiber: Math.round(selectedFood.fiber * ratio * 10) / 10,
      };
    }
  }, [selectedFood, quantity]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Food Database</h1>
        <p className="text-white/60">
          Search a food, enter grams or count, and see instant macro calculations.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Calculator Card */}
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Nutrition Calculator</CardTitle>
            <CardDescription>Select any food from the list, enter quantity.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFood ? (
              <>
                <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                  <p className="font-semibold text-violet-400">{selectedFood.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{selectedFood.serving_size}</p>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="qty">
                    {isCountable(selectedFood.serving_size)
                      ? "How many? (count)"
                      : "How many grams?"}
                  </Label>
                  <Input
                    id="qty"
                    type="number"
                    step={isCountable(selectedFood.serving_size) ? "1" : "10"}
                    placeholder={isCountable(selectedFood.serving_size) ? "e.g. 3" : "e.g. 200"}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    autoFocus
                  />
                </div>
                {calculated && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                    <p className="text-xs font-bold text-white/60 uppercase">{calculated.label}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between"><span className="text-white/50">Calories</span><span className="font-bold text-amber-400">{calculated.calories} kcal</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Protein</span><span className="font-bold text-pink-400">{calculated.protein}g</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Carbs</span><span className="font-bold text-violet-400">{calculated.carbs}g</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Fat</span><span className="font-bold text-teal-400">{calculated.fat}g</span></div>
                      <div className="flex justify-between"><span className="text-white/50">Fiber</span><span className="font-bold text-emerald-400">{calculated.fiber}g</span></div>
                    </div>
                  </div>
                )}
                <Button variant="outline" className="w-full text-xs" onClick={() => { setSelectedId(null); setQuantity(""); }}>
                  Clear Selection
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-white/30 gap-2">
                <Sparkles className="h-8 w-8 text-white/15" />
                <p className="text-sm text-center">Select a food from the list to calculate nutrition.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Search & List */}
        <Card className="bg-white/[0.02] md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Foods List ({foods.length} items)</CardTitle>
              <CardDescription>Click any food to calculate its macros.</CardDescription>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/30" />
              <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
            </div>
          </CardHeader>
          <CardContent className="h-[420px] overflow-y-auto pr-2">
            <div className="grid gap-2">
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  onClick={() => { setSelectedId(food.id); setQuantity(""); }}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    selectedId === food.id
                      ? "border-violet-500/40 bg-violet-500/10"
                      : "border-white/[0.04] bg-white/[0.01] hover:border-violet-500/20"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{food.name}</span>
                      <span className="text-[10px] text-white/40 uppercase bg-white/[0.04] px-1.5 py-0.5 rounded">{food.serving_size}</span>
                    </div>
                    <div className="flex gap-3 text-xs text-white/50">
                      <span>{food.calories} kcal</span>
                      <span>P: <strong className="text-pink-400">{food.protein}g</strong></span>
                      <span>C: <strong className="text-amber-400">{food.carbs}g</strong></span>
                      <span>F: <strong className="text-teal-400">{food.fat}g</strong></span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); favoriteMutation.mutate(food.id); }} className="h-8 w-8 text-white/30 hover:text-amber-400 hover:bg-white/10">
                    <Star className={`h-4 w-4 ${food.is_favorite ? "fill-amber-400 text-amber-400" : ""}`} />
                  </Button>
                </div>
              ))}
              {filteredFoods.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center text-white/30 gap-2">
                  <Sparkles className="h-8 w-8 text-white/20" />
                  <span className="text-sm">No foods match your search.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
