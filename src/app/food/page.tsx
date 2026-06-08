"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Star, Plus, Search, Sparkles } from "lucide-react";

export default function FoodDatabasePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [servingSize, setServingSize] = useState("100g");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");

  const { data: foods = [] } = useQuery({
    queryKey: ["foodItems"],
    queryFn: trackerService.getFoodItems,
  });

  const addFoodMutation = useMutation({
    mutationFn: async () => {
      if (!name || !servingSize || !calories) {
        throw new Error("Name, serving size, and calories are required");
      }
      return trackerService.addFoodItem({
        name,
        serving_size: servingSize,
        calories: parseInt(calories),
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
        fiber: parseInt(fiber) || 0,
        sugar: 0,
        sodium: 0,
        category: "Protein",
        is_favorite: false,
        notes: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodItems"] });
      toast.success("Food item added!");
      setName("");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setFiber("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add food");
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async (id: string) => {
      trackerService.toggleFoodFavorite(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["foodItems"] });
    },
  });

  const filteredFoods = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Food Database</h1>
        <p className="text-white/60">
          Manage your custom foods database to log exact metrics accurately.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Create Food Form */}
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Create Custom Food</CardTitle>
            <CardDescription>Add new food definition with macronutrients.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="foodName">Food Name</Label>
              <Input
                id="foodName"
                placeholder="e.g. Avocado"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="servingSize">Serving Size</Label>
                <Input
                  id="servingSize"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="calories">Calories (kcal)</Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1">
              <div className="space-y-1">
                <Label htmlFor="protein" className="text-[10px] uppercase font-bold text-center">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="carbs" className="text-[10px] uppercase font-bold text-center">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fat" className="text-[10px] uppercase font-bold text-center">Fat (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fiber" className="text-[10px] uppercase font-bold text-center">Fiber (g)</Label>
                <Input
                  id="fiber"
                  type="number"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full mt-3"
              onClick={() => addFoodMutation.mutate()}
              disabled={addFoodMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" /> Add Food
            </Button>
          </CardContent>
        </Card>

        {/* Database Search & List */}
        <Card className="bg-white/[0.02] md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-1">
              <CardTitle>Foods List</CardTitle>
              <CardDescription>Select, favorite, or search available foods.</CardDescription>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-white/30" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="h-[380px] overflow-y-auto pr-2">
            <div className="grid gap-2">
              {filteredFoods.map((food) => (
                <div
                  key={food.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-violet-500/30 transition-all duration-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{food.name}</span>
                      <span className="text-[10px] text-white/40 uppercase bg-white/[0.04] px-1.5 py-0.5 rounded">
                        {food.serving_size}
                      </span>
                    </div>
                    <div className="flex gap-3 text-xs text-white/50">
                      <span>{food.calories} kcal</span>
                      <span>P: <strong className="text-pink-400">{food.protein}g</strong></span>
                      <span>C: <strong className="text-amber-400">{food.carbs}g</strong></span>
                      <span>F: <strong className="text-teal-400">{food.fat}g</strong></span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => favoriteMutation.mutate(food.id)}
                    className="h-8 w-8 text-white/30 hover:text-amber-400 hover:bg-white/10"
                  >
                    <Star
                      className={`h-4 w-4 ${food.is_favorite ? "fill-amber-400 text-amber-400" : ""}`}
                    />
                  </Button>
                </div>
              ))}
              {filteredFoods.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center text-white/30 gap-2">
                  <Sparkles className="h-8 w-8 text-white/20" />
                  <span className="text-sm">No food items match your query.</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
