"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Dumbbell, Plus, Flame, Clock } from "lucide-react";

export default function WorkoutsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState("push");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [exercises, setExercises] = useState<{ name: string; sets: string; reps: string; weight: string }[]>([
    { name: "", sets: "3", reps: "10", weight: "20" }
  ]);

  const { data: workouts = [] } = useQuery({
    queryKey: ["workouts"],
    queryFn: trackerService.getWorkouts,
  });

  const logWorkoutMutation = useMutation({
    mutationFn: async () => {
      if (!name) throw new Error("Workout session name is required");
      return trackerService.addWorkoutSession({
        name,
        type,
        date: new Date().toISOString().split("T")[0],
        duration_minutes: duration ? parseInt(duration) : null,
        notes: notes || null,
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
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log workout session");
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Workout Tracker</h1>
        <p className="text-white/60">
          Plan, log, and track gym sessions, muscle group volume split, and template plans.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Log Workout Form */}
        <Card className="bg-white/[0.02]">
          <CardHeader>
            <CardTitle>Log Workout Session</CardTitle>
            <CardDescription>Record completed weight training.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="wName">Session Name</Label>
              <Input
                id="wName"
                placeholder="e.g. Upper Body Hypertrophy"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="wType">Workout Split</Label>
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
            <div className="space-y-1">
              <Label htmlFor="wNotes">Session Notes</Label>
              <Input
                id="wNotes"
                placeholder="Good connection, hit all targets"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button
              className="w-full mt-3"
              onClick={() => logWorkoutMutation.mutate()}
              disabled={logWorkoutMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" /> Log Session
            </Button>
          </CardContent>
        </Card>

        {/* Workout History */}
        <Card className="bg-white/[0.02] md:col-span-2">
          <CardHeader>
            <CardTitle>Workout History & Templates</CardTitle>
            <CardDescription>View completed weight training sessions.</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px] overflow-y-auto">
            {workouts.length > 0 ? (
              <div className="grid gap-3">
                {workouts.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-violet-500/30 transition-all duration-200"
                  >
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
                      {w.notes && (
                        <p className="text-xs text-white/40 italic mt-1">&quot;{w.notes}&quot;</p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg h-8">
                      View Details
                    </Button>
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
    </div>
  );
}
