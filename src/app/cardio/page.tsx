"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trackerService } from "@/lib/services";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { HeartPulse, Plus, Clock, Edit2, Trash2, X } from "lucide-react";

export default function CardioPage() {
  const queryClient = useQueryClient();
  const [type, setType] = useState("running");
  const [duration, setDuration] = useState("");
  const [distance, setDistance] = useState("");
  const [calories, setCalories] = useState("");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState("running");
  const [editDuration, setEditDuration] = useState("");
  const [editDistance, setEditDistance] = useState("");
  const [editCalories, setEditCalories] = useState("");

  const { data: cardio = [] } = useQuery({
    queryKey: ["cardioSessions"],
    queryFn: trackerService.getCardioSessions,
  });

  const logCardioMutation = useMutation({
    mutationFn: async () => {
      if (!duration) throw new Error("Duration is required");
      return trackerService.addCardioSession({
        date: new Date().toISOString().split("T")[0],
        type,
        duration_minutes: parseInt(duration),
        distance_km: distance ? parseFloat(distance) : null,
        calories_burned: calories ? parseInt(calories) : null,
        avg_pace: null,
        notes: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardioSessions"] });
      toast.success("Cardio activity logged successfully!");
      setDuration("");
      setDistance("");
      setCalories("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to log activity");
    },
  });

  const editCardioMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      if (!editDuration) throw new Error("Duration is required");
      return trackerService.updateCardioSession(editingId, {
        type: editType,
        duration_minutes: parseInt(editDuration),
        distance_km: editDistance ? parseFloat(editDistance) : null,
        calories_burned: editCalories ? parseInt(editCalories) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardioSessions"] });
      toast.success("Cardio activity updated successfully!");
      setIsEditModalOpen(false);
      setEditingId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update activity");
    },
  });

  const deleteCardioMutation = useMutation({
    mutationFn: async (id: string) => {
      return trackerService.deleteCardioSession(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cardioSessions"] });
      toast.success("Cardio session deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete cardio session");
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Cardio Tracker</h1>
        <p className="text-white/60">
          Monitor calorie expenditure and log steady state or HIIT cardio sessions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Entry Card */}
        <Card className="bg-[#161b22] border-white/[0.06] text-white">
          <CardHeader>
            <CardTitle>Log Cardio Workout</CardTitle>
            <CardDescription className="text-white/40">Record running, walking, cycling, etc.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cType">Activity Type</Label>
              <select
                id="cType"
                className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="walking">Walking</option>
                <option value="running">Running</option>
                <option value="cycling">Cycling</option>
                <option value="treadmill">Treadmill</option>
                <option value="stair_climber">Stair Climber</option>
                <option value="swimming">Swimming</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cDuration">Duration (minutes)</Label>
              <Input
                id="cDuration"
                type="number"
                placeholder="e.g. 45"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cDistance">Distance (km)</Label>
              <Input
                id="cDistance"
                type="number"
                step="0.1"
                placeholder="e.g. 5.2"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cCalories">Calories Burned (kcal)</Label>
              <Input
                id="cCalories"
                type="number"
                placeholder="e.g. 350"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                className="bg-zinc-900 border-white/10"
              />
            </div>
            <Button
              className="w-full mt-3 bg-teal-500 text-slate-900 hover:bg-teal-400 font-semibold"
              onClick={() => logCardioMutation.mutate()}
              disabled={logCardioMutation.isPending}
            >
              <Plus className="h-4 w-4 mr-2" /> Log Activity
            </Button>
          </CardContent>
        </Card>

        {/* History Grid */}
        <Card className="bg-[#161b22] border-white/[0.06] text-white md:col-span-2">
          <CardHeader>
            <CardTitle>Cardio History</CardTitle>
            <CardDescription className="text-white/40">View completed aerobic workouts.</CardDescription>
          </CardHeader>
          <CardContent className="h-[360px] overflow-y-auto">
            {cardio.length > 0 ? (
              <div className="grid gap-3">
                {cardio.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:border-teal-500/30 transition-all duration-200"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-white capitalize">{c.type}</h4>
                      <div className="flex gap-4 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-teal-400" />
                          {c.duration_minutes} mins
                        </span>
                        {c.distance_km && <span>Distance: {c.distance_km} km</span>}
                        {c.calories_burned && <span>Burned: {c.calories_burned} kcal</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingId(c.id);
                          setEditType(c.type);
                          setEditDuration(c.duration_minutes.toString());
                          setEditDistance(c.distance_km?.toString() || "");
                          setEditCalories(c.calories_burned?.toString() || "");
                          setIsEditModalOpen(true);
                        }}
                        className="p-1 rounded text-white/40 hover:text-teal-400 hover:bg-white/5 transition-colors"
                        title="Edit Activity"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this cardio session?")) {
                            deleteCardioMutation.mutate(c.id);
                          }
                        }}
                        className="p-1 rounded text-white/40 hover:text-rose-400 hover:bg-white/5 transition-colors"
                        title="Delete Activity"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-white/30 gap-2">
                <HeartPulse className="h-8 w-8 text-white/20" />
                <span className="text-sm">No cardio workouts logged yet. Every step builds progress!</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Cardio Dialog Modal Overlay */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md bg-zinc-950 border-white/[0.08] text-white">
            <CardHeader>
              <CardTitle>Edit Cardio Workout</CardTitle>
              <CardDescription className="text-white/40">Modify completed cardio session details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="editCType">Activity Type</Label>
                <select
                  id="editCType"
                  className="flex h-10 w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={editType}
                  onChange={(e) => setEditType(e.target.value)}
                >
                  <option value="walking">Walking</option>
                  <option value="running">Running</option>
                  <option value="cycling">Cycling</option>
                  <option value="treadmill">Treadmill</option>
                  <option value="stair_climber">Stair Climber</option>
                  <option value="swimming">Swimming</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="editCDuration">Duration (minutes)</Label>
                <Input
                  id="editCDuration"
                  type="number"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  className="bg-zinc-900 border-white/10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editCDistance">Distance (km)</Label>
                <Input
                  id="editCDistance"
                  type="number"
                  step="0.1"
                  value={editDistance}
                  onChange={(e) => setEditDistance(e.target.value)}
                  className="bg-zinc-900 border-white/10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="editCCalories">Calories Burned (kcal)</Label>
                <Input
                  id="editCCalories"
                  type="number"
                  value={editCalories}
                  onChange={(e) => setEditCalories(e.target.value)}
                  className="bg-zinc-900 border-white/10"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button className="bg-teal-500 text-slate-900 hover:bg-teal-400 font-semibold" onClick={() => editCardioMutation.mutate()}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
