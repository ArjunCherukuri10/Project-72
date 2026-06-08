"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Target, Plus } from "lucide-react";

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"weight" | "nutrition" | "workout" | "habit" | "health">("weight");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("kg");

  const { data: goals = [] } = useQuery({
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Goals Management</h1>
        <p className="text-white/60">
          Establish targeted parameters for weight, nutrition, workout counts, and healthy habits.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Entry Card */}
        <Card className="bg-white/[0.02]">
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
        <Card className="bg-white/[0.02] md:col-span-2">
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
