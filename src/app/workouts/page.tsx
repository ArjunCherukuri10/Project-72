"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dumbbell, Plus, Flame, Clock, Trash2, GripVertical, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AIWorkoutPlannerView from "@/components/ai-workout-planner-view";

interface ExerciseEntry {
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

export default function WorkoutsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState("push");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<ExerciseEntry[]>([
    { name: "", sets: "3", reps: "10", weight: "" }
  ]);

  const { data: workouts = [] } = useQuery({
    queryKey: ["workouts"],
    queryFn: trackerService.getWorkouts,
  });

  const addExercise = () => {
    setExercises([...exercises, { name: "", sets: "3", reps: "10", weight: "" }]);
  };

  const removeExercise = (idx: number) => {
    if (exercises.length <= 1) return;
    setExercises(exercises.filter((_, i) => i !== idx));
  };

  const updateExercise = (idx: number, field: keyof ExerciseEntry, value: string) => {
    const updated = [...exercises];
    updated[idx] = { ...updated[idx], [field]: value };
    setExercises(updated);
  };

  const logWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!name) throw new Error("Session name is required");
      const validExercises = exercises.filter((e) => e.name.trim());
      const exerciseSummary = validExercises
        .map((e) => `${e.name}: ${e.sets}×${e.reps}${e.weight ? ` @${e.weight}kg` : ""}`)
        .join(" | ");
      return trackerService.addWorkoutSession({
        name,
        type,
        date: new Date().toISOString().split("T")[0],
        duration_minutes: duration ? parseInt(duration) : null,
        notes: [exerciseSummary, notes].filter(Boolean).join("\n") || null,
        completed: true,
        template_id: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["dailySummaries"] });
      toast.success("Workout logged successfully!");
      setName("");
      setDuration("");
      setNotes("");
      setExercises([{ name: "", sets: "3", reps: "10", weight: "" }]);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log workout");
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Workout Tracker</h1>
        <p className="text-white/60">
          Log sessions with exercises, sets, reps, and weights.
        </p>
      </div>

      <Tabs defaultValue="tracker" className="space-y-6">
        <TabsList className="bg-white/[0.04] p-1 rounded-xl">
          <TabsTrigger value="tracker" className="text-xs rounded-lg">Workout Tracker</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs rounded-lg flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            AI Workout Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tracker" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Log Workout Form */}
            <Card className="bg-white/[0.02] md:col-span-1">
              <CardHeader>
                <CardTitle>Log Workout</CardTitle>
                <CardDescription>Add exercises with sets × reps × weight.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="wName">Session Name</Label>
                  <Input
                    id="wName"
                    placeholder="e.g. Upper Body Push"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="wType">Split</Label>
                    <select
                      id="wType"
                      className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-[#07070f] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="push">Push</option>
                      <option value="pull">Pull</option>
                      <option value="legs">Legs</option>
                      <option value="upper">Upper</option>
                      <option value="lower">Lower</option>
                      <option value="full_body">Full Body</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="wDuration">Duration (mins)</Label>
                    <Input
                      id="wDuration"
                      type="number"
                      placeholder="60"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                  </div>
                </div>

                {/* Exercise Builder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-white/50 uppercase">Exercises</Label>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-violet-400" onClick={addExercise}>
                      <Plus className="h-3 w-3 mr-1" /> Add Exercise
                    </Button>
                  </div>
                  {exercises.map((ex, idx) => (
                    <div key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-3.5 w-3.5 text-white/20 shrink-0" />
                        <Input
                          placeholder="Exercise name (e.g. Bench Press)"
                          value={ex.name}
                          onChange={(e) => updateExercise(idx, "name", e.target.value)}
                          className="flex-1 h-8 text-xs"
                        />
                        {exercises.length > 1 && (
                          <button onClick={() => removeExercise(idx)} className="p-1 text-red-400/50 hover:text-red-400">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-white/30 font-bold uppercase">Sets</span>
                          <Input
                            type="number"
                            value={ex.sets}
                            onChange={(e) => updateExercise(idx, "sets", e.target.value)}
                            className="h-8 text-xs text-center"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-white/30 font-bold uppercase">Reps</span>
                          <Input
                            type="number"
                            value={ex.reps}
                            onChange={(e) => updateExercise(idx, "reps", e.target.value)}
                            className="h-8 text-xs text-center"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-white/30 font-bold uppercase">Kg</span>
                          <Input
                            type="number"
                            placeholder="—"
                            value={ex.weight}
                            onChange={(e) => updateExercise(idx, "weight", e.target.value)}
                            className="h-8 text-xs text-center"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="wNotes">Notes (optional)</Label>
                  <Input
                    id="wNotes"
                    placeholder="Good pump, felt strong"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={() => logWorkoutMutation.mutate()}
                  disabled={logWorkoutMutation.isPending}
                >
                  <Plus className="h-4 w-4 mr-2" /> {logWorkoutMutation.isPending ? "Logging..." : "Log Workout"}
                </Button>
              </CardContent>
            </Card>

            {/* Workout History */}
            <Card className="bg-white/[0.02] md:col-span-2">
              <CardHeader>
                <CardTitle>Workout History</CardTitle>
                <CardDescription>View completed training sessions.</CardDescription>
              </CardHeader>
              <CardContent className="h-[500px] overflow-y-auto">
                {workouts.length > 0 ? (
                  <div className="grid gap-3">
                    {workouts.map((w) => (
                      <div
                        key={w.id}
                        className="p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-violet-500/30 transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-semibold text-white">{w.name}</h4>
                            <div className="flex gap-4 text-xs text-white/50">
                              <span className="flex items-center gap-1">
                                <Flame className="h-3.5 w-3.5 text-rose-500" />
                                <span className="capitalize">{w.type}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-blue-400" />
                                {w.duration_minutes || 60} mins
                              </span>
                              <span>{w.date}</span>
                            </div>
                          </div>
                        </div>
                        {w.notes && (
                          <div className="mt-2 p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                            {w.notes.split("\n").map((line, i) => (
                              <p key={i} className="text-xs text-white/50">
                                {line.includes("|") ? (
                                  <span className="flex flex-wrap gap-2">
                                    {line.split(" | ").map((ex, j) => (
                                      <span key={j} className="inline-flex items-center bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-lg text-[11px] font-mono">
                                        <Dumbbell className="h-3 w-3 mr-1 text-violet-400" />
                                        {ex}
                                      </span>
                                    ))}
                                  </span>
                                ) : (
                                  <span className="italic text-white/40">&quot;{line}&quot;</span>
                                )}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-white/30 gap-2">
                    <Dumbbell className="h-8 w-8 text-white/20" />
                    <span className="text-sm">No workout sessions logged. Ready to lift?</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <AIWorkoutPlannerView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
